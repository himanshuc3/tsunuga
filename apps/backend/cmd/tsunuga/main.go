package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/himanshuc3/tsunuga-be/internal/config"
	"github.com/himanshuc3/tsunuga-be/internal/database"
	"github.com/himanshuc3/tsunuga-be/internal/handler"
	"github.com/himanshuc3/tsunuga-be/internal/logger"
	"github.com/himanshuc3/tsunuga-be/internal/repository"
	"github.com/himanshuc3/tsunuga-be/internal/router"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/himanshuc3/tsunuga-be/internal/service"
)

/** Memory Access Patterns
// Program designing is important since memory
// access optimization according to Cache (L1/L2/L3) -> main memory
// model needs to be respected.
// Latency in memory access can be as harmful as an unoptimized
// big O algorithm.
**/

// 1. Structs doesn't necessarily get allocated the same space
// as declared
// 2. While a variable of example type might be allocated
// 3 bytes, but according to the architecture of the platform
// it doesn't want to span this across two different words and therefore
// padding is introduced according to the size of a word in the OS. Further
// the alignment is such that each value falls in powers of 2 indices
// 3. To optimize or minimize the padding, we need to structure the values
// in decreasing order of size of the value i.e. int16 -> bool
// 4. Anonymous structs are just use and throw inline structs
// 5. Implicit conversion doesn't happen with custom types unlike
// with native types
//
//	type example struct {
//	 isValid bool
//	 date int16
//	}

const DefaultContextTimeout = 30

// TODO: Figure out the unnecessarily complicated logging setup
func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		panic("failed to load config: " + err.Error())
	}

	// Initialize New Relic logger service
	loggerService := logger.NewLoggerService(cfg.Observability)
	defer loggerService.Shutdown()

	log := logger.NewLoggerWithService(cfg.Observability, loggerService)

	if cfg.Primary.Env != "local" {
		if err := database.Migrate(context.Background(), &log, cfg); err != nil {
			log.Fatal().Err(err).Msg("failed to migrate database")
		}
	}

	// Initialize server
	srv, err := server.New(cfg, &log, loggerService)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to initialize server")
	}

	// Initialize repositories, services, and handlers
	repos := repository.NewRepositories(srv)
	services, serviceErr := service.NewServices(srv, repos)
	if serviceErr != nil {
		log.Fatal().Err(serviceErr).Msg("could not create services")
	}
	handlers := handler.NewHandlers(srv, services)

	// Initialize router
	r := router.NewRouter(srv, handlers, services)

	// Setup HTTP server
	srv.SetupHTTPServer(r)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)

	// Start server
	go func() {
		if err = srv.Start(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal().Err(err).Msg("failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	<-ctx.Done()

	ctx, cancel := context.WithTimeout(context.Background(), DefaultContextTimeout*time.Second)

	if err = srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("server forced to shutdown")
	}
	stop()
	cancel()

	log.Info().Msg("server exited properly")
}

// func main() {
// 	ctx := context.Background()

// 	databaseURL := os.Getenv("DATABASE_URL")
// 	if databaseURL == "" {
// 		// NOTE:
// 		// Useful for persistent logging, concurrency
// 		// safe and adds timing implicitly
// 		log.Fatal("DATABASE_URL is required")
// 	}

// 	st, err := store.Connect(ctx, databaseURL)
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	defer st.Close()

// 	if err := st.EnsureSchema(ctx); err != nil {
// 		log.Fatal(err)
// 	}
// 	if err := st.SyncCatalog(ctx, catalog.Lessons); err != nil {
// 		log.Fatal(err)
// 	}
// 	log.Printf("synced %d lessons from catalog", len(catalog.Lessons))

// 	h := &handlers.Handler{Store: st}
// 	mux := api.NewRouter(h)

// 	log.Println("API listening on :3333")
// 	if err := http.ListenAndServe(":3333", mux); err != nil {
// 		log.Fatal(err)
// 	}
// }
