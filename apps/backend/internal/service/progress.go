package service

import (
	"github.com/google/uuid"
	"github.com/himanshuc3/tsunuga-be/internal/errs"
	"github.com/himanshuc3/tsunuga-be/internal/middleware"
	"github.com/himanshuc3/tsunuga-be/internal/model/progress"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/labstack/echo/v4"
)

type ProgressService struct {
	server       *server.Server
	progressRepo *repository.ProgressRepository
}

func NewProgressService(s *server.Server, r *repository.ProgressRepository) *ProgressService {
	return &ProgressService{
		server:       s,
		progressRepo: r,
	}
}

func (s *ProgressService) ListProgress(ctx echo.Context) ([]progress.ItemProgress, error) {
	logger := middleware.GetLogger(ctx)

	userID, err := uuid.Parse(middleware.GetUserID(ctx))
	if err != nil {
		return nil, errs.NewUnauthorizedError("Unauthorized", false)
	}

	items, err := s.progressRepo.ListUserProgress(ctx.Request().Context(), userID)
	if err != nil {
		logger.Error().Err(err).Msg("failed to list user progress")
		return nil, err
	}
	return items, nil
}

func (s *ProgressService) RecordAttempt(ctx echo.Context, payload *progress.RecordAttemptPayload) (*progress.ItemProgress, error) {
	logger := middleware.GetLogger(ctx)

	userID, err := uuid.Parse(middleware.GetUserID(ctx))
	if err != nil {
		return nil, errs.NewUnauthorizedError("Unauthorized", false)
	}

	item, err := s.progressRepo.RecordAttempt(ctx.Request().Context(), userID, payload.ItemID, payload.Correct)
	if err != nil {
		logger.Error().Err(err).Msg("failed to record item attempt")
		return nil, err
	}

	logger.Info().
		Str("event", "item_attempt_recorded").
		Str("user_id", userID.String()).
		Str("item_id", payload.ItemID).
		Bool("correct", payload.Correct).
		Msg("item attempt recorded successfully")

	return item, nil
}
