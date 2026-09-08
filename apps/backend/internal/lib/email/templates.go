package email

type Template string

// Essentially creating an enum to indicate that
// we only refer to these file template names
// available for consumption of html files
const (
	TemplateWelcome Template = "welcome"
)
