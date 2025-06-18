import { getAccessToken } from "../utils/auth-service.js";
import config from "../config";
import {
  saveStories,
  getStoriesFromCache,
  isOnline,
  saveStoryDetail,
  getStoryDetailFromCache,
} from "../utils/db-storage.js";
import { showNotification } from "../utils/notification-helper.js";

const ENDPOINTS = {
  REGISTER: `${config.BASE_URL}/register`,
  LOGIN: `${config.BASE_URL}/login`,
  STORIES: `${config.BASE_URL}/stories`,
  GUEST_STORIES: `${config.BASE_URL}/stories/guest`,
  STORY_DETAIL: (id) => `${config.BASE_URL}/stories/${id}`,
  SUBSCRIBE: `${config.BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${config.BASE_URL}/notifications/unsubscribe`,
};

// Ambil token dari localStorage
function getAuthToken() {
  const auth = localStorage.getItem("app_story_auth");
  if (auth) {
    try {
      const authData = JSON.parse(auth);
      return authData.loginResult?.token;
    } catch (error) {
      console.error("Error parsing auth data:", error);
      return null;
    }
  }
  return null;
}

// API REGISTER
export async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return await response.json();
}

// API LOGIN
export async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await response.json();
}

// GET STORIES
export async function getStories({ page = 1, size = 10, location = 0 } = {}) {
  try {
    if (isOnline()) {
      const result = await fetchStoriesFromNetwork({ page, size, location });
      console.log("HASIL fetchStoriesFromNetwork:", result); // Tambahkan ini

      return result;
    } else {
      console.log("Offline: retrieving stories from cache");
      const cachedData = await getStoriesFromCache();

      if (cachedData) {
        return { error: false, data: cachedData, fromCache: true };
      } else {
        return {
          error: true,
          data: { message: "You are offline and no cached data is available" },
          fromCache: true,
        };
      }
    }
  } catch (error) {
    console.error("Error in getStories:", error);

    const cachedData = await getStoriesFromCache();
    if (cachedData) {
      return { error: false, data: cachedData, fromCache: true };
    }

    return {
      error: true,
      data: { message: "Network error and no cache available" },
    };
  }
}

// GET STORY DETAIL
export async function getStoryDetail({ id, token }) {
  if (!navigator.onLine) {
    return {
      error: true,
      message: "Kamu sedang offline. Detail cerita tidak tersedia.",
    };
  }

  try {
    const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil detail cerita dari server.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("getStoryDetail error:", error);
    return {
      error: true,
      message: "Terjadi kesalahan saat mengambil detail cerita.",
    };
  }
}

// ADD STORY
export async function addStory({ description, photo, lat, lon, token }) {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat !== undefined) formData.append("lat", lat);
  if (lon !== undefined) formData.append("lon", lon);

  const response = await fetch(ENDPOINTS.STORIES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
}

// ADD GUEST STORY
export async function addGuestStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat !== undefined) formData.append("lat", lat);
  if (lon !== undefined) formData.append("lon", lon);

  const response = await fetch(ENDPOINTS.GUEST_STORIES, {
    method: "POST",
    body: formData,
  });

  return await response.json();
}

// ✅ SUBSCRIBE NOTIFICATION (Sudah Diperbaiki)
export async function subscribeNotification(subscription) {
  try {
    const token = getAuthToken();

    if (!navigator.onLine) {
      console.warn("[Notification] Kamu sedang offline. Subscription dibatalkan.");
      return {
        error: true,
        message: "Offline: tidak dapat mengirim subscription.",
      };
    }

    if (!token) {
      console.warn("[Notification] Token tidak ditemukan.");
      return {
        error: true,
        message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
      };
    }

    if (!subscription || !subscription.endpoint || !subscription.getKey) {
      console.error("[Notification] Subscription tidak valid:", subscription);
      return {
        error: true,
        message: "Data subscription tidak lengkap atau tidak valid.",
      };
    }

    const rawP256dh = subscription.getKey("p256dh");
    const rawAuth = subscription.getKey("auth");

    if (!rawP256dh || !rawAuth) {
      return {
        error: true,
        message: "Gagal mengambil kunci enkripsi dari subscription",
      };
    }

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawP256dh)));
    const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

    const bodyPayload = {
      endpoint: subscription.endpoint,
      keys: { p256dh, auth },
    };

    console.log("[Notification] Mengirim payload:", bodyPayload);

    const response = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: true,
        message: data.message || "Gagal berlangganan notifikasi",
      };
    }

    return { error: false, data };
  } catch (error) {
    console.error("[Notification] Gagal fetch:", error);
    return {
      error: true,
      message: "Terjadi kesalahan jaringan saat mengirim subscription",
    };
  }
}

// ✅ UNSUBSCRIBE NOTIFICATION (Sudah Diperbaiki)
export async function unsubscribeNotification(subscriptionData) {
  try {
    const token = getAuthToken();

    const response = await fetch(ENDPOINTS.UNSUBSCRIBE, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        endpoint: subscriptionData.endpoint,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: true,
        message:
          data.message || "Failed to unsubscribe from push notifications",
      };
    }

    return {
      error: false,
      data: data,
    };
  } catch (error) {
    console.error("Unsubscribe notification error:", error);
    return {
      error: true,
      message: "Network error occurred while unsubscribing from notifications",
    };
  }
}

async function fetchStoriesFromNetwork({ page, size, location }) {
  const token = getAccessToken();
  console.log("Token saat fetch:", token); // DEBUGGING
  const params = new URLSearchParams({
    page,
    size,
    location,
  });

  const response = await fetch(`${ENDPOINTS.STORIES}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseJson = await response.json();

  if (!response.ok) {
    return { error: true, data: responseJson };
  }

  if (responseJson && responseJson.listStory) {
    await saveStories(responseJson);
  }

  return { error: false, data: responseJson };
}