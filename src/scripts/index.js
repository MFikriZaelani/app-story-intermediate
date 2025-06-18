// File: src/scripts/index.js
// Import CSS utama
import "../styles/styles.css";

// Import aplikasi utama
import App from "./pages/app";
import SwRegister from './utils/sw-register.js';

// === Tambahkan listener offline/online ===
window.addEventListener("offline", () => {
  alert("Kamu sedang offline. Beberapa fitur tidak tersedia.");
});

window.addEventListener("online", () => {
  console.log("Koneksi internet kembali.");
});

document.addEventListener("DOMContentLoaded", async () => {
  const appInstance = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  // Render halaman awal
  await appInstance.renderPage();

  // Render ulang saat hash URL berubah
  window.addEventListener("hashchange", async () => {
    await appInstance.renderPage();
  });

  // Aksesibilitas: skip link ke konten utama
  const main = document.querySelector("#main-content");
  const skipBtn = document.querySelector(".skip-link");
  skipBtn.addEventListener("click", (e) => {
    e.preventDefault();
    skipBtn.blur();
    main.focus();
    main.scrollIntoView();
  });

  // ✅ Pindahkan semua ini ke sini:
  SwRegister.init();

  if (window.matchMedia("(display-mode: standalone)").matches) {
    console.log("App launched from homescreen");
  }
});
