const CACHE_NAME = "grocery-erp-pos-v1";

// Install Event: Initialize the cache with the homepage
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/"]);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches if we update the app
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-First Strategy with Dynamic Fallback
self.addEventListener("fetch", (event) => {
  // We ONLY want to cache UI assets (HTML, CSS, JS, Images)
  if (event.request.method !== "GET") return;
  
  // We NEVER cache backend API calls here (we use IndexedDB for that)
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the network call succeeds, dynamically save a clone to the cache!
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // MAGIC: If the network fails (Offline), serve the file from the Cache!
        return caches.match(event.request);
      })
  );
});