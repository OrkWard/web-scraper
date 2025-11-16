package pixiv

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
)

// Client is a client for interacting with the Pixiv API.
type Client struct {
	httpClient *http.Client
	headers    http.Header
}

// NewClient creates a new Pixiv client.
func NewClient(ctx context.Context, headers http.Header) *Client {
	return &Client{
		httpClient: &http.Client{},
		headers:    headers,
	}
}

// FetchBookmark fetches a user's bookmarked novels.
func (c *Client) FetchBookmark(userID, tag, offset, limit string) (*BookmarkResponse, error) {
	baseURL := fmt.Sprintf("https://www.pixiv.net/ajax/user/%s/novels/bookmarks", userID)
	params := url.Values{}
	params.Add("tag", tag)
	params.Add("offset", offset)
	params.Add("limit", limit)
	params.Add("lang", "zh")
	params.Add("rest", "show")

	req, err := http.NewRequest("GET", baseURL+"?"+params.Encode(), nil)
	if err != nil {
		return nil, err
	}

	req.Header = c.headers
	log.Println("|> target:", req.URL.String())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var bookmarkResp BookmarkResponse
	if err := json.NewDecoder(resp.Body).Decode(&bookmarkResp); err != nil {
		return nil, err
	}

	return &bookmarkResp, nil
}

// FetchNovel fetches a single novel.
func (c *Client) FetchNovel(novelID string) (*NovelResponse, error) {
	url := fmt.Sprintf("https://www.pixiv.net/ajax/novel/%s?lang=zh", novelID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header = c.headers

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var novelResp NovelResponse
	if err := json.NewDecoder(resp.Body).Decode(&novelResp); err != nil {
		return nil, err
	}

	return &novelResp, nil
}
