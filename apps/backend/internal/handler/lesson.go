package handler

import (
	"net/http"

	"github.com/himanshuc3/tango-be/internal/model/lesson"
	model "github.com/himanshuc3/tango-be/internal/model/user"
	"github.com/himanshuc3/tango-be/internal/server"
	"github.com/himanshuc3/tango-be/internal/service"
	"github.com/labstack/echo/v4"
)

type LessonHandler struct {
	Handler
	lessonService *service.LessonService
}

func NewLessonHandler(s *server.Server, lessonService *service.LessonService) *LessonHandler {
	return &LessonHandler{
		Handler:       NewHandler(s),
		lessonService: lessonService,
	}
}

func (h *LessonHandler) CreateLesson(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *lesson.CreateLessonPayload) (*lesson.Lesson, error) {

			return h.lessonService.CreateLesson(c, payload)
		},
		http.StatusCreated,
		&lesson.CreateLessonPayload{},
	)(c)
}

func (h *LessonHandler) ListLessons(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *model.EmptyPayload) ([]lesson.Detail, error) {
			return h.lessonService.ListLessons(c)
		},
		http.StatusOK,
		&model.EmptyPayload{},
	)(c)
}

func (h *LessonHandler) GetLesson(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *lesson.GetLessonByIDPayload) (*lesson.Detail, error) {
			return h.lessonService.GetLesson(c, payload)
		},
		http.StatusOK,
		&lesson.GetLessonByIDPayload{},
	)(c)
}

func (h *LessonHandler) GetNextLesson(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *model.EmptyPayload) (*lesson.Detail, error) {
			return h.lessonService.GetNextLesson(c)
		},
		http.StatusOK,
		&model.EmptyPayload{},
	)(c)
}

// func (h *TodoHandler) GetTodoByID(c echo.Context) error {
// 	return Handle(
// 		h.Handler,
// 		func(c echo.Context, payload *todo.GetTodoByIDPayload) (*todo.PopulatedTodo, error) {
// 			userID := middleware.GetUserID(c)
// 			return h.todoService.GetTodoByID(c, userID, payload.ID)
// 		},
// 		http.StatusOK,
// 		&todo.GetTodoByIDPayload{},
// 	)(c)
// }
