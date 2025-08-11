import { createClient } from "redis";
import { logger } from "./logger.js";

export const redis = await createClient({ url: process.env.REDIS })
  .on("connect", () => {
    logger.info("Redis connected");
  })
  .connect();
