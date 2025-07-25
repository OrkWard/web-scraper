import * as _ from "es-toolkit/compat";
import { Agents, Headers } from "got";
import { NetworkError, ParseError } from "../util/exception.js";

import { prepareGql } from "../util/gql.js";
import { authGet, authInstance, instance } from "../util/request.js";
import { TweetEntry } from "./type.js";

function filterOutDuplicateVideo(videoList: string[]) {
  const videoAttrList = videoList.map((v) => ({
    id: v.match(/ext_tw_video\/(\d+)\//)![1],
    url: v,
  }));
  const pickHighest = (vList: string[]) => {
    const resolutionList = vList.map((v) => {
      const vh = v.match(/\/(\d+)x(\d+)\//);
      // ignore m3u8
      if (!vh) return 0;
      const [_, w, h] = vh;
      return Number(w) * Number(h);
    });

    let highest = 0;
    for (let i = 1; i < vList.length; i += 1) {
      if (resolutionList[i] > resolutionList[0]) {
        highest = i;
      }
    }
    return vList[highest];
  };

  const filteredVideoList = Object.values(Object.groupBy(videoAttrList, ({ id }) => id)).map(
    (sameVideos) => pickHighest(sameVideos!.map((v) => v.url)),
  );

  return filteredVideoList;
}

/**
 *
 * @param headers auth info
 * @param agent proxy info
 * @returns methods
 */
export async function prepareAPI(headers?: Headers, agent?: Agents) {
  authInstance.defaults.options.merge({ agent, headers });
  instance.defaults.options.merge({ agent });

  const getGraphql = await prepareGql();
  function getAPIPathname(apiName: string) {
    const gql = getGraphql(apiName);
    const url = `https://x.com/i/api/graphql/${gql.queryId}/${apiName}`;
    return url;
  }

  async function getUserMedia(userId: string, topCursor?: string) {
    const path = getAPIPathname("UserMedia");
    let result: string;
    try {
      const resp = await authGet(
        `${path}?${new URLSearchParams({
          variables: JSON.stringify({
            userId,
            count: 20,
            includePromotedContent: false,
            withClientEventToken: false,
            withBirdwatchNotes: false,
            withVoice: true,
            withV2Timeline: true,
            cursor: topCursor,
          }),
          features:
            '{"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"articles_preview_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"rweb_video_timestamps_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_enhance_cards_enabled":false}',
          fieldToggles: '{"withArticlePlainText":false}',
        }).toString()}`,
      ).json();

      result = JSON.stringify(resp);
    } catch (err) {
      throw new NetworkError(path, err as Error);
    }

    const cursorReg = /"value":"([^"]*)","cursorType":"Bottom"/;
    const imgLinkReg = /"(https:\/\/pbs\.twimg\.com\/media.*?)"/g;
    const videoLinkReg = /"(https:\/\/video\.twimg\.com.*?)"/g;

    const cursor = result.match(cursorReg)![1];
    const imgList = [...result.matchAll(imgLinkReg)].map((m) => m[1]);
    const videoList = [...result.matchAll(videoLinkReg)].map((m) => m[1]);

    return {
      cursor,
      imgs: [...new Set(imgList)],
      videos: filterOutDuplicateVideo([...new Set(videoList)]),
    };
  }

  async function getUserId(userName: string) {
    const path = getAPIPathname("UserByScreenName");
    let res: any;
    try {
      res = await authGet(
        `${path}?${new URLSearchParams({
          variables: JSON.stringify({
            screen_name: userName,
            withSafetyModeUserFields: true,
          }),
          features:
            '{"hidden_profile_subscriptions_enabled":true,"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"subscriptions_verification_info_is_identity_verified_enabled":true,"subscriptions_verification_info_verified_since_enabled":true,"highlights_tweets_tab_ui_enabled":true,"responsive_web_twitter_article_notes_tab_enabled":true,"subscriptions_feature_can_gift_premium":true,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"responsive_web_graphql_timeline_navigation_enabled":true}',
          fieldToggles: '{"withAuxiliaryUserLabels":false}',
        }).toString()}`,
      ).json();
    } catch (err) {
      throw new NetworkError(path, err as Error);
    }

    const result = JSON.stringify(res);
    const id = result.match(/"rest_id":"(\d+)"/)![1];

    return id;
  }

  async function getUserTweets(userId: string, count = 20): Promise<TweetEntry[]> {
    const path = getAPIPathname("UserTweets");
    let res: any;
    try {
      res = await authGet(
        `${path}?${new URLSearchParams({
          variables: JSON.stringify({
            userId,
            count,
            includePromotedContent: true,
            withQuickPromoteEligibilityTweetFields: true,
            withVoice: true,
            withV2Timeline: true,
          }),
          features:
            '{"profile_label_improvements_pcf_label_in_post_enabled":true,"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"premium_content_api_read_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"responsive_web_grok_analyze_button_fetch_trends_enabled":false,"responsive_web_grok_analyze_post_followups_enabled":true,"responsive_web_jetfuel_frame":false,"responsive_web_grok_share_attachment_enabled":true,"articles_preview_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"responsive_web_grok_analysis_button_from_backend":true,"creator_subscriptions_quote_tweet_preview_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"rweb_video_timestamps_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_grok_image_annotation_enabled":true,"responsive_web_enhance_cards_enabled":false}',
          fieldToggles: '{"withArticlePlainText":false}',
        })}`,
      ).json();
    } catch (err) {
      throw new NetworkError(path, err as Error);
    }

    const _i = _.get(res, "data.user.result.timeline_v2.timeline.instructions");
    if (!Array.isArray(_i)) {
      throw new ParseError(
        JSON.stringify(res),
        `"data.user.result.timeline_v2.timeline.instructions" is not Array`,
      );
    }
    const entries = _i.find((i) => i.type === "TimelineAddEntries").entries;
    if (!Array.isArray(entries)) {
      throw new ParseError(JSON.stringify(_i), `"TimelineAddEntries" is not Array or not found`);
    }
    return entries;
  }

  return { getUserMedia, getUserId, getUserTweets };
}
