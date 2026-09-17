package handler

import (
	"net/http"

	"github.com/himanshuc3/tsunuga-be/internal/model/progress"
	model "github.com/himanshuc3/tsunuga-be/internal/model/user"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/himanshuc3/tsunuga-be/internal/service"
	"github.com/labstack/echo/v4"
)

type ProgressHandler struct {
	Handler
	progressService *service.ProgressService
}

func NewProgressHandler(s *server.Server, progressService *service.ProgressService) *ProgressHandler {
	return &ProgressHandler{
		Handler:         NewHandler(s),
		progressService: progressService,
	}
}

func (h *ProgressHandler) ListProgress(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *model.EmptyPayload) ([]progress.ItemProgress, error) {
			return h.progressService.ListProgress(c)
		},
		http.StatusOK,
		&model.EmptyPayload{},
	)(c)
}

func (h *ProgressHandler) RecordAttempt(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *progress.RecordAttemptPayload) (*progress.ItemProgress, error) {
			return h.progressService.RecordAttempt(c, payload)
		},
		http.StatusOK,
		&progress.RecordAttemptPayload{},
	)(c)
}
