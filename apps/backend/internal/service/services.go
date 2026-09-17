package service

import (
	"github.com/himanshuc3/tsunuga-be/internal/lib/utils/job"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/server"
)

type Services struct {
	Auth     *AuthService
	Job      *job.JobService
	Lesson   *LessonService
	Settings *SettingsService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
	authService := NewAuthService(s, *repos.User)
	lessonService := NewLessonService(s, repos.Lesson)
	settingsService := NewSettingsService(s, repos.Settings)

	return &Services{
		Job:      s.Job,
		Auth:     authService,
		Lesson:   lessonService,
		Settings: settingsService,
	}, nil
}
