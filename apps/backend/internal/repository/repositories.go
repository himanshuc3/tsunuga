package repository

import "github.com/himanshuc3/tsunuga-be/internal/server"

type Repositories struct {
	Lesson   *LessonRepository
	User     *UserRepository
	Settings *SettingsRepository
}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{
		Lesson:   NewLessonRepository(s),
		User:     NewUserRepository(s),
		Settings: NewSettingsRepository(s),
	}
}
