package job

import (
	"github.com/hibiken/asynq"
	"github.com/himanshuc3/tsunuga-be/internal/config"
	zerolog "github.com/jackc/pgx-zerolog"
)

// Purpose: Used for spining up external jobs
// like sending an email which shouldn't be blocking
// the main thread of execution
// The package asynq spins up a redis instance and handles
// these background jobs there
type JobService struct {
	Client *asynq.Client
	server *asynq.Server
	logger *zerolog.Logger
}

// DI: We've been prop drilling/saving everything in structs for the purpose
// of not importing everything globally
// Uses: explicit dependencies, easier in test mocking etc.
func NewJobService(logger *zerolog.Logger, cfg *config.Config) *JobService {
	redisAddr := cfg.Redis.Address

	client := asynq.NewClient(asynq.RedisClientOpt{
		Addr: redisAddr,
	})

	server := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisAddr},
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)
	return &JobService{
		Client: client,
		server: server,
		logger: logger,
	}
}

func (j *JobService) Start() error {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TaskWelcome, j.handleWelcomeEmailTask)

	j.logger.Info().Msg("Starting background job server")
	if err := j.server.Start(mux); err != nil {
		return err
	}
	return nil
}

func (j *JobService) Stop() {
	j.logger.Info().Msg("Stopping background job server")
	j.server.Shutdown()
	j.Client.Close()
}
