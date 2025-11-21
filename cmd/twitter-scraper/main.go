package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	twitter_scraper "github.com/OrkWard/web-scraper/internal/twitter-scraper"
	"github.com/OrkWard/web-scraper/pkg/twitter"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	noVideo := flag.Bool("v", false, "Only download images")
	noImage := flag.Bool("i", false, "Only download videos")
	maxCount := flag.Int("l", 0, "Limit the number of media to download")
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		fmt.Println("Usage: twitter-scraper [options] <username>")
		flag.PrintDefaults()
		os.Exit(1)
	}
	userName := args[0]

	fmt.Printf("[INPUT] Scraping user: %s\n", userName)
	fmt.Printf("[OPTION] No video: %v, No image: %v, Limit: %d\n", *noVideo, *noImage, *maxCount)

	headers := http.Header{}
	headers.Set("Cookie", os.Getenv("cookie"))
	headers.Set("X-CSRF-Token", os.Getenv("X_CSRF_TOKEN"))
	headers.Set("Authorization", os.Getenv("Authorization"))
	headers.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
	headers.Set("Referer", fmt.Sprintf("https://x.com/%s/media", userName))

	client := twitter.NewTwitterClient(context.Background(), headers)
	defer client.Close()

	userId, err := client.GetUserId(userName)
	if err != nil {
		fmt.Printf("Error getting user ID: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("[INFO] User ID: %s\n", userId)

	// Create output directory
	outputDir := fmt.Sprintf("output/%s", userName)
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		fmt.Printf("[ERROR] Error creating output directory: %v\n", err)
		os.Exit(1)
	}

	// Implement media fetching loop
	var images, videos []string
	var cursor *string
	for {
		result, err := client.GetUserMedia(userId, cursor)
		if err != nil {
			fmt.Printf("\n[ERROR] Error getting user media: %v", err)
			os.Exit(1)
		}

		if len(result.Images) == 0 && len(result.Videos) == 0 {
			fmt.Print("\n[INFO] No more media found.")
			break
		}

		images = append(images, result.Images...)
		videos = append(videos, result.Videos...)

		fmt.Printf("\r[PROGRESS] %c Fetched %d images and %d videos...", twitter_scraper.GetChar(), len(images), len(videos))

		if result.Cursor == "" {
			break
		}
		cursor = &result.Cursor

		if *maxCount > 0 && (len(images)+len(videos)) >= *maxCount {
			break
		}
	}
	fmt.Println()

	fmt.Printf("[INFO] Total images: %d, Total videos: %d\n", len(images), len(videos))

	// Save metadata
	saveMetadata(outputDir, "all_image.json", images)
	saveMetadata(outputDir, "all_video.json", videos)

	// Download files
	if !*noImage {
		fmt.Println("[INFO] Downloading images...")
		twitter_scraper.DownloadAll(images, outputDir)
	}

	if !*noVideo {
		fmt.Println("[INFO] Downloading videos...")
		twitter_scraper.DownloadAll(videos, outputDir)
	}
}

func saveMetadata(outputDir, fileName string, data []string) {
	filePath := fmt.Sprintf("%s/%s", outputDir, fileName)
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Printf("Error marshalling metadata to JSON: %v\n", err)
		return
	}
	if err := os.WriteFile(filePath, jsonData, 0644); err != nil {
		fmt.Printf("Error writing metadata file %s: %v\n", filePath, err)
	}
}
