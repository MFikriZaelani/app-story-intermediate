// src/scripts/utils/sw-register.js
import config from "../config";
import { subscribeNotification } from "../data/api";

const SwRegister = {
  async init() {
    if (!this._checkServiceWorkerSupport()) {
      console.log("Service Worker tidak didukung browser ini");
      return;
    }

    try {
      await this._registerServiceWorker();
      await this._requestNotificationPermission();
    } catch (error) {
      console.error("Gagal init service worker:", error);
    }
  },

  _checkServiceWorkerSupport() {
    return (
      "serviceWorker" in navigator &&
      "Notification" in window &&
      "PushManager" in window
    );
  },

  async _registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        type: "module",
        scope: "/",
      });

      if (registration.active) {
        await this._subscribePushMessage(registration);
      }

      console.log("Service worker berhasil diregistrasi:", registration);
      return registration;
    } catch (error) {
      throw new Error(`Registrasi service worker gagal: ${error.message}`);
    }
  },

  async _requestNotificationPermission() {
    const result = await Notification.requestPermission();

    if (result === "denied") {
      throw new Error("Notifikasi tidak diizinkan");
    }

    if (result === "default") {
      throw new Error("Pengguna menutup kotak dialog permintaan izin");
    }

    return result;
  },

  async _subscribePushMessage(registration) {
    try {
      const subscribed = await registration.pushManager.getSubscription();
      if (subscribed) {
        console.log("Sudah memiliki subscription:", subscribed);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlB64ToUint8Array(config.VAPID_PUBLIC_KEY),
      });

      console.log(
        "Berhasil melakukan subscribe dengan endpoint:",
        subscription.endpoint
      );
    } catch (error) {
      throw new Error(`Subscribe push message gagal: ${error.message}`);
    }
  },

  _urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  },
};

export default SwRegister;
