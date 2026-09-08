package repository

import "github.com/himanshuc3/tsunuga-be/internal/server"

type Repositories struct{}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{}
}
