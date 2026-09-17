package model

import (
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type GoogleLoginPayload struct {
	AccessToken string `json:"access_token" validate:"required"`
}

func (p *GoogleLoginPayload) Bind(c echo.Context) error {
	return c.Bind(p)
}

func (p *GoogleLoginPayload) Validate() error {
	validate := validator.New()
	return validate.Struct(p)
}

type GoogleProfileResponse struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

type UpsertUserPayload struct {
	GoogleProfileResponse
}

func (p *GoogleProfileResponse) Validate() error {
	validate := validator.New()
	return validate.Struct(p)
}

type UpsertUserResponse struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

// EmptyPayload is used for endpoints that take no request body/query params.
type EmptyPayload struct{}

func (p *EmptyPayload) Validate() error {
	return nil
}

type UpdateUserSettingsPayload struct {
	Settings
}

func (p *UpdateUserSettingsPayload) Validate() error {
	return p.Settings.Validate()
}
