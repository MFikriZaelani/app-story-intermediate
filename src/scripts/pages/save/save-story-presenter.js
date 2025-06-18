import { getAllSavedPhotos, isOnline } from "../../utils/db-storage.js";

export default class SavePresenter {
  #view = null;

  constructor({ view }) {
    this.#view = view;
  }

  async loadSavedPhotos() {
    if (!this.#view) return;

    try {
      this.#view.showLoading();

      if (!isOnline()) {
        console.info("Offline mode: loading saved photos from IndexedDB.");
      }

      const savedPhotos = await getAllSavedPhotos();

      if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
        this.#view.populateGallery(savedPhotos);
      } else {
        this.#view.showEmptyState();
      }
    } catch (error) {
      console.error("Error loading saved photos:", error);
      this.#view.showError(
        "Failed to load saved photos. Please try again later."
      );
    } finally {
      this.#view?.hideLoading();
    }
  }
}
