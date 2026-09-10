package lesson

import "github.com/go-playground/validator/v10"

// DTOs are required for defining public I/O contracts
// defined for all endpoints
// It mostly acts as a subset of the data available in
// table, filtering out the columns not required.

type GetLessonPayload struct {
	Title    string `json:"title,omitempty" validate:"required"`
	Position int    `json:"position,omitempty" validate="required"`
	Active   bool   `json:"active,omitempty" validate="required"`
}

func (p *GetLessonPayload) Validate() error {
	validate := validator.New()
	return validate.Struct(p)
}

type CreateLessonPayload struct {
	Title    string `json:"title,omitempty" validate:"required"`
	Position int    `json:"position,omitempty" validate="required"`
	Active   bool   `json:"active,omitempty" validate="required"`
}

func (p *CreateLessonPayload) Validate() error {
	validate := validator.New()
	return validate.Struct(p)
}
