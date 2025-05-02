import { getUserTweet } from "./controller/twitter/index.js";
import { trpc } from "./trpc.js";
import { z } from "zod";

const Router = trpc.router({
  twitter: trpc.procedure.input(z.object({ username: z.string() })).query(async ({ input }) => {
    return getUserTweet(input.username);
  }),
});

export type Router = typeof Router;
