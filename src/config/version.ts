/**
 * OWDA Version Config
 *
 * Single import for all version strings injected by Vite at build time.
 * Components that need a version string import from here, not directly
 * from `process.env.*`.
 *
 * All values fall back to "1.0.0" if the env var is missing (e.g. during
 * unit tests or CI environments that don't load .env files).
 */

export const APP_VERSION       = process.env.APP_VERSION       ?? "1.0.0";
export const SIMULATE_VERSION  = process.env.SIMULATE_VERSION  ?? "1.0.0";
export const ANALYTIC_VERSION  = process.env.ANALYTIC_VERSION  ?? "1.0.0";
export const WORKSPACE_VERSION = process.env.WORKSPACE_VERSION ?? "1.0.0";
export const COMPARE_VERSION   = process.env.COMPARE_VERSION   ?? "1.0.0";