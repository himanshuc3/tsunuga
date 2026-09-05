package api

import (
	"net/http"

	"github.com/himanshuc3/tsunuga-be/internal/api/handlers"
)

func NewRouter(h *handlers.Handler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok"}`))
	})
	mux.HandleFunc("GET /lesson/all", h.GetAllLessons)
	mux.HandleFunc("GET /lesson/{lessonID}", h.GetLesson)
	return mux
}
