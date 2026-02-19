/**
 * Resource Loading & Splash Screen Logic
 * Loading Page 的職責：
 * 1. 版本同步：檢查 Service Worker 狀態，確保是最新的核心與資源。
 * 2. 資源預載：字體、音訊、關鍵圖片。
 * 3. 系統初始化：等待 App 邏輯就緒。
 *
 * PWA Update Lifecycle Standardized:
 * 1. Check for updates -> Registration handling
 * 2. Update found -> Installing (Downloading assets)
 * 3. Installed -> Waiting (Assets ready) -> Send SKIP_WAITING
 * 4. Activating -> Cleaning up old caches
 * 5. Activated -> Controller Change -> Window Reload (Apply new version)
 */

import { APP_BASE_URL } from "../core/appConfig";
import { GALLERY_MANIFEST } from "../generated/galleryManifest";

(async function () {
    let isLoaded = false;
    const loadingText = document.getElementById("loadingText") as HTMLElement | null;

    // --- Configuration ---
    const MIN_LOADING_TIME = 2000; // ms

    // --- Progress Tracking ---
    type ProgressKey = "audio" | "fonts" | "heroAll" | "heroFirst" | "scripts" | "update";

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

    // Current State
    let actualPercent = 0;
    let visualPercent = 0;
    const startTime = Date.now();

    // --- UI Helpers ---

    function calcPercent(): number {
        let total = 0;
        for (const k in progress) {
            const key = k as ProgressKey;
            if (progress[key]) total += weights[key];
        }
        return total;
    }

    function updateUI(): void {
        actualPercent = calcPercent();
    }

    function setLoadingStatus(text: string): void {
        if (loadingText) loadingText.textContent = text;
        // console.log(`[Loader Status] ${text}`);
    }

    function setItemStatus(key: ProgressKey, state: "pending" | "active" | "done"): void {
        const icon = document.getElementById(`statusIcon_${key}`);
        const item = icon?.closest(".status-item");

        if (state === "active") {
            if (icon) icon.textContent = "◎";
            if (item) {
                item.classList.add("active");
                item.classList.remove("done");
            }
        } else if (state === "done") {
            if (icon) icon.textContent = "✓";
            if (item) {
                item.classList.remove("active");
                item.classList.add("done");
            }
        }
    }

    function markDone(key: ProgressKey): void {
        if (!progress[key]) {
            progress[key] = true;
            console.log(`[Loader] ✓ ${key} Done`);
            setItemStatus(key, "done");
            updateUI();
        }
    }

    function markActive(key: ProgressKey): void {
        if (!progress[key]) {
            setItemStatus(key, "active");
        }
    }

    // --- App Reveal ---
    function revealApp(): void {
        if (isLoaded) return;
        isLoaded = true;

        console.log("[Loader] 🚀 Revealing App");
        document.body.classList.add("app-loaded");

        setTimeout(() => {
            const overlay = document.getElementById("loadingOverlay");
            if (overlay) overlay.style.display = "none";
            document.body.classList.add("loader-finished");
            window.dispatchEvent(new CustomEvent("loader-finished"));
        }, 1500);
    }

    // --- Animation Loop ---
    function startAnimationLoop(): void {
        const frame = () => {
            const elapsedTime = Date.now() - startTime;
            // Ensure strictly monotonous visual progress
            const timePercent = Math.min((elapsedTime / MIN_LOADING_TIME) * 100, 100);

            // Visual percent chases actual percent, but is also bounded by time to ensure user sees splash
            const target = Math.max(actualPercent, timePercent);

            // Smooth lerp could be here, but direct approach is robust
            if (visualPercent < target) {
                visualPercent = target;
            }

            // Cap at 100
            if (visualPercent > 100) visualPercent = 100;

            if (loadingText) {
                loadingText.style.setProperty("--loading-progress", visualPercent.toFixed(1) + "%");
            }

            // If physically loaded (actual=100) AND min time passed (timePercent>=100)
            if (actualPercent >= 100 && timePercent >= 99.9) {
                revealApp();
            } else {
                requestAnimationFrame(frame);
            }
        };
        requestAnimationFrame(frame);
    }

    // --- Service Worker Logic (The Standard Lifecycle) ---

    // 1. Monitor Worker State
    async function monitorWorker(worker: ServiceWorker): Promise<void> {
        return new Promise((resolve) => {
            const stateHandler = () => {
                console.log(`[SW Monitor] State: ${worker.state}`);
                switch (worker.state) {
                    case "installing":
                        setLoadingStatus("正在下載更新...");
                        break;
                    case "installed":
                        setLoadingStatus("下載完成，準備安裝...");
                        // Standard: Skip Waiting to activate immediately
                        worker.postMessage({ type: "SKIP_WAITING" });
                        break;
                    case "activating":
                        setLoadingStatus("更新中...");
                        break;
                    case "activated":
                        setLoadingStatus("更新完成");
                        resolve(); // Ready
                        break;
                    case "redundant":
                        console.warn("[SW Monitor] Worker became redundant");
                        resolve();
                        break;
                }
            };

            worker.addEventListener("statechange", stateHandler);
            // Fire immediately to catch current state
            stateHandler();
        });
    }

    // 2. Main Check Routine
    async function checkSWandSync(): Promise<void> {
        markActive("update");

        // 1. 環境檢查 (Environment Check)
        if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
            console.log("[Loader] Skipping SW sync (Dev/NoSupport)");
            markDone("update");
            return;
        }

        try {
            // 2. 監聽控制器變更 (Reload trigger)
            let isReloading = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (isReloading) return;
                isReloading = true;
                console.log("[Loader] ★ Version Sync -> Reloading");
                setLoadingStatus("發現新版本，同步並重整中...");
                document.body.classList.add("is-updating");
                window.location.reload();
            });

            // 3. 獲取當前註冊狀態 (Get Registration)
            // 稍微等待以確保瀏覽器已處理底層註冊
            const reg = await Promise.race([
                navigator.serviceWorker.getRegistration(),
                new Promise<undefined>((resolve) => setTimeout(resolve, 2000)) // 2秒逾時
            ]);

            if (!reg) {
                console.log("[Loader] No active registration found or timeout.");
                markDone("update");
                return;
            }

            // 4. 檢查更新 (Check for Updates)
            setLoadingStatus("檢查更新...");

            // 如果已有等待中的更新，直接處理
            if (reg.waiting) {
                console.log("[Loader] Update found (Waiting) -> Activating");
                document.body.classList.add("is-updating");
                reg.waiting.postMessage({ type: "SKIP_WAITING" });
                return;
            }

            // 如果正在安裝，進行監控
            if (reg.installing) {
                console.log("[Loader] Update found (Installing) -> Monitoring");
                document.body.classList.add("is-updating");
                await monitorWorker(reg.installing);
                return;
            }

            try {
                await reg.update();
                // 如果沒有新更新 (reg.update 不一定回傳 boolean，需視狀態而定)
                if (!reg.installing && !reg.waiting) {
                    console.log("[Loader] Current version is up to date.");
                    markDone("update");
                }
            } catch (e) {
                console.warn("[Loader] Manual update check failed, assuming up-to-date.");
                markDone("update");
            }

        } catch (error) {
            console.error("[Loader] SW Sync Error:", error);
            markDone("update");
        }
    }

    // --- Other Loaders ---

    function loadScripts() {
        markActive("scripts");
        if ((window as any).__APP_LOGIC_READY__) {
            markDone("scripts");
        } else {
            window.addEventListener("app-logic-ready", () => markDone("scripts"));
        }
    }

    function checkFonts() {
        markActive("fonts");

        // 明確列出必須載入的關鍵字體 (Explicitly list critical fonts that must load)
        const criticalFonts = [
            { family: "Ma Shan Zheng", weight: "400" },    // 詩詞內文
            { family: "Zhi Mang Xing", weight: "400" },    // 書法標題
            { family: "Noto Serif TC", weight: "400" },     // 主要UI字體
        ];

        // 使用 document.fonts.check() 逐一確認每個字體是否已載入
        const checkAllFonts = (): boolean => {
            return criticalFonts.every(f => {
                try {
                    return document.fonts.check(`${f.weight} 16px "${f.family}"`);
                } catch {
                    return false;
                }
            });
        };

        // 如果已經全部載入（快取命中），立即完成
        if (checkAllFonts()) {
            console.log("[Loader] Fonts already cached and ready");
            markDone("fonts");
            return;
        }

        // 等待 document.fonts.ready 後再次確認
        document.fonts.ready.then(() => {
            if (checkAllFonts()) {
                console.log("[Loader] All critical fonts loaded via fonts.ready");
                markDone("fonts");
            } else {
                // fonts.ready 觸發但關鍵字體仍未載入 → 用輪詢等待
                console.warn("[Loader] fonts.ready fired but critical fonts still missing, polling...");
                pollFonts();
            }
        });

        // 輪詢機制：每 500ms 檢查一次，最多等 8 秒
        let pollCount = 0;
        const MAX_POLLS = 16; // 16 × 500ms = 8 seconds
        function pollFonts(): void {
            const interval = setInterval(() => {
                pollCount++;
                if (checkAllFonts()) {
                    clearInterval(interval);
                    console.log(`[Loader] Critical fonts loaded after ${pollCount * 500}ms polling`);
                    markDone("fonts");
                } else if (pollCount >= MAX_POLLS) {
                    clearInterval(interval);
                    console.warn("[Loader] ⚠️ Font loading timeout (8s). Proceeding with fallback fonts.");
                    markDone("fonts");
                }
            }, 500);
        }

        // 啟動初始輪詢（與 fonts.ready 競爭，先完成的贏）
        pollFonts();
    }

    function preloadAssets() {
        markActive("heroFirst");
        markActive("heroAll");
        markActive("audio");

        // Audio
        const baseDir = APP_BASE_URL || "/";
        const audioSrc = (baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/");
        const audio = new Audio();
        audio.oncanplaythrough = () => markDone("audio");
        audio.onerror = () => markDone("audio");
        audio.src = audioSrc;
        setTimeout(() => markDone("audio"), 2000); // Timeout

        // Images
        const m = new Date().getMonth() + 1;
        let season = "winter"; // Default
        if (m >= 2 && m <= 4) season = "spring";
        else if (m >= 5 && m <= 7) season = "summer";
        else if (m >= 8 && m <= 10) season = "autumn";

        // Manifest handling would go here, simplified for this robust loader:
        // We rely on window event from Main App or load first image manually

        // 1. Manually load first image (for speed)
        // Note: In real app, we need the exact filename.
        // Assuming we can get it or just rely on main app event for 'heroAll'.
        // For 'heroFirst', we will just mark it done when we get 'heroFirstLoaded' or
        // rely on a quick check.

        // Revised Strategy:
        // Since we don't want to duplicate the manifest logic here drastically,
        // we will rely on the app logic to signal us for assets, OR
        // we use the existing global event.

        // Since user wants "Optimized Code", let's keep the Manifest logic but clean.
        importGalleryAndLoad(season);
    }

    function importGalleryAndLoad(season: string) {
        // Reuse the logic cleanly
        const baseDir = APP_BASE_URL || "/";
        // Reuse logic

        // Simple check
        const manifest = GALLERY_MANIFEST as any;
        let list = manifest[season] || [];
        if (!list.length) {
            list = manifest["default"] || [];
            // default dir...
        }

        if (!list.length) {
            markDone("heroFirst");
            markDone("heroAll");
            return;
        }

        // Load First
        const img = new Image();
        img.onload = () => markDone("heroFirst");
        img.onerror = () => markDone("heroFirst");
        img.src = (baseDir + "assets/gallery/" + season + "/" + list[0]).replace(/\/+/g, "/");

        // Wait for full preload signal
        if ((window as any).__APP_IMAGES_PRELOADED__) {
            markDone("heroAll");
        } else {
            window.addEventListener("app-images-preloaded", () => markDone("heroAll"));
        }
    }

    // --- Main Sequence ---

    try {
        console.log("[Loader] 🚀 Init");
        console.log(`[Loader] Environment: ${import.meta.env.DEV ? "DEV" : "PROD"}`);

        // Start Animation Loop
        startAnimationLoop();

        // 1. Core Scripts
        loadScripts();

        // 2. Fonts
        checkFonts();

        // 3. Assets
        preloadAssets();

        // 4. Update Check (The Gatekeeper)
        // We do this concurrently but it updates the UI status
        checkSWandSync();

        // 5. Global Failsafe
        // If for ANY reason (logic error, network hang) we are stuck, we release the app.
        setTimeout(() => {
            const isUpdating = document.body.classList.contains("is-updating");
            if (!isLoaded && !isUpdating) {
                console.warn("[Loader] ⚠️ Global Timeout - Revealing App");
                revealApp();
            }
        }, 10000);
    } catch (e) {
        console.error("Critical Loader Error", e);
        revealApp();
    }
})();
