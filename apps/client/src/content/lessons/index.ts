import browser from 'webextension-polyfill'
import type { Lesson } from '../../domain/types'
import {
  getNextLesson as fetchNextLessonApi,
  listLessons,
  type LessonApi,
} from '../../background/async/apis'

const LESSONS_CACHE_KEY = 'lessonsCache'

// Lessons are no longer bundled statically — they are fetched from the API and
// cached here (in-memory + browser.storage.local) so every extension context
// (background, popup, sidepanel) can read them synchronously once loaded.
export let lessons: Lesson[] = []

let loadAllPromise: Promise<Lesson[]> | null = null

function toLesson(api: LessonApi, unlockAfter?: string): Lesson {
  return {
    id: api.id,
    title: api.title,
    concepts: api.concepts ?? [],
    vocab: api.vocab ?? [],
    unlockAfter,
  }
}

function mergeLesson(lesson: Lesson): void {
  const index = lessons.findIndex((existing) => existing.id === lesson.id)
  if (index >= 0) {
    lessons = [...lessons.slice(0, index), lesson, ...lessons.slice(index + 1)]
  } else {
    lessons = [...lessons, lesson]
  }
}

async function persistLessonsCache(): Promise<void> {
  await browser.storage.local.set({ [LESSONS_CACHE_KEY]: lessons })
}

/** Re-sync the in-memory cache from storage; each extension context starts with an empty cache. */
export async function hydrateLessonsCache(): Promise<Lesson[]> {
  const stored = await browser.storage.local.get(LESSONS_CACHE_KEY)
  const cached = stored[LESSONS_CACHE_KEY]
  if (Array.isArray(cached)) lessons = cached as Lesson[]
  return lessons
}

/** Fetch only the user's current lesson so the UI has something to show right after login. */
export async function fetchCurrentLesson(token: string): Promise<Lesson> {
  const apiLesson = await fetchNextLessonApi(token)
  const lesson = toLesson(apiLesson)
  mergeLesson(lesson)
  await persistLessonsCache()
  return lesson
}

/** Lazily fetch and cache the full lesson catalog; safe to call multiple times concurrently. */
export async function loadAllLessons(token: string): Promise<Lesson[]> {
  if (loadAllPromise) return loadAllPromise

  loadAllPromise = (async () => {
    const apiLessons = await listLessons(token)
    lessons = apiLessons.map((api, index) =>
      toLesson(api, index > 0 ? apiLessons[index - 1].id : undefined),
    )
    await persistLessonsCache()
    return lessons
  })()

  try {
    return await loadAllPromise
  } finally {
    loadAllPromise = null
  }
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id)
}

export function getFirstLesson(): Lesson | undefined {
  return lessons[0]
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const index = lessons.findIndex((lesson) => lesson.id === currentId)
  if (index < 0 || index >= lessons.length - 1) return undefined
  return lessons[index + 1]
}
