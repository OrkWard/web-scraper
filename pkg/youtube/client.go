package youtube

import (
	"context"
	"errors"
	"fmt"
	"os"

	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

// YouTubeClient is a client for interacting with the YouTube API.
type YouTubeClient struct {
	service *youtube.Service
}

// NewYouTubeClient creates a new YouTubeClient.
func NewYouTubeClient(ctx context.Context) (*YouTubeClient, error) {
	apiKey := os.Getenv("YOUTUBE_API_KEY")
	if apiKey == "" {
		return nil, errors.New("YOUTUBE_API_KEY is not set")
	}

	service, err := youtube.NewService(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}

	return &YouTubeClient{
		service: service,
	}, nil
}

// FetchChannelId fetches the channel ID for a given channel name.
func (c *YouTubeClient) FetchChannelId(channelName string) (string, error) {
	call := c.service.Channels.List([]string{"id"}).ForUsername(channelName)
	response, err := call.Do()
	if err != nil {
		return "", err
	}

	if len(response.Items) == 0 {
		return "", errors.New("channel not found")
	}

	return response.Items[0].Id, nil
}

// FetchChannelVideos fetches the videos for a given channel ID.
func (c *YouTubeClient) FetchChannelVideos(channelId string) ([]*YouTubeVideo, error) {
	// First, get the channel's uploads playlist ID.
	channelsCall := c.service.Channels.List([]string{"contentDetails"}).Id(channelId)
	channelsResponse, err := channelsCall.Do()
	if err != nil {
		return nil, fmt.Errorf("error fetching channel details: %w", err)
	}

	if len(channelsResponse.Items) == 0 {
		return nil, errors.New("channel not found")
	}

	playlistId := channelsResponse.Items[0].ContentDetails.RelatedPlaylists.Uploads
	if playlistId == "" {
		return nil, errors.New("uploads playlist not found for channel")
	}

	// Then, get the videos from the uploads playlist.
	playlistItemsCall := c.service.PlaylistItems.List([]string{"snippet"}).PlaylistId(playlistId).MaxResults(50)
	playlistItemsResponse, err := playlistItemsCall.Do()
	if err != nil {
		return nil, fmt.Errorf("error fetching playlist items: %w", err)
	}

	videos := make([]*YouTubeVideo, 0, len(playlistItemsResponse.Items))
	for _, item := range playlistItemsResponse.Items {
		if item.Snippet.ResourceId.Kind != "youtube#video" {
			continue
		}
		videos = append(videos, &YouTubeVideo{
			VideoID:      item.Snippet.ResourceId.VideoId,
			Title:        item.Snippet.Title,
			Description:  item.Snippet.Description,
			ThumbnailURL: item.Snippet.Thumbnails.Default.Url,
			PublishedAt:  item.Snippet.PublishedAt,
		})
	}

	return videos, nil
}
