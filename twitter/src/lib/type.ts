export type TweetEntry = {
  entryId: string;
  sortIndex: string;
  content: TweetContent;
};

export interface TweetContent {
  entryType: "TimelineTimelineItem";
  itemContent: ItemContent;
}

export interface ItemContent {
  itemType: "TimelineTweet";
  tweet_results: {
    result: TweetResult;
  };
}

export interface TweetResult {
  rest_id: string;
  source: string;
  core: {
    user_results: UserResult;
  }; // user info
  views: Views;
  legacy: TweetLegacy;
}

export interface UserResult {
  id?: string;
  rest_id?: string;
  has_graduated_access?: boolean;
  parody_commentary_fan_label?: string;
  is_blue_verified?: boolean;
  profile_image_shape?: string;
  legacy?: UserLegacy;
}

export interface UserLegacy {
  following?: boolean;
  can_dm?: boolean;
  can_media_tag?: boolean;
  created_at?: string;
  default_profile?: boolean;
  default_profile_image?: boolean;
  description?: string;
  entities?: PurpleEntities;
  fast_followers_count?: number;
  favourites_count?: number;
  followers_count?: number;
  friends_count?: number;
  has_custom_timelines?: boolean;
  is_translator?: boolean;
  listed_count?: number;
  location?: string;
  media_count?: number;
  name?: string;
  normal_followers_count?: number;
  pinned_tweet_ids_str?: string[];
  possibly_sensitive?: boolean;
  profile_banner_url?: string;
  profile_image_url_https?: string;
  profile_interstitial_type?: string;
  screen_name?: string;
  statuses_count?: number;
  translator_type?: string;
  url?: string;
  verified?: boolean;
  verified_type?: string;
  want_retweets?: boolean;
  withheld_in_countries?: any[];
}

export interface PurpleEntities {
  description?: Description;
  url?: Description;
}

export interface Description {
  urls?: URLElement[];
}

export interface URLElement {
  display_url: string;
  expanded_url: string;
  url: string;
}

export interface TweetLegacy {
  full_text: string;
  created_at?: string;
  bookmark_count?: number;
  entities: TweetEntities;
  favorite_count?: number;
  is_quote_status?: boolean;
  quote_count?: number;
  reply_count?: number;
  retweet_count?: number;
  user_id_str?: string;
  id_str?: string;
  retweeted_status_result?: { result: TweetResult };
}

export interface TweetEntities {
  hashtags: Hashtag[];
  symbols?: any[];
  urls?: URLElement[];
  user_mentions?: UserMention[];
  media?: Media[];
}

export interface Hashtag {
  text: string;
}

export interface Media {
  display_url?: string;
  expanded_url?: string;
  id_str?: string;
  media_url_https?: string;
  type?: string;
  url?: string;
  sizes?: Sizes;
  original_info?: OriginalInfo;
}

export interface OriginalInfo {
  height?: number;
  width?: number;
}

export interface Sizes {
  large?: ThumbClass;
  medium?: ThumbClass;
  small?: ThumbClass;
  thumb?: ThumbClass;
}

export interface ThumbClass {
  h?: number;
  w?: number;
  resize?: string;
}

export interface UserMention {
  id_str?: string;
  name?: string;
  screen_name?: string;
  indices?: number[];
}

export interface Views {
  count: string;
  state: string;
}
