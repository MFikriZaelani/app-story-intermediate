import { saveAuth } from "../../utils/auth-service";
import * as DicodingAPI from "../../data/api";

export default class LoginPresenter {
  #view;
  #model;

  constructor({ view, model = DicodingAPI }) {
    this.#view = view;
    this.#model = model;
  }

  async login(email, password) {
    try {
      this.#view.setLoading(true);

      const result = await this.#model.login({ email, password });

      if (result.error) {
        throw new Error(result.message);
      }

      saveAuth(result);
      window.dispatchEvent(new CustomEvent("auth-changed"));

      this.#view.showSuccess("Login berhasil. Mengalihkan ke beranda...");

      setTimeout(() => {
        window.location.hash = "#/";
      }, 1500);

      return true;
    } catch (err) {
      console.error("Login error:", err);
      this.#view.showError(err.message || "Login Gagal. Tolong ulangi lagi.");
      return false;
    } finally {
      this.#view.setLoading(false);
    }
  }
}
