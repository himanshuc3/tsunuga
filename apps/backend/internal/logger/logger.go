package logger

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/himanshuc3/tsunuga-be/internal/config"

	"github.com/newrelic/go-agent/v3/newrelic"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/pkgerrors"
)

// Logging indirectly includes monitoring
// & observability (instrumentation)
type LoggerService struct {
	nrApp *newrelic.Application
}

// Common pattern which is almost an alternative to
// a constructor in object oriented languages
func NewLoggerService(cfg *config.ObservabilityConfig) *LoggerService {
	service := &LoggerService{}

	// Nahi karni hume instrumentation, can be left
	// in dev env
	if cfg.NewRelic.LicenseKey == "" {
		fmt.Println("New Relic license key not provided, skipping initialization")
		return service
	}

	var configOptions []newrelic.ConfigOption
	configOptions = append(configOptions,
		newrelic.ConfigAppName(cfg.ServiceName),
		newrelic.ConfigLicense(cfg.NewRelic.LicenseKey),
		newrelic.ConfigAppLogForwardingEnabled(cfg.NewRelic.AppLogForwardingEnabled),
		newrelic.ConfigDistributedTracerEnabled(cfg.NewRelic.DistributedTracingEnabled),
	)

	if cfg.NewRelic.DebugLogging {
		configOptions = append(configOptions, newrelic.ConfigDebugLogger(os.Stdout))
	}

	app, err := newrelic.NewApplication(configOptions...)
	if err != nil {
		fmt.Printf("Failed to initialize New Relic: %v\n", err)
		return service
	}
	service.nrApp = app
	fmt.Printf("New relic initialized for app: %s\n", cfg.ServiceName)

	return service
}

func (ls *LoggerService) Shutdown() {
	if ls.nrApp != nil {
		ls.nrApp.Shutdown(10 * time.Second)
	}
}

// Getter for the struct
func (ls *LoggerService) GetApplication() *newrelic.Application {
	return ls.nrApp
}

// Newrelic logger service is different from application level logging
// which isn't persisted for debuggin (i assume)
// NewLoggerWithService creates a logger with full config and logger service
func NewLoggerWithService(cfg *config.ObservabilityConfig, loggerService *LoggerService) zerolog.Logger {
	var logLevel zerolog.Level
	level := cfg.GetLogLevel()

	switch level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	default:
		logLevel = zerolog.InfoLevel
	}

	// Donm't set global level - let each logger have it's own level
	zerolog.TimeFieldFormat = "2006-01-02 15:33:33"
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack

	var writer io.Writer

	var baseWriter io.Writer
	if cfg.IsProduction() && cfg.Logging.Format == "json" {
		baseWriter = os.Stdout
		writer = baseWriter
	} else {
		// Development mode - user console writer
		consoleWriter := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: "2006-01-02 15:05:05"}
		writer = consoleWriter
	}

	// Note: New Relic log forwarding is now handled automatically by zerologWriter integration

	logger := zerolog.New(writer).
		Level(logLevel).
		With().
		Timestamp().
		Str("service", cfg.ServiceName).
		Str("environment", cfg.Environment).
		Logger()

	if !cfg.IsProduction() {
		logger = logger.With().Stack().Logger()
	}

	return logger

}

func NewLogger(level string, isProd bool) zerolog.Logger {
	return NewLoggerWithService(&config.ObservabilityConfig{
		Logging: config.LoggingConfig{
			Level: level,
		},
		Environment: func() string {
			if isProd {
				return "production"
			}
			return "development"
		}(),
	}, nil)
}

func NewLoggerWithConfig(cfg *config.ObservabilityConfig) zerolog.Logger {
	return NewLoggerWithService(cfg, nil)
}

// Adds New Relic transaction context to logger
// Transaction - the debug trace of the code
func WithTraceContext(logger zerolog.Logger, txn *newrelic.Transaction) zerolog.Logger {
	if txn == nil {
		return logger
	}

	metadata := txn.GetTraceMetadata()

	return logger.With().
		Str("trace.id", metadata.TraceID).
		Str("space.id", metadata.SpanID).
		Logger()
}

func FormatSQLWithArgs(sql string, args []any) string {
	result := sql
	for i, arg := range args {
		placeholder := fmt.Sprintf("$%d", i+1)
		value := fmt.Sprintf("'%v'", arg)
		result = strings.Replace(result, placeholder, value, 1)
	}
	return result
}

func NewPgxLogger(level zerolog.Level) zerolog.Logger {
	writer := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:06:05",
		FormatFieldValue: func(i any) string {
			switch v := i.(type) {
			case string:
				if len(v) > 200 {
					return v[:200] + "..."
				}
				return v
			case []byte:
				var obj interface{}
				if err := json.Unmarshal(v, &obj); err == nil {
					pretty, _ := json.MarshalIndent(obj, "", "    ")
					return "\n" + string(pretty)
				}
				return string(v)

			default:
				return fmt.Sprintf("%v", v)
			}
		},
	}

	return zerolog.New(writer).
		Level(level).
		With().
		Timestamp().
		Str("component", "database").
		Logger()
}

var pgxTraceLogLevel = map[zerolog.Level]int{
	zerolog.DebugLevel: 6, // tracelog.LogLevelDebug
	zerolog.InfoLevel:  4,
	zerolog.WarnLevel:  3,
	zerolog.ErrorLevel: 2,
}

func GetPgxTraceLogLevel(level zerolog.Level) int {
	debugLevel, ok := pgxTraceLogLevel[level]
	if !ok {
		return 0
	}
	return debugLevel

}

// Why do we have unnecessarily large number
// of switch statements which can be simply
// replaced by a map?
// func GetPgxTraceLogLevel(level zerolog.Level) int{
// 	switch level {
// 		...case statements
// 	}
// }
