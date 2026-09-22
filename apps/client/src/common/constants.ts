import { Settings } from './types'

export const MASTERY_STREAK = 2

export const DEFAULT_SETTINGS: Settings = {
  minIntervalMin: 15,
  maxIntervalMin: 45,
  quietHours: [],
  paused: false,
}

export const ALARM_NAME = 'tango-next-card'

export const STORAGE_KEYS = {
  currentLessonId: 'currentLessonId',
  completedLessonIds: 'completedLessonIds',
  itemProgress: 'itemProgress',
  settings: 'settings',
  pendingCard: 'pendingCard',
  lessons: 'lessons',
} as const
