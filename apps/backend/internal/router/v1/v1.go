package v1

import (
	"github.com/himanshuc3/tsunuga-be/internal/handler"
	"github.com/himanshuc3/tsunuga-be/internal/middleware"
	"github.com/labstack/echo/v4"
)

func RegisterV1Routes(router *echo.Group, handlers *handler.Handlers, middleware *middleware.Middlewares) {
	// Register lesson routes
	registerLessonRoutes(router, handlers.Lesson)
}
