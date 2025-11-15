package twitter

import "fmt"

func (c *TwitterClient) GetUserMedia() (string, error) {
	if err := c.waitReady(); err != nil {
		return "", fmt.Errorf("client not ready: %w", err)
	}

	path, err := c.getAPIPathname("GetUserMedia")
	if err != nil {
		return "", err
	}

	return "getUserMedia called", nil
}

func (c *TwitterClient) GetUserTweets() (string, error) {
	if err := c.waitReady(); err != nil {
		return "", fmt.Errorf("client not ready: %w", err)
	}

	path, err := c.getAPIPathname("getUserTweets")
	if err != nil {
		return "", err
	}

	return "MethodB called", nil
}

func (c *TwitterClient) getAPIPathname(name string) (string, error) {
	queryId, err := c.gqlClient.getQueryId(name)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("https://x.com/i/api/graphql/%s/%s", queryId, name), nil
}
