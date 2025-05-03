import "./sentry.js";
import * as Sentry from "@sentry/node";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

import { getUserTweet } from "./controller/twitter/index.js";
import { trpc } from "./trpc.js";
import { logger } from "./logger.js";
import { getYoutubeChannelVideos } from "./controller/youtube/index.js";

const router = trpc.router({
  twitter: trpc.procedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
    return getUserTweet(input.username);
  }),
  youtube: trpc.procedure.input(z.object({ channelName: z.string() })).query(async ({ input }) => {
    return getYoutubeChannelVideos(input.channelName);
  }),
});

createHTTPServer({
  router: router,
  onError(e) {
    Sentry.captureException(e);
  },
}).listen(3000);
logger.info("tRPC server start");

export type AppRouter = typeof router;
