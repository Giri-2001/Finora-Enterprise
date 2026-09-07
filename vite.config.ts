import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",

  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        main:
          "index.html",

        controlCenter:
          "control-center.html",
      },
    },
  },
});
