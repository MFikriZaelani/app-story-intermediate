import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "src", "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "src", "index.html"), // gunakan path absolut
    },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectManifest: {
        swSrc: resolve(__dirname, "src/scripts/sw.js"),
        swDest: "sw.js",
      },
      includeAssets: ["favicon.ico", "icons/*.png", "manifest.json"],
      manifest: {
        name: "Story App",
        short_name: "Story",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2196f3",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
