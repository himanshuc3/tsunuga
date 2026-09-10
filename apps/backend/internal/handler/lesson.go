package handler

import (
	"net/http"

	"github.com/himanshuc3/tsunuga-be/internal/model/lesson"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/himanshuc3/tsunuga-be/internal/service"
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
