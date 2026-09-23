import { getOrCreateProgress, isItemMastered, progressKey } from './progress'
import type {
  AppState,
  ConceptCard,
  IntroCard,
  PendingCard,
  TestCard,
  TestDirection,
} from '../common/types'
import { getLessonById } from '../common/helpers'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

function distractors(correct: string, pool: string[], count = 3): string[] {
  const others = shuffle(pool.filter((x) => x !== correct)).slice(0, count)
  return shuffle([correct, ...others])
}

function buildVocabIntro(
  lessonId: string,
  id: string,
  romaji: string,
  en: string,
  meta?: string,
): IntroCard {
  return {
    id: uid(),
    kind: 'intro',
    lessonId,
    itemType: 'vocab',
    itemKey: id,
    romaji,
    en,
    meta,
  }
}

function buildConcept(
  lessonId: string,
  conceptId: string,
  title: string,
  body: string,
  meta?: string,
): ConceptCard {
  return {
    id: uid(),
    kind: 'concept',
    lessonId,
    conceptId,
    title,
    body,
    meta,
  }
}

function buildVocabTest(
  lessonId: string,
  id: string,
  romaji: string,
  en: string,
  allEn: string[],
  allRomaji: string[],
  meta?: string,
): TestCard {
  const toEn = Math.random() < 0.5
  const direction: TestDirection = toEn ? 'romaji-to-en' : 'en-to-romaji'
  if (toEn) {
    return {
      id: uid(),
      kind: 'test',
      lessonId,
      itemType: 'vocab',
      itemKey: id,
      direction,
      romaji,
      en,
      prompt: `What does ${romaji} mean?`,
      answer: en,
      choices: distractors(en, allEn),
      meta,
    }
  }
  return {
    id: uid(),
    kind: 'test',
    lessonId,
    itemType: 'vocab',
    itemKey: id,
    direction,
    romaji,
    en,
    prompt: `What is the romaji for “${en}”?`,
    answer: romaji,
    choices: distractors(romaji, allRomaji),
    meta,
  }
}

/** Pick next card: unseen current lesson first, then weak, then light review. */
export function sampleNextCard(state: AppState): PendingCard | null {
  if (!state.currentLessonId) return null
  const current = getLessonById(state.lessons, state.currentLessonId)
  if (!current) return null

  const candidates: { priority: number; build: () => PendingCard }[] = []

  // Unshown concepts in current lesson (high priority)
  for (const c of current.concepts) {
    const key = progressKey(current.id, 'concept', c.id)
    const p = getOrCreateProgress(state, key)
    if (!p.conceptShown) {
      candidates.push({
        priority: 0,
        build: () => buildConcept(current.id, c.id, c.title, c.body, c.meta),
      })
    }
  }

  // Unintroduced vocabulary
  for (const v of current.vocab) {
    const key = progressKey(current.id, 'vocab', v.id)
    const p = getOrCreateProgress(state, key)
    if (p.introducedAt == null) {
      candidates.push({
        priority: 1,
        build: () => buildVocabIntro(current.id, v.id, v.romaji, v.en, v.meta),
      })
    }
  }

  const currentEn = current.vocab.map((v) => v.en)
  const currentRomaji = current.vocab.map((v) => v.romaji)
  const globalEn = lessons.flatMap((l) => l.vocab.map((v) => v.en))
  const globalRomaji = lessons.flatMap((l) => l.vocab.map((v) => v.romaji))

  // Weak (introduced but not mastered) tests — current lesson
  for (const v of current.vocab) {
    const key = progressKey(current.id, 'vocab', v.id)
    const p = getOrCreateProgress(state, key)
    if (p.introducedAt != null && !isItemMastered(p)) {
      candidates.push({
        priority: 2,
        build: () =>
          buildVocabTest(
            current.id,
            v.id,
            v.romaji,
            v.en,
            currentEn.length >= 4 ? currentEn : globalEn,
            currentRomaji.length >= 4 ? currentRomaji : globalRomaji,
            v.meta,
          ),
      })
    }
  }

  // Light review from completed lessons
  for (const lesson of lessons) {
    if (!state.completedLessonIds.includes(lesson.id) && lesson.id !== current.id) {
      continue
    }
    if (lesson.id === current.id) continue

    for (const v of lesson.vocab) {
      const key = progressKey(lesson.id, 'vocab', v.id)
      const p = getOrCreateProgress(state, key)
      if (p.introducedAt != null) {
        candidates.push({
          priority: 3,
          build: () =>
            buildVocabTest(lesson.id, v.id, v.romaji, v.en, globalEn, globalRomaji, v.meta),
        })
      }
    }
  }

  // Also allow testing already-mastered current items occasionally (priority 3)
  for (const v of current.vocab) {
    const key = progressKey(current.id, 'vocab', v.id)
    const p = getOrCreateProgress(state, key)
    if (isItemMastered(p)) {
      candidates.push({
        priority: 3,
        build: () =>
          buildVocabTest(
            current.id,
            v.id,
            v.romaji,
            v.en,
            currentEn.length >= 4 ? currentEn : globalEn,
            currentRomaji.length >= 4 ? currentRomaji : globalRomaji,
            v.meta,
          ),
      })
    }
  }

  if (candidates.length === 0) {
    // Fallback: re-show a concept from current lesson
    const c = current.concepts[0]
    if (c) {
      return buildConcept(current.id, c.id, c.title, c.body, c.meta)
    }
    return null
  }

  const best = Math.min(...candidates.map((c) => c.priority))
  const pool = candidates.filter((c) => c.priority === best)
  const chosen = pick(pool)
  return chosen ? chosen.build() : null
}
