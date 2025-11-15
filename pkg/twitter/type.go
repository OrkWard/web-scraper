package twitter

type TweetEntry struct {
	EntryID   string `json:"entryId"`
	SortIndex string `json:"sortIndex"`
	Content   struct {
		EntryType   string             `json:"entryType"`
		ItemContent *TimelineTweetItem `json:"itemContent,omitempty"`
		Items       []struct {
			EntryID string `json:"entryId"`
			Item    struct {
				ItemContent TimelineTweetItem `json:"itemContent"`
			} `json:"item"`
		} `json:"items,omitempty"`
	} `json:"content"`
}

type TimelineTweetItem struct {
	ItemType     string `json:"itemType"`
	TweetResults struct {
		Result TimelineTweetResult `json:"result"`
	} `json:"tweet_results"`
}

type TimelineTweetResult struct {
	RestID string `json:"rest_id"`
	Source string `json:"source"`
	Core   struct {
		UserResults UserResult `json:"user_results"`
	} `json:"core"`
	Views  Views               `json:"views"`
	Legacy TimelineTweetLegacy `json:"legacy"`
}

type UserResult struct {
	ID                       *string     `json:"id,omitempty"`
	RestID                   *string     `json:"rest_id,omitempty"`
	HasGraduatedAccess       *bool       `json:"has_graduated_access,omitempty"`
	ParodyCommentaryFanLabel *string     `json:"parody_commentary_fan_label,omitempty"`
	IsBlueVerified           *bool       `json:"is_blue_verified,omitempty"`
	ProfileImageShape        *string     `json:"profile_image_shape,omitempty"`
	Legacy                   *UserLegacy `json:"legacy,omitempty"`
}

type UserLegacy struct {
	Following               *bool           `json:"following,omitempty"`
	CanDM                   *bool           `json:"can_dm,omitempty"`
	CanMediaTag             *bool           `json:"can_media_tag,omitempty"`
	CreatedAt               *string         `json:"created_at,omitempty"`
	DefaultProfile          *bool           `json:"default_profile,omitempty"`
	DefaultProfileImage     *bool           `json:"default_profile_image,omitempty"`
	Description             *string         `json:"description,omitempty"`
	Entities                *PurpleEntities `json:"entities,omitempty"`
	FastFollowersCount      *int            `json:"fast_followers_count,omitempty"`
	FavouritesCount         *int            `json:"favourites_count,omitempty"`
	FollowersCount          *int            `json:"followers_count,omitempty"`
	FriendsCount            *int            `json:"friends_count,omitempty"`
	HasCustomTimelines      *bool           `json:"has_custom_timelines,omitempty"`
	IsTranslator            *bool           `json:"is_translator,omitempty"`
	ListedCount             *int            `json:"listed_count,omitempty"`
	Location                *string         `json:"location,omitempty"`
	MediaCount              *int            `json:"media_count,omitempty"`
	Name                    *string         `json:"name,omitempty"`
	NormalFollowersCount    *int            `json:"normal_followers_count,omitempty"`
	PinnedTweetIDsStr       []string        `json:"pinned_tweet_ids_str,omitempty"`
	PossiblySensitive       *bool           `json:"possibly_sensitive,omitempty"`
	ProfileBannerURL        *string         `json:"profile_banner_url,omitempty"`
	ProfileImageURLHTTPS    *string         `json:"profile_image_url_https,omitempty"`
	ProfileInterstitialType *string         `json:"profile_interstitial_type,omitempty"`
	ScreenName              *string         `json:"screen_name,omitempty"`
	StatusesCount           *int            `json:"statuses_count,omitempty"`
	TranslatorType          *string         `json:"translator_type,omitempty"`
	URL                     *string         `json:"url,omitempty"`
	Verified                *bool           `json:"verified,omitempty"`
	VerifiedType            *string         `json:"verified_type,omitempty"`
	WantRetweets            *bool           `json:"want_retweets,omitempty"`
	WithheldInCountries     []interface{}   `json:"withheld_in_countries,omitempty"`
}

type PurpleEntities struct {
	Description *Description `json:"description,omitempty"`
	URL         *Description `json:"url,omitempty"`
}

type Description struct {
	URLs []URLElement `json:"urls,omitempty"`
}

type URLElement struct {
	DisplayURL  string `json:"display_url"`
	ExpandedURL string `json:"expanded_url"`
	URL         string `json:"url"`
}

type TimelineTweetLegacy struct {
	FullText              string        `json:"full_text"`
	CreatedAt             *string       `json:"created_at,omitempty"`
	BookmarkCount         int           `json:"bookmark_count"`
	Entities              TweetEntities `json:"entities"`
	FavoriteCount         int           `json:"favorite_count"`
	IsQuoteStatus         *bool         `json:"is_quote_status,omitempty"`
	QuoteCount            int           `json:"quote_count"`
	ReplyCount            int           `json:"reply_count"`
	RetweetCount          int           `json:"retweet_count"`
	UserIDStr             string        `json:"user_id_str"`
	IDStr                 string        `json:"id_str"`
	RetweetedStatusResult *struct {
		Result TimelineTweetResult `json:"result"`
	} `json:"retweeted_status_result,omitempty"`
}

type TweetEntities struct {
	Hashtags     []Hashtag     `json:"hashtags,omitempty"`
	Symbols      []interface{} `json:"symbols,omitempty"`
	URLs         []URLElement  `json:"urls,omitempty"`
	UserMentions []UserMention `json:"user_mentions,omitempty"`
	Media        []Media       `json:"media,omitempty"`
}

type Hashtag struct {
	Text string `json:"text"`
}

type Media struct {
	DisplayURL    *string `json:"display_url,omitempty"`
	ExpandedURL   *string `json:"expanded_url,omitempty"`
	IDStr         *string `json:"id_str,omitempty"`
	MediaURLHTTPS string  `json:"media_url_https"`
	Type          string  `json:"type"`
	VideoInfo     *struct {
		DurationMillis int   `json:"duration_millis"`
		AspectRatio    []int `json:"aspect_ratio"`
		Variants       []struct {
			ContentType string `json:"content_type"`
			URL         string `json:"url"`
		} `json:"variants"`
	} `json:"video_info,omitempty"`
	URL          *string       `json:"url,omitempty"`
	Sizes        *Sizes        `json:"sizes,omitempty"`
	OriginalInfo *OriginalInfo `json:"original_info,omitempty"`
}

type OriginalInfo struct {
	Height *int `json:"height,omitempty"`
	Width  *int `json:"width,omitempty"`
}

type Sizes struct {
	Large  *ThumbClass `json:"large,omitempty"`
	Medium *ThumbClass `json:"medium,omitempty"`
	Small  *ThumbClass `json:"small,omitempty"`
	Thumb  *ThumbClass `json:"thumb,omitempty"`
}

type ThumbClass struct {
	H      *int    `json:"h,omitempty"`
	W      *int    `json:"w,omitempty"`
	Resize *string `json:"resize,omitempty"`
}

type UserMention struct {
	IDStr      *string `json:"id_str,omitempty"`
	Name       *string `json:"name,omitempty"`
	ScreenName *string `json:"screen_name,omitempty"`
	Indices    []int   `json:"indices,omitempty"`
}

type Views struct {
	Count string `json:"count"`
	State string `json:"state"`
}

type GetUserTweetsResponse struct {
	Data struct {
		User struct {
			Result struct {
				Timeline struct {
					Timeline struct {
						Instructions []struct {
							Entries []TweetEntry `json:"entries"`
							Type    string       `json:"type"`
						} `json:"instructions"`
					} `json:"timeline"`
				} `json:"timeline"`
			} `json:"result"`
		} `json:"user"`
	} `json:"data"`
}
