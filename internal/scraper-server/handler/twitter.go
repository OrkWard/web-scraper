package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/OrkWard/web-scraper/pkg/twitter"
	"github.com/go-redis/redis/v8"
)

const (
	twitterCacheKey = "TWITTER_USER_TWEET:%s"
	twitterCacheTTL = 5 * time.Minute
)

func MakeTwitterHandler(ctx context.Context, headers http.Header, redisClient *redis.Client) http.HandlerFunc {
	twitterClient := twitter.NewTwitterClient(ctx, headers)

	return func(w http.ResponseWriter, r *http.Request) {
		username := r.PathValue("userName")
		cacheKey := fmt.Sprintf(twitterCacheKey, username)

		cachedTweets, err := redisClient.Get(ctx, cacheKey).Bytes()
		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Write(cachedTweets)
			return
		}

		userId, err := twitterClient.GetUserId(username)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		tweets, err := twitterClient.GetUserTweets(userId, 5)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		bytes, err := json.Marshal(tweets)
		if err != nil {
			http.Error(w, "Failed to marshal tweets", http.StatusInternalServerError)
			return
		}

		err = redisClient.Set(ctx, cacheKey, bytes, twitterCacheTTL).Err()
		if err != nil {
			fmt.Println("Failed to cache tweets:", err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)
	}
}
