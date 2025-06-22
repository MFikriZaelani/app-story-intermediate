import { showFormattedDate } from "../../utils";
import HomePresenter from "./home-presenter";
import * as DicodingAPI from "../../data/api";
import {
  initNotificationButton,
  updateNotificationButtonState,
} from "@/scripts/utils/notification-helper.js";

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <section class="container home-content" aria-labelledby="recent-stories-heading">
        <div class="offline-alert" id="connection-status" aria-live="polite"></div>
        <div class="home-section-header">
          <h2 id="recent-stories-heading">Daftar Cerita</h2>
          <button 
            id="notificationBtn" 
            class="notification-btn" 
            aria-label="Aktifkan notifikasi">
            <i class="fas fa-bell"></i>
            <span class="notification-text">Aktifkan Notifikasi</span>
          </button>
        </div>

        <div id="stories-container" role="region" aria-live="polite">
          <div class="loader-container" role="status">
            <div class="loader"></div>
            <span class="sr-only">Loading stories...</span>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Check if user is logged in
    this.addAccessibilityStyles();

    this.#presenter = new HomePresenter({ view: this, model: DicodingAPI });

    // Setup connection status indicator
    this.updateConnectionStatus();
    await this.#presenter.loadStories();

    const notificationBtn = document.getElementById("notificationBtn");

    if (notificationBtn) {
      notificationBtn.addEventListener("click", async () => {
        try {
          notificationBtn.disabled = true;
          notificationBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Mengaktifkan...';

          await initNotificationButton();

          // updateButtonState dipanggil dari dalam initNotificationButton()
        } catch (error) {
          console.error("Error:", error);
          alert("Gagal mengaktifkan notifikasi: " + error.message);
        } finally {
          if (Notification.permission !== "granted") {
            notificationBtn.disabled = false;
            notificationBtn.innerHTML =
              '<i class="fas fa-bell"></i> Aktifkan Notifikasi';
          }
        }
      });
    }
  }

  updateConnectionStatus() {
    const updateOfflineStatus = () => {
      const statusElement = document.getElementById("connection-status");
      if (!statusElement) return;

      if (!navigator.onLine) {
        statusElement.innerHTML = `
        <div class="offline-alert">
         ⚠️ Anda sedang offline. Menampilkan data dari cache.
        </div>
      `; // Kosongkan jika online
      } else {
        statusElement.innerHTML = "";
      }
    };

    // Initial check
    updateOfflineStatus();

    // Add listeners
    window.addEventListener("online", () => this.updateConnectionStatus());
    window.addEventListener("offline", () => this.updateConnectionStatus());
  }

  showLoginRequired() {
    const container = document.getElementById("stories-container");
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        <p>kamu harus login untuk lihat cerita. <a href="#/login">Login disini</a> atau <a href="#/register">Register</a></p>
      </div>
    `;
  }

  showEmptyStories() {
    const container = document.getElementById("stories-container");
    container.innerHTML = `
      <div class="alert" role="alert">
        <p>cerita tidak ditemukan. jadilah yang pertama untuk <a href="#/add">membuat cerita!</a></p>
      </div>
    `;
  }

  async showStories() {
    try {
      const response = await fetch("https://story-api.dicoding.dev/v1/stories");
      if (!response.ok) throw new Error("Gagal fetch dari API");

      const result = await response.json();
      const stories = result.listStory;

      // ✅ Simpan ke IndexedDB agar bisa diakses offline nanti
      const { saveStories } = await import("../../utils/db-storage.js");
      await saveStories(stories);

      this.displayStories(stories);
    } catch (error) {
      console.warn("Gagal ambil dari API, mencoba dari IndexedDB:", error);

      // ✅ Ambil dari cache kalau fetch gagal
      const { getStoriesFromCache } = await import("../../utils/db-storage.js");
      const cachedStories = await getStoriesFromCache();

      if (cachedStories && cachedStories.length > 0) {
        this.displayStories(cachedStories);
      } else {
        this.displayError(
          "Tidak bisa memuat cerita. Coba periksa koneksi Anda."
        );
      }
    }
  }

  showError(message) {
    const container = document.getElementById("stories-container");
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        <p>${message || "gagal loading cerita. tolong ulangi lagi."}</p>
      </div>
    `;
  }

  addAccessibilityStyles() {
    if (!document.getElementById("sr-only-styles")) {
      const style = document.createElement("style");
      style.id = "sr-only-styles";
      style.textContent = `
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }

  async displayStories(stories) {
    const container = document.getElementById("stories-container");

    const { getAllSavedPhotos } = await import("../../utils/db-storage.js");
    const savedPhotos = await getAllSavedPhotos();

    const storyItems = stories
      .map((story) => {
        const isSaved = savedPhotos.some((item) => item.id === story.id);
        const iconSrc = isSaved
          ? "images/save-full.png"
          : "images/save.png";
        const iconAlt = isSaved ? "Cerita telah disimpan" : "Simpan cerita";
        const ariaLabel = isSaved
          ? `Cerita ${story.name} telah disimpan`
          : `Simpan cerita ${story.name}`;

        return `
      <article class="story-card" style="view-transition-name: story-${
        story.id
      }" aria-labelledby="story-title-${story.id}">
        <figure class="story-image-container">
          <img
            src="${story.photoUrl}"
            alt="Story image by ${story.name}"
            class="story-image"
            onerror="this.src='images/placeholder.png'; this.alt='Placeholder image';"
          />
        </figure>
        <div class="story-content">
          <h3 class="story-title" id="story-title-${story.id}">${
          story.name
        }</h3>
          <p class="story-description">${this.truncateText(
            story.description,
            100
          )}</p>
          <div class="story-meta">
            <time class="story-date" datetime="${new Date(
              story.createdAt
            ).toISOString()}">
              ${showFormattedDate(story.createdAt)}
            </time>
            <a href="#/detail/${
              story.id
            }" class="btn btn-outline" aria-label="Read more about ${
          story.name
        }'s story">Read More</a>
            <button class="btn-save-story" data-story='${JSON.stringify(
              story
            )}' aria-label="${ariaLabel}">
              <img src="${iconSrc}" alt="${iconAlt}" class="icon-save" />
            </button>
          </div>
        </div>
      </article>
    `;
      })
      .join("");

    container.innerHTML = `
    <div class="story-list">
      ${storyItems}
    </div>
  `;

    this.#initSaveButtons();
  }

  #initSaveButtons() {
    const saveButtons = document.querySelectorAll(".btn-save-story");

    saveButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const story = JSON.parse(btn.dataset.story);
        const img = btn.querySelector("img");

        const {
          savePhotoToSavedPhotos,
          removePhotoFromSave,
          getAllSavedPhotos,
        } = await import("../../utils/db-storage.js");

        try {
          const savedPhotos = await getAllSavedPhotos();
          const isAlreadySaved = savedPhotos.some(
            (item) => item.id === story.id
          );

          if (isAlreadySaved) {
            // 🔴 Hapus dari penyimpanan
            await removePhotoFromSave(story.id);
            img.src = "images/save.png";
            img.alt = "Simpan cerita";
            btn.setAttribute("aria-label", `Simpan cerita ${story.name}`);
          } else {
            // ✅ Simpan ke penyimpanan
            await savePhotoToSavedPhotos(story);
            img.src = "images/save-full.png";
            img.alt = "Cerita telah disimpan";
            btn.setAttribute(
              "aria-label",
              `Cerita ${story.name} telah disimpan`
            );
          }
        } catch (error) {
          console.error("Gagal menyimpan/menghapus cerita:", error);
          alert("Terjadi kesalahan. Silakan coba lagi.");
        }
      });
    });
  }

  truncateText(text, maxLength) {
    return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
  }
}
