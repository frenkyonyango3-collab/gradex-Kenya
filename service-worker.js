// GradeX CBE - Progressive Web App Service Worker

const CACHE_NAME = "gradex-cbe-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install and cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

// Activate and remove old GradeX caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("gradex-cbe-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache static app files; don't cache Supabase or payment requests
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Never cache Supabase, authentication, or external requests
  if (
    url.origin !== self.location.origin ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/functions/")
  ) {
    return;
  }

  // Serve cached files first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const responseCopy = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseCopy);
          });
        }

        return networkResponse;
      });
    }).catch(() => {
      return caches.match("./index.html");
    })
  );
});
