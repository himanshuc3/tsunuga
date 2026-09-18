package service

import (
	"github.com/google/uuid"
	"github.com/himanshuc3/tango-be/internal/errs"
	"github.com/himanshuc3/tango-be/internal/middleware"
	model "github.com/himanshuc3/tango-be/internal/model/user"
	"github.com/himanshuc3/tango-be/internal/repository"
	"github.com/himanshuc3/tango-be/internal/server"
	"github.com/labstack/echo/v4"
)

type SettingsService struct {
	server       *server.Server
	settingsRepo *repository.SettingsRepository
}

func NewSettingsService(s *server.Server, r *repository.SettingsRepository) *SettingsService {
	return &SettingsService{
		server:       s,
		settingsRepo: r,
	}
}

func (s *SettingsService) GetSettings(ctx echo.Context) (*model.UserSettings, error) {
	logger := middleware.GetLogger(ctx)

	userID, err := uuid.Parse(middleware.GetUserID(ctx))
	if err != nil {
		return nil, errs.NewUnauthorizedError("Unauthorized", false)
	}

	settings, err := s.settingsRepo.GetUserSettings(ctx.Request().Context(), userID)
	if err != nil {
		logger.Error().Err(err).Msg("failed to get user settings")
		return nil, err
	}
	return settings, nil
}

func (s *SettingsService) UpdateSettings(ctx echo.Context, payload *model.UpdateUserSettingsPayload) (*model.UserSettings, error) {
	logger := middleware.GetLogger(ctx)

	userID, err := uuid.Parse(middleware.GetUserID(ctx))
	if err != nil {
		return nil, errs.NewUnauthorizedError("Unauthorized", false)
	}

	settings, err := s.settingsRepo.UpsertUserSettings(ctx.Request().Context(), userID, payload.Settings)
	if err != nil {
		logger.Error().Err(err).Msg("failed to update user settings")
		return nil, err
	}

	logger.Info().
		Str("event", "user_settings_updated").
		Str("user_id", userID.String()).
		Msg("user settings updated successfully")

	return settings, nil
}
