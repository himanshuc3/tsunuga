package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/himanshuc3/tango-be/internal/model/progress"
	"github.com/himanshuc3/tango-be/internal/server"
	"github.com/jackc/pgx/v5"
)

// completionStreak is the number of consecutive correct answers required to mark an item completed.
const completionStreak = 3

type ProgressRepository struct {
	server *server.Server
}

func NewProgressRepository(s *server.Server) *ProgressRepository {
	return &ProgressRepository{server: s}
}

// ListUserProgress returns every progress row tracked for the given user.
func (r *ProgressRepository) ListUserProgress(ctx context.Context, userID uuid.UUID) ([]progress.ItemProgress, error) {
	stmt := `
		SELECT
			*
		FROM
			user_item_progress
		WHERE
			user_id = @user_id
	`

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"user_id": userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to execute list user progress query user_id=%s", userID)
	}

	items, err := pgx.CollectRows(rows, pgx.RowToStructByName[progress.ItemProgress])
	if err != nil {
		return nil, fmt.Errorf("failed to collect rows from table:user_item_progress user_id=%s", userID)
	}
	return items, nil
}

// RecordAttempt upserts the progress row for a single item based on whether the user answered correctly.
// On conflict, correct_streak is incremented or reset in the same statement to avoid a read-then-write race.
func (r *ProgressRepository) RecordAttempt(ctx context.Context, userID uuid.UUID, itemID string, correct bool) (*progress.ItemProgress, error) {
	stmt := `
		INSERT INTO
			user_item_progress (
				user_id,
				item_id,
				introduced_at,
				correct_streak,
				last_seen_at,
				concept_shown,
				completed_at
			)
		VALUES
			(
				@user_id,
				@item_id,
				CURRENT_TIMESTAMP,
				CASE WHEN @correct THEN 1 ELSE 0 END,
				CURRENT_TIMESTAMP,
				TRUE,
				CASE WHEN @correct AND 1 >= @completion_streak THEN CURRENT_TIMESTAMP ELSE NULL END
			)
		ON CONFLICT (user_id, item_id)
		DO UPDATE SET
			introduced_at = COALESCE(user_item_progress.introduced_at, CURRENT_TIMESTAMP),
			correct_streak = CASE WHEN @correct THEN user_item_progress.correct_streak + 1 ELSE 0 END,
			last_seen_at = CURRENT_TIMESTAMP,
			concept_shown = TRUE,
			completed_at = CASE
				WHEN user_item_progress.completed_at IS NOT NULL THEN user_item_progress.completed_at
				WHEN @correct AND user_item_progress.correct_streak + 1 >= @completion_streak THEN CURRENT_TIMESTAMP
				ELSE NULL
			END
		RETURNING *
	`

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"user_id":           userID,
		"item_id":           itemID,
		"correct":           correct,
		"completion_streak": completionStreak,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to execute record attempt query user_id=%s item_id=%s", userID, itemID)
	}

	updated, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[progress.ItemProgress])
	if err != nil {
		return nil, fmt.Errorf("failed to collect row from table:user_item_progress user_id=%s item_id=%s", userID, itemID)
	}
	return &updated, nil
}
