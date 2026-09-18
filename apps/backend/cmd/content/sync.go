package content

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/himanshuc3/tango-be/internal/config"
	"github.com/jackc/pgx/v5"
	zerolog "github.com/rs/zerolog"
	"gopkg.in/yaml.v3"
)

type Lesson struct {
	ID       string    `yaml:"id" validate:"required"`
	Title    string    `yaml:"title" validate:"required"`
	Position string    `yaml:"position" validate:"required"`
	Concepts []Concept `yaml:"concepts" validate:"dive"`
	Vocab    []Vocab   `yaml:"vocab" validate:"dive"`
}

type Concept struct {
	ID       string `yaml:"id" validate:"required"`
	Title    string `yaml:"title" validate:"required"`
	Body     string `yaml:"body" validate:"required"`
	Position string `yaml:"position" validate:"required"`
	Meta     string `yaml:"meta"`
}

type Vocab struct {
	ID       string `yaml:"id" validate:"required"`
	Position string `yaml:"position" validate:"required"`
	Romaji   string `yaml:"romaji" validate:"required"`
	EN       string `yaml:"en" validate:"required"`
	Meta     string `yaml:"meta"`
}

func (l Lesson) Validate() error {
	validate := validator.New()
	return validate.Struct(l)
}

// TODO[optimization]: Like DB migrations, we should
// maintain versioning of changing content and only run
// this utility for syncing static content with DB, if
// the version changes
// Readfile (syntactic sugar for auto file opening/closing) vs
// open -> manual
func LoadLesson(path string) (Lesson, error) {
	file, err := os.Open(path)
	if err != nil {
		return Lesson{}, err
	}
	defer file.Close()

	var lesson Lesson

	decoder := yaml.NewDecoder(file)
	decoder.KnownFields(true)

	if err := decoder.Decode(&lesson); err != nil {
		return Lesson{}, err
	}

	return lesson, nil

}

func LoadLessons(dir string) ([]Lesson, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var lessons []Lesson

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".yaml" {
			continue
		}

		path := filepath.Join(dir, entry.Name())

		lesson, err := LoadLesson(path)
		if err != nil {
			return nil, fmt.Errorf(
				"load lesson %s: %w",
				entry.Name(),
				err,
			)
		}

		lessons = append(lessons, lesson)
	}

	sort.Slice(lessons, func(i, j int) bool {
		return lessons[i].Position < lessons[j].Position
	})

	return lessons, nil
}

func syncLessons(ctx context.Context, tx pgx.Tx, lessons []Lesson) error {

	for _, lesson := range lessons {
		if err := syncLesson(ctx, tx, lesson); err != nil {
			return err
		}
	}
	return nil

}

func syncLesson(ctx context.Context, tx pgx.Tx, lesson Lesson) error {
	// Upsert lesson
	_, err := tx.Exec(ctx, `
	INSERT INTO lessons (
            id,
            title,
            position
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (id)
        DO UPDATE SET
            title = EXCLUDED.title,
            position = EXCLUDED.position
	`,
		lesson.ID,
		lesson.Title,
		lesson.Position)

	if err != nil {
		return fmt.Errorf(
			"upsert lesson %q: %w",
			lesson.ID,
			err,
		)
	}

	// Sync concepts
	for _, concept := range lesson.Concepts {
		if err := syncConcept(ctx, tx, lesson.ID, concept); err != nil {
			return err
		}
	}

	// Sync vocabulary
	for _, vocab := range lesson.Vocab {
		if err := syncVocab(
			ctx,
			tx,
			lesson.ID,
			vocab,
		); err != nil {
			return err
		}
	}

	return nil
}

func syncConcept(
	ctx context.Context,
	tx pgx.Tx,
	lessonID string,
	concept Concept,
) error {

	_, err := tx.Exec(ctx, `
        INSERT INTO lesson_items (
            id,
            lesson_id,
			kind,
            position,
			title,
			body,
			meta
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET
            lesson_id = EXCLUDED.lesson_id,
            position = EXCLUDED.position,
            kind = EXCLUDED.kind,
            title = EXCLUDED.title,
			body = EXCLUDED.body,
            meta = EXCLUDED.meta
    `,
		concept.ID,
		lessonID,
		"concept",
		concept.Position,
		concept.Title,
		concept.Body,
		concept.Meta,
	)

	return err
}

func syncVocab(
	ctx context.Context,
	tx pgx.Tx,
	lessonID string,
	vocab Vocab,
) error {

	_, err := tx.Exec(ctx, `
        INSERT INTO lesson_items (
            id,
            lesson_id,
			kind,
            position,
            romaji,
            en,
            meta
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET
            lesson_id = EXCLUDED.lesson_id,
            position = EXCLUDED.position,
            romaji = EXCLUDED.romaji,
            en = EXCLUDED.en,
            meta = EXCLUDED.meta
    `,
		vocab.ID,
		lessonID,
		"vocab",
		vocab.Position,
		vocab.Romaji,
		vocab.EN,
		vocab.Meta,
	)

	return err
}

func CreateDBURI(cfg *config.Config) string {
	hostPort := net.JoinHostPort(cfg.Database.Host, strconv.Itoa(cfg.Database.Port))
	encodedPassword := url.QueryEscape(cfg.Database.Password)
	dsn := fmt.Sprintf("postgres://%s:%s@%s/%s?sslmode=%s",
		cfg.Database.User,
		encodedPassword,
		hostPort,
		cfg.Database.Name,
		cfg.Database.SSLMode)
	return dsn

}

// Reconcile our lessons and lesson items table with static data
func Sync(ctx context.Context, logger *zerolog.Logger, cfg *config.Config) error {
	dbURI := CreateDBURI(cfg)
	conn, err := pgx.Connect(ctx, dbURI)
	if err != nil {
		logger.
			Info().
			Str("db", dbURI).
			Msg("Error connecting to DB")
		return err
	}
	defer conn.Close(ctx)

	lessons, err := LoadLessons(filepath.Join(cfg.ContentDir, "lessons"))
	if err != nil {
		return fmt.Errorf("load lessons: %w", err)
	}

	for _, lesson := range lessons {
		if err := lesson.Validate(); err != nil {
			return fmt.Errorf("Validating lesson ID %s: %w", lesson.ID, err)
		}
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin content sync transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := syncLessons(ctx, tx, lessons); err != nil {
		return fmt.Errorf("sync lessons: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit content sync: %w", err)
	}

	logger.Info().
		Int("lessons", len(lessons)).
		Msg("content synced successfully")

	return nil
}
