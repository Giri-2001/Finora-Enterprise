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

        recipientTrustMaintenance:
          "recipient-trust-maintenance.html",

        recipientTrustRecovery:
          "recipient-trust-recovery.html",
      },
    },
  },
});
