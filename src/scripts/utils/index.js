/**
 * Ubah format tanggal menjadi format yang mudah dibaca
 * @param {string} date - Tanggal yang akan diformat
 * @returns {string} Tanggal dengan format yang lebih ramah (contoh: "Monday, January 1, 2023")
 */
export function showFormattedDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", options);
}

/**
 * Terapkan animasi transisi halaman
 * @param {Function} updateCallback - Fungsi untuk mengganti konten
 * @param {string} animationType - Jenis animasi yang digunakan ('fade', 'slide', 'zoom')
 */
export async function applyPageTransition(updateCallback, animationType = "fade") {
  if (document.startViewTransition) {
    try {
      document.documentElement.dataset.transitionType = animationType;
      const transition = document.startViewTransition(() => {
        updateCallback();
      });
      await transition.finished;
      delete document.documentElement.dataset.transitionType;
    } catch (err) {
      console.error("Error during view transition:", err);
      updateCallback();
    }
  } else {
    updateCallback();
  }
}

/**
 * Tambahkan animasi pada elemen HTML
 * @param {HTMLElement} element - Elemen target
 * @param {string} animationClass - Nama kelas animasi CSS
 * @param {number} duration - Durasi animasi (milidetik)
 */
export function animateElement(element, animationClass, duration = 500) {
  if (!element) return;
  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
}

/**
 * Fungsi delay/sleep berbasis Promise
 * @param {number} time - Waktu tunda dalam milidetik
 * @returns {Promise<void>} Promise yang selesai setelah waktu habis
 */
export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function convertBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}