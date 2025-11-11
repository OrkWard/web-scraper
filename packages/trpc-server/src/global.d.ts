namespace NodeJS {
  interface ProcessEnv {
    SENTRY_DSN: string;
    REDIS: string;
    YOUTUBE_API_KEY: string;
    TWI_COOKIE: string;
    TWI_CSRF_TOKEN: string;
    TWI_Authorization: string;
    NODE_ENV?: string;
    VERSION: string;
  }
}
