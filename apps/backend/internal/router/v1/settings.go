package v1

import (
	"github.com/himanshuc3/tango-be/internal/handler"
	"github.com/labstack/echo/v4"
)

func registerSettingsRoutes(r *echo.Group, h *handler.SettingsHandler) {
	settings := r.Group("/settings")

	settings.GET("", h.GetSettings)
	settings.PUT("", h.UpdateSettings)
}
