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
  position: number
}

export type ItemProgress = {
  introducedAt: number | null
  correctStreak: number
  lastSeenAt: number | null
  conceptShown: boolean
  completedAt: null | number
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
  lessons: Lesson[]
}
