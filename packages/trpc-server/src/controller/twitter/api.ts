import { prepareAPI } from "twitter-scraper";

export const { getUserId, getUserTweets } = await prepareAPI({
  cookie: process.env.TWI_COOKIE,
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "x-csrf-token": process.env.TWI_CSRF_TOKEN,
  authorization: process.env.TWI_Authorization,
});
