import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
    site: 'https://benitorhuang-svg.github.io',
    base: '/pwa_lunar-calendar',
    server: {
        host: true,
    },
    integrations: [
        AstroPWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,mp3}'],
                maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // Increased to 15MB
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                        },
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'gallery-images',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    {
                        urlPattern: /\.(?:mp3|wav)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'ambient-music',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: "農民曆 PWA",
                short_name: "農民曆",
                description: "傳統智慧・現代應用 - 數位農民曆",
                start_url: "/pwa_lunar-calendar/",
                scope: "/pwa_lunar-calendar/",
                display: "standalone",
                background_color: "#0F0F1A",
                theme_color: "#1A1A2E",
                orientation: "portrait",
                icons: [
                    {
                        "src": "assets/icons/icon-192.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "any maskable"
                    },
                    {
                        "src": "assets/icons/icon-512.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any maskable"
                    }
                ]
            }
        })
    ]
});
