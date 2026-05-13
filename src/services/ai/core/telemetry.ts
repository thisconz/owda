interface AIRequestMetric {
  model: string;

  durationMs: number;

  success: boolean;

  retries: number;

  tokensIn?: number;

  tokensOut?: number;

  errorCode?: string;
}

export function trackAIRequest(metric: AIRequestMetric) {
  if (process.env.NODE_ENV) {
    console.table(metric);
  }

  // Future:
  // send to analytics pipeline
  // OpenTelemetry
  // Grafana
  // Sentry
}
