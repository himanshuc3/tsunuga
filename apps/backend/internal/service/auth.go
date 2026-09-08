package service

import (
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/himanshuc3/tsunuga-be/internal/server"
)

type AuthService struct {
	server *server.Server
}

func NewAuthService(s *server.Server) *AuthService {
	clerk.SetKey(s.Config.Auth.SecretKey)
	return &AuthService{
		server: s,
	}
}
