//src/scripts/utils/notification-helper.js
import config from "../config";
import { convertBase64ToUint8Array } from "./index";
import { subscribeNotification, unsubscribeNotification } from "../data/api";

const NOTIFICATION_SUBSCRIPTION_KEY = "app-story-notification-subscription";

export function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "denied") {
      showFloatingMessage("🚫 Notifikasi ditolak oleh pengguna.", "error");
    } else if (permission === "default") {
      showFloatingMessage(
        "⚠️ Permintaan notifikasi ditutup tanpa aksi.",
        "warning"
      );
    } else if (permission === "granted") {
      showFloatingMessage("✅ Notifikasi berhasil diaktifkan!", "success");
    }

    return { error: false, permission };
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    showFloatingMessage("❗ Gagal meminta izin notifikasi.", "error");
    return {
      error: true,
      message: "Failed to request notification permission",
    };
  }
}

export function showFloatingMessage(message, type = "default") {
  const popup = document.createElement("div");
  popup.textContent = message;

  let bgColor = "bg-gray";
  if (type === "error") bgColor = "bg-red";
  if (type === "success") bgColor = "bg-green";
  if (type === "warning") bgColor = "bg-yellow";

  popup.className = `popup-notif ${bgColor}`;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.classList.add("opacity-0");
    setTimeout(() => popup.remove(), 300);
  }, 4000);
}

export function saveSubscriptionToStorage(subscription) {
  if (!subscription) return;

  try {
    localStorage.setItem(
      NOTIFICATION_SUBSCRIPTION_KEY,
      JSON.stringify({
        isSubscribed: true,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Error saving subscription to storage:", error);
  }
}

export function removeSubscriptionFromStorage() {
  try {
    localStorage.removeItem(NOTIFICATION_SUBSCRIPTION_KEY);
  } catch (error) {
    console.error("Error removing subscription from storage:", error);
  }
}

export function getSubscriptionFromStorage() {
  try {
    const storedData = localStorage.getItem(NOTIFICATION_SUBSCRIPTION_KEY);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error("Error getting subscription from storage:", error);
    return null;
  }
}

export function isUserSubscribed() {
  const subscription = getSubscriptionFromStorage();
  return subscription && subscription.isSubscribed;
}

export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) {
    return {
      error: true,
      message: "Service Worker not supported in this browser",
    };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return { error: false, registration };
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return { error: true, message: "Failed to register service worker" };
  }
}

export async function subscribeUserToPushNotifications() {
  try {
    const permissionResult = await requestNotificationPermission();

    if (permissionResult.error || permissionResult.permission !== "granted") {
      return {
        error: true,
        message: "Permission denied for notifications",
      };
    }

    const swRegResult = await registerServiceWorker();

    if (swRegResult.error) {
      return swRegResult;
    }

    const registration = swRegResult.registration;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertBase64ToUint8Array(
          config.VAPID_PUBLIC_KEY
        ),
      });
    }

    const response = await subscribeNotification(subscription);
    if (response.error) {
      return {
        error: true,
        message:
          response.message || "Failed to subscribe to push notifications",
      };
    }

    saveSubscriptionToStorage(subscription);

    return { error: false, subscription };
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return {
      error: true,
      message: "Failed to subscribe to push notifications",
    };
  }
}

export async function unsubscribeUserFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      removeSubscriptionFromStorage();
      return { error: false, message: "No subscription found to unsubscribe" };
    }

    const response = await unsubscribeNotification({
      endpoint: subscription.endpoint,
    });

    await subscription.unsubscribe();

    removeSubscriptionFromStorage();

    return {
      error: false,
      message: "Successfully unsubscribed from push notifications",
    };
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return {
      error: true,
      message: "Failed to unsubscribe from push notifications",
    };
  }
}

export function initNotificationButton() {
  const notificationContainer = document.getElementById("notificationBtn");

  if (!notificationContainer) return;

  if (isPushNotificationSupported()) {
    notificationContainer.style.display = "block";

    updateNotificationButtonState();

    notificationContainer.addEventListener("click", async () => {
      if (isUserSubscribed()) {
        const result = await unsubscribeUserFromPushNotifications();
        if (!result.error) {
          notificationContainer.textContent = "Notif Off";
          notificationContainer.classList.remove("notification-active");
          notificationContainer.classList.add("notification-inactive");
        }
      } else {
        const result = await subscribeUserToPushNotifications();
        if (!result.error) {
          notificationContainer.textContent = "Notif On";
          notificationContainer.classList.remove("notification-inactive");
          notificationContainer.classList.add("notification-active");
        }
      }
    });
  }
}

export function updateNotificationButtonState() {
  const notificationContainer = document.getElementById("notificationBtn");

  if (!notificationContainer) return;

  if (isUserSubscribed()) {
    notificationContainer.textContent = "Notif On";
    notificationContainer.classList.remove("notification-inactive");
    notificationContainer.classList.add("notification-active");
  } else {
    notificationContainer.textContent = "Notif Off";
    notificationContainer.classList.remove("notification-active");
    notificationContainer.classList.add("notification-inactive");
  }
}

export function showNotification(title, options = {}) {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    });
  }
}

class NotificationHelper {
  static async initButton() {
    const notificationBtn = document.getElementById("notificationBtn");

    if (!notificationBtn) return;

    this.updateButtonState(notificationBtn);

    notificationBtn.addEventListener("click", async () => {
      try {
        const result = isUserSubscribed()
          ? await unsubscribeUserFromPushNotifications()
          : await subscribeUserToPushNotifications();

        this.updateButtonState(notificationBtn);

        if (!result.error) {
          showFloatingMessage(
            result.message || "Sukses memperbarui notifikasi",
            "success"
          );
        } else {
          showFloatingMessage(
            result.message || "Gagal memperbarui notifikasi",
            "error"
          );
        }
      } catch (error) {
        console.error("Gagal memproses notifikasi:", error);
        showFloatingMessage("Terjadi kesalahan pada notifikasi", "error");
      }
    });
  }

  static updateButtonState(button) {
    if (!button) return;

    const permission = Notification.permission;
    const textSpan = button.querySelector(".notification-text");

    if (!textSpan) {
      console.error("Notification text element not found");
      return;
    }

    if (permission === "granted" && isUserSubscribed()) {
      button.classList.add("active");
      textSpan.textContent = "Notifikasi Aktif";
    } else {
      button.classList.remove("active");
      textSpan.textContent = "Aktifkan Notifikasi";
    }
  }
}

export default NotificationHelper;
