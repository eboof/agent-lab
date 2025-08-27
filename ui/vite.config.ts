import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/agents": "http://localhost:3001",
      "/run": "http://localhost:3001",
      "/chat": "http://localhost:3001",
      "/schedule": "http://localhost:3001",
      "/run-now": "http://localhost:3001",
    },
  },
});
