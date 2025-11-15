package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"

	twitter_scraper "github.com/OrkWard/web-scraper/internal/twitter-scraper"
	"github.com/OrkWard/web-scraper/pkg/twitter"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		fmt.Println("Error loading .env file, assuming variables are set")
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

	fmt.Printf("Scraping user: %s\n", userName)
	fmt.Printf("No video: %v, No image: %v, Limit: %d\n", *noVideo, *noImage, *maxCount)

	// Read auth from env
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

	fmt.Printf("User ID: %s\n", userId)

	// Create output directory
	outputDir := fmt.Sprintf("output/%s", userName)
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		fmt.Printf("Error creating output directory: %v\n", err)
		os.Exit(1)
	}

	// Implement media fetching loop
	var imgs, videos []string
	var cursor *string
	for {
		result, err := client.GetUserMedia(userId, cursor)
		if err != nil {
			fmt.Printf("Error getting user media: %v\n", err)
			os.Exit(1)
		}

		if len(result.Images) == 0 && len(result.Videos) == 0 {
			fmt.Println("No more media found.")
			break
		}

		imgs = append(imgs, result.Images...)
		videos = append(videos, result.Videos...)

		fmt.Printf("Fetched %d images and %d videos...\n", len(imgs), len(videos))

		if result.Cursor == "" {
			break
		}
		cursor = &result.Cursor

		if *maxCount > 0 && (len(imgs)+len(videos)) >= *maxCount {
			break
		}
	}

	fmt.Printf("Total images: %d, Total videos: %d\n", len(imgs), len(videos))

	// Save metadata
	saveMetadata(outputDir, "all_image.json", imgs)
	saveMetadata(outputDir, "all_video.json", videos)

	// Download files
	if !*noImage {
		fmt.Println("Downloading images...")
		twitter_scraper.DownloadAll(imgs, outputDir)
	}

	if !*noVideo {
		fmt.Println("Downloading videos...")
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
