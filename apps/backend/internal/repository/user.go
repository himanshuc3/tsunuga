package repository

import (
	"context"
	"fmt"

	model "github.com/himanshuc3/tsunuga-be/internal/model/user"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/jackc/pgx/v5"
)

type UserRepository struct {
	server *server.Server
}

func NewUserRepository(s *server.Server) *UserRepository {
	return &UserRepository{
		server: s,
	}
}

func (u *UserRepository) InsertGoogleUser(ctx context.Context, payload *model.GoogleProfileResponse) (*model.User, error) {
	stmt := `
		INSERT INTO	
			users (
				email,
				display_name,
				google_subject,
				auth_method
			)
		VALUES
			(
				
				@email,
				@display_name,
				@google_subject,
				@auth_method
			)
		ON CONFLICT (google_subject)
		DO UPDATE SET
			email = EXCLUDED.email,
			display_name = EXCLUDED.display_name
		RETURNING *
	`

	rows, err := u.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"email":          payload.Email,
		"display_name":   payload.Name,
		"google_subject": payload.Sub,
		"auth_method":    "google",
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create/get user=%s", payload.Email)
	}

	// Automatically closes our row connection
	newUser, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[model.User])

	if err != nil {
		return nil, fmt.Errorf("failed to collect row from table:users user=%s", payload.Email)
	}
	return &newUser, nil
}
