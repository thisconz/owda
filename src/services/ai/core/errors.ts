export interface AIErrorParams {
  message: string;
  code: string;
  retryable?: boolean;
  status?: number;
  cause?: unknown;
}

export class AIError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly status: number | undefined;
  public override readonly cause: unknown | undefined;

  constructor(params: AIErrorParams) {
    // Forward the message and cause structurally to the native Error class
    super(params.message, params.cause !== undefined ? { cause: params.cause } : undefined);
    
    this.name = "AIError";
    this.code = params.code;
    this.retryable = params.retryable ?? false;
    this.status = params.status;
    this.cause = params.cause;

    // Restore correct prototype chain for subclassing behavior in ES5/ES6 runtimes
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture clean stack trace across environments
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AIParseError extends AIError {
  constructor(message: string, options?: { cause?: unknown }) {
    super({
      message,
      code: "AI_PARSE_ERROR",
      retryable: false,
      cause: options?.cause,
    });
  }
}

export class AITimeoutError extends AIError {
  constructor(timeoutMs: number, options?: { cause?: unknown }) {
    super({
      message: `AI request timed out after ${timeoutMs}ms`,
      code: "AI_TIMEOUT",
      retryable: true,
      cause: options?.cause,
    });
  }
}

export class AIRateLimitError extends AIError {
  constructor(options?: { message?: string; cause?: unknown }) {
    super({
      message: options?.message ?? "AI provider rate limited the request",
      code: "AI_RATE_LIMIT",
      retryable: true,
      status: 429,
      cause: options?.cause,
    });
  }
}

export class AIHTTPError extends AIError {
  constructor(status: number, body?: string, options?: { cause?: unknown }) {
    const slicedBody = body !== undefined && body.length > 0 ? `: ${body.slice(0, 200)}` : "";
    
    super({
      message: `AI provider returned HTTP ${status}${slicedBody}`,
      code: "AI_HTTP_ERROR",
      retryable: [429, 500, 502, 503, 504].includes(status),
      status,
      cause: options?.cause,
    });
  }
}