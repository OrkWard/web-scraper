import { prepareAPI } from "twitter-scraper";
import { C } from "./config.js";

export const { getUserId, getUserTweets } = await prepareAPI({
  cookie: C.cookie,
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "x-csrf-token": C["x-csrf-token"],
  Authorization: C.Authorization,
});
