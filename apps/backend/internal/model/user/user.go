package model

import "github.com/himanshuc3/tsunuga-be/internal/model"

type User struct {
	model.Base
	Email         string `json:"email,omitempty" db:"email"`
	DisplayName   string `json:"display_name,omitempty" db:"display_name"`
	AvatarUrl     string `json:"avatar_url,omitempty" db:"avatar_url"`
	AuthMethod    string `json:"auth_method,omitempty" db:"auth_method"`
	PasswordHash  string `json:"password_hash,omitempty" db:"password_hash"`
	GoogleSubject string `json:"google_subject,omitempty" db:"google_subject"`
}
