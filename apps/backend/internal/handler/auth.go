package handler

import (
	"net/http"

	model "github.com/himanshuc3/tsunuga-be/internal/model/user"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/himanshuc3/tsunuga-be/internal/service"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	Handler
	authService *service.AuthService
}

func NewAuthHandler(s *server.Server, authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		Handler:     NewHandler(s),
		authService: authService,
	}
}

func (h *AuthHandler) AuthenticateUser(c echo.Context) error {
	return Handle(
		h.Handler,
		func(c echo.Context, payload *model.GoogleLoginPayload) (*model.AuthResponse, error) {
			return h.authService.LoginWithGoogle(c, payload.AccessToken)
		},
		http.StatusOK,
		&model.GoogleLoginPayload{},
	)(c)
}
