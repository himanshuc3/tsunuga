import {
  isBackgroundEvent,
  isBackgroundRequest,
  type BackgroundEvent,
  type BackgroundRequest,
  type ExtensionMessage,
} from '../domain/messages'
import { computeNextFireAt, delayMinutesFromNow } from '../domain/scheduler'
import type { AppState, PendingCard } from '../domain/types'
import { ALARM_NAME } from '../domain/types'
import browser from 'webextension-polyfill'
import { openSidePanelFromGesture } from './sidepanelHelper'
import { getActiveInjectableTab, isInjectableUrl } from './utils'
import { CardFeature, type AnswerInput } from './features/card'
import { SettingsFeature } from './features/settings'
import { backgroundDeps, type BackgroundDeps } from './deps'

export type ShowResult =
  | { status: 'shown'; tabId: number }
  | { status: 'pending_no_tab' }
  | { status: 'paused' }
  | { status: 'no_card' }
  | { status: 'inject_failed'; tabId: number }

type EventHandlerMap = {
  [Type in BackgroundEvent['type']]: (
    message: Extract<BackgroundEvent, { type: Type }>,
  ) => Promise<void>
}

type RequestHandlerMap = {
  [Type in BackgroundRequest['type']]: (
    message: Extract<BackgroundRequest, { type: Type }>,
  ) => Promise<unknown>
}

export class BackgroundController {
  private lastShownTabId: number | null = null
  private readonly cards: CardFeature
  private readonly settings: SettingsFeature
  private readonly eventHandlers: EventHandlerMap
  private readonly requestHandlers: RequestHandlerMap

  constructor(private readonly deps: BackgroundDeps = backgroundDeps) {
    this.cards = new CardFeature(deps)
    this.settings = new SettingsFeature(deps)
    this.eventHandlers = {
      ANSWER: (message) => this.answerCard(message),
      DISMISS: (message) => this.dismissCard(message.cardId),
    }
    this.requestHandlers = {
      GET_STATE: () => this.getState(),
      SET_PAUSED: (message) => this.createPausedResponse(message.paused),
      UPDATE_SETTINGS: (message) => this.createSettingsResponse(message.settings),
      FORCE_CARD: () => this.forceCardResponse(),
    }
  }

  async initialize(onStartup = false): Promise<void> {
    const state = await this.deps.loadState()
    if (!onStartup) await this.deps.saveState(state)

    await this.setBadge(Boolean(state.pendingCard))
    if (state.pendingCard) {
      await this.showPendingOnActiveTab(state.pendingCard)
    } else {
      await this.ensureAlarm(state)
    }
  }

  async initializeActiveTab(): Promise<void> {
    // this.lastActiveTabId = (await getLastActiveTabId()) ?? null
  }

  async handleCommand(command: string): Promise<void> {
    if (command === 'open-side-panel') openSidePanelFromGesture()
  }

  async handleAlarm(alarm: object): Promise<void> {
    if ('name' in alarm && alarm.name === ALARM_NAME) {
      await this.createAndShowCard()
    }
  }

  async handleTabActivated(tabId: number): Promise<void> {
    // this.lastActiveTabId = tabId
    const state = await this.deps.loadState()
    if (state.pendingCard) await this.showPendingOnActiveTab(state.pendingCard)
  }

  async handleTabUpdated(
    tabId: number,
    changeInfo: { status?: string },
    url?: string,
  ): Promise<void> {
    if (changeInfo.status !== 'complete' || !isInjectableUrl(url)) return

    const state = await this.deps.loadState()
    if (!state.pendingCard) return

    const [active] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    if (active?.id === tabId) {
      await this.showPendingOnActiveTab(state.pendingCard)
    }
  }

  async getState(): Promise<{ type: 'STATE'; ok: true; state: AppState }> {
    return { type: 'STATE', ok: true, state: await this.deps.loadState() }
  }

  handleMessage(message: unknown): Promise<unknown> | undefined {
    if (isBackgroundEvent(message)) {
      void this.dispatch(this.eventHandlers, message)
      return undefined
    }

    if (isBackgroundRequest(message)) {
      return this.dispatch(this.requestHandlers, message)
    }

    return undefined
  }

  private dispatch<Message extends { type: string }, Result>(
    handlers: {
      [Type in Message['type']]: (message: Extract<Message, { type: Type }>) => Promise<Result>
    },
    message: Message,
  ): Promise<Result> {
    const handler = handlers[message.type as Message['type']] as unknown as (
      message: Message,
    ) => Promise<Result>
    return handler(message)
  }

  private async createPausedResponse(paused: boolean): Promise<unknown> {
    return { ok: true, state: await this.setPaused(paused) }
  }

  private async createSettingsResponse(settings: Partial<AppState['settings']>): Promise<unknown> {
    return { ok: true, state: await this.updateSettings(settings) }
  }

  private async forceCardResponse(): Promise<unknown> {
    return { ok: true, ...(await this.forceCard()) }
  }

  private async createAndShowCard(options?: {
    bypassQuietHours?: boolean
    bypassPause?: boolean
  }): Promise<ShowResult> {
    const result = await this.cards.createCard(options)

    if (result.status === 'paused') return { status: 'paused' }
    if (result.status === 'no_card') {
      await this.ensureAlarm(result.state)
      return { status: 'no_card' }
    }

    await this.setBadge(true)
    if (result.status === 'created') await browser.alarms.clear(ALARM_NAME)
    return this.showPendingOnActiveTab(result.card)
  }

  private async forceCard(): Promise<{ result: ShowResult; state: AppState }> {
    const result = await this.createAndShowCard({
      bypassQuietHours: true,
      bypassPause: true,
    })
    return { result, state: await this.deps.loadState() }
  }

  private async answerCard(input: AnswerInput): Promise<void> {
    const state = await this.cards.answerCard(input)
    if (state) await this.finishCard(state)
  }

  private async dismissCard(cardId: string): Promise<void> {
    const state = await this.cards.dismissCard(cardId)
    if (state) await this.finishCard(state)
  }

  private async setPaused(paused: boolean): Promise<AppState> {
    const state = await this.settings.setPaused(paused)
    await this.syncAfterSettingsChange(state)
    return state
  }

  private async updateSettings(settings: Partial<AppState['settings']>): Promise<AppState> {
    const state = await this.settings.updateSettings(settings)
    await this.syncAfterSettingsChange(state)
    return state
  }

  private async syncAfterSettingsChange(state: AppState): Promise<void> {
    if (state.settings.paused) {
      await browser.alarms.clear(ALARM_NAME)
    } else if (state.pendingCard) {
      await this.showPendingOnActiveTab(state.pendingCard)
    } else {
      await this.ensureAlarm(state)
    }
  }

  // cron job scheduler
  private async ensureAlarm(state: AppState): Promise<void> {
    await browser.alarms.clear(ALARM_NAME)
    if (state.settings.paused || state.pendingCard) return

    const fireAt = computeNextFireAt(state.settings)
    await browser.alarms.create(ALARM_NAME, {
      delayInMinutes: delayMinutesFromNow(fireAt),
    })
  }

  private async finishCard(state: AppState): Promise<void> {
    await this.setBadge(false)
    await this.hideOnTab(this.lastShownTabId)
    this.lastShownTabId = null
    await this.ensureAlarm(state)
  }

  private async showPendingOnActiveTab(card: PendingCard): Promise<ShowResult> {
    const tab = await getActiveInjectableTab()
    if (!tab?.id) return { status: 'pending_no_tab' }

    if (this.lastShownTabId != null && this.lastShownTabId !== tab.id) {
      await this.hideOnTab(this.lastShownTabId)
    }

    const shown = await this.sendShowWithInject(tab.id, card)
    if (!shown) return { status: 'inject_failed', tabId: tab.id }

    this.lastShownTabId = tab.id
    return { status: 'shown', tabId: tab.id }
  }

  private async sendShowWithInject(tabId: number, card: PendingCard): Promise<boolean> {
    if (await this.sendToTab(tabId, { type: 'SHOW_CARD', card })) return true

    const files = browser.runtime.getManifest().content_scripts?.[0]?.js
    if (!files?.length) return false

    try {
      await browser.scripting.executeScript({ target: { tabId }, files })
      await new Promise((resolve) => setTimeout(resolve, 50))
      return this.sendToTab(tabId, { type: 'SHOW_CARD', card })
    } catch {
      return false
    }
  }

  // Message communication to active tab
  private async sendToTab(tabId: number, message: ExtensionMessage): Promise<boolean> {
    try {
      await browser.tabs.sendMessage(tabId, message)
      return true
    } catch {
      return false
    }
  }

  private async hideOnTab(tabId: number | null): Promise<void> {
    if (tabId != null) await this.sendToTab(tabId, { type: 'HIDE_CARD' })
  }

  // Communication with popup
  private async setBadge(pending: boolean): Promise<void> {
    await browser.action.setBadgeBackgroundColor({ color: '#C47B2C' })
    await browser.action.setBadgeText({ text: pending ? '!' : '' })
  }
}
