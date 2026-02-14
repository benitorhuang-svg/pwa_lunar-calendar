const CACHE_NAME = "lunar-calendar-v1";
const ASSETS = [
    "./",
    "./lunar-calendar.html", // Main entry point
    "./manifest.json",
    "./assets/js/lunar.min.js",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&display=swap",
];

// Install Event
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache");
            return cache.addAll(ASSETS);
        }),
    );
});

// Activate Event (Cleanup old caches)
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("Deleting old cache:", cache);
                        return caches.delete(cache);
                    }
                }),
            );
        }),
    );
});

// Fetch Event (Cache First, Network Fallback)
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        }),
    );
});
