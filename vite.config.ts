import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isProd = mode === 'production';
  return {
    plugins: [react()],
    base: "/Web/",
    define: {
      'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
      'process.env.__DEV__': isProd ? 'false' : 'true',
      'import.meta.env.PROD': isProd,
      'import.meta.env.DEV': !isProd,
      'globalThis.process': 'undefined',
      'globalThis.__DEV__': isProd ? 'false' : 'true',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@data": path.resolve(__dirname, "./src/data"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@types": path.resolve(__dirname, "./src/types"),
        "@router": path.resolve(__dirname, "./src/router"),
      },
    },
    server: {
      port: 5174,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY || "http://127.0.0.1:3001",
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      minify: isProd ? "terser" : "esbuild",
      terserOptions: isProd ? {
        compress: {
          pure_funcs: ['console.log', 'console.debug', 'console.info'],
          drop_debugger: true,
          passes: 2,
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          conditionals: true,
          dead_code: true,
          evaluate: true,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      } : undefined,
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor-recharts';
              if (id.includes('swagger-ui')) return 'vendor-swagger';
              // Keep React ecosystem in main vendor to avoid circular deps
              return 'vendor';
            }
            if (id.includes('CorporateSuite')) return 'app-corporate-suite';
            if (id.includes('RestaurantPlanner')) return 'app-restaurant-planner';
            if (id.includes('Encyclopedia')) return 'app-encyclopedia';
            if (id.includes('ChallengeOptimizer')) return 'app-challenge-optimizer';
            if (id.includes('RetailCalculator')) return 'app-retail-calculator';
            if (id.includes('ConstructionCalculator')) return 'app-construction-calculator';
            if (id.includes('ProfitCalculator')) return 'app-profit-calculator';
            if (id.includes('XpCalculator')) return 'app-xp-calculator';
            if (id.includes('SalesOfficeCalculator')) return 'app-sales-office';
            if (id.includes('RetailMechanics')) return 'app-retail-mechanics';
            if (id.includes('MarketIntel')) return 'app-market-intel';
            if (id.includes('simco_static')) return 'app-simco-static';
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});