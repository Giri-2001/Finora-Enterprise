import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",

  plugins: [react()],

  // P1-686L: Explicit static asset recognition.
  // PNG imports must resolve to asset URLs, not executable JS.
  assetsInclude: ["**/*.png"],

  build: {
    rollupOptions: {
      input: {
        main:
          "index.html",

        controlCenter:
          "control-center.html",

        recipientTrustMaintenance:
          "recipient-trust-maintenance.html",

        recipientTrustRecovery:
          "recipient-trust-recovery.html",
      },
    },
  },
});
