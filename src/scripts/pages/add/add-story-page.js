import AddStoryPresenter from "./add-story-presenter";
import * as DicodingAPI from "../../data/api";

export default class AddStoryPage {
  #presenter = null;
  #map = null;
  #marker = null;
  #selectedLocation = null;
  #mediaStream = null;
  #locationWatchId = null;

  async render() {
    return `
      <section class="container" aria-labelledby="add-story-heading">
        <div class="form-container">
          <h2 id="add-story-heading" class="form-title">Tambah Cerita Baru</h2>

          <div role="alert" aria-live="assertive" id="alert-container"></div>

          <form id="add-story-form" aria-describedby="form-description">
            <p id="form-description" class="sr-only">
              Isi formulir di bawah ini untuk membuat cerita baru dengan foto dan data lokasi opsional.
            </p>

            <div class="photo-options">
              <div class="option-tabs" role="tablist">
                <button type="button" id="camera-tab-btn" class="option-tab active" data-tab="camera" role="tab" aria-selected="true" aria-controls="camera-tab">
                  Ambil Foto
                </button>
                <button type="button" id="gallery-tab-btn" class="option-tab" data-tab="gallery" role="tab" aria-selected="false" aria-controls="gallery-tab">
                  Dari Galeri
                </button>
              </div>

              <div id="camera-tab" class="form-group tab-content" role="tabpanel" aria-labelledby="camera-tab-btn">
                <label for="camera-stream">Ambil Foto</label>
                <div class="camera-container">
                  <div class="camera-preview-wrapper">
                    <div id="camera-preview" class="camera-preview">
                      <video id="camera-stream" autoplay playsinline aria-label="Camera preview"></video>
                      <canvas id="camera-canvas" style="display:none;" aria-hidden="true"></canvas>
                      <img id="captured-image" class="captured-image" style="display:none;" alt="Your captured photo for the story" aria-live="polite" />
                    </div>
                  </div>
                  <div class="camera-controls">
                    <button type="button" id="btn-start-camera" class="camera-btn">Buka Kamera</button>
                    <button type="button" id="btn-capture" class="camera-btn" disabled>Ambil Gambar</button>
                    <button type="button" id="btn-retake" class="camera-btn" style="display:none;">Ulangi</button>
                  </div>
                </div>
              </div>

              <div id="gallery-tab" class="form-group tab-content" style="display:none;" role="tabpanel" aria-labelledby="gallery-tab-btn">
                <label for="file-upload">Unggah Foto</label>
                <div class="file-upload-container">
                  <input id="file-upload" type="file" accept="image/*" class="file-input" aria-describedby="file-upload-help" />
                  <label for="file-upload" class="file-upload-label">
                    <span class="file-upload-icon" aria-hidden="true">📁</span>
                    <span class="file-upload-text">Pilih File atau Seret Disini</span>
                  </label>
                  <p id="file-upload-help" class="sr-only">Accepted file types: JPG, PNG, GIF. Maximum file size: 5 MB.</p>
                  <div class="file-preview-container" style="display: none;">
                    <img id="file-preview" class="file-preview-image" alt="Your uploaded photo for the story" />
                    <button type="button" id="btn-remove-file" class="camera-btn">Hapus</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label id="location-label">Lokasi</label>
              <div class="location-actions">
                <button type="button" id="get-current-location" class="btn" aria-describedby="location-help">
                  <i class="fas fa-location-arrow" aria-hidden="true"></i> Gunakan Lokasi Saya Saat Ini
                </button>
                <p id="location-help" class="sr-only">Menambahkan koordinat geografis Anda saat ini ke cerita</p>
                <div id="location-status" role="status" aria-live="polite"></div>
              </div>
              <div class="map-container" id="location-map-container" aria-label="Interactive map to select location">
                <div id="map"></div>
              </div>
              <p id="selected-location-text" aria-live="polite">Tidak ada lokasi yang dipilih. Klik pada peta untuk memilih lokasi atau gunakan lokasi Anda saat ini.</p>
            </div>

            <div class="form-group" data-length="0/500">
              <label for="description">Deskripsi Cerita</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                class="form-control"
                required
                placeholder="Bagikan kisah menakjubkan Anda kepada kami..."
                aria-required="true"
                maxlength="500"></textarea>
            </div>

            <button class="btn btn-submit" type="submit" id="submit-button">
              <i class="fas fa-paper-plane"></i>
              Bagikan Cerita
            </button>
          </form>
        </div>
      </section>
    `;
  }


  async afterRender() {
    // Menambahkan styling aksesibilitas hanya jika belum ada
    this.addAccessibilityStyles();

    // Inisialisasi presenter dengan mengirimkan referensi view dan model
    this.#presenter = new AddStoryPresenter({
      view: this,
      model: DicodingAPI,
    });

    // Cek autentikasi sebelum melanjutkan
    const isLoggedIn = this.#presenter.checkAuth();
    if (!isLoggedIn) return;

    // Inisialisasi fitur halaman
    this.initCamera();
    this.initFileUpload();
    this.initTabSwitching();
    this.initMap();
    this.initLocationFeatures();
    this.setupForm();
  }

  showLoginRequired() {
    const alertContainer = document.getElementById("alert-container");
    alertContainer.innerHTML = `
      <div class="alert alert-error">
        <p>Kamu harus login untuk membuat cerita. <a href="#/login">Login disini</a> atau <a href="#/register">Daftar</a></p>
      </div>
    `;
  }

  showSuccess(message) {
    const alertContainer = document.getElementById("alert-container");
    alertContainer.innerHTML = `
      <div class="alert alert-success">
        <p>${message}</p>
      </div>
    `;
  }

  showError(message) {
    const alertContainer = document.getElementById("alert-container");
    alertContainer.innerHTML = `
      <div class="alert alert-error">
        <p>${message}</p>
      </div>
    `;
  }

  setLoading(isLoading) {
    const button = document.getElementById("submit-button");
    button.disabled = isLoading;
    button.textContent = isLoading ? "Mengirimkan..." : "Cerita Dibuat";
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

  initTabSwitching() {
    const tabs = document.querySelectorAll(".option-tab");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });

        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        contents.forEach((content) => {
          content.style.display = "none";
          content.setAttribute("aria-hidden", "true");
        });

        const target = document.getElementById(`${tab.dataset.tab}-tab`);
        target.style.display = "block";
        target.setAttribute("aria-hidden", "false");

        if (tab.dataset.tab === "camera") {
          this.stopCameraStream();
          document.getElementById("btn-start-camera").disabled = false;
          document.getElementById("btn-capture").disabled = true;
        }
      });
    });
  }

  initCamera() {
    const btnStart = document.getElementById("btn-start-camera");
    const btnCapture = document.getElementById("btn-capture");
    const btnRetake = document.getElementById("btn-retake");
    const video = document.getElementById("camera-stream");
    const canvas = document.getElementById("camera-canvas");
    const image = document.getElementById("captured-image");

    btnStart.addEventListener("click", async () => {
      try {
        this.#mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        video.srcObject = this.#mediaStream;
        video.style.display = "block";
        image.style.display = "none";

        btnStart.disabled = true;
        btnCapture.disabled = false;
        btnRetake.style.display = "none";
      } catch (err) {
        console.error("Camera access error:", err);
        this.showError("Gagal mengakses kamera. Harap periksa pengaturan izin Anda.");
      }
    });

    btnCapture.addEventListener("click", () => {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL("image/jpeg");
      image.src = photoData;
      image.style.display = "block";
      video.style.display = "none";

      this.stopCameraStream();

      btnCapture.disabled = true;
      btnRetake.style.display = "inline-block";
      btnStart.disabled = false;
    });

    btnRetake.addEventListener("click", () => {
      image.src = "";
      image.style.display = "none";

      btnRetake.style.display = "none";
      btnStart.disabled = false;
      btnCapture.disabled = true;
    });
  }

  initFileUpload() {
    const input = document.getElementById("file-upload");
    const previewImg = document.getElementById("file-preview");
    const previewBox = document.querySelector(".file-preview-container");
    const btnRemove = document.getElementById("btn-remove-file");
    const labelUpload = document.querySelector(".file-upload-label");
    const dropZone = document.querySelector(".file-upload-container");

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          previewImg.src = evt.target.result;
          previewBox.style.display = "block";
          labelUpload.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach((evtName) => {
      dropZone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ["dragenter", "dragover"].forEach((evtName) => {
      dropZone.addEventListener(evtName, () => {
        dropZone.classList.add("highlight");
      });
    });

    ["dragleave", "drop"].forEach((evtName) => {
      dropZone.addEventListener(evtName, () => {
        dropZone.classList.remove("highlight");
      });
    });

    dropZone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        input.files = e.dataTransfer.files;
        const reader = new FileReader();
        reader.onload = (evt) => {
          previewImg.src = evt.target.result;
          previewBox.style.display = "block";
          labelUpload.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

    btnRemove.addEventListener("click", () => {
      input.value = "";
      previewImg.src = "";
      previewBox.style.display = "none";
      labelUpload.style.display = "flex";
    });
  }

  stopCameraStream() {
    if (this.#mediaStream) {
      const tracks = this.#mediaStream.getTracks();
      tracks.forEach((track) => track.stop());
      this.#mediaStream = null;
    }
  }
  
  async initMap() {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    document.head.appendChild(script);

    script.onload = () => {
      this.#map = L.map("map").setView([-0.7893, 113.9213], 5);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.#map);

      this.#map.on("click", (e) => {
        this.updateSelectedLocation(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        this.#map.invalidateSize();
      }, 100);
    };
  }

  initLocationFeatures() {
    const getCurrentLocationBtn = document.getElementById(
      "get-current-location"
    );
    const locationStatus = document.getElementById("location-status");

    getCurrentLocationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        locationStatus.innerHTML = `
          <div class="alert alert-error">
            <p><i class="fas fa-exclamation-triangle"></i> Geolokasi tidak didukung oleh browser Anda</p>
          </div>
        `;
        return;
      }

      locationStatus.innerHTML = `
        <div class="location-loading">
          <span class="loader-small"></span> Getting your location...
        </div>
      `;
      getCurrentLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Update the selected location and map marker
          this.updateSelectedLocation(latitude, longitude);

          // Center and zoom the map to the user's location
          this.#map.setView([latitude, longitude], 15);

          locationStatus.innerHTML = `
            <div class="alert alert-success">
              <p><i class="fas fa-check-circle"></i> Lokasi berhasil diperoleh!</p>
            </div>
          `;
          getCurrentLocationBtn.disabled = false;

          // Clear the success message after a few seconds
          setTimeout(() => {
            locationStatus.innerHTML = "";
          }, 3000);
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please allow access to your location.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Request to get location timed out.";
              break;
            default:
              errorMessage = "An unknown error occurred getting your location.";
          }

          locationStatus.innerHTML = `
            <div class="alert alert-error">
              <p><i class="fas fa-exclamation-triangle"></i> ${errorMessage}</p>
            </div>
          `;
          getCurrentLocationBtn.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  updateSelectedLocation(lat, lng) {
    this.#selectedLocation = {
      lat: lat,
      lon: lng,
    };

    document.getElementById("selected-location-text").innerHTML = `
      <span>Selected location: <strong>${lat.toFixed(6)}, ${lng.toFixed(
      6
    )}</strong></span>
      <button type="button" id="clear-location" class="btn-small">
        <i class="fas fa-times"></i> Clear
      </button>
    `;

    // Add event listener to the clear button
    document.getElementById("clear-location").addEventListener("click", (e) => {
      e.preventDefault();
      this.clearLocation();
    });

    if (this.#marker) {
      this.#marker.setLatLng([lat, lng]);
    } else {
      // Create a custom marker with a bouncing animation
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `<div class="marker-pin animate-bounce" style="background-color: var(--accent-color); position: relative; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.3);"><i class="fas fa-map-marker-alt" style="color: white;"></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      });
      this.#marker = L.marker([lat, lng], { icon: customIcon }).addTo(
        this.#map
      );
    }
  }

  clearLocation() {
    if (this.#marker) {
      this.#map.removeLayer(this.#marker);
      this.#marker = null;
    }
    this.#selectedLocation = null;
    document.getElementById("selected-location-text").textContent =
      "Tidak ada lokasi yang dipilih. Klik pada peta untuk memilih lokasi atau gunakan lokasi Anda saat ini.";
  }

  setupForm() {
    const form = document.getElementById("add-story-form");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const description = document.getElementById("description").value;
      const capturedImage = document.getElementById("captured-image");
      const fileInput = document.getElementById("file-upload");

      const activeTab = document
        .querySelector(".option-tab.active")
        .getAttribute("data-tab");
      let imageFile = null;

      if (activeTab === "camera") {
        if (!capturedImage.src || capturedImage.style.display === "none") {
          this.showError("Silakan ambil foto menggunakan kamera.");
          return;
        }

        const imageBlob = await fetch(capturedImage.src).then((r) => r.blob());
        imageFile = new File([imageBlob], "story-image.jpg", {
          type: "image/jpeg",
        });
      } else {
        if (!fileInput.files || fileInput.files.length === 0) {
          this.showError("Silakan pilih gambar dari galeri.");
          return;
        }

        imageFile = fileInput.files[0];
      }

      // Validate form data using presenter
      if (!this.#presenter.validateFormData(description, imageFile)) {
        return;
      }

      // Submit the story using presenter
      const success = await this.#presenter.createStory(
        description,
        imageFile,
        this.#selectedLocation
      );

      if (success) {
        this.stopCameraStream();
      }
    });
  }

  async destroy() {
    this.stopCameraStream();
    // Clear any active location watching
    if (this.#locationWatchId) {
      navigator.geolocation.clearWatch(this.#locationWatchId);
    }
  }
}
