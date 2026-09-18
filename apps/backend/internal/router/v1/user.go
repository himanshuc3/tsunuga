package v1

import (
	"github.com/himanshuc3/tango-be/internal/handler"
	"github.com/labstack/echo/v4"
)

func registerAuthRoutes(r *echo.Group, h *handler.AuthHandler) {
	lessons := r.Group("/login")

	// Collection operations
	lessons.POST("", h.AuthenticateUser)
}
