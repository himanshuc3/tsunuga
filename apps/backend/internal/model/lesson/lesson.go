package lesson

import "github.com/himanshuc3/tsunuga-be/internal/model"

// json for output to clients
// db for input from database
type Lesson struct {
	model.Base
	Title    string `json:"title,omitempty" db:"title"`
	Position int    `json:"position,omitempty" db:"position"`
	Active   bool   `json:"active,omitempty" db:"active"`
}
