import LoginPresenter from "./login-presenter";
import * as DicodingAPI from "../../data/api";

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
      <section class="container">
        <div class="auth-container">
          <h2 class="form-title">Login App Story</h2>

          <div id="alert-container"></div>

          <form id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                class="form-control"
                required
                autocomplete="email"
                placeholder="Masukkan Email Anda"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-control"
                required
                autocomplete="current-password"
                placeholder="Masukkan Password Anda (minimal 8 karakter)"
                minlength="8"
              />
            </div>

            <button type="submit" id="login-button" class="btn btn-full">
              Login
            </button>
          </form>

          <div class="form-footer">
            <p>
              Belum Punya Akun?
              <a href="#/register">Daftar</a>
            </p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({ view: this, model: DicodingAPI });
    this.attachFormListener();
  }

  attachFormListener() {
    const form = document.getElementById("login-form");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailField = document.getElementById("email");
      const passwordField = document.getElementById("password");

      const email = emailField.value;
      const password = passwordField.value;

      await this.#presenter.login(email, password);
    });
  }

  setLoading(isLoading) {
    const button = document.getElementById("login-button");

    button.disabled = isLoading;
    button.textContent = isLoading ? "Logging in..." : "Login";
  }

  showSuccess(message) {
    const alertBox = document.getElementById("alert-container");
    alertBox.innerHTML = `
      <div class="alert alert-success">
        <p>${message}</p>
      </div>
    `;
  }

  showError(message) {
    const alertBox = document.getElementById("alert-container");
    alertBox.innerHTML = `
      <div class="alert alert-error">
        <p>${message}</p>
      </div>
    `;
  }
}
