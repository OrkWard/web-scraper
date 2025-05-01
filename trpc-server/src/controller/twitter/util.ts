import got from "got";
import { decode } from "html-entities";
import { Media, TimelineTweetLegacy } from "twitter-scraper";
import { getUserId } from "./api.js";

export function getTweetMedia(media: Media) {
  let url: string = media.media_url_https;
  if (media.type === "photo") {
    //
  } else if (media.type === "video") {
    url = media.video_info?.variants.filter((v) => v.content_type === "video/mp4").at(-1)?.url!;
  }

  return {
    type: media.type,
    url,
    buffer: got(url).buffer(),
  };
}

export function getTweetContent(tweet: TimelineTweetLegacy) {
  const tweetId = tweet.id_str;
  const text = decode(tweet.full_text);
  const media = tweet.entities.media?.map(getTweetMedia);
  return {
    tweetId,
    text,
    media,
  };
}

export class UserIdStore {
  private _map = new Map<string, string>();

  constructor() {}
  async get(username: string) {
    if (!this._map.has(username)) {
      const id = await getUserId("blue_archivejp");
      this._map.set(username, id);
      return id;
    }

    return this._map.get(username)!;
  }
}
