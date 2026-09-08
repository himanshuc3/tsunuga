package service

import (
	"github.com/himanshuc3/tsunuga-be/internal/lib/utils/job"
	"github.com/himanshuc3/tsunuga-be/internal/server"
)

type Services struct {
	Auth *AuthService
	Job  *job.JobService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
	authService := NewAuthService(s)

	return &Services{
		Job:  s.Job,
		Auth: authService,
	}, nil
}
