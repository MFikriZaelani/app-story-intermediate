// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";

console.log(">>> PWA swSrc:", resolve(__dirname, "src/scripts/sw.js"));

export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "src/public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "src/index.html"),
    },
  },
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      injectRegister: false, // Jangan inject auto register, kamu pakai manual
      srcDir: "scripts", // Ini direktori tempat sw.js berada (relatif ke root)
      filename: "sw.js", // Nama file SW di dalam dist/
      includeAssets: ["favicon.ico", "images/*.png", "manifest.json"],
      manifest: {
        name: "Story App",
        short_name: "Story",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2196f3",
        icons: [
          {
            src: "/images/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/images/icon-512x512.png",
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
