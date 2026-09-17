package v1

import (
	"github.com/himanshuc3/tsunuga-be/internal/handler"
	"github.com/labstack/echo/v4"
)

func registerProgressRoutes(r *echo.Group, h *handler.ProgressHandler) {
	progress := r.Group("/progress")

	progress.GET("", h.ListProgress)
	progress.POST("/:item_id/attempt", h.RecordAttempt)
}
