import type {
  BackgroundEvent,
  BackgroundRequest,
  ExtensionMessage,
} from '../common/messaging/messages'
import { computeNextFireAt, delayMinutesFromNow } from '../domain/scheduler'
import type { AppState, PendingCard } from '../common/types'
import { ALARM_NAME } from '../common/constants'
import browser from 'webextension-polyfill'
import { openSidePanelFromGesture } from './sidepanelHelper'
import { getActiveInjectableTab, isInjectableUrl } from './utils'
import { CardFeature, type AnswerInput } from './features/card'
import { SettingsFeature } from './features/settings'
import { hideOnTab, sendToTab, setBadge } from './helpers'
import {
  apiProgressToClientProgress,
  apiSettingsToClientSettings,
  clientSettingsToApiSettings,
  getUserSettings,
  listLessons,
  listUserProgress,
  loginWithGoogle,
  updateUserSettings,
} from './async/apis'
import { StorageController } from './storage'
import { completedLessonIds, getCurrentLessonId } from '../common/helpers'

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

// NOTE[Refactor]: Add global functionalities to object
// for easier access to helper modules
export class BackgroundController {
  private lastShownTabId: number | null = null
  private readonly cards: CardFeature
  private readonly settings: SettingsFeature
  private readonly eventHandlers: EventHandlerMap
  private readonly requestHandlers: RequestHandlerMap
  private readonly storageController: StorageController

  constructor() {
    this.storageController = StorageController.getInstance()
    this.cards = new CardFeature(this.storageController)
    this.settings = new SettingsFeature(this.storageController)
    this.eventHandlers = {
      ANSWER: (message) => this.answerCard(message),
      DISMISS: (message) => this.dismissCard(message.cardId),
      OPEN_SIDEPANEL: (message) => this._openSidePanel(),
    }
    this.requestHandlers = {
      GET_STATE: () => this.getState(),
      SET_PAUSED: (message) => this.createPausedResponse(message.paused),
      UPDATE_SETTINGS: (message) => this.createSettingsResponse(message.settings),
      FORCE_CARD: () => this.forceCardResponse(),
      AUTH_TOKEN: () => this.getAuthToken(),
      AUTH_TOKEN_STATUS: () => this.getAuthTokenStatus(),
      OPEN_SETTINGS: () => this.openSettings(),
      CONSUME_OPEN_SETTINGS: () => this.consumeOpenSettings(),
      LOGOUT: () => this.logout(),
    }
  }

  // initialize on startup/install/background app start
  async initialize(onStartup = false): Promise<void> {
    const state = await this.storageController.loadState()
    if (!onStartup) await this.storageController.saveState(state)

    await setBadge(Boolean(state.pendingCard))
    if (state.pendingCard) {
      await this.showPendingOnActiveTab(state.pendingCard)
    } else {
      await this.ensureAlarm(state)
    }
  }

  /**
   * Native event handlers emitted by
   * cross browser module. Ensure a convention of
   * handle[Feature] for consuming these events.
   */
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
    const state = await this.storageController.loadState()
    if (state.pendingCard) await this.showPendingOnActiveTab(state.pendingCard)
  }

  async handleTabUpdated(
    tabId: number,
    changeInfo: { status?: string },
    url?: string,
  ): Promise<void> {
    if (changeInfo.status !== 'complete' || !isInjectableUrl(url)) return

    const state = await this.storageController.loadState()
    if (!state.pendingCard) return

    const [active] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    if (active?.id === tabId) {
      await this.showPendingOnActiveTab(state.pendingCard)
    }
  }

  handleMessage(message: unknown): Promise<unknown> | undefined {
    if (!this.hasMessageType(message)) return undefined

    const extensionMessage = message as ExtensionMessage
    if (Object.hasOwn(this.eventHandlers, extensionMessage.type)) {
      void this.dispatch(this.eventHandlers, extensionMessage as BackgroundEvent)
      return undefined
    }

    if (Object.hasOwn(this.requestHandlers, extensionMessage.type)) {
      return this.dispatch(this.requestHandlers, extensionMessage as BackgroundRequest)
    }

    return undefined
  }

  private hasMessageType(message: unknown): message is { type: string } {
    return typeof message === 'object' && message !== null && 'type' in message
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

    await setBadge(true)
    if (result.status === 'created') await browser.alarms.clear(ALARM_NAME)
    return this.showPendingOnActiveTab(result.card)
  }

  private async forceCard(): Promise<{ result: ShowResult; state: AppState }> {
    const result = await this.createAndShowCard({
      bypassQuietHours: true,
      bypassPause: true,
    })
    return { result, state: await this.storageController.loadState() }
  }

  /**
   * On message handlers based on message types
   */
  private async createPausedResponse(paused: boolean): Promise<unknown> {
    return { ok: true, state: await this.setPaused(paused) }
  }

  private async _openSidePanel(): Promise<void> {
    const result = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    const windowId = result[0].windowId
    // Chrome nativeAPI
    chrome.sidePanel.open({ windowId: windowId })
  }

  private async getAuthToken(): Promise<{ ok: true; token: string; user?: unknown }> {
    // OAuth 2.0 -> Authorization
    // OpenIDC -> authentication
    // Access tokens, identity information, client IDs and API keys
    // Access token from google can be intercepted from browser
    // extension and used for getting user profiles
    // Client ID verifies the application from google
    // 1. Application -> client ID to google -> identifies a verifiable
    // app for issuing tokens to -> access resources using oauth token
    try {
      const identity = (
        chrome as unknown as {
          identity: {
            getAuthToken(options: { interactive: boolean }): Promise<{ token: string }>
          }
        }
      ).identity
      const result = await identity.getAuthToken({
        interactive: true,
      })

      const authTokenResult = await loginWithGoogle(result.token)

      const token = authTokenResult.token

      // TODO: Save token and user details, route them via storage controller
      await browser.storage.local.set({ authToken: token })
      await browser.storage.local.set({ user: authTokenResult.user || {} })

      // Lazily hydrate the rest of the lesson catalog, progress and settings in the background.
      try {
        await this.syncLessonsFromApi(token)
        await this.syncProgressFromApi(token)
        await this.syncSettingsFromApi(token)
        await this.storageController.updateState((prev) => {
          const completedIds = completedLessonIds(prev)
          const currentLessonId = getCurrentLessonId(prev, completedIds)
          console.log(completedIds, currentLessonId)
          return {
            ...prev,
            completedLessonIds: completedIds,
            currentLessonId: currentLessonId,
          }
        })
      } catch (err) {
        console.error('Failed to fetch data', err)
      }

      return {
        ok: true,
        token,
        user: authTokenResult.user,
      }
    } catch (error) {
      console.error('Failed to get auth token or fetch contacts:', error)
      throw error
    }
  }

  private async getAuthTokenStatus(): Promise<{ ok: true; authenticated: boolean }> {
    const stored = await browser.storage.local.get('authToken')
    return {
      ok: true,
      authenticated: typeof stored.authToken === 'string' && Boolean(stored.authToken),
    }
  }

  private async logout(): Promise<{ ok: true }> {
    await browser.storage.local.remove(['authToken', 'user'])
    await browser.alarms.clear(ALARM_NAME)
    return { ok: true }
  }

  private async openSettings(): Promise<{ ok: true }> {
    await this.storageController.setOpenSettingsOnLoad()
    return { ok: true }
  }

  private async consumeOpenSettings(): Promise<{ ok: true; open: boolean }> {
    return { ok: true, open: await this.storageController.consumeOpenSettingsOnLoad() }
  }

  private async syncSettingsFromApi(token: string): Promise<void> {
    const response = await getUserSettings(token)
    await this.storageController.updateState((prev) => ({
      ...prev,
      settings: apiSettingsToClientSettings(prev.settings, response.settings),
    }))
  }

  private async syncProgressFromApi(token: string): Promise<void> {
    const items = await listUserProgress(token)
    const itemProgress = apiProgressToClientProgress(items)
    await this.storageController.updateState((prev) => ({
      ...prev,
      itemProgress: { ...prev.itemProgress, ...itemProgress },
    }))
  }

  private async syncLessonsFromApi(token: string): Promise<void> {
    const items = await listLessons(token)
    console.log('items', items)
    await this.storageController.updateState((prev) => ({
      ...prev,
      lessons: items,
    }))
  }

  private async createSettingsResponse(settings: Partial<AppState['settings']>): Promise<unknown> {
    return { ok: true, state: await this.updateSettings(settings) }
  }

  private async forceCardResponse(): Promise<unknown> {
    return { ok: true, ...(await this.forceCard()) }
  }

  async getState(): Promise<{ type: 'STATE'; ok: true; state: AppState }> {
    return { type: 'STATE', ok: true, state: await this.storageController.loadState() }
  }

  private async answerCard(input: AnswerInput): Promise<void> {
    const state = await this.cards.answerCard(input)
    if (state) await this.finishCard(state)
  }

  private async dismissCard(cardId: string): Promise<void> {
    const state = await this.cards.dismissCard(cardId)
    if (state) await this.finishCard(state)
  }
  /**
   * End of On message handlers based on message types
   */

  private async setPaused(paused: boolean): Promise<AppState> {
    const state = await this.settings.setPaused(paused)
    await this.syncAfterSettingsChange(state)
    return state
  }

  private async updateSettings(settings: Partial<AppState['settings']>): Promise<AppState> {
    const state = await this.settings.updateSettings(settings)
    await this.syncAfterSettingsChange(state)
    void this.pushSettingsToApi(state.settings).catch((error) =>
      console.error('Failed to sync settings to API', error),
    )
    return state
  }

  private async pushSettingsToApi(settings: AppState['settings']): Promise<void> {
    const stored = await browser.storage.local.get('authToken')
    const token = stored.authToken
    if (typeof token !== 'string' || !token) return
    await updateUserSettings(token, clientSettingsToApiSettings(settings))
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
    await setBadge(false)
    await hideOnTab(this.lastShownTabId)
    this.lastShownTabId = null
    await this.ensureAlarm(state)
  }

  private async showPendingOnActiveTab(card: PendingCard): Promise<ShowResult> {
    const tab = await getActiveInjectableTab()
    if (!tab?.id) return { status: 'pending_no_tab' }

    if (this.lastShownTabId != null && this.lastShownTabId !== tab.id) {
      await hideOnTab(this.lastShownTabId)
    }

    const shown = await this.sendShowWithInject(tab.id, card)
    if (!shown) return { status: 'inject_failed', tabId: tab.id }

    this.lastShownTabId = tab.id
    return { status: 'shown', tabId: tab.id }
  }

  private async sendShowWithInject(tabId: number, card: PendingCard): Promise<boolean> {
    if (await sendToTab(tabId, { type: 'SHOW_CARD', card })) return true

    const files = browser.runtime.getManifest().content_scripts?.[0]?.js
    if (!files?.length) return false

    try {
      await browser.scripting.executeScript({ target: { tabId }, files })
      await new Promise((resolve) => setTimeout(resolve, 50))
      return sendToTab(tabId, { type: 'SHOW_CARD', card })
    } catch {
      return false
    }
  }

  // Fetch
}
