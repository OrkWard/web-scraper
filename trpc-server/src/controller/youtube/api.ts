import { google } from "googleapis";
import { C } from "./config.js";
import { logger } from "../../logger.js";

const youtube = google.youtube({
  version: "v3",
  auth: C.YOUTUBE_API_KEY,
});

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export async function fetchChannelId(channelName: string): Promise<string | null> {
  try {
    const response = await youtube.channels.list({
      part: ["id"],
      forUsername: channelName,
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id || null;
    } else {
      return null;
    }
  } catch (error) {
    logger.error(`Error fetching YouTube channel ID for ${channelName}: ${error}`);
    throw error;
  }
}

export async function fetchChannelVideos(channelId: string): Promise<YouTubeVideo[]> {
  try {
    const response = await youtube.search.list({
      channelId: channelId,
      part: ["snippet"],
      order: "date",
      type: ["video"],
      maxResults: 25,
    });

    if (response.data.items) {
      return response.data.items.map((item) => {
        return {
          videoId: item.id?.videoId || "unknown",
          title: item.snippet?.title || "unknown",
          description: item.snippet?.description || "unknown",
          thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "unknown",
          publishedAt: item.snippet?.publishedAt || "unknown",
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    logger.error(`Error fetching YouTube videos for channel ${channelId}: ${error}`);
    throw error;
  }
}
