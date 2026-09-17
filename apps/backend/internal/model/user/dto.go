package model

import (
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type GoogleLoginPayload struct {
	AccessToken string `json:"access_token" validate:"required"`
}

func (p *GoogleLoginPayload) Bind(c echo.Context) error {
	const bearerPrefix = "Bearer "

	authorization := c.Request().Header.Get(echo.HeaderAuthorization)
	if strings.HasPrefix(authorization, bearerPrefix) {
		p.AccessToken = strings.TrimSpace(strings.TrimPrefix(authorization, bearerPrefix))
	}
	return nil
}

func (p *GoogleLoginPayload) Validate() error {
	validate := validator.New()
	return validate.Struct(p)
}

type GoogleProfileResponse struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
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
