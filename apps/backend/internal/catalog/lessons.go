package catalog

import "github.com/himanshuc3/tsunuga-be/internal/domain"

// Lessons is the authoring source of truth. Edit this slice, restart the API,
// and SyncCatalog upserts the same IDs/content into Postgres.
var Lessons = []domain.Lesson{
	{
		ID:    "lesson-01-people",
		Title: "People",
		Concepts: []domain.Concept{
			{
				ID:    "c-romaji",
				Title: "Learning in romaji",
				Body:  "Romaji is Japanese written with the Latin alphabet. In this course you will learn vocabulary and short phrases in romaji so you can read and write everyday Japanese without learning kana first.",
			},
			{
				ID:    "c-macron",
				Title: "What are macrons?",
				Body:  "A macron (e.g. kyōshi) means a longer vowel and held for twice the duration of a short vowel.",
			},
		},
		Vocab: []domain.Vocab{
			{ID: "v-watashi", Romaji: "watashi", EN: "I / me"},
			{ID: "v-anata", Romaji: "anata", EN: "you"},
			{
				ID:     "v-anohito",
				Romaji: "ano hito / ano kata",
				EN:     "that person / he / she",
				Meta:   "ano kata is the polite/formal version",
			},
			{ID: "v-sensei", Romaji: "sensei", EN: "teacher / instructor"},
			{
				ID:     "v-kyoshi",
				Romaji: "kyōshi",
				EN:     "teacher / instructor",
				Meta:   "Often used when referring to yourself",
			},
			{ID: "v-gakusei", Romaji: "gakusei", EN: "student"},
			{ID: "v-kaishain", Romaji: "kaishain", EN: "company employee"},
			{
				ID:     "v-shain",
				Romaji: "shain",
				EN:     "employee",
				Meta:   "Often used with a company name, e.g. Quillbot no [word]",
			},
		},
	},
	{
		ID:    "lesson-02-greetings",
		Title: "Greetings",
		Concepts: []domain.Concept{
			{
				ID:    "c-particles",
				Title: "Particles",
				Body:  "Particles are small words that sit after a word to show its role in the sentence — for example the topic, possession, or what is being talked about. You will meet them soon in patterns like [topic] wa [noun] desu.",
			},
			{
				ID:    "c-sov",
				Title: "Sentence order",
				Body:  "Japanese sentences put the verb at the end: subject–object–verb (SOV). That is the same order as Hindi, and different from English’s subject–verb–object.",
				Meta:  "English: I eat sushi → Japanese: Watashi wa sushi o tabemasu (I / sushi / eat)",
			},
		},
		Vocab: []domain.Vocab{
			{ID: "v-ohayou", Romaji: "ohayō / ohayō gozaimasu", EN: "good morning"},
			{ID: "v-konnichiwa", Romaji: "konnichiwa", EN: "hello / good afternoon"},
			{ID: "v-konbanwa", Romaji: "konbanwa", EN: "good evening"},
			{ID: "v-arigatou", Romaji: "arigatou", EN: "thank you"},
			{ID: "v-sumimasen", Romaji: "sumimasen", EN: "excuse me / sorry"},
			{ID: "v-hai", Romaji: "hai", EN: "yes"},
			{ID: "v-iie", Romaji: "iie", EN: "no"},
		},
	},
	{
		ID:    "lesson-03-nouns",
		Title: "Everyday nouns",
		Concepts: []domain.Concept{
			{
				ID:    "c-nouns",
				Title: "Building blocks",
				Body:  "Simple nouns help you form real phrases. Match each romaji word to its meaning — you will reuse these when building sentences.",
			},
		},
		Vocab: []domain.Vocab{
			{ID: "v-mizu", Romaji: "mizu", EN: "water"},
			{ID: "v-inu", Romaji: "inu", EN: "dog"},
			{ID: "v-neko", Romaji: "neko", EN: "cat"},
			{ID: "v-hon", Romaji: "hon", EN: "book"},
			{ID: "v-hito", Romaji: "hito", EN: "person"},
			{ID: "v-asa", Romaji: "asa", EN: "morning"},
			{ID: "v-yoru", Romaji: "yoru", EN: "night"},
			{ID: "v-sakana", Romaji: "sakana", EN: "fish"},
		},
	},
	{
		ID:    "lesson-04-particles",
		Title: "Particles: wa & desu",
		Concepts: []domain.Concept{
			{
				ID:    "c-wa-desu",
				Title: "Building “A is B”",
				Body:  "Use wa to mark the topic and desu to end a polite “is/am/are” sentence. Pattern: [topic] wa [noun] desu.",
				Meta:  "Romaji: Watashi wa gakusei desu. English (literal translation): I student is.",
			},
		},
		Vocab: []domain.Vocab{
			{
				ID:     "v-wa",
				Romaji: "wa",
				EN:     "topic marker (as for…)",
				Meta:   "Written は in kana, pronounced “wa”",
			},
			{ID: "v-desu", Romaji: "desu", EN: "is / am / are"},
			{
				ID:     "v-no",
				Romaji: "no",
				EN:     "possessive / of",
				Meta:   "Connects nouns: Quillbot no shain",
			},
		},
	},
}

func ByID(id string) (domain.Lesson, bool) {
	for _, lesson := range Lessons {
		if lesson.ID == id {
			return lesson, true
		}
	}
	return domain.Lesson{}, false
}

func First() domain.Lesson {
	return Lessons[0]
}

func Next(currentID string) (domain.Lesson, bool) {
	for i, lesson := range Lessons {
		if lesson.ID == currentID {
			if i >= len(Lessons)-1 {
				return domain.Lesson{}, false
			}
			return Lessons[i+1], true
		}
	}
	return domain.Lesson{}, false
}
