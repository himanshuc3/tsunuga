package handlers

import (
	"encoding/json"
	"net/http"
)

func (h *Handler) GetAllLessons(w http.ResponseWriter, r *http.Request) {
	lessons, err := h.Store.ListLessons(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, lessons)
}

func (h *Handler) GetLesson(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("lessonID")
	lesson, ok, err := h.Store.GetLesson(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !ok {
		writeError(w, http.StatusNotFound, "lesson not found")
		return
	}
	writeJSON(w, http.StatusOK, lesson)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
