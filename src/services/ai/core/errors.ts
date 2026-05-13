export class AIError extends Error {
  public readonly code: string;

  public readonly retryable: boolean;

  public readonly status?: number;

  constructor(params: {
    message: string;
    code: string;
    retryable?: boolean;
    status?: number;
  }) {
    super(params.message);

    this.name = "AIError";

    this.code = params.code;

    this.retryable = params.retryable ?? false;

    this.status = params.status;
  }
}

export class AIParseError extends AIError {
  constructor(message: string) {
    super({
      message,
      code: "AI_PARSE_ERROR",
      retryable: false,
    });
  }
}

export class AITimeoutError extends AIError {
  constructor(timeoutMs: number) {
    super({
      message: `AI request timed out after ${timeoutMs}ms`,
      code: "AI_TIMEOUT",
      retryable: true,
    });
  }
}

export class AIRateLimitError extends AIError {
  constructor() {
    super({
      message: "AI provider rate limited the request",
      code: "AI_RATE_LIMIT",
      retryable: true,
      status: 429,
    });
  }
}

export class AIHTTPError extends AIError {
  constructor(status: number, body?: string) {
    super({
      message: `AI provider returned HTTP ${status}${
        body ? `: ${body.slice(0, 200)}` : ""
      }`,
      code: "AI_HTTP_ERROR",
      retryable: [429, 500, 502, 503, 504].includes(status),
      status,
    });
  }
}
