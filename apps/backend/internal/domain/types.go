package domain

// 1. Everything in go is passed by value, even pointers passed by value
// 2. Stacks for memory allocation are inverted.
// 3. Stacks get cleaned on it's own because of the frame model
// but garbage collector gets involved in heap allocation
// 4. Compiler determines using escape analysis whether the pointer
// data is living in stack/heap. As a common standard, we want value
// semantics while assigning a value.
// 5. Constants can get implicit typing (usually kind promotion happens
// if different kinds of types are involved, like int to float)
// 6. Constants are values assigned at compile time and have a high
// precision (256 bits).
// 7. No one asked for but we get auto-increment iota feature.
// 8. Apparently go is data-oriented, not object oriented
type ItemKind string

const (
	ItemKindConcept ItemKind = "concept"
	ItemKindVocab   ItemKind = "vocab"
)

type Lesson struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Concepts []Concept `json:"concepts"`
	Vocab    []Vocab   `json:"vocab"`
}

type Concept struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Body  string `json:"body"`
	Meta  string `json:"meta,omitempty"`
}

type Vocab struct {
	ID     string `json:"id"`
	Romaji string `json:"romaji"`
	EN     string `json:"en"`
	Meta   string `json:"meta,omitempty"`
}

type AppState struct {
	CurrentLessonID   string                  `json:"currentLessonId"`
	UnlockedLessonIDs []string                `json:"unlockedLessonIDs"`
	ItemProgress      map[string]ItemProgress `json:"itemProgress"`
	Settings          Settings                `json:"settings"`
	QueuedCard        *QueuedCard             `json:"queuedCard"`
}

type ItemProgress struct {
	introducedAt  int
	correctStreak int
	lastSeenAt    int
	conceptShown  bool
}

type Settings struct {
}

type QueuedCard struct {
}
