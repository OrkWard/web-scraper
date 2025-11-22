package scraper_server

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	TwitterHeaders http.Header
}

func LoadConfig() (*Config, error) {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, loading from environment")
	}

	headers := http.Header{}
	headers.Set("Cookie", os.Getenv("cookie"))
	headers.Set("X-CSRF-Token", os.Getenv("X_CSRF_TOKEN"))
	headers.Set("Authorization", os.Getenv("Authorization"))
	headers.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")

	return &Config{
		TwitterHeaders: headers,
	}, nil
}
