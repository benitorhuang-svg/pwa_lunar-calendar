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

    async function waitForInstallingWorker(worker: ServiceWorker): Promise<void> {
        document.body.classList.add("is-updating");
        if (loadingText) loadingText.textContent = "下載更新中...";

        await new Promise<void>((resolve) => {
            const onStateChange = () => {
                if (worker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        console.log("[Loader] Installed, reloading...");
                        if (loadingText) loadingText.textContent = "安裝更新中...";

                        const fallbackTimeout = window.setTimeout(() => {
                            console.warn("[Loader] controllerchange timeout, continuing without reload.");
                            markDone("update");
                            resolve();
                        }, 12000);

                        navigator.serviceWorker.addEventListener(
                            "controllerchange",
                            () => {
                                window.clearTimeout(fallbackTimeout);
                                window.location.reload();
                            },
                            { once: true },
                        );

                        worker.postMessage({ type: "SKIP_WAITING" });
                    } else {
                        // First install
                        markDone("update");
                        resolve();
                    }
                } else if (worker.state === "redundant") {
                    console.warn("[Loader] SW installation failed/redundant.");
                    markDone("update");
                    resolve();
                }
            };

            worker.addEventListener("statechange", onStateChange);
            onStateChange();
        });
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
                document.body.classList.add("is-updating");
                if (loadingText) loadingText.textContent = "更新中...";
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
                navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    () => {
                        window.location.reload();
                    },
                    { once: true },
                );
                return; // Wait for reload
            }

            // B. Check for update actively
            let updateFound = false;
            registration.addEventListener(
                "updatefound",
                () => {
                    updateFound = true;
                },
                { once: true },
            );

            await registration.update();

            // Allow micro-delay for late updatefound/installing propagation
            await new Promise((resolve) => window.setTimeout(resolve, 600));

            if (registration.waiting) {
                console.log("[Loader] Update found after check, waiting worker ready.");
                document.body.classList.add("is-updating");
                if (loadingText) loadingText.textContent = "更新中...";
                (registration.waiting as ServiceWorker).postMessage({ type: "SKIP_WAITING" });
                navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    () => {
                        window.location.reload();
                    },
                    { once: true },
                );
                return;
            }

            // C. After update check, acts if installing
            if (registration.installing) {
                console.log("[Loader] New version installing...");
                await waitForInstallingWorker(registration.installing);
            } else {
                if (updateFound) {
                    // updatefound happened but worker object not yet visible, wait one more cycle.
                    await new Promise((resolve) => window.setTimeout(resolve, 600));
                    if (registration.installing) {
                        await waitForInstallingWorker(registration.installing);
                        return;
                    }
                }

                // No update found (or updatefound had no installing worker)
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
            document.body.classList.add("loader-finished");
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

        const isSlideshowFile = (f: string) => !/[\u4e00-\u9fa5]/.test(f);

        const manifest = GALLERY_MANIFEST as Record<string, string[]>;
        let imageList = (manifest[season] || [])
            .filter(isSlideshowFile)
            .map((f: string) => galleryDir + f);

        if (imageList.length === 0) {
            const defaultDir = (baseDir + "assets/gallery/default/").replace(/\/+/g, "/");
            imageList = (manifest["default"] || [])
                .filter(isSlideshowFile)
                .map((f: string) => defaultDir + f);
        }

        if (imageList.length === 0) {
            markDone("heroFirst");
            markDone("heroAll");
            return;
        }

        // --- Critical Path: Preload First Image ---
        const img = new Image();
        img.onload = () => markDone("heroFirst");
        img.onerror = () => {
            console.warn("[Loader] HeroFirst load failed, using fallback...");
            markDone("heroFirst");
        };

        if (imageList[0]) img.src = imageList[0]!;

        // --- Note: heroAll (the rest) will be signaled via CustomEvent from the app's ImageManager ---
        window.addEventListener("app-images-preloaded", () => markDone("heroAll"));
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
    if ((window as any).__APP_LOGIC_READY__) {
        markDone("scripts");
    } else {
        window.addEventListener("app-logic-ready", () => markDone("scripts"));
    }

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

    // Check for heroAll flag which might have been set by hero-main during image detection
    if ((window as any).__APP_IMAGES_PRELOADED__) {
        markDone("heroAll");
    } else {
        window.addEventListener("app-images-preloaded", () => markDone("heroAll"));
    }

    // Safety timeout
    // Safety timeout
    setTimeout(() => {
        let key: ProgressKey;
        for (key in progress) {
            // Block force-completion ONLY if we are in a confirmed update state
            // This ensures we don't accidentally let the user in while an update is installing
            if (key === "update" && (document.body.classList.contains("is-updating"))) {
                console.log("[Loader] Critical update in progress. Blocking access until reload.");
                continue;
            }

            if (!progress[key]) {
                console.warn("[Loader] Force-completing: " + key);
                markDone(key);
            }
        }
    }, 8000);
})();
