package v1

import (
	"github.com/himanshuc3/tsunuga-be/internal/handler"
	"github.com/himanshuc3/tsunuga-be/internal/middleware"
	"github.com/labstack/echo/v4"
)

func RegisterV1Routes(router *echo.Group, handlers *handler.Handlers, mw *middleware.Middlewares) {
	// Public routes (no auth required)
	registerAuthRoutes(router, handlers.Authentication)

	// Protected routes, require a valid JWT issued by our login flow
	protected := router.Group("", mw.Auth.RequireJWTAuth)
	registerLessonRoutes(protected, handlers.Lesson)
	registerSettingsRoutes(protected, handlers.Settings)
	registerProgressRoutes(protected, handlers.Progress)
}
