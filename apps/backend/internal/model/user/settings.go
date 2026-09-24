package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// DefaultSettings is returned when a user has not customized their settings yet.
var DefaultSettings = Settings{
	RandomIntervalMinMinutes: 30,
	RandomIntervalMaxMinutes: 120,
	QuietTimeStart:           "22:00",
	QuietTimeEnd:             "07:00",
	Paused:                   false,
}

// Settings is persisted as a single JSONB column on user_settings.
type Settings struct {
	RandomIntervalMinMinutes int    `json:"random_interval_min_minutes" validate:"required,gte=1"`
	RandomIntervalMaxMinutes int    `json:"random_interval_max_minutes" validate:"required,gtefield=RandomIntervalMinMinutes"`
	QuietTimeStart           string `json:"quiet_time_start" validate:"required,quiettime"`
	QuietTimeEnd             string `json:"quiet_time_end" validate:"required,quiettime"`
	Paused                   bool   `json:"paused" validate:"required"`
}

// Scan implements sql.Scanner so pgx can populate this field from the settings JSONB column.
func (s *Settings) Scan(src any) error {
	if src == nil {
		*s = DefaultSettings
		return nil
	}

	bytes, ok := src.([]byte)
	if !ok {
		return fmt.Errorf("unsupported type for Settings.Scan: %T", src)
	}
	return json.Unmarshal(bytes, s)
}

// Value implements driver.Valuer so pgx can write this field back as JSONB.
func (s Settings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *Settings) Validate() error {
	validate := validator.New()
	if err := validate.RegisterValidation("quiettime", validateQuietTime); err != nil {
		return err
	}
	return validate.Struct(s)
}

// validateQuietTime enforces a 24h "HH:MM" time format
func validateQuietTime(fl validator.FieldLevel) bool {
	_, err := time.Parse("15:04", fl.Field().String())
	return err == nil
}

type UserSettings struct {
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Settings  Settings  `json:"settings" db:"settings"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
