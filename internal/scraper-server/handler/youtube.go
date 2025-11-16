package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/OrkWard/web-scraper/pkg/youtube"
	"github.com/go-redis/redis/v8"
)

const (
	youtubeCacheKey = "YOUTUBE_CHANNEL_VIDEO:%s"
	youtubeCacheTTL = 20 * time.Minute
)

func MakeYoutubeHandler(ytClient *youtube.YouTubeClient, redisClient *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		channelName := r.PathValue("channelName")
		if channelName == "" {
			http.Error(w, "channelName is required", http.StatusBadRequest)
			return
		}

		cacheKey := fmt.Sprintf(youtubeCacheKey, channelName)
		ctx := r.Context()

		cachedVideos, err := redisClient.Get(ctx, cacheKey).Bytes()
		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Write(cachedVideos)
			return
		}

		channelId, err := ytClient.FetchChannelId(channelName)
		if err != nil {
			http.Error(w, "Failed to fetch channel ID", http.StatusInternalServerError)
			return
		}

		videos, err := ytClient.FetchChannelVideos(channelId)
		if err != nil {
			http.Error(w, "Failed to fetch channel videos", http.StatusInternalServerError)
			return
		}

		bytes, err := json.Marshal(videos)
		if err != nil {
			http.Error(w, "Failed to marshal videos", http.StatusInternalServerError)
			return
		}

		err = redisClient.Set(ctx, cacheKey, bytes, youtubeCacheTTL).Err()
		if err != nil {
			fmt.Println("Failed to cache videos:", err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)
	}
}
