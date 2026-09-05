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
import { loadState, saveState, updateState } from '../common/storage'
import browser from 'webextension-polyfill'
import { openSidePanelFromGesture } from './sidepanelHelper'
import { getActiveInjectableTab, getLastActiveTabId } from './utils'

let lastShownTabId: number | null = null
let lastActiveTabId: number | null = null

export type ShowResult =
  | { status: 'shown'; tabId: number }
  | { status: 'pending_no_tab' }
  | { status: 'paused' }
  | { status: 'no_card' }
  | { status: 'inject_failed'; tabId: number }



async function injectContentScript(tabId: number): Promise<boolean> {
  const manifest = browser.runtime.getManifest()
  const files = manifest.content_scripts?.[0]?.js
  if (!files?.length) return false
  try {
    await browser.scripting.executeScript({
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
    await browser.tabs.sendMessage(tabId, message)
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

// Used for modifying popup icon
async function setBadge(pending: boolean): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ color: '#C47B2C' })
  await browser.action.setBadgeText({ text: pending ? '!' : '' })
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
  await browser.alarms.clear(ALARM_NAME)

  if (s.settings.paused || s.pendingCard) return

  const fireAt = computeNextFireAt(s.settings)
  const delayInMinutes = delayMinutesFromNow(fireAt)
  await browser.alarms.create(ALARM_NAME, { delayInMinutes })
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
  await browser.alarms.clear(ALARM_NAME)
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

// async function configureSidePanel(): Promise<void> {
  
//   await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
//   await chrome.sidePanel.setOptions({
//     path: 'sidepanel.html',
//     enabled: true,
//   })
// }


async function bootup({ onStartup = false }: { onStartup?: boolean } = {}) {
  // 1. Configuring side panel is not required for now
  // await configureSidePanel()

  // 2. Initialize extension local-storage with merged default state  
  const existing = await loadState()
  if (!onStartup) {
    await saveState(existing)
  }

  // 3. Update the extension popup icon
  await setBadge(Boolean(existing.pendingCard))

  

  // 5. If a card already expired it's designated time, inject the card
  // though it doesn't necessarily make sense 
  if (existing.pendingCard) {
    await showPendingOnActiveTab(existing.pendingCard)
  }else{
    // else setup an alarm for the next card
    await ensureAlarm(existing)
  }
}

// Setting up runtime handlers for native extension events

browser.commands.onCommand.addListener((command: string) => {
  if (command === 'open-side-panel') {
    openSidePanelFromGesture()
  }
})

// Contrary to the name, this is triggered in multiple instances:
// - When extension is installed (default), chrome or extension updates
browser.runtime.onInstalled.addListener(() => bootup({onStartup:false}))

browser.runtime.onStartup.addListener(() => bootup({onStartup:true}))

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return
  await createAndShowCard()
})

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  lastActiveTabId = tabId
  await followPendingToActiveTab()
})

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
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

browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
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

  handle().then(sendResponse).catch(() => sendResponse(undefined))
  return true
})



void (async () => {
  // await configureSidePanel()
  const activeTabId = await getLastActiveTabId()
  if(activeTabId) lastActiveTabId = activeTabId

  bootup({onStartup:true})
})()
