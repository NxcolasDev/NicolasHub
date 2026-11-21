import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/**
 * Configures React Fast Refresh, Tailwind's Vite plugin, and local API proxying.
 */
export default defineConfig(({ mode }) => ({
  envPrefix: [],
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      loadEnv(mode, process.cwd(), "VITE_API_BASE_URL").VITE_API_BASE_URL ?? "",
    ),
  },
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
    },
  },
}));
