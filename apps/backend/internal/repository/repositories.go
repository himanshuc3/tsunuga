package repository

import "github.com/himanshuc3/tsunuga-be/internal/server"

type Repositories struct {
	Lesson *LessonRepository
}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{
		Lesson: NewLessonRepository(s),
	}
}
