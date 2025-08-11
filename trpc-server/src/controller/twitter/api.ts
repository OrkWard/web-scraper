import { prepareAPI } from "twitter-scraper";

export const { getUserId, getUserTweets } = await prepareAPI({
  cookie: process.env.TWI_COOKIE,
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "x-csrf-token": process.env.TWI_CSRF_TOKEN,
  Authorization: process.env.TWI_Authorization,
});
