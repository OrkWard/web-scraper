import got from "got";
import { decode } from "html-entities";
import { Media, TimelineTweetLegacy } from "twitter-scraper";

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
