import type { ExtensionMessage } from '../domain/messages'
import {
  markConceptShown,
  markIntroduced,
  markTestResult,
  maybeAdvanceLesson,
  progressKey,
} from '../domain/progress'
import { sampleNextCard } from '../domain/sampler'
import {
  computeNextFireAt,
  delayMinutesFromNow,
  isInAnyQuietHour,
} from '../domain/scheduler'
import type { AppState, PendingCard } from '../domain/types'
import { ALARM_NAME } from '../domain/types'
import { loadState, saveState, updateState } from '../storage'

let lastShownTabId: number | null = null

export type ShowResult =
  | { status: 'shown'; tabId: number }
  | { status: 'pending_no_tab' }
  | { status: 'paused' }
  | { status: 'no_card' }
  | { status: 'inject_failed'; tabId: number }

function isInjectableUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

/** Resolve the tab behind the popup (last focused normal window). */
async function getActiveInjectableTab(): Promise<chrome.tabs.Tab | null> {
  const [focused] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  if (focused?.id && isInjectableUrl(focused.url)) return focused

  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ['normal'],
  })
  const ordered = [
    ...windows.filter((w) => w.focused),
    ...windows.filter((w) => !w.focused),
  ]
  for (const win of ordered) {
    const active = win.tabs?.find((t) => t.active)
    if (active?.id && isInjectableUrl(active.url)) return active
  }
  return null
}

async function injectContentScript(tabId: number): Promise<boolean> {
  const manifest = chrome.runtime.getManifest()
  const files = manifest.content_scripts?.[0]?.js
  if (!files?.length) return false
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files,
    })
    return true
  } catch {
    return false
  }
}

async function sendToTab(
  tabId: number,
  message: ExtensionMessage,
): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, message)
    return true
  } catch {
    return false
  }
}

async function sendShowWithInject(
  tabId: number,
  card: PendingCard,
): Promise<boolean> {
  if (await sendToTab(tabId, { type: 'SHOW_CARD', card })) return true
  if (!(await injectContentScript(tabId))) return false
  // Content script needs a tick to register its listener
  await new Promise((r) => setTimeout(r, 50))
  return sendToTab(tabId, { type: 'SHOW_CARD', card })
}

async function hideOnTab(tabId: number | null): Promise<void> {
  if (tabId == null) return
  await sendToTab(tabId, { type: 'HIDE_CARD' })
}

async function setBadge(pending: boolean): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#C47B2C' })
  await chrome.action.setBadgeText({ text: pending ? '!' : '' })
}

async function showPendingOnActiveTab(card: PendingCard): Promise<ShowResult> {
  const tab = await getActiveInjectableTab()
  if (!tab?.id) return { status: 'pending_no_tab' }

  if (lastShownTabId != null && lastShownTabId !== tab.id) {
    await hideOnTab(lastShownTabId)
  }

  const ok = await sendShowWithInject(tab.id, card)
  if (ok) {
    lastShownTabId = tab.id
    return { status: 'shown', tabId: tab.id }
  }
  return { status: 'inject_failed', tabId: tab.id }
}

async function ensureAlarm(state?: AppState): Promise<void> {
  const s = state ?? (await loadState())
  await chrome.alarms.clear(ALARM_NAME)

  if (s.settings.paused || s.pendingCard) return

  const fireAt = computeNextFireAt(s.settings)
  const delayInMinutes = delayMinutesFromNow(fireAt)
  await chrome.alarms.create(ALARM_NAME, { delayInMinutes })
}

async function createAndShowCard(options?: {
  bypassQuietHours?: boolean
  bypassPause?: boolean
}): Promise<ShowResult> {
  const state = await loadState()
  if (state.settings.paused && !options?.bypassPause) {
    return { status: 'paused' }
  }

  if (state.pendingCard) {
    await setBadge(true)
    return showPendingOnActiveTab(state.pendingCard)
  }

  if (
    !options?.bypassQuietHours &&
    isInAnyQuietHour(new Date(), state.settings.quietHours)
  ) {
    await ensureAlarm(state)
    return { status: 'no_card' }
  }

  const card = sampleNextCard(state)
  if (!card) {
    await ensureAlarm(state)
    return { status: 'no_card' }
  }

  const next = await updateState((prev) => ({
    ...prev,
    pendingCard: card,
  }))
  await setBadge(true)
  await chrome.alarms.clear(ALARM_NAME)
  return showPendingOnActiveTab(next.pendingCard!)
}

async function followPendingToActiveTab(): Promise<void> {
  const state = await loadState()
  if (!state.pendingCard) return
  await showPendingOnActiveTab(state.pendingCard)
}

function applyCardAck(state: AppState, card: PendingCard): AppState {
  if (card.kind === 'intro') {
    const key = progressKey(card.lessonId, card.itemType, card.itemKey)
    return maybeAdvanceLesson(markIntroduced(state, key))
  }
  if (card.kind === 'concept') {
    return maybeAdvanceLesson(
      markConceptShown(state, card.lessonId, card.conceptId),
    )
  }
  return state
}

async function handleAnswer(
  cardId: string,
  choice?: string,
  correctFlag?: boolean,
): Promise<void> {
  const state = await loadState()
  const card = state.pendingCard
  if (!card || card.id !== cardId) return

  let next = state

  if (card.kind === 'test') {
    const correct =
      typeof correctFlag === 'boolean'
        ? correctFlag
        : choice !== undefined
          ? choice === card.answer
          : false
    const key = progressKey(card.lessonId, card.itemType, card.itemKey)
    next = maybeAdvanceLesson(markTestResult(state, key, correct))
  } else {
    next = applyCardAck(state, card)
  }

  next = { ...next, pendingCard: null }
  await saveState(next)
  await setBadge(false)
  if (lastShownTabId != null) {
    await hideOnTab(lastShownTabId)
  }
  lastShownTabId = null
  await ensureAlarm(next)
}

async function handleDismiss(cardId: string): Promise<void> {
  const state = await loadState()
  const card = state.pendingCard
  if (!card || card.id !== cardId) return

  let next = state
  if (card.kind === 'intro') {
    const key = progressKey(card.lessonId, card.itemType, card.itemKey)
    next = markIntroduced(state, key)
  } else if (card.kind === 'concept') {
    next = markConceptShown(state, card.lessonId, card.conceptId)
  } else {
    const key = progressKey(card.lessonId, card.itemType, card.itemKey)
    next = markIntroduced(state, key)
  }

  next = maybeAdvanceLesson({ ...next, pendingCard: null })
  await saveState(next)
  await setBadge(false)
  if (lastShownTabId != null) {
    await hideOnTab(lastShownTabId)
  }
  lastShownTabId = null
  await ensureAlarm(next)
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await loadState()
  await saveState(existing)
  await setBadge(Boolean(existing.pendingCard))
  await ensureAlarm(existing)
  if (existing.pendingCard) {
    await showPendingOnActiveTab(existing.pendingCard)
  }
})

chrome.runtime.onStartup.addListener(async () => {
  const state = await loadState()
  await setBadge(Boolean(state.pendingCard))
  if (state.pendingCard) {
    await showPendingOnActiveTab(state.pendingCard)
  } else {
    await ensureAlarm(state)
  }
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return
  await createAndShowCard()
})

chrome.tabs.onActivated.addListener(async () => {
  await followPendingToActiveTab()
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  const state = await loadState()
  if (!state.pendingCard) return

  const [active] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  if (active?.id === tabId && isInjectableUrl(tab.url)) {
    await showPendingOnActiveTab(state.pendingCard)
  }
})

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      case 'ANSWER':
        await handleAnswer(message.cardId, message.choice, message.correct)
        return { ok: true }
      case 'DISMISS':
        await handleDismiss(message.cardId)
        return { ok: true }
      case 'GET_STATE': {
        const state = await loadState()
        return { type: 'STATE', ok: true, state }
      }
      case 'SET_PAUSED': {
        const state = await updateState((prev) => ({
          ...prev,
          settings: { ...prev.settings, paused: message.paused },
        }))
        if (message.paused) {
          await chrome.alarms.clear(ALARM_NAME)
        } else if (!state.pendingCard) {
          await ensureAlarm(state)
        } else {
          await showPendingOnActiveTab(state.pendingCard)
        }
        return { ok: true, state }
      }
      case 'UPDATE_SETTINGS': {
        const state = await updateState((prev) => {
          const settings = { ...prev.settings, ...message.settings }
          if (settings.minIntervalMin > settings.maxIntervalMin) {
            settings.maxIntervalMin = settings.minIntervalMin
          }
          return { ...prev, settings }
        })
        if (state.settings.paused) {
          await chrome.alarms.clear(ALARM_NAME)
        } else if (state.pendingCard) {
          await showPendingOnActiveTab(state.pendingCard)
        } else {
          await ensureAlarm(state)
        }
        return { ok: true, state }
      }
      case 'FORCE_CARD': {
        const result = await createAndShowCard({
          bypassQuietHours: true,
          bypassPause: true,
        })
        const state = await loadState()
        return { ok: true, result, state }
      }
      default:
        return { ok: false }
    }
  }

  handle().then(sendResponse)
  return true
})

void (async () => {
  const state = await loadState()
  await setBadge(Boolean(state.pendingCard))
  if (state.pendingCard) {
    await showPendingOnActiveTab(state.pendingCard)
  } else {
    await ensureAlarm(state)
  }
})()
