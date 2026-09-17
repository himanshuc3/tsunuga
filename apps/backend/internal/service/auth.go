package service

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/himanshuc3/tsunuga-be/internal/errs"
	"github.com/himanshuc3/tsunuga-be/internal/lib/jwt"
	"github.com/himanshuc3/tsunuga-be/internal/middleware"
	model "github.com/himanshuc3/tsunuga-be/internal/model/user"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/labstack/echo/v4"
)

type AuthService struct {
	server    *server.Server
	usersRepo repository.UserRepository
	jwt       *jwt.Client
}

func NewAuthService(s *server.Server, userRepo repository.UserRepository) *AuthService {
	// clerk.SetKey(s.Config.Auth.SecretKey)
	return &AuthService{
		server:    s,
		usersRepo: userRepo,
		jwt:       jwt.NewClient(s.Config),
	}
}

func (service *AuthService) LoginWithGoogle(ctx echo.Context, accessToken string) (*model.AuthResponse, error) {
	profile, err := service.fetchGoogleProfile(ctx, accessToken)

	if err != nil {
		return nil, errs.NewUnauthorizedError("Invalid google token", false)
	}

	// AI must love golang, given how much token maxxing is required for implementing it's verbose code
	if profile.Sub == "" {
		return nil, errs.NewUnauthorizedError("Google account is not verified", false)
	}

	user, err := service.usersRepo.InsertGoogleUser(ctx.Request().Context(), profile)
	if err != nil {
		return nil, err
	}

	token, err := service.jwt.Sign(user.ID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	return &model.AuthResponse{Token: token, User: user}, nil
}

func (service *AuthService) fetchGoogleProfile(ctx echo.Context, accessToken string) (*model.GoogleProfileResponse, error) {
	log := middleware.GetLogger(ctx)

	// Why are we getting an error even before dispatching a request
	// It's so explicit for simply making an api call
	// 1. Create request object -> check for error -> set headers
	// -> set header -> dispatch request -> check error -> close connection
	// -> Check success reponse -> check deserialization worked
	// Verbose error handling means business logic has a lot of unnecessary noise
	request, err := http.NewRequestWithContext(
		ctx.Request().Context(),
		http.MethodGet,
		"https://www.googleapis.com/oauth2/v3/userinfo",
		nil,
	)
	if err != nil {
		return &model.GoogleProfileResponse{}, err
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)

	log.Debug().
		Str("method", request.Method).
		Str("url", request.URL.String()).
		Msg("fetching google profile")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		log.Error().Err(err).Msg("google userinfo request failed")
		return &model.GoogleProfileResponse{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		log.Error().
			Int("status_code", response.StatusCode).
			Msg("google userinfo returned non-200 status")
		return &model.GoogleProfileResponse{}, fmt.Errorf("google userinfo returned %d", response.StatusCode)
	}

	var profile *model.GoogleProfileResponse
	if err := json.NewDecoder(response.Body).Decode(&profile); err != nil {
		log.Error().Err(err).Msg("failed to decode google userinfo response")
		return &model.GoogleProfileResponse{}, err
	}
	return profile, nil
}
