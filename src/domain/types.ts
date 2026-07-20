export type Concept = {
  id: string
  title: string
  body: string
}

export type HiraganaItem = {
  char: string
  romaji: string
}

export type VocabItem = {
  id: string
  jp: string
  reading: string
  en: string
  /** Optional clarifying subtext shown under the word or question. */
  meta?: string
}

export type Lesson = {
  id: string
  order: number
  title: string
  concepts: Concept[]
  hiragana: HiraganaItem[]
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
  itemType: 'hiragana' | 'vocab'
  itemKey: string
  jp: string
  en: string
  reading?: string
  meta?: string
}

export type ConceptCard = {
  id: string
  kind: 'concept'
  lessonId: string
  conceptId: string
  title: string
  body: string
}

export type TestDirection = 'jp-to-en' | 'en-to-jp' | 'kana-to-romaji' | 'romaji-to-kana'

export type TestCard = {
  id: string
  kind: 'test'
  lessonId: string
  itemType: 'hiragana' | 'vocab'
  itemKey: string
  direction: TestDirection
  prompt: string
  answer: string
  choices: string[]
  meta?: string
}

export type PendingCard = IntroCard | ConceptCard | TestCard

export type AppState = {
  currentLessonId: string
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

export const ALARM_NAME = 'tsunagu-next-card'
