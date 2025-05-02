import "./sentry.js";
import * as Sentry from "@sentry/node";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import assert from "node:assert";

import { getUserTweet } from "./controller/twitter/index.js";
import { trpc } from "./trpc.js";
import { logger } from "./util.js";

const router = trpc.router({
  twitter: trpc.procedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
    try {
      return getUserTweet(input.username);
    } catch (e) {
      logger.error(e, "Error in handle /twitter");
      assert(e instanceof Error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: e?.cause, message: e.message });
    }
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
