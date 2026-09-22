package repository

import (
	"context"
	"fmt"

	"github.com/himanshuc3/tango-be/internal/model/lesson"
	"github.com/himanshuc3/tango-be/internal/server"
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

// lessonItemRow is the flattened shape of a lesson LEFT JOIN lesson_items row.
type lessonItemRow struct {
	LessonID       string  `db:"lesson_id"`
	LessonTitle    string  `db:"lesson_title"`
	LessonPosition int     `db:"lesson_position"`
	ItemID         *string `db:"item_id"`
	ItemKind       *string `db:"item_kind"`
	ItemTitle      *string `db:"item_title"`
	ItemBody       *string `db:"item_body"`
	ItemRomaji     *string `db:"item_romaji"`
	ItemEN         *string `db:"item_en"`
	ItemMeta       *string `db:"item_meta"`
}

// buildLessonDetails groups flattened lesson/item rows into ordered lesson details.
func buildLessonDetails(rows []lessonItemRow) []lesson.Detail {
	var lessons []lesson.Detail
	index := map[string]int{}

	for _, row := range rows {
		i, ok := index[row.LessonID]
		if !ok {
			lessons = append(lessons, lesson.Detail{
				ID:       row.LessonID,
				Title:    row.LessonTitle,
				Position: row.LessonPosition,
				Concepts: []lesson.Concept{},
				Vocab:    []lesson.Vocab{},
			})
			i = len(lessons) - 1
			index[row.LessonID] = i
		}

		if row.ItemID == nil || row.ItemKind == nil {
			continue
		}

		switch *row.ItemKind {
		case "concept":
			lessons[i].Concepts = append(lessons[i].Concepts, lesson.Concept{
				ID:    *row.ItemID,
				Title: derefStr(row.ItemTitle),
				Body:  derefStr(row.ItemBody),
				Meta:  derefStr(row.ItemMeta),
			})
		case "vocab":
			lessons[i].Vocab = append(lessons[i].Vocab, lesson.Vocab{
				ID:     *row.ItemID,
				Romaji: derefStr(row.ItemRomaji),
				EN:     derefStr(row.ItemEN),
				Meta:   derefStr(row.ItemMeta),
			})
		}
	}

	return lessons
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

const lessonWithItemsQuery = `
	SELECT
		l.id AS lesson_id,
		l.title AS lesson_title,
		l.position AS lesson_position,
		li.id AS item_id,
		li.kind AS item_kind,
		li.title AS item_title,
		li.body AS item_body,
		li.romaji AS item_romaji,
		li.en AS item_en,
		li.meta AS item_meta
	FROM lessons l
	LEFT JOIN lesson_items li ON li.lesson_id = l.id AND li.active = TRUE
	WHERE l.active = TRUE
`

// ListLessons returns every active lesson with its concepts/vocab, ordered by position.
func (r *LessonRepository) ListLessons(ctx context.Context) ([]lesson.Detail, error) {
	stmt := lessonWithItemsQuery + `
		ORDER BY l.position, li.position
	`

	rows, err := r.server.DB.Pool.Query(ctx, stmt)
	if err != nil {
		return nil, fmt.Errorf("failed to execute list lessons query: %w", err)
	}

	items, err := pgx.CollectRows(rows, pgx.RowToStructByName[lessonItemRow])
	if err != nil {
		return nil, fmt.Errorf("failed to collect rows from table:lessons: %w", err)
	}

	return buildLessonDetails(items), nil
}

// GetLessonByID returns a single active lesson with its concepts/vocab.
func (r *LessonRepository) GetLessonByID(ctx context.Context, id string) (*lesson.Detail, error) {
	stmt := lessonWithItemsQuery + `
		AND l.id = @id
		ORDER BY li.position
	`

	rows, err := r.server.DB.Pool.Query(ctx, stmt, pgx.NamedArgs{"id": id})
	if err != nil {
		return nil, fmt.Errorf("failed to execute get lesson by id=%s query: %w", id, err)
	}

	items, err := pgx.CollectRows(rows, pgx.RowToStructByName[lessonItemRow])
	if err != nil {
		return nil, fmt.Errorf("failed to collect rows from table:lessons id=%s: %w", id, err)
	}

	details := buildLessonDetails(items)
	if len(details) == 0 {
		return nil, nil
	}
	return &details[0], nil
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
