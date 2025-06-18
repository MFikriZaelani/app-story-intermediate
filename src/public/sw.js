// src/sw.js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

if (workbox) {
  console.log("[Workbox] Loaded");

  workbox.precaching.precacheAndRoute([]);

  // Cache stories API responses
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith("/stories"),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "stories-cache",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  self.addEventListener("push", (event) => {
    let notificationData = {};

    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = {
        title: "Story App Notification",
        options: {
          body: event.data ? event.data.text() : "Notifikasi baru",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
        },
      };
    }

    event.waitUntil(
      self.registration.showNotification(
        notificationData.title || "Story App",
        notificationData.options || {
          body: "Ada pembaruan story baru",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
        }
      )
    );
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length === 0) {
            return clients.openWindow("/");
          }
          return clientList[0].focus();
        })
    );
  });
} else {
  console.warn("[Workbox] Not loaded");
}
