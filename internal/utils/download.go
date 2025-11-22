package utils

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"path"
	"strings"
	"sync"
	"syscall"
	"time"
)

var shutdown = false

func listenForShutdown() {
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	fmt.Println("\nInterrupted. Saving progress...")
	shutdown = true
}

func DownloadAll(urls []string, outputDir string) {
	go listenForShutdown()

	// Check for interrupt file
	interruptFile := path.Join(outputDir, "download.int")
	if _, err := os.Stat(interruptFile); err == nil {
		fmt.Println("[INFO] Unfinished download task detected, resuming...")
		data, err := os.ReadFile(interruptFile)
		if err == nil {
			urls = strings.Split(string(data), "\n")
			os.Remove(interruptFile)
		}
	}

	var wg sync.WaitGroup
	urlChan := make(chan string)

	for range 10 {
		wg.Go(func() {
			for url := range urlChan {
				if shutdown {
					return
				}
				downloadFile(url, outputDir)
				time.Sleep(500 * time.Millisecond) // Be nice to the server
			}
		})
	}

	remainingUrls := urls
	for i, url := range urls {
		if shutdown {
			remainingUrls = urls[i:]
			break
		}
		urlChan <- url
		fmt.Printf("\r[PROGRESS] downloading: %.2f%%", float64(i+1)/float64(len(urls))*100)
	}
	fmt.Println()
	close(urlChan)
	wg.Wait()

	if shutdown {
		fmt.Println("[WARN] Saving progress...")
		data := strings.Join(remainingUrls, "\n")
		os.WriteFile(interruptFile, []byte(data), 0644)
		fmt.Println("[WARN] About to exit...")
	} else {
		fmt.Println("[SUCCESS] Download completed.")
	}
}

func downloadFile(url, outputDir string) {
	if url == "" {
		return
	}
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("[ERROR] Error downloading %s: %v\n", url, err)
		return
	}
	defer resp.Body.Close()

	fileName := path.Base(url)
	// The URL might have query params, so we need to clean the filename
	fileName = strings.Split(fileName, "?")[0]

	filePath := path.Join(outputDir, fileName)

	out, err := os.Create(filePath)
	if err != nil {
		fmt.Printf("Error creating file %s: %v\n", filePath, err)
		return
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		fmt.Printf("Error writing to file %s: %v\n", filePath, err)
	}
}
