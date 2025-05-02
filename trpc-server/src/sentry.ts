import * as Sentry from "@sentry/node";
import { C } from "./config.js";

Sentry.init({
  dsn: C.SENTRY_DSN,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV ?? "development",
});
