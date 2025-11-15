package twitter

import (
	"context"
	"fmt"
	"net/http"
)

type TwitterClient struct {
	ready       chan struct{}
	initErr     error
	gqlClient   *GQLClient
	httpClient  *http.Client
	authHeaders http.Header
}

func NewTwitterClient(ctx context.Context, headers http.Header) *TwitterClient {
	c := &TwitterClient{
		ready:       make(chan struct{}),
		authHeaders: headers,
	}

	go c.runInit(ctx)

	return c
}

func (c *TwitterClient) runInit(ctx context.Context) {
	defer close(c.ready)

	c.httpClient = http.DefaultClient

	select {
	case result := <-NewGQLClient(c.httpClient):
		c.initErr = result.err
		c.gqlClient = result.client

	case <-ctx.Done():
		c.initErr = ctx.Err()
	}
}

func (c *TwitterClient) waitReady() error {
	<-c.ready
	return c.initErr
}

func (c *TwitterClient) Close() error {
	<-c.ready

	if c.gqlClient != nil {
		fmt.Println("Closing client connection")
	}
	return nil
}
