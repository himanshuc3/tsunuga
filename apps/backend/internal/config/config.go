package config

import (
	"encoding/json"
	"os"

	"strings"

	"github.com/go-playground/validator/v10"
	_ "github.com/joho/godotenv/autoload"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/v2"
	"github.com/rs/zerolog"
)

/**************************************
***************************************
* Basic flow: .env file -> godotenv -> OS environment variables
				-> koanf + env provider (specifically to only read env config)
				-> Go config struct -> validator
				-> valid config (without throwing errors)
   NOTE: zerolog is only a fancy logger package
***************************************
***************************************/

/**************************************
***************************************
* Global config for managing application based on
* environment it is deployed in. General observation
* is that a lot of boilerplate is generally required for
* consuming/serialization/deserialization of any outside
* data via any medium (env files, http payloads etc.)
***************************************
***************************************/
type Config struct {
	Primary       Primary              `koanf:"primary" validate:"required"`
	Server        ServerConfig         `koanf:"server" validate:"required"`
	Database      DatabaseConfig       `koanf:"database" validate:"required"`
	Auth          AuthConfig           `koanf:"auth" validate:"required"`
	Redis         *RedisConfig         `koanf:"redis"`
	ContentDir    string               `koanf:"content_dir" validate:"required"`
	Integration   IntegrationConfig    `koanf:"integration" validate:"required"`
	Observability *ObservabilityConfig `koanf:"observability"`
}

/**************************************
***************************************
* Use of koanf: Give me configuration from different
* sources, normalize it, merge it, and let me turn
* it into a Go struct. It supports sources such as environment variables,
* files, command-line flags, Vault, S3, etc.
***************************************
***************************************/
type Primary struct {
	Env string `koanf:"env" validate:"required"`
}

/**************************************
***************************************
* Use of validator: Generic library for validating
* anything using struct tags
***************************************
***************************************/
type ServerConfig struct {
	Port               string   `koanf:"port" validate:"required"`
	ReadTimeout        int      `koanf:"read_timeout" validate:"required"`
	WriteTimeout       int      `koanf:"write_timeout" validate:"required"`
	IdleTimeout        int      `koanf:"idle_timeout" validate:"required"`
	CORSAllowedOrigins []string `koanf:"cors_allowed_origins" validate:"required"`
}

type DatabaseConfig struct {
	DSN             string `koanf:"dsn" validate:"required"`
	MaxOpenConns    string `koanf:"max_open_conns" validate:"required"`
	MaxIdleConns    string `koanf:"max_idle_conns" validate:"required"`
	ConnMaxLifetime string `koanf:"conn_max_lifetime" validate:"required"`
	ConnMaxIdleTime string `koanf:"conn_max_idle_time" validate:"required"`
}

type RedisConfig struct {
	Address string `koanf:"address" validate:"required"`
}

type IntegrationConfig struct {
	ResendAPIKey string `koanf:"resend_api_key"`
}

type AuthConfig struct {
	SecretKey string `koanf:"secret_key" validate:"required"`
}

/*
*****************************
*****************************
* Libraries used:
* zerolog: an alternative to standard library, useful
* for producing json logs which can be consumed by external
* platforms
* newrelic: Used as the platform for log ingestion, zerolog sends
* it to newrelic based on env(production)
* pgx: Used as a driver for conecting and communicating to postgresql DB
*

*****************************
*****************************
 */
func LoadConfig() (*Config, error) {

	logger := zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).With().Timestamp().Logger()

	k := koanf.New(".")

	err := k.Load(env.Provider("TANGO_", ".", func(s string) string {
		return strings.ToLower(strings.TrimPrefix(s, "TANGO_"))
	}), nil)

	if err != nil {
		logger.Fatal().Err(err).Msg("could not load initial env variables")
	}

	mainConfig := &Config{}

	err = k.Unmarshal("", mainConfig)
	if err != nil {
		logger.Fatal().Err(err).Msg("could not unmarshall main config")
	}
	if mainConfig.Server.Port == "" {
		mainConfig.Server.Port = os.Getenv("PORT")
	}

	validate := validator.New()

	err = validate.Struct(mainConfig)
	if err != nil {
		formattedConfig, marshalErr := json.MarshalIndent(mainConfig, "", "  ")
		if marshalErr != nil {
			logger.Fatal().Err(marshalErr).Msg("could not format config for logging")
		}

		logger.Fatal().Err(err).Msgf("config validation failed:\n%s", formattedConfig)
	}

	// Observability config is unique since it isn't a required
	// field. Not required specifically in development and therefore mocked
	if mainConfig.Observability == nil {
		mainConfig.Observability = DefaultObservabilityConfig()
	}

	mainConfig.Observability.ServiceName = "Tango"
	mainConfig.Observability.Environment = mainConfig.Primary.Env

	if err := mainConfig.Observability.Validate(); err != nil {
		logger.Fatal().Err(err).Msg("invalid observability config")
	}
	// Ending observability config

	return mainConfig, nil
}
