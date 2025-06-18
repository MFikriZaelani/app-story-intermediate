//src/scripts/pages/app.js
import routes from "../routes/routes";
import { getActiveRoute, parseActivePathname } from "../routes/url-parser.js";
import { getAuth, isAuthenticated } from "../utils/auth-service.js";
import { applyPageTransition } from "../utils/index.js";
import NotificationHelper from "../utils/notification-helper.js";
import SwRegister from "../utils/sw-register.js";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #authButton = null;
  #currentPage = null;
  #currentPageInstance = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#authButton = document.querySelector("#auth-button");

    this.#setupDrawerEvents();
    this.#configureAuth();
  }

  async init() {
    try {
      // Inisialisasi notifikasi
      await NotificationHelper.initButton();
      console.log("Initializing app...");
      await SwRegister.init();
      console.log("Service Worker initialization complete");
    } catch (error) {
      console.error("Failed to initialize service worker:", error);
    }
  }

  #setupDrawerEvents() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (e) => {
      if (
        !this.#navigationDrawer.contains(e.target) &&
        !this.#drawerButton.contains(e.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(e.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #configureAuth() {
    this.#refreshAuthButton();
    window.addEventListener("auth-changed", () => this.#refreshAuthButton());
  }

  #refreshAuthButton() {
    if (isAuthenticated()) {
      const { loginResult } = getAuth();
      this.#authButton.textContent = `Logout (${loginResult.name})`;
      this.#authButton.href = "#/";
      this.#authButton.addEventListener("click", this.#logoutHandler);
    } else {
      this.#authButton.textContent = "Login";
      this.#authButton.href = "#/login";
      this.#authButton.removeEventListener("click", this.#logoutHandler);
    }
  }

  #logoutHandler = (e) => {
    e.preventDefault();
    localStorage.removeItem("app_story_auth");
    window.dispatchEvent(new CustomEvent("auth-changed"));
    window.location.hash = "#/";
  };

  #getAnimationType(newUrl) {
    if (!this.#currentPage) return "fade";

    const categories = {
      home: ["/"],
      auth: ["/login", "/register"],
      content: ["/detail", "/add"],
      info: ["/about", "/map"],
    };

    const resolveCategory = (url) => {
      for (const [key, paths] of Object.entries(categories)) {
        if (paths.some((p) => url.startsWith(p))) return key;
      }
      return "other";
    };

    const current = resolveCategory(this.#currentPage);
    const next = resolveCategory(newUrl);

    if (current === next) return "fade";
    if (current === "auth" && next === "home") return "zoom";
    if (next === "content") return "slide";
    return "fade";
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];
    const params = parseActivePathname();

    if (!page) {
      this.#content.innerHTML = `<div class="container"><h2>Page Not Found</h2></div>`;
      return;
    }

    try {
      if (this.#currentPageInstance?.destroy instanceof Function) {
        await this.#currentPageInstance.destroy();
      }

      const animation = this.#getAnimationType(url);

      await applyPageTransition(async () => {
        this.#content.innerHTML = await page.render(params);
        await page.afterRender(params);
      }, animation);

      this.#currentPage = url;
      this.#currentPageInstance = page;
    } catch (err) {
      console.error("Error rendering page:", err);
      this.#content.innerHTML = `
        <div class="container">
          <div class="alert alert-error">
            <p>Failed to load page content. Please try again later.</p>
          </div>
        </div>
      `;
    }
  }
}

export default App;
