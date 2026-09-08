package job

import (
	"encoding/json"
	"time"

	"github.com/hibiken/asynq"
)

const (
	TaskWelcome = "email:welcome"
)

type WelcomeEmailPayload struct {
	To        string `json:"to,omitempty"`
	FirstName string `json:"firstName,omitempty"`
}

// Error always come in the second position as a standard
func NewWelcomeEmailTask(to, firstName string) (*asynq.Task, error) {
	// To serialize -> to marshal the troops
	payload, err := json.Marshal(WelcomeEmailPayload{
		To:        to,
		FirstName: firstName,
	})

	if err != nil {
		return nil, err
	}

	return asynq.NewTask(TaskWelcome, payload, asynq.MaxRetry(3), asynq.Queue("default"), asynq.Timeout(30*time.Second)), nil
}
