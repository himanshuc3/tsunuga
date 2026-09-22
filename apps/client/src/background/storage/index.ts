import browser from 'webextension-polyfill'

const STORAGE_KEYS = {
  currentLessonId: 'currentLessonId',
  completedLessonIds: 'completedLessonIds',
  itemProgress: 'itemProgress',
  settings: 'settings',
  pendingCard: 'pendingCard',
  openSettingsOnLoad: 'openSettingsOnLoad',
} as const

export type Concept = {
  id: string
  title: string
  body: string
  meta?: string
}

export type VocabItem = {
  id: string
  romaji: string
  en: string
  /** Optional clarifying subtext shown under the word or question. */
  meta?: string
}

export type Lesson = {
  id: string
  title: string
  concepts: Concept[]
  vocab: VocabItem[]
  unlockAfter?: string
}

export type ItemProgress = {
  introducedAt: number | null
  correctStreak: number
  lastSeenAt: number | null
  conceptShown: boolean
}

export type QuietHour = {
  start: string // HH:mm
  end: string // HH:mm
}

export type Settings = {
  minIntervalMin: number
  maxIntervalMin: number
  quietHours: QuietHour[]
  paused: boolean
}

export type CardKind = 'intro' | 'concept' | 'test'

export type IntroCard = {
  id: string
  kind: 'intro'
  lessonId: string
  itemType: 'vocab'
  itemKey: string
  romaji: string
  en: string
  meta?: string
}

export type ConceptCard = {
  id: string
  kind: 'concept'
  lessonId: string
  conceptId: string
  title: string
  body: string
  meta?: string
}

export type TestDirection = 'romaji-to-en' | 'en-to-romaji'

export type TestCard = {
  id: string
  kind: 'test'
  lessonId: string
  itemType: 'vocab'
  itemKey: string
  direction: TestDirection
  romaji: string
  en: string
  prompt: string
  answer: string
  choices: string[]
  meta?: string
}

export type PendingCard = IntroCard | ConceptCard | TestCard

export type AppState = {
  currentLessonId: string | null
  completedLessonIds: string[]
  itemProgress: Record<string, ItemProgress>
  settings: Settings
  pendingCard: PendingCard | null
}

export const MASTERY_STREAK = 2

export const DEFAULT_SETTINGS: Settings = {
  minIntervalMin: 15,
  maxIntervalMin: 45,
  quietHours: [],
  paused: false,
}

export const ALARM_NAME = 'tango-next-card'

export class StorageController {
  private _state: AppState
  private static _instance: StorageController
  constructor(state = StorageController._getDefaultStorage()) {
    this._state = state
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
    }
  }

  async saveState(state: AppState): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEYS.currentLessonId]: state.currentLessonId,
      [STORAGE_KEYS.completedLessonIds]: state.completedLessonIds,
      [STORAGE_KEYS.itemProgress]: state.itemProgress,
      [STORAGE_KEYS.settings]: state.settings,
      [STORAGE_KEYS.pendingCard]: state.pendingCard,
    })
  }

  async updateState(updater: (prev: AppState) => AppState): Promise<AppState> {
    const prev = await this.loadState()
    const next = updater(prev)
    await this.saveState(next)
    return next
  }

  async setOpenSettingsOnLoad(): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.openSettingsOnLoad]: true })
  }

  async consumeOpenSettingsOnLoad(): Promise<boolean> {
    const result = await browser.storage.local.get(STORAGE_KEYS.openSettingsOnLoad)
    if (!result[STORAGE_KEYS.openSettingsOnLoad]) return false

    await browser.storage.local.remove(STORAGE_KEYS.openSettingsOnLoad)
    return true
  }
}
