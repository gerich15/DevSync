package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/devsync/server/internal/app"
	"github.com/devsync/server/internal/config"
)

func main() {
	// Загружаем .env из текущей папки и родителя (работает при запуске из server/ или из корня DevSync)
	_ = godotenv.Overload(".env")
	_ = godotenv.Overload("../.env")
	_ = godotenv.Overload("../../.env")
	cfg := config.Load()
	ctx := context.Background()
	a, err := app.New(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}
	go func() {
		if err := a.Run(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := a.Shutdown(shutdownCtx); err != nil {
		log.Fatal(err)
	}
}
