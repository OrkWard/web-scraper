package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/OrkWard/wormface/pkg/pixiv"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, loading from environment")
	}

	// Define flags
	tag := flag.String("t", "", "Filter by tag")
	limit := flag.Int("l", 30, "Number of works to fetch per page")
	offset := flag.Int("o", 0, "Starting offset")
	outputDir := flag.String("d", "./output", "Output directory")
	flag.Parse()

	// Get user ID from arguments
	args := flag.Args()
	if len(args) < 1 {
		log.Println("Usage: pixiv-scraper <user_id> [options]")
		flag.PrintDefaults()
		os.Exit(1)
	}
	userID := args[0]

	// Create output directory if it doesn't exist
	if _, err := os.Stat(*outputDir); os.IsNotExist(err) {
		if err := os.MkdirAll(*outputDir, 0755); err != nil {
			log.Fatalf("Failed to create output directory: %v", err)
		}
	}

	// Create Pixiv client
	headers := http.Header{}
	headers.Set("Cookie", os.Getenv("PIXIV_COOKIE"))
	headers.Set("User-Agent", os.Getenv("PIXIV_USER_AGENT"))
	client := pixiv.NewClient(context.Background(), headers)

	// Main loop
	currentOffset := *offset
	for {
		bookmarkResp, err := client.FetchBookmark(userID, *tag, strconv.Itoa(currentOffset), strconv.Itoa(*limit))
		if err != nil {
			log.Fatalf("Failed to fetch bookmarks: %v", err)
		}

		for _, work := range bookmarkResp.Body.Works {
			novelResp, err := client.FetchNovel(work.ID)
			if err != nil {
				log.Printf("Failed to fetch novel %s: %v", work.ID, err)
				continue
			}

			filePath := path.Join(*outputDir, novelResp.Body.Title+".txt")
			if err := os.WriteFile(filePath, []byte(novelResp.Body.Content), 0644); err != nil {
				log.Printf("Failed to write novel %s to file: %v", work.ID, err)
			}
		}

		log.Printf("|> Progress: %d/%d\n", currentOffset+len(bookmarkResp.Body.Works), bookmarkResp.Body.Total)

		if len(bookmarkResp.Body.Works) < *limit {
			break
		}

		time.Sleep(1 * time.Second)
		currentOffset += *limit
	}
}
