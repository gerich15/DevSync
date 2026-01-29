package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"github.com/devsync/server/internal/config"
	"github.com/devsync/server/internal/infrastructure/database"
	"github.com/devsync/server/internal/domain/user"
	"github.com/devsync/server/internal/domain/stats"
	"github.com/devsync/server/internal/domain/github"
	httptransport "github.com/devsync/server/internal/transport/http"
	httphandlers "github.com/devsync/server/internal/transport/http/handlers"
	"github.com/devsync/server/internal/transport/websocket"
	"github.com/devsync/server/pkg/pdf"
)

type App struct {
	cfg    *config.Config
	server *http.Server
}

func New(ctx context.Context, cfg *config.Config) (*App, error) {
	pool, err := database.NewPool(ctx, cfg.Database.URL)
	if err != nil {
		return nil, fmt.Errorf("database: %w", err)
	}

	userRepo := user.NewRepository(pool)
	userSvc := user.NewService(userRepo)

	repoRepo := stats.NewRepoRepository(pool)
	contribRepo := stats.NewContributionRepository(pool)
	dailyRepo := stats.NewDailyStatsRepository(pool)
	statsSvc := stats.NewService(repoRepo, contribRepo, dailyRepo)

	syncSvc := github.NewSyncService(userSvc, repoRepo, contribRepo, dailyRepo)

	oauthCfg := &oauth2.Config{
		ClientID:     cfg.GitHub.ClientID,
		ClientSecret: cfg.GitHub.ClientSecret,
		RedirectURL:  cfg.GitHub.RedirectURL,
		Endpoint:     oauth2.Endpoint{
			AuthURL:  "https://github.com/login/oauth/authorize",
			TokenURL: "https://github.com/login/oauth/access_token",
		},
		Scopes: []string{"read:user", "user:email", "repo"},
	}

	wsHub := websocket.NewHub()
	authHandler := httphandlers.NewAuthHandler(oauthCfg, cfg.JWT.Secret, cfg.JWT.ExpireHours, userSvc)
	userHandler := httphandlers.NewUserHandler(userSvc, statsSvc, syncSvc, wsHub)
	statsHandler := httphandlers.NewStatsHandler(statsSvc)
	pdfGen := pdf.NewGenerator()
	reportsHandler := httphandlers.NewReportsHandler(userSvc, statsSvc, pdfGen)

	router := httptransport.NewRouter(authHandler, userHandler, statsHandler, reportsHandler, cfg.JWT.Secret, wsHub)

	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	engine.Use(gin.Recovery())
	router.Setup(engine)

	addr := ":" + cfg.Server.Port
	server := &http.Server{Addr: addr, Handler: engine}

	return &App{cfg: cfg, server: server}, nil
}

func (a *App) Run() error {
	log.Printf("server listening on %s", a.server.Addr)
	return a.server.ListenAndServe()
}

func (a *App) Shutdown(ctx context.Context) error {
	return a.server.Shutdown(ctx)
}
