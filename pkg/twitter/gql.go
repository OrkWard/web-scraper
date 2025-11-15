package twitter

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type GQLClient struct {
	mainJsContent string
}

type NewGQLClientResult struct {
	client *GQLClient
	err    error
}

func NewGQLClient(httpClient *http.Client) <-chan NewGQLClientResult {
	resultCh := make(chan NewGQLClientResult)

	sendError := func(err error) {
		resultCh <- NewGQLClientResult{
			err: err,
		}
	}

	go func() {
		req, err := http.NewRequest("GET", "https://abs.twimg.com/responsive-web/client-web/main.b5edec8a.js", nil)
		if err != nil {
			sendError(err)
			return
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			sendError(err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			io.ReadAll(resp.Body)
			sendError(fmt.Errorf("HTTP status error: %d", resp.StatusCode))
			return
		}

		bytes, err := io.ReadAll(resp.Body)
		if err != nil {
			sendError(err)
			return
		}

		client := &GQLClient{
			mainJsContent: string(bytes),
		}
		resultCh <- NewGQLClientResult{
			client: client,
		}
	}()

	return resultCh
}

func (c *GQLClient) getQueryId(funcName string) (string, error) {
	if c.mainJsContent == "" {
		return "", errors.New("GQLClient not init or main.js content is empty")
	}

	operationNameStr := fmt.Sprintf(`operationName:"%s"`, funcName)
	operationIndex := strings.Index(c.mainJsContent, operationNameStr)
	if operationIndex == -1 {
		return "", fmt.Errorf("operationName '%s' not found", funcName)
	}

	// Search backwards from the operation name for the queryId
	searchArea := c.mainJsContent[:operationIndex]
	queryIdIndex := strings.LastIndex(searchArea, `queryId:"`)
	if queryIdIndex == -1 {
		return "", fmt.Errorf("queryId for '%s' not found", funcName)
	}

	// Extract the queryId
	queryIdStartIndex := queryIdIndex + len(`queryId:"`)
	searchArea = searchArea[queryIdStartIndex:]
	endQuoteIndex := strings.Index(searchArea, `"`)
	if endQuoteIndex == -1 {
		return "", fmt.Errorf("could not find end of queryId for '%s'", funcName)
	}

	return searchArea[:endQuoteIndex], nil
}
