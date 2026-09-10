package v1

import (
	"github.com/himanshuc3/tsunuga-be/internal/handler"
	"github.com/labstack/echo/v4"
)

func registerLessonRoutes(r *echo.Group, h *handler.LessonHandler) {
	lessons := r.Group("/lessons")

	// Collection operations
	lessons.POST("", h.CreateLesson)
}
