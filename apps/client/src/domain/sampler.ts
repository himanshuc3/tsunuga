import { getLessonById, lessons } from '../content/lessons'
import {
  getOrCreateProgress,
  isItemMastered,
  lessonItemKeys,
  progressKey,
} from './progress'
import type {
  AppState,
  ConceptCard,
  IntroCard,
  PendingCard,
  TestCard,
  TestDirection,
} from './types'

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

function buildHiraganaIntro(lessonId: string, char: string, romaji: string): IntroCard {
  return {
    id: uid(),
    kind: 'intro',
    lessonId,
    itemType: 'hiragana',
    itemKey: char,
    jp: char,
    en: romaji,
    reading: romaji,
  }
}

function buildVocabIntro(
  lessonId: string,
  id: string,
  jp: string,
  reading: string,
  en: string,
  meta?: string,
): IntroCard {
  return {
    id: uid(),
    kind: 'intro',
    lessonId,
    itemType: 'vocab',
    itemKey: id,
    jp,
    en,
    reading,
    meta,
  }
}

function buildConcept(
  lessonId: string,
  conceptId: string,
  title: string,
  body: string,
): ConceptCard {
  return {
    id: uid(),
    kind: 'concept',
    lessonId,
    conceptId,
    title,
    body,
  }
}

function buildHiraganaTest(
  lessonId: string,
  char: string,
  romaji: string,
  allRomaji: string[],
  allChars: string[],
): TestCard {
  const toRomaji = Math.random() < 0.5
  const direction: TestDirection = toRomaji ? 'kana-to-romaji' : 'romaji-to-kana'
  if (toRomaji) {
    return {
      id: uid(),
      kind: 'test',
      lessonId,
      itemType: 'hiragana',
      itemKey: char,
      direction,
      prompt: `What is the romaji for ${char}?`,
      answer: romaji,
      choices: distractors(romaji, allRomaji),
    }
  }
  return {
    id: uid(),
    kind: 'test',
    lessonId,
    itemType: 'hiragana',
    itemKey: char,
    direction,
    prompt: `Which character is “${romaji}”?`,
    answer: char,
    choices: distractors(char, allChars),
  }
}

function buildVocabTest(
  lessonId: string,
  id: string,
  jp: string,
  en: string,
  allEn: string[],
  allJp: string[],
  meta?: string,
): TestCard {
  const toEn = Math.random() < 0.5
  const direction: TestDirection = toEn ? 'jp-to-en' : 'en-to-jp'
  if (toEn) {
    return {
      id: uid(),
      kind: 'test',
      lessonId,
      itemType: 'vocab',
      itemKey: id,
      direction,
      prompt: `What does ${jp} mean?`,
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
    prompt: `Which word means “${en}”?`,
    answer: jp,
    choices: distractors(jp, allJp),
    meta,
  }
}

/** Pick next card: unseen current lesson first, then weak, then light review. */
export function sampleNextCard(state: AppState): PendingCard | null {
  const current = getLessonById(state.currentLessonId)
  if (!current) return null

  const candidates: { priority: number; build: () => PendingCard }[] = []

  // Unshown concepts in current lesson (high priority)
  for (const c of current.concepts) {
    const key = progressKey(current.id, 'concept', c.id)
    const p = getOrCreateProgress(state, key)
    if (!p.conceptShown) {
      candidates.push({
        priority: 0,
        build: () => buildConcept(current.id, c.id, c.title, c.body),
      })
    }
  }

  // Unintroduced hiragana / vocab
  for (const h of current.hiragana) {
    const key = progressKey(current.id, 'hiragana', h.char)
    const p = getOrCreateProgress(state, key)
    if (p.introducedAt == null) {
      candidates.push({
        priority: 1,
        build: () => buildHiraganaIntro(current.id, h.char, h.romaji),
      })
    }
  }
  for (const v of current.vocab) {
    const key = progressKey(current.id, 'vocab', v.id)
    const p = getOrCreateProgress(state, key)
    if (p.introducedAt == null) {
      candidates.push({
        priority: 1,
        build: () =>
          buildVocabIntro(current.id, v.id, v.jp, v.reading, v.en, v.meta),
      })
    }
  }

  const allRomaji = current.hiragana.map((h) => h.romaji)
  const allChars = current.hiragana.map((h) => h.char)
  // Widen distractor pools from all lessons when needed
  const globalRomaji = lessons.flatMap((l) => l.hiragana.map((h) => h.romaji))
  const globalChars = lessons.flatMap((l) => l.hiragana.map((h) => h.char))
  const currentEn = current.vocab.map((v) => v.en)
  const currentJp = current.vocab.map((v) => v.jp)
  const globalEn = lessons.flatMap((l) => l.vocab.map((v) => v.en))
  const globalJp = lessons.flatMap((l) => l.vocab.map((v) => v.jp))

  // Weak (introduced but not mastered) tests — current lesson
  for (const h of current.hiragana) {
    const key = progressKey(current.id, 'hiragana', h.char)
    const p = getOrCreateProgress(state, key)
    if (p.introducedAt != null && !isItemMastered(p)) {
      candidates.push({
        priority: 2,
        build: () =>
          buildHiraganaTest(
            current.id,
            h.char,
            h.romaji,
            allRomaji.length >= 4 ? allRomaji : globalRomaji,
            allChars.length >= 4 ? allChars : globalChars,
          ),
      })
    }
  }
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
            v.jp,
            v.en,
            currentEn.length >= 4 ? currentEn : globalEn,
            currentJp.length >= 4 ? currentJp : globalJp,
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

    for (const h of lesson.hiragana) {
      const key = progressKey(lesson.id, 'hiragana', h.char)
      const p = getOrCreateProgress(state, key)
      if (p.introducedAt != null) {
        candidates.push({
          priority: 3,
          build: () =>
            buildHiraganaTest(
              lesson.id,
              h.char,
              h.romaji,
              globalRomaji,
              globalChars,
            ),
        })
      }
    }
    for (const v of lesson.vocab) {
      const key = progressKey(lesson.id, 'vocab', v.id)
      const p = getOrCreateProgress(state, key)
      if (p.introducedAt != null) {
        candidates.push({
          priority: 3,
          build: () =>
            buildVocabTest(
              lesson.id,
              v.id,
              v.jp,
              v.en,
              globalEn,
              globalJp,
              v.meta,
            ),
        })
      }
    }
  }

  // Also allow testing already-mastered current items occasionally (priority 3)
  for (const h of current.hiragana) {
    const key = progressKey(current.id, 'hiragana', h.char)
    const p = getOrCreateProgress(state, key)
    if (isItemMastered(p)) {
      candidates.push({
        priority: 3,
        build: () =>
          buildHiraganaTest(
            current.id,
            h.char,
            h.romaji,
            allRomaji.length >= 4 ? allRomaji : globalRomaji,
            allChars.length >= 4 ? allChars : globalChars,
          ),
      })
    }
  }
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
            v.jp,
            v.en,
            currentEn.length >= 4 ? currentEn : globalEn,
            currentJp.length >= 4 ? currentJp : globalJp,
            v.meta,
          ),
      })
    }
  }

  if (candidates.length === 0) {
    // Fallback: re-show a concept from current lesson
    const c = current.concepts[0]
    if (c) {
      return buildConcept(current.id, c.id, c.title, c.body)
    }
    const keys = lessonItemKeys(current)
    if (keys.hiragana[0]) {
      const h = current.hiragana[0]
      return buildHiraganaIntro(current.id, h.char, h.romaji)
    }
    return null
  }

  const best = Math.min(...candidates.map((c) => c.priority))
  const pool = candidates.filter((c) => c.priority === best)
  const chosen = pick(pool)
  return chosen ? chosen.build() : null
}
