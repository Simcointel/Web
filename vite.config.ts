import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Web/",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "vendor-react";
          if (id.includes("node_modules")) return "vendor-other";
        },
      },
    },
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
  },
});
