import * as Sentry from "@sentry/node";
import packageJson from "../package.json" with { type: "json" };

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV ?? "development",
  release: `trpc-server@${packageJson.version}`,
});
