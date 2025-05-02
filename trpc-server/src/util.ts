import { pino } from "pino";

export function safeJsonParse<T = unknown>(jsonString: string | null | undefined): T | null {
  if (jsonString === null || jsonString === undefined) {
    return null;
  }

  try {
    const parsedData: T = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    console.error("safeJsonParse: Failed to parse JSON.", error);
    return null; // Indicate failure
  }
}

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
