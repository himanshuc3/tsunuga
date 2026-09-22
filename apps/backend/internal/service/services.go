package service

import (
	"github.com/himanshuc3/tango-be/internal/lib/utils/job"
	"github.com/himanshuc3/tango-be/internal/repository"
	"github.com/himanshuc3/tango-be/internal/server"
)

type Services struct {
	Auth     *AuthService
	Job      *job.JobService
	Lesson   *LessonService
	Settings *SettingsService
	Progress *ProgressService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
	authService := NewAuthService(s, *repos.User)
	lessonService := NewLessonService(s, repos.Lesson, repos.Progress)
	settingsService := NewSettingsService(s, repos.Settings)
	progressService := NewProgressService(s, repos.Progress)

	return &Services{
		Job:      s.Job,
		Auth:     authService,
		Lesson:   lessonService,
		Settings: settingsService,
		Progress: progressService,
	}, nil
}
