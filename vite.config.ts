import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const cspHeader = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-qUfytOIotiaRfRm5tv4kk/OuGZvPXqFZmeb+OGhEjRQ=' 'sha256-1YtRcwWFYwc12Z4W+IbSPG/et1QYUBFZk/cwaL75LmI=' 'sha256-KTbaGoeWo1Wv2Kq5eJfkc2HU4fu3sZ5Ul+6eGUPQJ3o=' 'sha256-YHKKSph+VswLvuTno6uXayzRHPkv9AtpGx7qE8j7RSg='; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.simcotools.com https://raw.githubusercontent.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

function cspPlugin() {
  return {
    name: 'csp-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Content-Security-Policy', cspHeader);
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), cspPlugin()],
    base: "/Web/",
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
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});