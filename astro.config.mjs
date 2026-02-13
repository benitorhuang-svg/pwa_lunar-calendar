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
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
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
