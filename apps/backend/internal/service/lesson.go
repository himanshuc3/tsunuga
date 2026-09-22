package service

import (
	"strconv"

	"github.com/google/uuid"
	"github.com/himanshuc3/tango-be/internal/errs"
	"github.com/himanshuc3/tango-be/internal/middleware"
	"github.com/himanshuc3/tango-be/internal/model/lesson"
	"github.com/himanshuc3/tango-be/internal/repository"
	"github.com/himanshuc3/tango-be/internal/server"
	"github.com/labstack/echo/v4"
)

type LessonService struct {
	server       *server.Server
	lessonRepo   *repository.LessonRepository
	progressRepo *repository.ProgressRepository
}

func NewLessonService(s *server.Server, r *repository.LessonRepository, progressRepo *repository.ProgressRepository) *LessonService {
	return &LessonService{
		server:       s,
		lessonRepo:   r,
		progressRepo: progressRepo,
	}
}

func (s *LessonService) CreateLesson(ctx echo.Context, payload *lesson.CreateLessonPayload) (*lesson.Lesson, error) {
	logger := middleware.GetLogger(ctx)

	lessonItem, err := s.lessonRepo.CreateLesson(ctx.Request().Context(), payload)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create lesson")
		return nil, err
	}

	logger.Info().
		Str("event", "lesson_created").
		Str("lesson_id", lessonItem.ID.String()).
		Str("title", lessonItem.Title).
		Str("position", strconv.Itoa(lessonItem.Position)).
		Msg("Lesson created successfully")

	return lessonItem, nil
}

// ListLessons returns every lesson (with concepts/vocab) ordered by position.
func (s *LessonService) ListLessons(ctx echo.Context) ([]lesson.Detail, error) {
	logger := middleware.GetLogger(ctx)

	lessons, err := s.lessonRepo.ListLessons(ctx.Request().Context())
	if err != nil {
		logger.Error().Err(err).Msg("failed to list lessons")
		return nil, err
	}
	return lessons, nil
}

// GetLesson returns a single lesson (with concepts/vocab) by ID.
func (s *LessonService) GetLesson(ctx echo.Context, payload *lesson.GetLessonByIDPayload) (*lesson.Detail, error) {
	logger := middleware.GetLogger(ctx)

	lessonDetail, err := s.lessonRepo.GetLessonByID(ctx.Request().Context(), payload.ID)
	if err != nil {
		logger.Error().Err(err).Str("lesson_id", payload.ID).Msg("failed to get lesson")
		return nil, err
	}
	if lessonDetail == nil {
		return nil, errs.NewNotFoundError("Lesson not found", false, nil)
	}
	return lessonDetail, nil
}

// GetNextLesson returns the first lesson the user has not yet completed,
// so the client can fetch it immediately after login without waiting on the full catalog.
func (s *LessonService) GetNextLesson(ctx echo.Context) (*lesson.Detail, error) {
	logger := middleware.GetLogger(ctx)

	userID, err := uuid.Parse(middleware.GetUserID(ctx))
	if err != nil {
		return nil, errs.NewUnauthorizedError("Unauthorized", false)
	}

	lessons, err := s.lessonRepo.ListLessons(ctx.Request().Context())
	if err != nil {
		logger.Error().Err(err).Msg("failed to list lessons for next lesson lookup")
		return nil, err
	}
	if len(lessons) == 0 {
		return nil, errs.NewNotFoundError("No lessons available", false, nil)
	}

	progressItems, err := s.progressRepo.ListUserProgress(ctx.Request().Context(), userID)
	if err != nil {
		logger.Error().Err(err).Msg("failed to list user progress for next lesson lookup")
		return nil, err
	}

	completed := make(map[string]bool, len(progressItems))
	for _, item := range progressItems {
		if item.CompletedAt != nil {
			completed[item.ItemID] = true
		}
	}

	for i := range lessons {
		if !isLessonComplete(&lessons[i], completed) {
			return &lessons[i], nil
		}
	}

	// Everything is complete, keep serving the last lesson.
	return &lessons[len(lessons)-1], nil
}

func isLessonComplete(l *lesson.Detail, completed map[string]bool) bool {
	for _, concept := range l.Concepts {
		if !completed[concept.ID] {
			return false
		}
	}
	for _, vocab := range l.Vocab {
		if !completed[vocab.ID] {
			return false
		}
	}
	return true
}
