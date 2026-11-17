import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/__tests__/**/*.test.tsx", "src/__tests__/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: [],
    css: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/__tests__/**", "src/**/*.d.ts"],
      thresholds: {
        statements: 9,
        branches: 7,
        functions: 6,
        lines: 9,
      },
    },
  },
});
