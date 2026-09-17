package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	model "github.com/himanshuc3/tsunuga-be/internal/model/user"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/jackc/pgx/v5"
)

type SettingsRepository struct {
	server *server.Server
}

func NewSettingsRepository(s *server.Server) *SettingsRepository {
	return &SettingsRepository{server: s}
}

// GetUserSettings returns the user's stored settings, or defaults if they have never set any.
func (r *SettingsRepository) GetUserSettings(ctx context.Context, userID uuid.UUID) (*model.UserSettings, error) {
	stmt := `
		SELECT
			*
		FROM
			user_settings
		WHERE
			user_id = @user_id
	`

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"user_id": userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to execute get user settings query user_id=%s", userID)
	}

	settings, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[model.UserSettings])
	if errors.Is(err, pgx.ErrNoRows) {
		return &model.UserSettings{UserID: userID, Settings: model.DefaultSettings}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to collect row from table:user_settings user_id=%s", userID)
	}
	return &settings, nil
}

// UpsertUserSettings creates or overwrites the settings row for a user.
func (r *SettingsRepository) UpsertUserSettings(ctx context.Context, userID uuid.UUID, settings model.Settings) (*model.UserSettings, error) {
	stmt := `
		INSERT INTO
			user_settings (
				user_id,
				settings
			)
		VALUES
			(
				@user_id,
				@settings
			)
		ON CONFLICT (user_id)
		DO UPDATE SET
			settings = EXCLUDED.settings,
			updated_at = CURRENT_TIMESTAMP
		RETURNING *
	`

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"user_id":  userID,
		"settings": settings,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to execute upsert user settings query user_id=%s", userID)
	}

	updated, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[model.UserSettings])
	if err != nil {
		return nil, fmt.Errorf("failed to collect row from table:user_settings user_id=%s", userID)
	}
	return &updated, nil
}
