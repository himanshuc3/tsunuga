package service

import (
	"strconv"

	"github.com/himanshuc3/tsunuga-be/internal/middleware"
	"github.com/himanshuc3/tsunuga-be/internal/model/lesson"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/labstack/echo/v4"
)

type LessonService struct {
	server     *server.Server
	lessonRepo *repository.LessonRepository
}

func NewLessonService(s *server.Server, r *repository.LessonRepository) *LessonService {
	return &LessonService{
		server:     s,
		lessonRepo: r,
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
