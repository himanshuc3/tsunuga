package handler

import (
	"net/http"

	model "github.com/himanshuc3/tango-be/internal/model/user"
	"github.com/himanshuc3/tango-be/internal/server"
	"github.com/himanshuc3/tango-be/internal/service"
	"github.com/labstack/echo/v4"
)

type SettingsHandler struct {
	Handler
	settingsService *service.SettingsService
}

func NewSettingsHandler(s *server.Server, settingsService *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		Handler:         NewHandler(s),
		settingsService: settingsService,
	}
}

func (h *SettingsHandler) GetSettings(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *model.EmptyPayload) (*model.UserSettings, error) {
			return h.settingsService.GetSettings(c)
		},
		http.StatusOK,
		&model.EmptyPayload{},
	)(c)
}

func (h *SettingsHandler) UpdateSettings(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *model.UpdateUserSettingsPayload) (*model.UserSettings, error) {
			return h.settingsService.UpdateSettings(c, payload)
		},
		http.StatusOK,
		&model.UpdateUserSettingsPayload{},
	)(c)
}
