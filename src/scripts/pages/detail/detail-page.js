import { showFormattedDate } from "../../utils";
import DetailPresenter from "./detail-presenter.js";
import * as DicodingAPI from "../../data/api.js";
import config from "../../config";

export default class DetailPage {
  #presenter = null;

  async render() {
    return `
      <section class="container" aria-labelledby="story-title">
        <div id="story-detail-container">
          <div class="loader-container" role="status" aria-live="polite">
            <div class="loader"></div>
            <span class="sr-only">Loading story details...</span>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender(params) {
    this.#presenter = new DetailPresenter({ view: this, storyId: params?.id });
    await this.#presenter.loadStoryDetail();
  }

  showMissingIdError() {
    const container = document.getElementById("story-detail-container");
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        <p>Story ID hilang. <a href="#/">kembali ke beranda</a></p>
      </div>
    `;
  }

  showLoginRequired() {
    const container = document.getElementById("story-detail-container");
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        <p>kamu harus login untuk melihat detail cerita. <a href="#/login">Login disini</a> or <a href="#/register">Register</a></p>
      </div>
    `;
  }

  showError(message) {
    const container = document.getElementById("story-detail-container");
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        <p>${
          message || "Failed to load story details. Please try again later."
        }</p>
      </div>
    `;
  }

  displayStoryDetail(story) {
    const container = document.getElementById("story-detail-container");

    // Aman terhadap nilai createdAt yang kosong atau tidak valid
    let dateTimeMarkup = `<time>Tanggal tidak diketahui</time>`;
    if (story.createdAt) {
      const dateObj = new Date(story.createdAt);
      if (!isNaN(dateObj)) {
        const formatted = showFormattedDate(dateObj);
        dateTimeMarkup = `
        <time datetime="${dateObj.toISOString()}">
          ${formatted}
        </time>`;
      }
    }

    container.innerHTML = `
    <div class="detail-container" style="view-transition-name: story-${
      story.id
    }">
      <a href="#/" class="btn btn-outline" aria-label="Back to story list">← kembali ke beranda</a>

      <article class="detail-content">
        <h1 class="detail-title" id="story-title">Cerita dari ${story.name}</h1>

        <div class="detail-meta">
          ${dateTimeMarkup}
        </div>

        <figure>
          <img
            src="${story.photoUrl}"
            alt="Photo shared by ${story.name}"
            class="detail-image"
          />
          <figcaption class="sr-only">Story photo shared oleh ${
            story.name
          }</figcaption>
        </figure>

        <div class="detail-description">
          <p>${story.description}</p>
        </div>

        ${
          story.lat && story.lon
            ? `
          <div class="map-container" id="map-container">
            <h3 id="map-heading">lokasi cerita</h3>
            <div id="map" role="img" aria-labelledby="map-heading" aria-describedby="map-description"></div>
            <p id="map-description" class="sr-only">
              peta menunjukan dimana lokasi cerita ini dibuat dengan koordinat ${story.lat}, ${story.lon}
            </p>
          </div>
        `
            : ""
        }
      </article>
    </div>
  `;

    this.addAccessibilityStyles();

    if (story.lat && story.lon) {
      this.initMap(story);
    }
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

  async initMap(story) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    document.head.appendChild(script);

    script.onload = () => {
      const map = L.map("map").setView([story.lat, story.lon], 13);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([story.lat, story.lon]).addTo(map);
      marker
        .bindPopup(
          `<b>Cerita dari ${story.name}</b><br>${story.description.slice(
            0,
            50
          )}...`
        )
        .openPopup();

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
  }

  showLoading() {
    const container = document.getElementById("story-detail-container");
    container.innerHTML = `
    <div class="loader-container" role="status" aria-live="polite">
      <div class="loader"></div>
      <span class="sr-only">Loading story details...</span>
    </div>
  `;
  }

  hideLoading() {
    const loader = document.querySelector(".loader-container");
    if (loader) loader.remove();
  }

  renderStory(story) {
    this.displayStoryDetail(story);
  }
  showOfflineAlert() {
    const container = document.getElementById("story-detail-container");
    const alert = document.createElement("div");
    alert.className = "alert alert-warning";
    alert.role = "alert";
    alert.innerHTML = "<p>Kamu sedang offline. Data diambil dari cache.</p>";
    container.prepend(alert);
  }
}
