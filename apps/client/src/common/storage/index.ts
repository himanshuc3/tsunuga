import type { AppState, ItemProgress, PendingCard, Settings } from '../../domain/types'
import { DEFAULT_SETTINGS } from '../../domain/types'
import browser from 'webextension-polyfill'

const STORAGE_KEYS = {
  currentLessonId: 'currentLessonId',
  completedLessonIds: 'completedLessonIds',
  itemProgress: 'itemProgress',
  settings: 'settings',
  pendingCard: 'pendingCard',
} as const

export function createDefaultState(): AppState {
  return {
    // Populated once the API-backed "current lesson" fetch resolves after login.
    currentLessonId: '',
    completedLessonIds: [],
    itemProgress: {},
    settings: { ...DEFAULT_SETTINGS },
    pendingCard: null,
  }
}

function mergeSettings(raw: unknown): Settings {
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

function migratePendingCard(raw: unknown): PendingCard | null {
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
export async function loadState(): Promise<AppState> {
  const defaults = createDefaultState()
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
    settings: mergeSettings(result.settings),
    pendingCard: migratePendingCard(result.pendingCard),
  }
}

export async function saveState(state: AppState): Promise<void> {
  await browser.storage.local.set({
    [STORAGE_KEYS.currentLessonId]: state.currentLessonId,
    [STORAGE_KEYS.completedLessonIds]: state.completedLessonIds,
    [STORAGE_KEYS.itemProgress]: state.itemProgress,
    [STORAGE_KEYS.settings]: state.settings,
    [STORAGE_KEYS.pendingCard]: state.pendingCard,
  })
}

export async function updateState(updater: (prev: AppState) => AppState): Promise<AppState> {
  const prev = await loadState()
  const next = updater(prev)
  await saveState(next)
  return next
}
