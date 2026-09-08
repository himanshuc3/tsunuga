package errs

import "strings"

// Deals with form based errors to map
// each field to an error
type FieldError struct {
	Field string `json:"field"`
	Error string `json:"error"`
}

type ActionType string

const (
	ActionTypeRedirect ActionType = "redirect"
)

// For some cases like unauthenticated 401, we
// want to take an action like redirection
type Action struct {
	Type    ActionType `json:"type"`
	Message string     `json:"message"`
	Value   string     `json:"value"`
}

type HTTPError struct {
	Code     string `json:"code,omitempty"`
	Message  string `json:"message,omitempty"`
	Status   int    `json:"status,omitempty"`
	Override bool   `json:"override,omitempty"`
	// Field level errors
	Errors []FieldError `json:"errors,omitempty"`
	// action to be taken
	Action *Action `json:"action,omitempty"`
}

func (e *HTTPError) Error() string {
	return e.Message
}

// Is an http error
func (e *HTTPError) Is(target error) bool {
	_, ok := target.(*HTTPError)
	return ok
}

// Overriding an error's message
func (e *HTTPError) WithMessage(message string) *HTTPError {
	return &HTTPError{Code: e.Code, Message: message, Status: e.Status, Override: e.Override, Errors: e.Errors, Action: e.Action}
}

func MakeUpperCaseWithUnderscores(str string) string {
	return strings.ToUpper(strings.ReplaceAll(str, " ", "_"))
}
