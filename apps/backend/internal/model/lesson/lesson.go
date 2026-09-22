package lesson

import "github.com/himanshuc3/tango-be/internal/model"

// json for output to clients
// db for input from database
type Lesson struct {
	model.Base
	Title    string `json:"title,omitempty" db:"title"`
	Position int    `json:"position,omitempty" db:"position"`
	Active   bool   `json:"active,omitempty" db:"active"`
}

// Concept is a single teaching item within a lesson.
type Concept struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Body  string `json:"body"`
	Meta  string `json:"meta,omitempty"`
}

// Vocab is a single vocabulary item within a lesson.
type Vocab struct {
	ID     string `json:"id"`
	Romaji string `json:"romaji"`
	EN     string `json:"en"`
	Meta   string `json:"meta,omitempty"`
}

// Detail is the full lesson payload (with items) returned to clients.
type Detail struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Position int       `json:"position"`
	Concepts []Concept `json:"concepts"`
	Vocab    []Vocab   `json:"vocab"`
}
