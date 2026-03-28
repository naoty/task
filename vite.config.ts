import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/ui",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": `http://localhost:${process.env.API_PORT ?? 4979}`,
    },
  },
  build: {
    outDir: "../../dist/ui",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
