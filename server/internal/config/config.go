package config

import (
	"os"
	"strconv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	GitHub   GitHubConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	URL string
}

type RedisConfig struct {
	URL string
}

type GitHubConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type JWTConfig struct {
	Secret     string
	ExpireHours int
}

func Load() *Config {
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8181" // локальный запуск; Docker backend занимает 8180
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://devsync:devsync123@localhost:5433/devsync?sslmode=disable"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6380/0"
	}

	jwtExpire := 24
	if e := os.Getenv("JWT_EXPIRE_HOURS"); e != "" {
		if v, err := strconv.Atoi(e); err == nil {
			jwtExpire = v
		}
	}

	return &Config{
		Server: ServerConfig{Port: port},
		Database: DatabaseConfig{URL: dbURL},
		Redis: RedisConfig{URL: redisURL},
		GitHub: GitHubConfig{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			RedirectURL:  getEnv("GITHUB_REDIRECT_URL", "http://localhost:8181/api/auth/github/callback"),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "devsync-jwt-secret"),
			ExpireHours: jwtExpire,
		},
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
