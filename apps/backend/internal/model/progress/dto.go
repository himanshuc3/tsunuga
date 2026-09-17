package progress

import (
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// ItemProgress mirrors a row of user_item_progress.
type ItemProgress struct {
	UserID        uuid.UUID  `json:"user_id" db:"user_id"`
	ItemID        string     `json:"item_id" db:"item_id"`
	IntroducedAt  *time.Time `json:"introduced_at,omitempty" db:"introduced_at"`
	CorrectStreak int        `json:"correct_streak" db:"correct_streak"`
	LastSeenAt    *time.Time `json:"last_seen_at,omitempty" db:"last_seen_at"`
	ConceptShown  bool       `json:"concept_shown" db:"concept_shown"`
	CompletedAt   *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// RecordAttemptPayload captures the result of a user answering a lesson item.
type RecordAttemptPayload struct {
	ItemID  string `param:"item_id" json:"-" validate:"required"`
	Correct bool   `json:"correct"`
}

func (p *RecordAttemptPayload) Validate() error {
	validate := validator.New()
	return validate.Struct(p)
}
