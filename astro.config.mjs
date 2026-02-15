import AstroPWA from "@vite-pwa/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
    base: "/pwa_lunar-calendar",
    integrations: [
        AstroPWA({
            injectRegister: "script",
            manifest: {
                background_color: "#0F0F1A", // Matches --color-pwa-bg
                description: "傳統智慧・現代應用 - 數位農民曆",
                display: "standalone",
                icons: [
                    {
                        purpose: "any maskable",
                        sizes: "192x192",
                        src: "assets/icons/icon-192.png",
                        type: "image/png",
                    },
                    {
                        purpose: "any maskable",
                        sizes: "512x512",
                        src: "assets/icons/icon-512.png",
                        type: "image/png",
                    },
                ],
                name: "農民曆 PWA",
                orientation: "portrait",
                scope: "/pwa_lunar-calendar/",
                short_name: "農民曆",
                start_url: "/pwa_lunar-calendar/",
                theme_color: "#1A1A2E", // Matches --color-pwa-theme
            },
            registerType: "autoUpdate",
            workbox: {
                clientsClaim: true,
                globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,mp3}"],
                maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // Increased to 15MB
                runtimeCaching: [
                    {
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                                maxEntries: 10,
                            },
                        },
                        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                    },
                    {
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "gallery-images",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                                maxEntries: 50,
                            },
                        },
                        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
                    },
                    {
                        handler: "CacheFirst",
                        options: {
                            cacheName: "ambient-music",
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                                maxEntries: 10,
                            },
                        },
                        urlPattern: /\.(?:mp3|wav)$/,
                    },
                ],
                skipWaiting: true,
            },
        }),
    ],
    server: {
        host: true,
    },
    site: "https://benitorhuang-svg.github.io",
});
