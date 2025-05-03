import { logger } from "../../logger.js";
import { redis } from "../../redis.js";
import { fetchChannelId, fetchChannelVideos, type YouTubeVideo } from "./api.js";

const CHANNEL_KEY = "YOUTUBE_CHANNEL_VIDEO";
const CHANNEL_ID_KEY = "YOUTUBE_CHANNEL_ID";
const CHANNEL_RETRY_TIME = 5 * 60; // seconds
const CHANNEL_ID_RETRY_TIME = 24 * 60 * 60;

async function getChannelId(channelName: string): Promise<string> {
  const cachedChannelId = await redis.get(`${CHANNEL_ID_KEY}:${channelName}`);
  if (cachedChannelId) {
    return cachedChannelId;
  }

  logger.info(`Channel ID of ${channelName} not found in cache`);
  const channelId = await fetchChannelId(channelName);
  if (!channelId) {
    throw new Error(`Could not find channel ID for ${channelName}`);
  }

  await redis.setEx(`${CHANNEL_ID_KEY}:${channelName}`, CHANNEL_ID_RETRY_TIME, channelId);

  return channelId;
}

export async function getYoutubeChannelVideos(channelName: string): Promise<YouTubeVideo[]> {
  const cachedVideos = await redis.get(`${CHANNEL_KEY}:${channelName}`);
  if (cachedVideos) {
    const parsedVideos = JSON.parse(cachedVideos) as YouTubeVideo[];
    logger.info(`Youtube cache hit for channel ${channelName}`);
    return parsedVideos;
  }

  const channelId = await getChannelId(channelName);
  const videos = await fetchChannelVideos(channelId);

  await redis.setEx(`${CHANNEL_KEY}:${channelName}`, CHANNEL_RETRY_TIME, JSON.stringify(videos));
  logger.info(`Youtube videos for channel ${channelName} saved to cache`);

  return videos;
}
