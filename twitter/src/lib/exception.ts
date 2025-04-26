export class NetworkError extends Error {
  constructor(url: string, origin?: Error) {
    super(`target:${url} detail:${origin?.message}`, { cause: origin?.cause });
    this.name = "NetworkError";
    if (origin?.stack) {
      this.stack = origin.stack;
    }
  }
}

export class ParseError extends Error {
  constructor(raw: string, message?: string);
  constructor(raw: string, origin?: Error);
  constructor(raw: string, origin?: Error | string) {
    if (origin instanceof Error) {
      super(`raw:${raw} detail:${origin.message}`, { cause: origin.cause });
      if (origin.stack) {
        this.stack = origin.stack;
      }
    } else {
      super(`raw:${raw} detail:${origin}`);
    }
    this.name = "ParseError";
  }
}
