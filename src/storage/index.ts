import { getFirstLesson } from '../content/lessons'
import type { AppState, PendingCard, Settings } from '../domain/types'
import { DEFAULT_SETTINGS } from '../domain/types'

const STORAGE_KEYS = {
  currentLessonId: 'currentLessonId',
  completedLessonIds: 'completedLessonIds',
  itemProgress: 'itemProgress',
  settings: 'settings',
  pendingCard: 'pendingCard',
} as const

export function createDefaultState(): AppState {
  return {
    currentLessonId: getFirstLesson().id,
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
    minIntervalMin:
      typeof s.minIntervalMin === 'number' ? s.minIntervalMin : base.minIntervalMin,
    maxIntervalMin:
      typeof s.maxIntervalMin === 'number' ? s.maxIntervalMin : base.maxIntervalMin,
    quietHours: Array.isArray(s.quietHours) ? s.quietHours : base.quietHours,
    paused: typeof s.paused === 'boolean' ? s.paused : base.paused,
  }
}

export async function loadState(): Promise<AppState> {
  const defaults = createDefaultState()
  const result = await chrome.storage.local.get([
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
        ? result.itemProgress
        : defaults.itemProgress,
    settings: mergeSettings(result.settings),
    pendingCard: (result.pendingCard as PendingCard | null) ?? null,
  }
}

export async function saveState(state: AppState): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.currentLessonId]: state.currentLessonId,
    [STORAGE_KEYS.completedLessonIds]: state.completedLessonIds,
    [STORAGE_KEYS.itemProgress]: state.itemProgress,
    [STORAGE_KEYS.settings]: state.settings,
    [STORAGE_KEYS.pendingCard]: state.pendingCard,
  })
}

export async function updateState(
  updater: (prev: AppState) => AppState,
): Promise<AppState> {
  const prev = await loadState()
  const next = updater(prev)
  await saveState(next)
  return next
}
