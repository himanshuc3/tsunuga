import browser from 'webextension-polyfill'
import { AppState, ItemProgress, PendingCard, Settings } from '../../common/types'
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../../common/constants'

export class StorageController {
  private _state: AppState
  private static _instance: StorageController
  constructor(state = StorageController._getDefaultStorage()) {
    this._state = state
  }

  getState() {
    return this._state
  }

  static getInstance(): StorageController {
    if (!StorageController._instance) {
      StorageController._instance = new StorageController()
    }
    return StorageController._instance
  }

  private static _getDefaultStorage(): AppState {
    return {
      // Populated once the API-backed "current lesson" fetch resolves after login.
      currentLessonId: null,
      completedLessonIds: [],
      itemProgress: {},
      settings: { ...DEFAULT_SETTINGS },
      pendingCard: null,
      lessons: [],
    }
  }

  mergeSettings(raw: unknown): Settings {
    const base = { ...DEFAULT_SETTINGS }
    if (!raw || typeof raw !== 'object') return base
    const s = raw as Partial<Settings>
    return {
      minIntervalMin: typeof s.minIntervalMin === 'number' ? s.minIntervalMin : base.minIntervalMin,
      maxIntervalMin: typeof s.maxIntervalMin === 'number' ? s.maxIntervalMin : base.maxIntervalMin,
      quietHours: Array.isArray(s.quietHours) ? s.quietHours : base.quietHours,
      paused: typeof s.paused === 'boolean' ? s.paused : base.paused,
    }
  }

  migratePendingCard(raw: unknown): PendingCard | null {
    if (!raw || typeof raw !== 'object') return null
    const card = raw as Record<string, unknown>
    if (card.kind === 'intro' && typeof card.en === 'string') {
      return {
        ...card,
        romaji:
          typeof card.romaji === 'string'
            ? card.romaji
            : typeof card.reading === 'string'
              ? card.reading
              : '',
      } as PendingCard
    }
    if (card.kind === 'test' && typeof card.answer === 'string') {
      const legacyDirection = card.direction === 'jp-to-en' || card.direction === 'en-to-jp'
      return {
        ...card,
        direction: card.direction === 'en-to-jp' ? 'en-to-romaji' : card.direction,
        romaji:
          typeof card.romaji === 'string'
            ? card.romaji
            : typeof card.reading === 'string'
              ? card.reading
              : legacyDirection && card.direction === 'en-to-jp'
                ? card.answer
                : '',
        en: typeof card.en === 'string' ? card.en : '',
      } as PendingCard
    }
    return card.kind === 'concept' ? (card as PendingCard) : null
  }

  // Replace with in-memory state-management?
  // And deep-merging state?
  async loadState(): Promise<AppState> {
    const defaults = StorageController._getDefaultStorage()
    const result = await browser.storage.local.get([
      STORAGE_KEYS.currentLessonId,
      STORAGE_KEYS.completedLessonIds,
      STORAGE_KEYS.itemProgress,
      STORAGE_KEYS.settings,
      STORAGE_KEYS.pendingCard,
      STORAGE_KEYS.lessons,
    ])

    return {
      currentLessonId:
        typeof result.currentLessonId === 'string'
          ? result.currentLessonId
          : defaults.currentLessonId,
      completedLessonIds: Array.isArray(result.completedLessonIds)
        ? result.completedLessonIds
        : defaults.completedLessonIds,
      itemProgress:
        result.itemProgress && typeof result.itemProgress === 'object'
          ? (result.itemProgress as Record<string, ItemProgress>)
          : defaults.itemProgress,
      settings: this.mergeSettings(result.settings),
      pendingCard: this.migratePendingCard(result.pendingCard),
      lessons: result.lessons ?? [],
    }
  }

  async saveState(state: AppState): Promise<void> {
    this._state = state

    await browser.storage.local.set({
      [STORAGE_KEYS.currentLessonId]: state.currentLessonId,
      [STORAGE_KEYS.completedLessonIds]: state.completedLessonIds,
      [STORAGE_KEYS.itemProgress]: state.itemProgress,
      [STORAGE_KEYS.settings]: state.settings,
      [STORAGE_KEYS.pendingCard]: state.pendingCard,
      [STORAGE_KEYS.lessons]: state.lessons,
    })
  }

  async updateState(updater: (prev: AppState) => AppState): Promise<AppState> {
    const prev = await this.loadState()
    const next = updater(prev)
    await this.saveState(next)
    return next
  }
}
