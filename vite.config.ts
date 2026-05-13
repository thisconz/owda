import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
      'process.env.APP_VERSION': JSON.stringify(env.APP_VERSION),
      'process.env.SIMULATE_VERSION': JSON.stringify(env.SIMULATE_VERSION),
      'process.env.ANALYTIC_VERSION': JSON.stringify(env.ANALYTIC_VERSION),
      'process.env.WORKSPACE_VERSION': JSON.stringify(env.WORKSPACE_VERSION),
      'process.env.COMPARE_VERSION': JSON.stringify(env.COMPARE_VERSION),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
