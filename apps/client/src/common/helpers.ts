import browser from 'webextension-polyfill'
import { AppState, ItemProgress, Lesson } from './types'

export async function openSidePanel(): Promise<void> {
  const result = await browser.tabs.query({ active: true, lastFocusedWindow: true })
  const windowId = result[0].windowId
  // Chrome nativeAPI
  chrome.sidePanel.open({ windowId: windowId })
}

// Flags the popup to open straight into its settings view, then requests the popup itself.
export async function openPopupWithSettings(): Promise<void> {
  await browser.runtime.sendMessage({ type: 'OPEN_SETTINGS' })
  try {
    await (chrome.action as any).openPopup()
  } catch (error) {
    console.error('Failed to open popup', error)
  }
}

export function getNextLesson(state: AppState) {
  const completedIds = new Set(state.completedLessonIds)
  const indexCurrent = state.lessons.findIndex((lesson) => lesson.id === state.currentLessonId)
  return (
    state.lessons.find((lesson, index) => index > indexCurrent && !completedIds.has(lesson.id)) ??
    state.lessons[state.lessons.length - 1]
  )
}

function isLessonComplete(
  lesson: Lesson,
  itemProgressSet: Set<string>,
  itemProgress: Record<string, ItemProgress>,
) {
  const lessonSet = new Set([
    ...lesson.concepts.map((concept) => concept.id),
    ...lesson.vocab.map((v) => v.id),
  ])
  const intersection = itemProgressSet.intersection(lessonSet)
  if (intersection.size !== lessonSet.size) return false

  lesson.vocab.forEach((v) => {
    if (!itemProgress[v.id].completedAt) return false
  })
}

export function completedLessonIds(state: AppState) {
  const itemProgressSet = new Set([...Object.keys(state.itemProgress)])
  return state.lessons
    .filter((lesson) => isLessonComplete(lesson, itemProgressSet, state.itemProgress))
    .sort((a, b) => a.position - b.position)
    .map((lesson) => lesson.id)
}

export function getCurrentLessonId(state: AppState, completedIds: string[]): string | null {
  const completedSet = new Set(completedIds)
  return (
    state.lessons.find((lesson) => !completedSet.has(lesson.id))?.id ??
    state.lessons[state.lessons.length - 1]?.id ??
    null
  )
}

export function getLessonById(lessons: any[], id: string) {
  return lessons.find((lesson) => lesson.id === id)
}

export const sendMessage = browser.runtime.sendMessage
