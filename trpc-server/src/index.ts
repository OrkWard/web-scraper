import "./sentry.js";
import * as Sentry from "@sentry/node";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

import { getUserTweet } from "./controller/twitter/index.js";
import { trpc } from "./trpc.js";
import { logger } from "./logger.js";
import { getYoutubeChannelVideosById, getYoutubeChannelVideosByName } from "./controller/youtube/index.js";

const router = trpc.router({
  twitter: trpc.procedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
    return getUserTweet(input.username);
  }),
  youtube: trpc.procedure
    .input(z.union([z.object({ channelName: z.string() }), z.object({ channelId: z.string() })]))
    .query(async ({ input }) => {
      if ("channelName" in input) {
        return getYoutubeChannelVideosByName(input.channelName);
      } else {
        return getYoutubeChannelVideosById(input.channelId);
      }
    }),
});

createHTTPServer({
  router: router,
  onError(e) {
    Sentry.captureException(e);
    logger.error(e.error);
  },
}).listen(3000);
logger.info("tRPC server start");

export type AppRouter = typeof router;
