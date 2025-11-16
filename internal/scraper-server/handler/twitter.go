package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/OrkWard/web-scraper/pkg/twitter"
	"github.com/redis/go-redis/v9"
)

const (
	twitterCacheKey = "TWITTER_USER_TWEET:%s"
	twitterCacheTTL = 5 * time.Minute
)

func MakeTwitterHandler(ctx context.Context, headers http.Header, redisClient *redis.Client) http.HandlerFunc {
	twitterClient := twitter.NewTwitterClient(ctx, headers)

	return func(w http.ResponseWriter, r *http.Request) {
		userId := r.PathValue("userId")
		cacheKey := fmt.Sprintf(twitterCacheKey, userId)

		cachedTweets, err := redisClient.Get(ctx, cacheKey).Bytes()
		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Write(cachedTweets)
			return
		}

		tweets, err := twitterClient.GetUserTweets(userId, 5)
		if err != nil {
			fmt.Println(err)
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
