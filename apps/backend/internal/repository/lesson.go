package repository

import (
	"context"
	"fmt"

	"github.com/himanshuc3/tsunuga-be/internal/model/lesson"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/jackc/pgx/v5"
)

type LessonRepository struct {
	server *server.Server
}

func NewLessonRepository(server *server.Server) *LessonRepository {
	return &LessonRepository{server: server}
}

func (r *LessonRepository) CreateLesson(ctx context.Context, payload *lesson.CreateLessonPayload) (*lesson.Lesson, error) {
	// Plain string manipulation is not done to prevent SQL injection
	stmt := `
		INSERT INTO	
			lessons (

				title,
				position,
				active
			)
		VALUES
			(
				
				@title,
				@position,
				@active
			)
		RETURNING
		*
	`

	// Set default values here or on the DTO (i'll prefer it there, since that is the
	// transformation/interface layer with externals)

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"title":    payload.Title,
		"position": payload.Position,
		"active":   payload.Active,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to execute create lesson query titel=%s", payload.Title)
	}

	// Automatically closes our row connection
	newLesson, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[lesson.Lesson])

	if err != nil {
		return nil, fmt.Errorf("failed to collect row from table:lessons lesson=%s", payload.Title)
	}
	return &newLesson, nil
}

func (r *LessonRepository) GetLessonByPosition(ctx context.Context, position int) (*lesson.Lesson, error) {
	// Plain string manipulation is not done to prevent SQL injection
	stmt := `
		SELECT 
			*
		FROM 
			lessons
		WHERE 
			lesson.position = @position
		RETURNING
		*
	`

	// Set default values here or on the DTO (i'll prefer it there, since that is the
	// transformation/interface layer with externals)

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{
		"position": position,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to execute get lesson by position=%s", position)
	}

	// Automatically closes our row connection
	existingLesson, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[lesson.Lesson])

	if err != nil {
		return nil, fmt.Errorf("failed to collect row from table:lessons lesson position=%s", position)
	}
	return &existingLesson, nil
}
