import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import {resolve} from "path";
export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: "webdriverio",
      headless: false,
      name: "chrome",
      screenshotDirectory: resolve(__dirname, "src/test/screenshots"),
    },
    testTimeout: 10_000,
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
});