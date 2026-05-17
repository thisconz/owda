// src/vite-env.d.ts
/// <reference types="vite/client" />

// CSS Modules (not used in this project — using global Tailwind)
// Kept for compatibility if CSS modules are added in future
declare module "*.module.css" {
  const content: { readonly [className: string]: string };
  export default content;
}

// Environment variable types for process.env substitutions via Vite define
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly APP_VERSION: string;
    readonly SIMULATE_VERSION: string;
    readonly ANALYTIC_VERSION: string;
    readonly WORKSPACE_VERSION: string;
    readonly COMPARE_VERSION: string;
  }
}