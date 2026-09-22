package v1

import (
	"github.com/himanshuc3/tango-be/internal/handler"
	"github.com/labstack/echo/v4"
)

func registerLessonRoutes(r *echo.Group, h *handler.LessonHandler) {
	lessons := r.Group("/lessons")

	// Collection operations
	lessons.POST("", h.CreateLesson)
	lessons.GET("", h.ListLessons)

	// Static routes must be registered before the dynamic /:id route
	lessons.GET("/next", h.GetNextLesson)
	lessons.GET("/:id", h.GetLesson)
}
