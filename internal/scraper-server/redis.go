package scraper_server

import (
	"context"
	"log"
	"os"

	"github.com/go-redis/redis/v8"
)

func NewRedisClient() (*redis.Client, error) {
	redisURL := os.Getenv("REDIS")
	if redisURL == "" {
		log.Fatalln("REDIS environment not found")
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	return client, nil
}
