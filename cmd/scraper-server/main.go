package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	scraper_server "github.com/OrkWard/web-scraper/internal/scraper-server"
	"github.com/OrkWard/web-scraper/internal/scraper-server/handler"
	"github.com/OrkWard/web-scraper/pkg/youtube"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func run() error {
	cfg, err := scraper_server.LoadConfig()
	if err != nil {
		return err
	}

	redisClient, err := scraper_server.NewRedisClient()
	if err != nil {
		return err
	}
	defer func() {
		if err := redisClient.Close(); err != nil {
			log.Printf("Error closing Redis client: %v", err)
		} else {
			log.Println("Redis client closed.")
		}
	}()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ytClient, err := youtube.NewYouTubeClient(ctx)
	if err != nil {
		return err
	}

	router := http.NewServeMux()
	router.HandleFunc("/twitter/{userId}/posts", handler.MakeTwitterHandler(ctx, cfg.TwitterHeaders, redisClient))
	router.HandleFunc("/youtube/{channelName}/videos", handler.MakeYoutubeHandler(ytClient, redisClient))

	server := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	go func() {
		log.Printf("Server starting on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to listen: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Server shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("server shutdown failed: %w", err)
	}
	log.Println("Server gracefully stopped.")
	return nil
}
