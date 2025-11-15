package twitter

import (
	"context"
	"fmt"
)

type TwitterClient struct {
	ready     chan struct{}
	initErr   error
	gqlClient *GQLClient
}

func NewTwitterClient(ctx context.Context) *TwitterClient {
	c := &TwitterClient{
		ready: make(chan struct{}),
	}

	go c.runInit(ctx)

	return c
}

func (c *TwitterClient) runInit(ctx context.Context) {
	defer close(c.ready)

	select {
	case result := <-NewGQLClient():
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
