import RegisterPresenter from "./register-presenter";
import * as DicodingAPI from "../../data/api";

export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="container">
        <div class="auth-container">
          <h2 class="form-title">Daftar App Story</h2>

          <div id="alert-container"></div>

          <form id="register-form">
            <div class="form-group">
              <label for="name">Nama</label>
              <input
                type="text"
                id="name"
                name="name"
                class="form-control"
                required
                autocomplete="name"
                placeholder="Masukkan Nama Anda"
              />
            </div>

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
                autocomplete="new-password"
                placeholder="Masukkan Password Anda (minimal 8 karakter)"
                minlength="8"
              />
            </div>

            <button type="submit" id="register-button" class="btn btn-full">
              Daftar
            </button>
          </form>

          <div class="form-footer">
            <p>
              Sudah Punya Akun?
              <a href="#/login">Login</a>
            </p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({ view: this, model: DicodingAPI });
    this.attachFormListener();
  }

  attachFormListener() {
    const form = document.getElementById("register-form");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nameField = document.getElementById("name");
      const emailField = document.getElementById("email");
      const passwordField = document.getElementById("password");

      const name = nameField.value;
      const email = emailField.value;
      const password = passwordField.value;

      await this.#presenter.register(name, email, password);
    });
  }

  setLoading(isLoading) {
    const button = document.getElementById("register-button");
    button.disabled = isLoading;
    button.textContent = isLoading ? "Registering..." : "Register";
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
