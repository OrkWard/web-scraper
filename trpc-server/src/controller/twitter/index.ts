import { TweetEntry } from "twitter-scraper";

import { getUserTweets } from "./api.js";
import { getTweetContent, UserIdStore } from "./util.js";
import { logger } from "../../logger.js";
import { redis } from "../../redis.js";

const userIdStore = new UserIdStore();
const REDIS_KEY = "TWITTER_USER_TWEET";
const RETRY_TIME = 5 * 60; // seconds

function parseTweetEntry(entries: TweetEntry[]) {
  const result = entries
    .filter((e) => ["TimelineTimelineItem", "TimelineTimelineModule"].includes(e.content.entryType))
    .map((e) =>
      e.content.entryType === "TimelineTimelineItem"
        ? e.content.itemContent
        : e.content.items.map((i) => i.item.itemContent).reverse(),
    )
    .flat()
    .filter((t) => t.itemType === "TimelineTweet")
    .map((t) => t.tweet_results.result.legacy)
    .map(getTweetContent);

  if (!Array.isArray(result) || result.some((t) => typeof t.tweetId !== "string" || typeof t.text !== "string")) {
    throw new Error(`Entries don't have expected structure, raw: ${JSON.stringify(result)}`);
  }
  return result;
}

export async function getUserTweet(username: string) {
  let entries: TweetEntry[];
  const cachedEntries = await redis.get(`${REDIS_KEY}:${username}`);
  if (cachedEntries) {
    logger.info("Tweet cache hit");
    entries = JSON.parse(cachedEntries) as TweetEntry[];
  } else {
    const id = await userIdStore.get(username);
    entries = await getUserTweets(id);
    logger.info(`Tweets of ${username} fetch successful`);
    await redis.setEx(`${REDIS_KEY}:${username}`, RETRY_TIME, JSON.stringify(entries));
    logger.info(`Tweets of ${username} save to cache`);
  }

  return parseTweetEntry(entries);
}
