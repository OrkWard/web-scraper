import { createClient } from "redis";
import { C } from "./config.js";
import { logger } from "./util.js";

export const redis = await createClient({ url: C.REDIS })
  .on("connect", () => {
    logger.info("Redis connected");
  })
  .connect();
