import { getLessonById, getNextLesson } from '../content/lessons'
import type { AppState, ItemProgress, Lesson } from './types'
import { MASTERY_STREAK } from './types'

export function progressKey(
  lessonId: string,
  kind: 'hiragana' | 'vocab' | 'concept',
  itemKey: string,
): string {
  return `${lessonId}:${kind}:${itemKey}`
}

export function emptyProgress(): ItemProgress {
  return {
    introducedAt: null,
    correctStreak: 0,
    lastSeenAt: null,
    conceptShown: false,
  }
}

export function getOrCreateProgress(
  state: AppState,
  key: string,
): ItemProgress {
  return state.itemProgress[key] ?? emptyProgress()
}

export function lessonItemKeys(lesson: Lesson): {
  hiragana: string[]
  vocab: string[]
  concepts: string[]
} {
  return {
    hiragana: lesson.hiragana.map((h) => h.char),
    vocab: lesson.vocab.map((v) => v.id),
    concepts: lesson.concepts.map((c) => c.id),
  }
}

export function isItemMastered(progress: ItemProgress): boolean {
  return progress.correctStreak >= MASTERY_STREAK
}

export function isLessonComplete(state: AppState, lesson: Lesson): boolean {
  const keys = lessonItemKeys(lesson)

  for (const char of keys.hiragana) {
    const p = getOrCreateProgress(state, progressKey(lesson.id, 'hiragana', char))
    if (!isItemMastered(p)) return false
  }

  for (const id of keys.vocab) {
    const p = getOrCreateProgress(state, progressKey(lesson.id, 'vocab', id))
    if (!isItemMastered(p)) return false
  }

  for (const id of keys.concepts) {
    const p = getOrCreateProgress(state, progressKey(lesson.id, 'concept', id))
    if (!p.conceptShown) return false
  }

  // Lessons with only concepts and no drill items: require concepts shown
  if (keys.hiragana.length === 0 && keys.vocab.length === 0) {
    return keys.concepts.every((id) => {
      const p = getOrCreateProgress(state, progressKey(lesson.id, 'concept', id))
      return p.conceptShown
    })
  }

  return true
}

export function countMasteredInLesson(
  state: AppState,
  lesson: Lesson,
): { mastered: number; total: number } {
  const keys = lessonItemKeys(lesson)
  const drillKeys = [
    ...keys.hiragana.map((c) => progressKey(lesson.id, 'hiragana', c)),
    ...keys.vocab.map((id) => progressKey(lesson.id, 'vocab', id)),
  ]
  const total = drillKeys.length
  const mastered = drillKeys.filter((k) =>
    isItemMastered(getOrCreateProgress(state, k)),
  ).length
  return { mastered, total }
}

export function isLessonUnlocked(state: AppState, lesson: Lesson): boolean {
  if (!lesson.unlockAfter) return true
  return state.completedLessonIds.includes(lesson.unlockAfter)
}

/** Apply mastery unlock: mark current complete and advance if ready. */
export function maybeAdvanceLesson(state: AppState): AppState {
  const current = getLessonById(state.currentLessonId)
  if (!current) return state

  if (!isLessonComplete(state, current)) return state

  const completed = state.completedLessonIds.includes(current.id)
    ? state.completedLessonIds
    : [...state.completedLessonIds, current.id]

  const next = getNextLesson(current.id)
  if (!next) {
    return { ...state, completedLessonIds: completed }
  }

  return {
    ...state,
    completedLessonIds: completed,
    currentLessonId: next.id,
  }
}

export function markIntroduced(
  state: AppState,
  key: string,
  now = Date.now(),
): AppState {
  const prev = getOrCreateProgress(state, key)
  return {
    ...state,
    itemProgress: {
      ...state.itemProgress,
      [key]: {
        ...prev,
        introducedAt: prev.introducedAt ?? now,
        lastSeenAt: now,
      },
    },
  }
}

export function markConceptShown(
  state: AppState,
  lessonId: string,
  conceptId: string,
  now = Date.now(),
): AppState {
  const key = progressKey(lessonId, 'concept', conceptId)
  const prev = getOrCreateProgress(state, key)
  return {
    ...state,
    itemProgress: {
      ...state.itemProgress,
      [key]: {
        ...prev,
        conceptShown: true,
        introducedAt: prev.introducedAt ?? now,
        lastSeenAt: now,
      },
    },
  }
}

export function markTestResult(
  state: AppState,
  key: string,
  correct: boolean,
  now = Date.now(),
): AppState {
  const prev = getOrCreateProgress(state, key)
  const streak = correct ? prev.correctStreak + 1 : 0
  return {
    ...state,
    itemProgress: {
      ...state.itemProgress,
      [key]: {
        ...prev,
        introducedAt: prev.introducedAt ?? now,
        correctStreak: streak,
        lastSeenAt: now,
      },
    },
  }
}
