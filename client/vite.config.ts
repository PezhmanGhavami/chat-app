import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

//TODO - Don't forget to remove secure false in prod
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
