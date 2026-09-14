import type { Lesson } from '../../domain/types'

// No need of ids, since the lessons are hardcoded,
// index works as the id
export const lessons: Lesson[] = [
  {
    id: 'lesson-01',
    title: 'Vocab: Introductions',
    concepts: [
      {
        id: 'c-introductions',
        title: 'Words for people',
        body: 'Use these everyday words to introduce yourself and talk about people around you.',
        meta: 'Each word includes its Japanese, romaji, and English forms.',
      },
    ],
    vocab: [
      { id: 'v-ai', romaji: 'ai', en: 'love' },
      { id: 'v-ie', romaji: 'ie', en: 'house' },
      { id: 'v-ue', romaji: 'ue', en: 'up; above' },
      { id: 'v-ao', romaji: 'ao', en: 'blue', meta: 'a color' },
      { id: 'v-au', romaji: 'au', en: 'to meet' },
      { id: 'v-iu', romaji: 'iu', en: 'to say' },
      { id: 'v-oi', romaji: 'oi', en: 'nephew', meta: 'a family member' },
    ],
  },
  {
    id: 'lesson-02-greetings',
    title: 'Vocab: Greetings',
    unlockAfter: 'lesson-01',
    concepts: [
      {
        id: 'c-greetings',
        title: 'Everyday greetings',
        body: 'Use these expressions in common conversations throughout the day.',
        meta: 'Focus on the English meaning first, then reinforce the romaji reading.',
      },
    ],
    vocab: [
      { id: 'v-ohayou', romaji: 'ohayou', en: 'good morning (casual)' },
      { id: 'v-konnichiwa', romaji: 'konnichiwa', en: 'hello / good afternoon' },
      { id: 'v-konbanwa', romaji: 'konbanwa', en: 'good evening' },
      { id: 'v-arigatou', romaji: 'arigatou', en: 'thank you' },
      { id: 'v-sumimasen', romaji: 'sumimasen', en: 'excuse me / sorry' },
      { id: 'v-hai', romaji: 'hai', en: 'yes' },
      { id: 'v-iie', romaji: 'iie', en: 'no' },
    ],
  },
  {
    id: 'lesson-03-nouns',
    title: 'Vocab: Everyday nouns',
    unlockAfter: 'lesson-02-greetings',
    concepts: [
      {
        id: 'c-nouns',
        title: 'Building blocks',
        body: 'Simple nouns help you form real phrases and understand everyday Japanese.',
        meta: 'Read the romaji aloud after checking the English meaning.',
      },
    ],
    vocab: [
      { id: 'v-mizu', romaji: 'mizu', en: 'water' },
      { id: 'v-neko', romaji: 'neko', en: 'cat' },
      { id: 'v-inu', romaji: 'inu', en: 'dog' },
      { id: 'v-hon', romaji: 'hon', en: 'book' },
      { id: 'v-hito', romaji: 'hito', en: 'person' },
      { id: 'v-asa', romaji: 'asa', en: 'morning' },
      { id: 'v-yoru', romaji: 'yoru', en: 'night' },
      { id: 'v-sakana', romaji: 'sakana', en: 'fish' },
    ],
  },
]

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id)
}

export function getFirstLesson(): Lesson {
  return lessons[0]
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const index = lessons.findIndex((lesson) => lesson.id === currentId)
  if (index < 0 || index >= lessons.length - 1) return undefined
  return lessons[index + 1]
}
