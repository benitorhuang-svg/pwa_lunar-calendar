/**
 * Resource Loading & Splash Screen Logic
 * Loading Page 的職責：
 * 1. 確認 Service Worker 已完成所有資源的 precache（同步更新）
 * 2. 確認首圖、字體、音訊等關鍵資源已就緒
 * 3. 以上全部完成後，才放行進入每日資訊頁面
 *
 * 更新生命週期：
 * ┌─────────────────────────────────────────────────────┐
 * │  GitHub Pages 推送新版本                              │
 * │  ↓                                                   │
 * │  瀏覽器偵測到 sw.js 變更                              │
 * │  ↓                                                   │
 * │  新 SW 開始 install（precache 所有資源）               │
 * │  ↓                                                   │
 * │  install 完成 → 新 SW 進入 "waiting" 狀態             │
 * │  ↓                                                   │
 * │  Loading Page 偵測到 waiting SW                       │
 * │  ↓                                                   │
 * │  Loading Page 發送 SKIP_WAITING                       │
 * │  ↓                                                   │
 * │  新 SW activate → controllerchange                   │
 * │  ↓                                                   │
 * │  Loading Page 執行 window.location.reload()           │
 * │  ↓                                                   │
 * │  重整後：所有資源皆為最新版 → 放行進入 App              │
 * └─────────────────────────────────────────────────────┘
 */

import { APP_BASE_URL } from "../core/appConfig";
import { GALLERY_MANIFEST } from "../generated/galleryManifest";

(async function () {
    let isLoaded = false;
    const loadingText = document.getElementById("loadingText") as HTMLElement | null;

    // (Moved Global Timeout to bottom to ensure revealApp is defined)

    try {

        console.log("[Loader] Started");

        type ProgressKey = "audio" | "fonts" | "heroAll" | "heroFirst" | "scripts" | "update";

        // --- Resource Tracker ---
        const progress: Record<ProgressKey, boolean> = {
            audio: false, // 10%
            fonts: false, // 15%
            heroAll: false, // 15%
            heroFirst: false, // 25%
            scripts: false, // 15%
            update: false, // 20%
        };

        const weights: Record<ProgressKey, number> = {
            audio: 10,
            fonts: 15,
            heroAll: 15,
            heroFirst: 25,
            scripts: 15,
            update: 20,
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
        const MIN_LOADING_TIME = 2000;

        function updateUI(): void {
            actualPercent = calcPercent();
        }

        function markDone(key: ProgressKey): void {
            if (!progress[key]) {
                progress[key] = true;
                const currentTotal = calcPercent();
                console.log(`[Loader] ✓ ${key} | Total Progress: ${currentTotal}%`);
                updateUI();

                const icon = document.getElementById(`statusIcon_${key}`);
                const item = icon?.closest(".status-item");
                if (icon) icon.textContent = "✓";
                if (item) {
                    item.classList.remove("active");
                    item.classList.add("done");
                }
            }
        }

        function markActive(key: ProgressKey): void {
            const icon = document.getElementById(`statusIcon_${key}`);
            const item = icon?.closest(".status-item");
            if (icon && !progress[key]) icon.textContent = "◎";
            if (item && !progress[key]) item.classList.add("active");
        }

        function setLoadingStatus(text: string): void {
            const loadingText = document.getElementById("loadingText");
            if (loadingText) loadingText.textContent = text;
            console.log(`[Loader Status] ${text}`);
        }

        // ... (waitForInstallingWorker remains same, ensuring skipWaiting is handled there too if needed, but checkSWUpdate is main entry)

        async function waitForInstallingWorker(worker: ServiceWorker): Promise<void> {
            document.body.classList.add("is-updating");
            setLoadingStatus("正在下載更新...");

            return new Promise<void>((resolve) => {
                const onStateChange = () => {
                    console.log(`[Loader] SW state: ${worker.state}`);
                    if (worker.state === "installed") {
                        console.log("[Loader] ✓ Resources cached. Forcing activation...");
                        // Force skipWaiting here too
                        worker.postMessage({ type: 'SKIP_WAITING' });
                    } else if (worker.state === "activating" || worker.state === "activated") {
                        if (navigator.serviceWorker.controller) {
                            console.log("[Loader] SW activated. Waiting for reload...");
                            setLoadingStatus("更新完成，重啟中...");
                        } else {
                            markDone("update");
                            resolve();
                        }
                    } else if (worker.state === "redundant") {
                        console.warn("[Loader] SW redundant.");
                        markDone("update");
                        resolve();
                    }
                };
                worker.addEventListener("statechange", onStateChange);
                onStateChange();
            });
        }

        async function checkSWUpdate(): Promise<void> {
            if (import.meta.env.DEV) {
                markDone("update");
                return;
            }

            if (!("serviceWorker" in navigator)) {
                markDone("update");
                return;
            }

            try {
                let reloading = false;
                navigator.serviceWorker.addEventListener("controllerchange", () => {
                    if (reloading) return;
                    reloading = true;
                    console.log("[Loader] ★ controllerchange → reloading...");
                    document.body.classList.add("is-updating");
                    setLoadingStatus("更新完成，即將重整...");
                    window.location.reload();
                });

                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration) {
                    await waitForFirstInstall();
                    return;
                }

                // A: Waiting
                if (registration.waiting) {
                    console.log("[Loader] Found waiting SW → forcing skipWaiting...");
                    document.body.classList.add("is-updating");
                    setLoadingStatus("正在套用更新...");
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    await new Promise(() => { }); // Block until reload
                    return;
                }

                // B: Installing
                if (registration.installing) {
                    await waitForInstallingWorker(registration.installing);
                    return;
                }

                // C: Update Check
                console.log("[Loader] Checking for updates...");
                setLoadingStatus("檢查更新中...");

                const updatePromise = new Promise<boolean>((resolve) => {
                    const listener = () => resolve(true);
                    registration.addEventListener("updatefound", listener, { once: true });
                    setTimeout(() => {
                        registration.removeEventListener("updatefound", listener);
                        resolve(false);
                    }, 3000);
                });

                await registration.update();
                const hasUpdate = await updatePromise;

                if (hasUpdate) {
                    console.log("[Loader] Update found → SW installing...");
                    document.body.classList.add("is-updating");
                    setLoadingStatus("發現新版本，下載中...");
                    if (registration.installing) {
                        await waitForInstallingWorker(registration.installing);
                    } else {
                        // Should be installing, but wait a bit to be sure
                        await new Promise(r => setTimeout(r, 1000));
                        if (registration.installing) {
                            await waitForInstallingWorker(registration.installing);
                        }
                    }
                    // Block until reload
                    await new Promise(() => { });
                    return;
                }

                console.log("[Loader] ✓ No update.");
                setLoadingStatus("系統準備就緒");
                await new Promise((r) => setTimeout(r, 500));
                markDone("update");
            } catch (e) {
                console.warn("[Loader] SW check failed:", e);
                markDone("update");
            }
        }

        /**
         * 首次造訪：等待 SW 完成首次安裝
         */
        async function waitForFirstInstall(): Promise<void> {
            return new Promise<void>((resolve) => {
                const onRegistration = async () => {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg) {
                        if (reg.installing) {
                            await waitForInstallingWorker(reg.installing);
                        } else if (reg.active) {
                            // 已啟動
                            markDone("update");
                        } else {
                            // 等 updatefound
                            reg.addEventListener(
                                "updatefound",
                                async () => {
                                    if (reg.installing) {
                                        await waitForInstallingWorker(reg.installing);
                                    }
                                },
                                { once: true },
                            );
                        }
                        resolve();
                    } else {
                        // 再等一下
                        setTimeout(onRegistration, 500);
                    }
                };

                // 給 registerSW.js 一點時間開始註冊
                setTimeout(onRegistration, 300);

                // 安全超時
                setTimeout(() => {
                    markDone("update");
                    resolve();
                }, 10000);
            });
        }

        // ====================================================================
        //  Animation Loop
        // ====================================================================
        function startAnimationLoop(): void {
            const frame = () => {
                const elapsedTime = Date.now() - startTime;
                const timePercent = (elapsedTime / MIN_LOADING_TIME) * 100;
                visualPercent = Math.min(actualPercent, timePercent);

                if (loadingText) {
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

        // ====================================================================
        //  Resource Loaders
        // ====================================================================
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

            // Critical Path: First Image
            const img = new Image();
            img.onload = () => markDone("heroFirst");
            img.onerror = () => {
                console.warn("[Loader] HeroFirst load failed, using fallback...");
                markDone("heroFirst");
            };

            if (imageList[0]) img.src = imageList[0]!;

            // heroAll will be signaled via CustomEvent from the app's ImageManager
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

        // ====================================================================
        //  Main Execution
        // ====================================================================

        // ====================================================================
        //  Global Safety Timeout
        // ====================================================================
        // Validates if the app is stuck in loading state.
        // Modified: If updating, allow much more time (e.g. 60s) for slow networks.
        setTimeout(() => {
            const isUpdating = document.body.classList.contains("is-updating");
            if (!isLoaded) {
                if (isUpdating) {
                    console.log("[Loader] Update in progress... extending safety timeout (30s total).");
                    setTimeout(() => {
                        if (!isLoaded) {
                            console.warn("[Loader] ★ Update process HUNG (30s). Force revealing app.");
                            revealApp();
                        }
                    }, 18000);
                } else {
                    console.warn("[Loader] ★ GLOBAL TIMEOUT (12s) — force revealing app");
                    revealApp();
                }
            }
        }, 12000);

        // 1. Scripts readiness
        markActive("scripts");
        if ((window as any).__APP_LOGIC_READY__) {
            markDone("scripts");
        } else {
            window.addEventListener("app-logic-ready", () => markDone("scripts"));
        }

        // 2. Start animation
        startAnimationLoop();

        // 3. Start resource loading (parallel)
        markActive("heroFirst");
        markActive("heroAll");
        preloadHeroImages();

        markActive("audio");
        preloadAudio();

        markActive("fonts");
        if (!checkFonts()) {
            document.fonts.ready.then(() => markDone("fonts"));
            setTimeout(() => markDone("fonts"), 3000);
        }

        // 4. ★ SW Update Check — THE GATE
        // This is the most important check.
        // It MUST complete (either "no update" or "update installed & reloaded")
        // before the loading screen is dismissed.
        markActive("update");
        await checkSWUpdate();

        // 5. Check for heroAll flag (might have been set during SW check)
        if ((window as any).__APP_IMAGES_PRELOADED__) {
            markDone("heroAll");
        } else {
            window.addEventListener("app-images-preloaded", () => markDone("heroAll"));
        }

        // 6. Safety timeout (for non-update resources only)
        setTimeout(() => {
            let key: ProgressKey;
            for (key in progress) {
                // NEVER force-complete "update" if an update is in progress
                if (key === "update" && document.body.classList.contains("is-updating")) {
                    console.log("[Loader] ⚠ Critical update in progress. Waiting for reload.");
                    continue;
                }

                if (!progress[key]) {
                    console.warn("[Loader] Force-completing: " + key);
                    markDone(key);
                }
            }
        }, 8000);

    } catch (err) {
        // ★ If ANYTHING goes wrong, force-reveal the app
        console.error("[Loader] ★ CRITICAL ERROR — force revealing app:", err);
        document.body.classList.add("app-loaded");
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) overlay.style.display = "none";
        document.body.classList.add("loader-finished");
        window.dispatchEvent(new CustomEvent("loader-finished"));
    }
})();
