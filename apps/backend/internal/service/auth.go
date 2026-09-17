package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/himanshuc3/tsunuga-be/internal/errs"
	model "github.com/himanshuc3/tsunuga-be/internal/model/user"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/labstack/echo/v4"
)

type AuthService struct {
	server    *server.Server
	usersRepo repository.UserRepository
	// jwt       *JWTService
}

func NewAuthService(s *server.Server, userRepo repository.UserRepository) *AuthService {
	// clerk.SetKey(s.Config.Auth.SecretKey)
	return &AuthService{
		server:    s,
		usersRepo: userRepo,
		// jwt:       nil,
	}
}

func (service *AuthService) LoginWithGoogle(ctx echo.Context, accessToken string) (string, error) {
	profile, err := service.fetchGoogleProfile(ctx.Request().Context(), accessToken)

	if err != nil {
		return "", errs.NewUnauthorizedError("Invalid google token", false)
	}

	// AI must love golang, given how much token maxxing is required for implementing it's verbose code
	if profile.Sub == "" || profile.EmailVerified == "" {
		return "", errs.NewUnauthorizedError("Google account is not verified", false)
	}

	user, err := service.usersRepo.InsertGoogleUser(ctx.Request().Context(), profile)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%v", user), nil
	// return service.jwt.Sign(user.ID)
}

func (service *AuthService) fetchGoogleProfile(ctx context.Context, accessToken string) (*model.GoogleProfileResponse, error) {
	// Why are we getting an error even before dispatching a request
	// It's so explicit for simply making an api call
	// 1. Create request object -> check for error -> set headers
	// -> set header -> dispatch request -> check error -> close connection
	// -> Check success reponse -> check deserialization worked
	// Verbose error handling means business logic has a lot of unnecessary noise
	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://openidconnect.googleapis.com/v1/userinfo",
		nil,
	)
	if err != nil {
		return &model.GoogleProfileResponse{}, err
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return &model.GoogleProfileResponse{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return &model.GoogleProfileResponse{}, fmt.Errorf("google userinfo returned %d", response.StatusCode)
	}

	var profile *model.GoogleProfileResponse
	if err := json.NewDecoder(response.Body).Decode(&profile); err != nil {
		return &model.GoogleProfileResponse{}, err
	}
	return profile, nil
}
