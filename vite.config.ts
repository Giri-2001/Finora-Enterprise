import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  publicDir: "public",

  resolve: {
    alias: {
      "@": resolve(__dirname, "app"),
    },
  },

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },

  preview: {
    host: "127.0.0.1",
    port: 4173,
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
