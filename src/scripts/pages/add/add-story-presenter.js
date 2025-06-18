import { getToken } from "../../utils/auth-service";
import * as DicodingAPI from "../../data/api";

export default class AddStoryPresenter {
  #view;
  #model;

  constructor({ view, model = DicodingAPI }) {
    this.#view = view;
    this.#model = model;
  }

  checkAuth() {
    const token = getToken();
    if (!token) {
      this.#view.showLoginRequired();
      return false;
    }
    return true;
  }

  async createStory(description, photo, location) {
    const token = getToken();
    if (!token) {
      this.#view.showLoginRequired();
      return false;
    }

    try {
      this.#view.setLoading(true);

      const response = await this.#model.addStory({
        description,
        photo,
        lat: location?.lat,
        lon: location?.lon,
        token,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      this.#view.showSuccess(
        "Cerita berhasil dibuat! Mengalihkan ke beranda..."
      );

      setTimeout(() => {
        window.location.hash = "#/";
      }, 2000);

      return true;
    } catch (err) {
      console.error("createStory error:", err);
      this.#view.showError(
        err.message || "Gagal membuat cerita. Silakan coba lagi."
      );
      return false;
    } finally {
      this.#view.setLoading(false);
    }
  }

  validateFormData(description, imageFile) {
    if (!imageFile) {
      this.#view.showError("Silakan ambil foto atau unggah gambar.");
      return false;
    }

    if (!description.trim()) {
      this.#view.showError("Silakan masukkan deskripsi cerita.");
      return false;
    }

    return true;
  }
}
