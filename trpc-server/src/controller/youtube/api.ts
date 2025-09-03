import { google } from "googleapis";
import { logger } from "../../logger.js";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
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
    const channels = await youtube.channels.list({
      id: [channelId],
      part: ["snippet", "contentDetails"],
    });
    const playlistId = channels.data.items?.[0].contentDetails?.relatedPlaylists?.uploads;

    if (!playlistId) {
      throw new Error(`Playlist id is null for channel id ${channelId}`);
    }

    const items = await youtube.playlistItems.list({
      playlistId,
      part: ["snippet"],
      maxResults: 50,
    });

    if (items.data.items?.some((v) => v.snippet?.channelId !== channelId)) {
      logger.error(`Malformed video detect. Full response: ${JSON.stringify(items.data)}`);
    }

    return (
      items.data.items
        ?.filter((v) => v.snippet?.channelId === channelId)
        ?.map((item) => {
          return {
            videoId: item.snippet?.resourceId?.videoId || "unknown",
            title: item.snippet?.title || "unknown",
            description: item.snippet?.description || "unknown",
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.default?.url ||
              "unknown",
            publishedAt: item.snippet?.publishedAt || "unknown",
          };
        }) || []
    );
  } catch (error) {
    logger.error(`Error fetching YouTube videos for channel ${channelId}: ${error}`);
    throw error;
  }
}
