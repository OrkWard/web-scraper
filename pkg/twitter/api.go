package twitter

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
)

type GetUserIdResponse struct {
	Data struct {
		User struct {
			Result struct {
				RestID string `json:"rest_id"`
			} `json:"result"`
		} `json:"user"`
	} `json:"data"`
}

type UserMediaResult struct {
	Cursor string
	Images []string
	Videos []string
}

func (c *TwitterClient) GetUserMedia(userId string, topCursor *string) (*UserMediaResult, error) {
	if err := c.waitReady(); err != nil {
		return nil, fmt.Errorf("client not ready: %w", err)
	}

	path, err := c.getAPIPathname("UserMedia")
	if err != nil {
		return nil, err
	}

	variables := map[string]any{
		"userId":                 userId,
		"count":                  20,
		"includePromotedContent": false,
		"withClientEventToken":   false,
		"withBirdwatchNotes":     false,
		"withVoice":              true,
		"cursor":                 topCursor,
	}
	features := map[string]any{
		"rweb_video_screen_enabled": false,
		"payments_enabled":          false,
		"rweb_xchat_enabled":        false,
		"profile_label_improvements_pcf_label_in_post_enabled":                    true,
		"responsive_web_profile_redirect_enabled":                                 false,
		"rweb_tipjar_consumption_enabled":                                         true,
		"verified_phone_label_enabled":                                            false,
		"creator_subscriptions_tweet_preview_api_enabled":                         true,
		"responsive_web_graphql_timeline_navigation_enabled":                      true,
		"responsive_web_graphql_skip_user_profile_image_extensions_enabled":       false,
		"premium_content_api_read_enabled":                                        false,
		"communities_web_enable_tweet_community_results_fetch":                    true,
		"c9s_tweet_anatomy_moderator_badge_enabled":                               true,
		"responsive_web_grok_analyze_button_fetch_trends_enabled":                 false,
		"responsive_web_grok_analyze_post_followups_enabled":                      true,
		"responsive_web_jetfuel_frame":                                            true,
		"responsive_web_grok_share_attachment_enabled":                            true,
		"articles_preview_enabled":                                                true,
		"responsive_web_edit_tweet_api_enabled":                                   true,
		"graphql_is_translatable_rweb_tweet_is_translatable_enabled":              true,
		"view_counts_everywhere_api_enabled":                                      true,
		"longform_notetweets_consumption_enabled":                                 true,
		"responsive_web_twitter_article_tweet_consumption_enabled":                true,
		"tweet_awards_web_tipping_enabled":                                        false,
		"responsive_web_grok_show_grok_translated_post":                           false,
		"responsive_web_grok_analysis_button_from_backend":                        false,
		"creator_subscriptions_quote_tweet_preview_enabled":                       false,
		"freedom_of_speech_not_reach_fetch_enabled":                               true,
		"standardized_nudges_misinfo":                                             true,
		"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
		"longform_notetweets_rich_text_read_enabled":                              true,
		"longform_notetweets_inline_media_enabled":                                true,
		"responsive_web_grok_image_annotation_enabled":                            true,
		"responsive_web_grok_imagine_annotation_enabled":                          true,
		"responsive_web_grok_community_note_auto_translation_is_enabled":          false,
		"responsive_web_enhance_cards_enabled":                                    false,
	}
	fieldToggles := map[string]any{
		"withArticlePlainText": false,
	}

	variablesBytes, _ := json.Marshal(variables)
	featuresBytes, _ := json.Marshal(features)
	fieldTogglesBytes, _ := json.Marshal(fieldToggles)

	params := url.Values{}
	params.Add("variables", string(variablesBytes))
	params.Add("features", string(featuresBytes))
	params.Add("fieldToggles", string(fieldTogglesBytes))

	reqURL := fmt.Sprintf("%s?%s", path, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header = c.authHeaders

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	resultStr := string(bodyBytes)

	cursorReg := regexp.MustCompile(`"value":"([^"]*)","cursorType":"Bottom"`)
	imgLinkReg := regexp.MustCompile(`"(https:\/\/pbs\.twimg\.com\/media.*?)"`)
	videoLinkReg := regexp.MustCompile(`"(https:\/\/video\.twimg\.com.*?)"`)

	cursorMatch := cursorReg.FindStringSubmatch(resultStr)
	cursor := ""
	if len(cursorMatch) > 1 {
		cursor = cursorMatch[1]
	}

	var imgList []string
	for _, match := range imgLinkReg.FindAllStringSubmatch(resultStr, -1) {
		if len(match) > 1 {
			imgList = append(imgList, match[1])
		}
	}

	var videoList []string
	for _, match := range videoLinkReg.FindAllStringSubmatch(resultStr, -1) {
		if len(match) > 1 {
			videoList = append(videoList, match[1])
		}
	}

	// Remove duplicates
	imgList = removeDuplicateStrings(imgList)
	videoList = removeDuplicateStrings(videoList)

	videoList = filterOutDuplicateVideo(videoList)

	return &UserMediaResult{
		Cursor: cursor,
		Images: imgList,
		Videos: videoList,
	}, nil
}

func (c *TwitterClient) GetUserTweets(userId string, count int) ([]TweetEntry, error) {
	if err := c.waitReady(); err != nil {
		return nil, fmt.Errorf("client not ready: %w", err)
	}

	path, err := c.getAPIPathname("UserTweets")
	if err != nil {
		return nil, err
	}

	variables := map[string]any{
		"userId":                                 userId,
		"count":                                  count,
		"includePromotedContent":                 true,
		"withQuickPromoteEligibilityTweetFields": true,
		"withVoice":                              true,
	}
	features := map[string]any{
		"rweb_video_screen_enabled": false,
		"payments_enabled":          false,
		"rweb_xchat_enabled":        false,
		"profile_label_improvements_pcf_label_in_post_enabled":                    true,
		"rweb_tipjar_consumption_enabled":                                         true,
		"verified_phone_label_enabled":                                            false,
		"creator_subscriptions_tweet_preview_api_enabled":                         true,
		"responsive_web_graphql_timeline_navigation_enabled":                      true,
		"responsive_web_graphql_skip_user_profile_image_extensions_enabled":       false,
		"premium_content_api_read_enabled":                                        false,
		"communities_web_enable_tweet_community_results_fetch":                    true,
		"c9s_tweet_anatomy_moderator_badge_enabled":                               true,
		"responsive_web_grok_analyze_button_fetch_trends_enabled":                 false,
		"responsive_web_grok_analyze_post_followups_enabled":                      true,
		"responsive_web_jetfuel_frame":                                            true,
		"responsive_web_grok_share_attachment_enabled":                            true,
		"articles_preview_enabled":                                                true,
		"responsive_web_edit_tweet_api_enabled":                                   true,
		"graphql_is_translatable_rweb_tweet_is_translatable_enabled":              true,
		"view_counts_everywhere_api_enabled":                                      true,
		"longform_notetweets_consumption_enabled":                                 true,
		"responsive_web_twitter_article_tweet_consumption_enabled":                true,
		"tweet_awards_web_tipping_enabled":                                        false,
		"responsive_web_grok_show_grok_translated_post":                           false,
		"responsive_web_grok_analysis_button_from_backend":                        false,
		"creator_subscriptions_quote_tweet_preview_enabled":                       false,
		"freedom_of_speech_not_reach_fetch_enabled":                               true,
		"standardized_nudges_misinfo":                                             true,
		"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
		"longform_notetweets_rich_text_read_enabled":                              true,
		"longform_notetweets_inline_media_enabled":                                true,
		"responsive_web_grok_image_annotation_enabled":                            true,
		"responsive_web_grok_imagine_annotation_enabled":                          true,
		"responsive_web_grok_community_note_auto_translation_is_enabled":          false,
		"responsive_web_enhance_cards_enabled":                                    false,
	}
	fieldToggles := map[string]any{
		"withArticlePlainText": false,
	}

	variablesBytes, _ := json.Marshal(variables)
	featuresBytes, _ := json.Marshal(features)
	fieldTogglesBytes, _ := json.Marshal(fieldToggles)

	params := url.Values{}
	params.Add("variables", string(variablesBytes))
	params.Add("features", string(featuresBytes))
	params.Add("fieldToggles", string(fieldTogglesBytes))

	reqURL := fmt.Sprintf("%s?%s", path, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header = c.authHeaders

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result GetUserTweetsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	for _, instruction := range result.Data.User.Result.Timeline.Timeline.Instructions {
		if instruction.Type == "TimelineAddEntries" {
			return instruction.Entries, nil
		}
	}

	return nil, fmt.Errorf("TimelineAddEntries instruction not found in response")
}

func (c *TwitterClient) GetUserId(userName string) (string, error) {
	if err := c.waitReady(); err != nil {
		return "", fmt.Errorf("client not ready: %w", err)
	}

	path, err := c.getAPIPathname("UserByScreenName")
	if err != nil {
		return "", err
	}

	variables := map[string]any{
		"screen_name":           userName,
		"withGrokTranslatedBio": false,
	}
	features := map[string]any{
		"hidden_profile_subscriptions_enabled":                              true,
		"payments_enabled":                                                  false,
		"profile_label_improvements_pcf_label_in_post_enabled":              true,
		"responsive_web_profile_redirect_enabled":                           false,
		"rweb_tipjar_consumption_enabled":                                   true,
		"verified_phone_label_enabled":                                      false,
		"subscriptions_verification_info_is_identity_verified_enabled":      true,
		"subscriptions_verification_info_verified_since_enabled":            true,
		"highlights_tweets_tab_ui_enabled":                                  true,
		"responsive_web_twitter_article_notes_tab_enabled":                  true,
		"subscriptions_feature_can_gift_premium":                            true,
		"creator_subscriptions_tweet_preview_api_enabled":                   true,
		"responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
		"responsive_web_graphql_timeline_navigation_enabled":                true,
	}
	fieldToggles := map[string]any{
		"withAuxiliaryUserLabels": true,
	}

	variablesBytes, _ := json.Marshal(variables)
	featuresBytes, _ := json.Marshal(features)
	fieldTogglesBytes, _ := json.Marshal(fieldToggles)

	params := url.Values{}
	params.Add("variables", string(variablesBytes))
	params.Add("features", string(featuresBytes))
	params.Add("fieldToggles", string(fieldTogglesBytes))

	reqURL := fmt.Sprintf("%s?%s", path, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header = c.authHeaders

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result GetUserIdResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", fmt.Errorf("failed to read body on json decode error: %w", err)
		}
		return "", fmt.Errorf("failed to decode response: %w. body: %s", err, string(bodyBytes))
	}

	if result.Data.User.Result.RestID == "" {
		return "", fmt.Errorf("user ID not found in response")
	}

	return result.Data.User.Result.RestID, nil
}

func (c *TwitterClient) getAPIPathname(name string) (string, error) {
	queryId, err := c.gqlClient.getQueryId(name)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("https://x.com/i/api/graphql/%s/%s", queryId, name), nil
}

// Helper function to remove duplicate strings from a slice
func removeDuplicateStrings(slice []string) []string {
	seen := make(map[string]struct{})
	var result []string
	for _, item := range slice {
		if _, ok := seen[item]; !ok {
			seen[item] = struct{}{}
			result = append(result, item)
		}
	}
	return result
}
