import type { Lesson } from '../../domain/types'

export const lessons: Lesson[] = [
  {
    id: 'lesson-01-vowels',
    order: 1,
    title: 'Hiragana: Vowels',
    concepts: [
      {
        id: 'c-hiragana-intro',
        title: 'What is hiragana?',
        body: 'Hiragana is one of the Japanese writing systems. Each character represents a syllable sound. Start with the five vowels: a, i, u, e, o.',
      },
    ],
    hiragana: [
      // { char: 'あ', romaji: 'a' },
      // { char: 'い', romaji: 'i' },
      // { char: 'う', romaji: 'u' },
      // { char: 'え', romaji: 'e' },
      // { char: 'お', romaji: 'o' },
    ],
    vocab: [
      { id: 'v-ai', jp: 'あい', reading: 'watashi', en: 'I' },
      { id: 'v-ie', jp: 'いえ', reading: 'anata', en: 'you' },
      { id: 'v-ue', jp: 'うえ', reading: 'sensei', en: 'teacher/instructor' },
      { id: 'v-ao', jp: 'あお', reading: 'kyōshi', en: 'teacher/instructor', meta: 'refering to self' },
      { id: 'v-au', jp: 'あう', reading: 'gakusei', en: 'student' },
      { id: 'v-iu', jp: 'いう', reading: 'kaishain', en: 'company employee' },
      { id: 'v-oi', jp: 'おい', reading: 'shain', en: 'employee', meta: 'Quillbot no shain' },
    ],
  },
  {
    id: 'lesson-02-k-row',
    order: 2,
    title: 'Hiragana: K-row',
    unlockAfter: 'lesson-01-vowels',
    concepts: [
      {
        id: 'c-consonant-rows',
        title: 'Consonant rows',
        body: 'After vowels come consonant rows. The K-row adds a k-sound before each vowel: ka, ki, ku, ke, ko.',
      },
    ],
    hiragana: [
      // { char: 'か', romaji: 'ka' },
      // { char: 'き', romaji: 'ki' },
      // { char: 'く', romaji: 'ku' },
      // { char: 'け', romaji: 'ke' },
      // { char: 'こ', romaji: 'ko' },
    ],
    vocab: [],
  },
  {
    id: 'lesson-03-s-row',
    order: 3,
    title: 'Hiragana: S-row',
    unlockAfter: 'lesson-02-k-row',
    concepts: [
      {
        id: 'c-shi',
        title: 'Note: し is “shi”',
        body: 'Most S-row sounds are sa/su/se/so, but し is pronounced “shi,” not “si.”',
      },
    ],
    hiragana: [
      { char: 'さ', romaji: 'sa' },
      { char: 'し', romaji: 'shi' },
      { char: 'す', romaji: 'su' },
      { char: 'せ', romaji: 'se' },
      { char: 'そ', romaji: 'so' },
    ],
    vocab: [],
  },
  {
    id: 'lesson-04-t-row',
    order: 4,
    title: 'Hiragana: T-row',
    unlockAfter: 'lesson-03-s-row',
    concepts: [
      {
        id: 'c-chi-tsu',
        title: 'Note: ち and つ',
        body: 'ち is “chi” (not ti) and つ is “tsu” (not tu). These irregular readings are common in Japanese.',
      },
    ],
    hiragana: [
      { char: 'た', romaji: 'ta' },
      { char: 'ち', romaji: 'chi' },
      { char: 'つ', romaji: 'tsu' },
      { char: 'て', romaji: 'te' },
      { char: 'と', romaji: 'to' },
    ],
    vocab: [],
  },
  {
    id: 'lesson-05-n-row',
    order: 5,
    title: 'Hiragana: N-row',
    unlockAfter: 'lesson-04-t-row',
    concepts: [
      {
        id: 'c-n-row',
        title: 'The N-row',
        body: 'The N-row is regular: na, ni, nu, ne, no. You now have enough kana to read many short words.',
      },
    ],
    hiragana: [
      { char: 'な', romaji: 'na' },
      { char: 'に', romaji: 'ni' },
      { char: 'ぬ', romaji: 'nu' },
      { char: 'ね', romaji: 'ne' },
      { char: 'の', romaji: 'no' },
    ],
    vocab: [],
  },
  {
    id: 'lesson-06-greetings',
    order: 6,
    title: 'Vocab: Greetings',
    unlockAfter: 'lesson-05-n-row',
    concepts: [
      {
        id: 'c-greetings',
        title: 'Everyday greetings',
        body: 'These greetings use kana you already know. Focus on meaning first; reading will reinforce the characters.',
      },
    ],
    hiragana: [],
    vocab: [
      { id: 'v-ohayou', jp: 'おはよう', reading: 'ohayou', en: 'good morning (casual)' },
      { id: 'v-konnichiwa', jp: 'こんにちは', reading: 'konnichiwa', en: 'hello / good afternoon' },
      { id: 'v-konbanwa', jp: 'こんばんは', reading: 'konbanwa', en: 'good evening' },
      { id: 'v-arigatou', jp: 'ありがとう', reading: 'arigatou', en: 'thank you' },
      { id: 'v-sumimasen', jp: 'すみません', reading: 'sumimasen', en: 'excuse me / sorry' },
      { id: 'v-hai', jp: 'はい', reading: 'hai', en: 'yes' },
      { id: 'v-iie', jp: 'いいえ', reading: 'iie', en: 'no' },
    ],
  },
  {
    id: 'lesson-07-h-row',
    order: 7,
    title: 'Hiragana: H-row',
    unlockAfter: 'lesson-06-greetings',
    concepts: [
      {
        id: 'c-fu',
        title: 'Note: ふ is “fu”',
        body: 'ふ is usually romanized as “fu” (closer to a soft f) rather than “hu.”',
      },
    ],
    hiragana: [
      { char: 'は', romaji: 'ha' },
      { char: 'ひ', romaji: 'hi' },
      { char: 'ふ', romaji: 'fu' },
      { char: 'へ', romaji: 'he' },
      { char: 'ほ', romaji: 'ho' },
    ],
    vocab: [],
  },
  {
    id: 'lesson-08-nouns',
    order: 8,
    title: 'Vocab: Everyday nouns',
    unlockAfter: 'lesson-07-h-row',
    concepts: [
      {
        id: 'c-nouns',
        title: 'Building blocks',
        body: 'Simple nouns help you form real phrases. Match each word to its meaning, then practice reading the kana aloud.',
      },
    ],
    hiragana: [],
    vocab: [
      { id: 'v-mizu', jp: 'みず', reading: 'mizu', en: 'water' },
      { id: 'v-neko', jp: 'ねこ', reading: 'neko', en: 'cat' },
      { id: 'v-inu', jp: 'いぬ', reading: 'inu', en: 'dog' },
      { id: 'v-hon', jp: 'ほん', reading: 'hon', en: 'book' },
      { id: 'v-hito', jp: 'ひと', reading: 'hito', en: 'person' },
      { id: 'v-asa', jp: 'あさ', reading: 'asa', en: 'morning' },
      { id: 'v-yoru', jp: 'よる', reading: 'yoru', en: 'night' },
      { id: 'v-sakana', jp: 'さかな', reading: 'sakana', en: 'fish' },
    ],
  },
]

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id)
}

export function getSortedLessons(): Lesson[] {
  return [...lessons].sort((a, b) => a.order - b.order)
}

export function getFirstLesson(): Lesson {
  return getSortedLessons()[0]
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const sorted = getSortedLessons()
  const idx = sorted.findIndex((l) => l.id === currentId)
  if (idx < 0 || idx >= sorted.length - 1) return undefined
  return sorted[idx + 1]
}
