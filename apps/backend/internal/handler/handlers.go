package handler

import (
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/himanshuc3/tsunuga-be/internal/service"
)

type Handlers struct {
	Health  *HealthHandler
	OpenAPI *OpenAPIHandler
	Lesson  *LessonHandler
}

func NewHandlers(s *server.Server, services *service.Services) *Handlers {
	return &Handlers{
		Health:  NewHealthHandler(s),
		OpenAPI: NewOpenAPIHandler(s),
		Lesson:  NewLessonHandler(s, services.Lesson),
	}
}
