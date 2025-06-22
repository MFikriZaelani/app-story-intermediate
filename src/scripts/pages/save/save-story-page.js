// pages/save/save-page.js
import SavePresenter from "./save-story-presenter.js";
import {
  isOnline,
  removePhotoFromSave,
  getAllSavedPhotos,
} from "../../utils/db-storage.js";

export default class SavePage {
  #presenter = null;
  #savedPhotos = [];

  constructor() {
    this.#presenter = new SavePresenter({
      view: this,
    });
  }

  async render() {
    return `
      <section class="creepy-container" id="main-content" tabindex="-1">
        <div class="header">
          <a href="#/" class="back-btn">← Back to Home</a>
          <p class="warning-text">Your Saved Photos</p>
        </div>

        <h1 class="creepy-title">SAVED PHOTOS</h1>

        <div id="connection-status"></div>
        <div id="gallery" class="gallery">
          <div class="loading-indicator">Loading saved photos...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Setup connection status indicator
    this.updateConnectionStatus();

    // Add online/offline event listeners
    window.addEventListener("online", () => {
      this.updateConnectionStatus();
    });

    window.addEventListener("offline", () => {
      this.updateConnectionStatus();
    });

    // Load saved photos
    await this.#presenter.loadSavedPhotos();

    // Add click handlers for photos and save icons
    this.setupPhotoClickHandlers();
  }

  updateConnectionStatus() {
    const statusElement = document.getElementById("connection-status");
    if (!statusElement) return;

    if (isOnline()) {
      statusElement.innerHTML = ""; // Clear if online
    } else {
      statusElement.innerHTML = `
        <div class="bg-yellow-300 text-gray-800 text-center p-2 rounded-md my-3">
         ⚠️ You're not connected to the internet. Using saved data only.
        </div>
      `;
    }
  }

  setupPhotoClickHandlers() {
    const gallery = document.getElementById("gallery");
    if (gallery) {
      // Photo container click handler for navigation
      gallery.addEventListener("click", (e) => {
        const photoLink = e.target.closest(".photo-container");
        if (!photoLink) return;

        e.preventDefault();

        const href = photoLink.getAttribute("href");

        // Handle transition
        if (document.startViewTransition) {
          document.startViewTransition(() => {
            window.location.hash = href;
          });
        } else {
          window.location.hash = href;
        }
      });

      // Save icon click handler to remove from saved
      gallery.addEventListener("click", async (e) => {
        const saveIcon = e.target.closest(".save-icon");
        if (!saveIcon) return;

        e.preventDefault();
        e.stopPropagation();

        const photoId = saveIcon.dataset.id;
        const photoItem = saveIcon.closest(".photo-item");

        // Animasi keluar sebelum dihapus
        if (photoItem) {
          photoItem.classList.add("fade-out");

          // Tunggu animasi selesai
          setTimeout(async () => {
            await removePhotoFromSave(photoId);
            await this.#presenter.loadSavedPhotos();
          }, 300);
        } else {
          // Fallback
          await removePhotoFromSave(photoId);
          await this.#presenter.loadSavedPhotos();
        }
      });
    }
  }

  showLoading() {
    const gallery = document.getElementById("gallery");
    if (gallery) {
      gallery.innerHTML =
        '<div class="loading-indicator">Loading saved photos...</div>';
    }
  }

  hideLoading() {
    const loadingIndicator = document.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }

  populateGallery(photos) {
    this.#savedPhotos = photos;
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    if (!photos || photos.length === 0) {
      this.showEmptyState();
      return;
    }

    const photosHtml = photos
      .map((photo, i) => {
        const truncatedDesc =
          photo.description.length > 100
            ? photo.description.substring(0, 100) + "..."
            : photo.description;

        const createdDate = new Date(photo.createdAt);
        const formattedDate = createdDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `
        <div class="photo-item">
          <a href="#/details-photo/${photo.id}" class="photo-container">
            <img src="${photo.photoUrl}" alt="image-${i + 1}" />
          </a>
          <div class="photo-info">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h3 class="photo-name">${photo.name}</h3>
                <p class="photo-description">${truncatedDesc}</p>
              </div>
              <div style="margin-left: 10px;">
                <img src="images/save-full.png" 
                     class="save-icon icon-save" 
                     data-id="${photo.id}" 
                     style="width: 40px; cursor: pointer;" 
                     alt="Hapus dari favorit" 
                     title="Hapus dari favorit" />
              </div>
            </div>
            <div class="photo-date" style="margin-top: 8px;">${formattedDate}</div>
          </div>
        </div>
        `;
      })
      .join("");

    gallery.innerHTML = photosHtml;
  }

  showEmptyState() {
    const gallery = document.getElementById("gallery");
    if (gallery) {
      gallery.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">You haven't saved any photos yet</p>
          <a href="#/" class="return-home-btn">Explore Photos</a>
        </div>
      `;
    }
  }

  showError(message) {
    const gallery = document.getElementById("gallery");
    if (gallery) {
      gallery.innerHTML = `
        <div class="error-container">
          <p class="error-message">${message}</p>
          <button id="retry-button" class="retry-button">Retry</button>
        </div>
      `;

      // Add retry functionality
      document.getElementById("retry-button")?.addEventListener("click", () => {
        this.#presenter.loadSavedPhotos();
      });
    }
  }
}
