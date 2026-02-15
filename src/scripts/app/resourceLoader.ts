/**
 * Resource Loading & Splash Screen Logic
 * 負責首屏加載遮罩邏輯
 */

import { APP_BASE_URL } from "../core/appConfig";
import { GALLERY_MANIFEST } from "../generated/galleryManifest";

// IIFE to run loader logic
(async function () {
    let isLoaded = false;
    const loadingText = document.getElementById("loadingText") as HTMLElement | null;

    type ProgressKey = "audio" | "fonts" | "heroAll" | "heroFirst" | "scripts" | "update";

    // --- Resource Tracker ---
    // Weight Distribution: scripts 15%, fonts 15%, hero images 40%, audio 10%, SW update 20%
    const progress: Record<ProgressKey, boolean> = {
        audio: false,
        fonts: false,
        heroAll: false,
        heroFirst: false,
        scripts: false,
        update: false, // New check for SW update
    };

    const weights: Record<ProgressKey, number> = {
        audio: 10,
        fonts: 15,
        heroAll: 15, // Reduced hero weight slightly for update check
        heroFirst: 25,
        scripts: 15,
        update: 20, // Significant weight for update check
    };

    function calcPercent(): number {
        let total = 0;
        let key: keyof typeof progress;
        for (key in progress) {
            if (progress[key]) total += weights[key];
        }
        return total;
    }

    let actualPercent = 0;
    let visualPercent = 0;
    const startTime = Date.now();
    const MIN_LOADING_TIME = 2000; // 至少動畫 2 秒

    function updateUI(): void {
        actualPercent = calcPercent();
    }

    function markDone(key: ProgressKey): void {
        if (!progress[key]) {
            progress[key] = true;
            const currentTotal = calcPercent();
            console.log(`[Loader] ✓ ${key} | Total Progress: ${currentTotal}%`);
            updateUI();
        }
    }

    // --- Service Worker Update Logic ---
    // --- Service Worker Update Logic ---
    async function checkSWUpdate(): Promise<void> {
        if (!("serviceWorker" in navigator)) {
            markDone("update");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                markDone("update");
                return;
            }

            // A. Check if already waiting (Update ready)
            if (registration.waiting) {
                console.log("[Loader] Update waiting, boosting...");
                if (loadingText) loadingText.textContent = "更新中...";
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
                navigator.serviceWorker.addEventListener("controllerchange", () => {
                    window.location.reload();
                });
                return; // Wait for reload
            }

            // B. Check for update actively
            await registration.update();

            // C. After update check, acts if installing
            if (registration.installing) {
                const installingWorker = registration.installing;
                console.log("[Loader] New version installing...");
                if (loadingText) loadingText.textContent = "下載更新中...";

                installingWorker.addEventListener("statechange", () => {
                    if (installingWorker.state === "installed") {
                        if (navigator.serviceWorker.controller) {
                            console.log("[Loader] Installed, reloading...");
                            if (loadingText) loadingText.textContent = "安裝更新中...";
                            installingWorker.postMessage({ type: "SKIP_WAITING" });
                            // Reload will happen via controllerchange listener attached below
                        } else {
                            // First install
                            markDone("update");
                        }
                    }
                });

                navigator.serviceWorker.addEventListener("controllerchange", () => {
                    window.location.reload();
                });

                // DO NOT markDone("update") here. We wait for installation.
                // But add a safety timeout in case installation stalls?
                // Let's rely on the global safety timeout (8000ms) to force entry if stuck.
            } else {
                // No update found
                markDone("update");
            }
        } catch (e) {
            console.warn("[Loader] SW check failed:", e);
            markDone("update");
        }
    }

    // 啟動平滑動畫循環 (Start smooth animation loop)
    function startAnimationLoop(): void {
        const frame = () => {
            const elapsedTime = Date.now() - startTime;
            const timePercent = (elapsedTime / MIN_LOADING_TIME) * 100;
            visualPercent = Math.min(actualPercent, timePercent);

            if (loadingText) {
                // If text is overridden by update logic, don't update progress bar text content itself if embedded
                // But here we use CSS var for bar width, text content is static usually
                loadingText.style.setProperty("--loading-progress", visualPercent.toFixed(1) + "%");
            }

            if (visualPercent < 100 || actualPercent < 100) {
                requestAnimationFrame(frame);
            } else {
                revealApp();
            }
        };
        requestAnimationFrame(frame);
    }

    function revealApp(): void {
        if (isLoaded) return;
        isLoaded = true;
        document.body.classList.add("app-loaded");
        setTimeout(() => {
            const overlay = document.getElementById("loadingOverlay");
            if (overlay) overlay.style.display = "none";
            window.dispatchEvent(new CustomEvent("loader-finished"));
        }, 1500);
    }

    // --- Resources ---
    function checkFonts(): boolean {
        if (document.fonts && document.fonts.status === "loaded") {
            markDone("fonts");
            return true;
        }
        return false;
    }

    function preloadHeroImages(): void {
        const m = new Date().getMonth() + 1;
        let season: string;
        if (m >= 2 && m <= 4) season = "spring";
        else if (m >= 5 && m <= 7) season = "summer";
        else if (m >= 8 && m <= 10) season = "autumn";
        else season = "winter";

        const baseDir = APP_BASE_URL || "/";
        const galleryDir = (baseDir + "assets/gallery/" + season + "/").replace(/\/+/g, "/");

        const manifest = GALLERY_MANIFEST as Record<string, string[]>;
        let imageList = (manifest[season] || []).map((f: string) => galleryDir + f);
        if (imageList.length === 0) {
            const defaultDir = (baseDir + "assets/gallery/default/").replace(/\/+/g, "/");
            imageList = (manifest["default"] || []).map((f: string) => defaultDir + f);
        }

        if (imageList.length === 0) {
            markDone("heroFirst");
            markDone("heroAll");
            return;
        }

        // Fallback function
        const loadFallback = () => {
            console.warn("[Loader] Primary hero image failed, attempting fallback...");
            const fallbackImg = new Image();
            fallbackImg.onload = fallbackImg.onerror = () => {
                console.log("[Loader] Fallback image loaded (or failed safely)");
                markDone("heroFirst");
            };
            // Fallback to default/1.webp or similar if available, or just manifest default
            const fallbackPath = (baseDir + "assets/gallery/default/1.webp").replace(/\/+/g, "/");
            fallbackImg.src = fallbackPath;
        };

        const img = new Image();
        img.onload = () => {
            markDone("heroFirst");
        };
        img.onerror = () => {
            loadFallback();
        };

        if (imageList[0]) img.src = imageList[0]!;
        else loadFallback();

        if (imageList.length <= 1) {
            markDone("heroAll");
        } else {
            const remaining = imageList.length - 1;
            let loaded = 0;
            for (let i = 1; i < imageList.length; i++) {
                const img = new Image();
                img.onload = img.onerror = () => {
                    loaded++;
                    if (loaded >= remaining) markDone("heroAll");
                };
                if (imageList[i]) img.src = imageList[i] as string;
            }
        }
    }

    function preloadAudio(): void {
        const baseDir = APP_BASE_URL || "/";
        const audioFiles = [(baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/")];
        if (audioFiles.length === 0) {
            markDone("audio");
            return;
        }
        const firstAudio = audioFiles[0];
        if (!firstAudio) {
            markDone("audio");
            return;
        }
        const audio = new Audio();
        audio.preload = "auto";
        audio.oncanplaythrough = () => markDone("audio");
        audio.onerror = () => markDone("audio");
        audio.src = firstAudio;
        setTimeout(() => markDone("audio"), 2000);
    }

    // --- Main ---
    window.addEventListener("app-logic-ready", () => markDone("scripts"));

    startAnimationLoop(); // Start visual loop early

    // Start all parallel tasks
    preloadHeroImages();
    preloadAudio();

    if (!checkFonts()) {
        document.fonts.ready.then(() => markDone("fonts"));
        setTimeout(() => markDone("fonts"), 3000);
    }

    // SW Update Check - Await after starting others to prevent blocking initial downloads
    await checkSWUpdate();

    // Safety timeout
    setTimeout(() => {
        let key: ProgressKey;
        for (key in progress) {
            if (!progress[key]) {
                console.warn("[Loader] Force-completing: " + key);
                markDone(key);
            }
        }
    }, 8000);
})();
