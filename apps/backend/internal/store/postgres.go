package store

import (
	"context"
	"fmt"

	"github.com/himanshuc3/tsunuga-be/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func Connect(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) EnsureSchema(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, schemaSQL)
	if err != nil {
		return fmt.Errorf("ensure schema: %w", err)
	}
	return nil
}

const schemaSQL = `
CREATE TABLE IF NOT EXISTS lessons (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	sort_order INT NOT NULL,
	active BOOLEAN NOT NULL DEFAULT TRUE,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_items (
	id TEXT PRIMARY KEY,
	lesson_id TEXT NOT NULL REFERENCES lessons(id),
	kind TEXT NOT NULL CHECK (kind IN ('concept', 'vocab')),
	title TEXT NOT NULL DEFAULT '',
	body TEXT NOT NULL DEFAULT '',
	romaji TEXT NOT NULL DEFAULT '',
	en TEXT NOT NULL DEFAULT '',
	meta TEXT NOT NULL DEFAULT '',
	sort_order INT NOT NULL,
	active BOOLEAN NOT NULL DEFAULT TRUE,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_items_lesson_id_idx
	ON lesson_items (lesson_id, sort_order);
`

const upsertLessonSQL = `
INSERT INTO lessons (id, title, sort_order, active, updated_at)
VALUES ($1, $2, $3, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET
	title = EXCLUDED.title,
	sort_order = EXCLUDED.sort_order,
	active = TRUE,
	updated_at = NOW()
`

const upsertItemSQL = `
INSERT INTO lesson_items (
	id, lesson_id, kind, title, body, romaji, en, meta, sort_order, active, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET
	lesson_id = EXCLUDED.lesson_id,
	kind = EXCLUDED.kind,
	title = EXCLUDED.title,
	body = EXCLUDED.body,
	romaji = EXCLUDED.romaji,
	en = EXCLUDED.en,
	meta = EXCLUDED.meta,
	sort_order = EXCLUDED.sort_order,
	active = TRUE,
	updated_at = NOW()
`

// SyncCatalog writes the in-repo catalog into Postgres. Existing rows with
// matching IDs are updated; IDs removed from the catalog are marked inactive
// so user progress can keep pointing at them.
func (s *Store) SyncCatalog(ctx context.Context, lessons []domain.Lesson) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin catalog sync: %w", err)
	}
	defer tx.Rollback(ctx)

	lessonIDs := make([]string, 0, len(lessons))
	itemIDs := make([]string, 0)

	for i, lesson := range lessons {
		lessonIDs = append(lessonIDs, lesson.ID)
		if _, err := tx.Exec(ctx, upsertLessonSQL, lesson.ID, lesson.Title, i); err != nil {
			return fmt.Errorf("upsert lesson %s: %w", lesson.ID, err)
		}

		for j, concept := range lesson.Concepts {
			itemIDs = append(itemIDs, concept.ID)
			if _, err := tx.Exec(
				ctx,
				upsertItemSQL,
				concept.ID,
				lesson.ID,
				string(domain.ItemKindConcept),
				concept.Title,
				concept.Body,
				"",
				"",
				concept.Meta,
				j,
			); err != nil {
				return fmt.Errorf("upsert concept %s: %w", concept.ID, err)
			}
		}

		for j, vocab := range lesson.Vocab {
			itemIDs = append(itemIDs, vocab.ID)
			if _, err := tx.Exec(
				ctx,
				upsertItemSQL,
				vocab.ID,
				lesson.ID,
				string(domain.ItemKindVocab),
				"",
				"",
				vocab.Romaji,
				vocab.EN,
				vocab.Meta,
				j,
			); err != nil {
				return fmt.Errorf("upsert vocab %s: %w", vocab.ID, err)
			}
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE lessons
		SET active = FALSE, updated_at = NOW()
		WHERE NOT (id = ANY($1))
	`, lessonIDs); err != nil {
		return fmt.Errorf("deactivate removed lessons: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE lesson_items
		SET active = FALSE, updated_at = NOW()
		WHERE NOT (id = ANY($1))
	`, itemIDs); err != nil {
		return fmt.Errorf("deactivate removed items: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit catalog sync: %w", err)
	}
	return nil
}

func (s *Store) ListLessons(ctx context.Context) ([]domain.Lesson, error) {
	return s.queryLessons(ctx, "")
}

func (s *Store) GetLesson(ctx context.Context, id string) (domain.Lesson, bool, error) {
	lessons, err := s.queryLessons(ctx, id)
	if err != nil {
		return domain.Lesson{}, false, err
	}
	if len(lessons) == 0 {
		return domain.Lesson{}, false, nil
	}
	return lessons[0], true, nil
}

func (s *Store) queryLessons(ctx context.Context, id string) ([]domain.Lesson, error) {
	const sql = `
		SELECT
			l.id, l.title,
			i.id, i.kind, i.title, i.body, i.romaji, i.en, i.meta
		FROM lessons l
		LEFT JOIN lesson_items i
			ON i.lesson_id = l.id AND i.active
		WHERE l.active AND ($1 = '' OR l.id = $1)
		ORDER BY l.sort_order, i.kind, i.sort_order
	`

	rows, err := s.pool.Query(ctx, sql, id)
	if err != nil {
		return nil, fmt.Errorf("query lessons: %w", err)
	}
	defer rows.Close()

	byID := make(map[string]*domain.Lesson)
	order := make([]string, 0)

	for rows.Next() {
		var (
			lessonID, lessonTitle string
			itemID, kind          *string
			title, body           *string
			romaji, en, meta      *string
		)
		if err := rows.Scan(
			&lessonID, &lessonTitle,
			&itemID, &kind, &title, &body, &romaji, &en, &meta,
		); err != nil {
			return nil, fmt.Errorf("scan lesson: %w", err)
		}

		lesson, ok := byID[lessonID]
		if !ok {
			lesson = &domain.Lesson{
				ID:       lessonID,
				Title:    lessonTitle,
				Concepts: []domain.Concept{},
				Vocab:    []domain.Vocab{},
			}
			byID[lessonID] = lesson
			order = append(order, lessonID)
		}

		if itemID == nil || kind == nil {
			continue
		}

		switch domain.ItemKind(*kind) {
		case domain.ItemKindConcept:
			lesson.Concepts = append(lesson.Concepts, domain.Concept{
				ID:    *itemID,
				Title: deref(title),
				Body:  deref(body),
				Meta:  deref(meta),
			})
		case domain.ItemKindVocab:
			lesson.Vocab = append(lesson.Vocab, domain.Vocab{
				ID:     *itemID,
				Romaji: deref(romaji),
				EN:     deref(en),
				Meta:   deref(meta),
			})
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate lessons: %w", err)
	}

	out := make([]domain.Lesson, 0, len(order))
	for _, lessonID := range order {
		out = append(out, *byID[lessonID])
	}
	return out, nil
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
