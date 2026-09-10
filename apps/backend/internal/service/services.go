package service

import (
	"github.com/himanshuc3/tsunuga-be/internal/lib/utils/job"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/server"
)

type Services struct {
	Auth   *AuthService
	Job    *job.JobService
	Lesson *LessonService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
	authService := NewAuthService(s)
	lessonService := NewLessonService(s, repos.Lesson)

	return &Services{
		Job:    s.Job,
		Auth:   authService,
		Lesson: lessonService,
	}, nil
}
