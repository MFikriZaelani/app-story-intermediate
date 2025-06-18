import * as DicodingAPI from "../../data/api";

export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model = DicodingAPI }) {
    this.#view = view;
    this.#model = model;
  }

  async register(name, email, password) {
    try {
      this.#view.setLoading(true);

      const result = await this.#model.register({ name, email, password });

      if (result.error) {
        throw new Error(result.message);
      }

      this.#view.showSuccess("Registrasi berhasil. Silakan login dengan akun baru Anda.");

      setTimeout(() => {
        window.location.hash = "#/login";
      }, 2000);

      return true;
    } catch (err) {
      console.error("register: error:", err);
      this.#view.showError(err.message || "Registrasi gagal. Ulangi lagi.");
      return false;
    } finally {
      this.#view.setLoading(false);
    }
  }
}
