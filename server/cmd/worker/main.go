package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
	"github.com/devsync/server/internal/config"
	"github.com/devsync/server/internal/infrastructure/database"
	"github.com/devsync/server/internal/domain/user"
	"github.com/devsync/server/internal/domain/stats"
	"github.com/devsync/server/internal/domain/github"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()
	pool, err := database.NewPool(ctx, cfg.Database.URL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	userRepo := user.NewRepository(pool)
	userSvc := user.NewService(userRepo)
	repoRepo := stats.NewRepoRepository(pool)
	contribRepo := stats.NewContributionRepository(pool)
	dailyRepo := stats.NewDailyStatsRepository(pool)
	syncSvc := github.NewSyncService(userSvc, repoRepo, contribRepo, dailyRepo)

	// Первый запуск сразу после старта
	runSync(ctx, userSvc, syncSvc)

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			runSync(ctx, userSvc, syncSvc)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("worker stopping")
}

func runSync(ctx context.Context, userSvc user.Service, syncSvc github.SyncService) {
	ids, err := userSvc.ListIDsWithToken(ctx)
	if err != nil {
		log.Printf("worker: list users: %v", err)
		return
	}
	if len(ids) == 0 {
		log.Println("worker: no users to sync")
		return
	}
	log.Printf("worker: syncing %d users", len(ids))
	for i, id := range ids {
		if err := syncSvc.SyncUser(ctx, id); err != nil {
			log.Printf("worker: sync user %s: %v", id, err)
		} else {
			log.Printf("worker: synced user %s (%d/%d)", id, i+1, len(ids))
		}
		// Пауза между пользователями, чтобы не упереться в лимит GitHub API
		if i < len(ids)-1 {
			time.Sleep(3 * time.Second)
		}
	}
	log.Println("worker: sync run done")
}
