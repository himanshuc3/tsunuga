package router

import (
	"net/http"

	"github.com/himanshuc3/tsunuga-be/internal/handler"
	"github.com/himanshuc3/tsunuga-be/internal/middleware"
	v1 "github.com/himanshuc3/tsunuga-be/internal/router/v1"
	"github.com/himanshuc3/tsunuga-be/internal/server"
	"github.com/himanshuc3/tsunuga-be/internal/service"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

func NewRouter(s *server.Server, h *handler.Handlers, services *service.Services) *echo.Echo {
	// 1. Initiate middleware layer
	middlewares := middleware.NewMiddlewares(s)

	// 2. Initiate echo framework for routing
	router := echo.New()

	router.HTTPErrorHandler = middlewares.Global.GlobalErrorHandler

	// Register middlewares run for every route of our application
	router.Use(
		echoMiddleware.RateLimiterWithConfig(echoMiddleware.RateLimiterConfig{
			Store: echoMiddleware.NewRateLimiterMemoryStore(rate.Limit(20)),
			DenyHandler: func(c echo.Context, identifier string, err error) error {
				// Record rate limit hit metrics
				if rateLimitMiddleware := middlewares.RateLimit; rateLimitMiddleware != nil {
					rateLimitMiddleware.RecordRateLimitHit(c.Path())
				}

				s.Logger.Warn().
					Str("request_id", middleware.GetRequestID(c)).
					Str("identifier", identifier).
					Str("path", c.Path()).
					Str("method", c.Request().Method).
					Str("ip", c.RealIP()).
					Msg("rate limit exceeded")

				return echo.NewHTTPError(http.StatusTooManyRequests, "Rate limit exceeded")
			},
		}),
		middlewares.Global.CORS(),
		middlewares.Global.Secure(),
		middleware.RequestID(),
		middlewares.Tracing.NewRelicMiddleware(),
		middlewares.Tracing.EnhanceTracing(),
		middlewares.ContextEnhancer.EnhanceContext(),
		middlewares.Global.RequestLogger(),
		middlewares.Global.Recover(),
	)

	// register system routes
	registerSystemRoutes(router, h)

	// register versioned routes
	v1Router := router.Group("/api/v1")

	v1.RegisterV1Routes(v1Router, h, middlewares)

	return router
}
