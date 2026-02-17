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

    type ProgressKey = "audio" | "fonts" | "heroAll" | "heroFirst" | "scripts" | "update";

    // --- Resource Tracker ---
    const progress: Record<ProgressKey, boolean> = {
        scripts: false,   // 15% - Core app scripts ready
        heroFirst: false,  // 25% - First hero image loaded
        fonts: false,      // 15% - Web fonts ready
        heroAll: false,    // 15% - All hero images preloaded
        audio: false,      // 10% - Audio ready
        update: false,     // 20% - SW update check complete (most critical gate)
    };

    const weights: Record<ProgressKey, number> = {
        scripts: 15,
        heroFirst: 25,
        fonts: 15,
        heroAll: 15,
        audio: 10,
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

            // Update status checklist UI
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
        // Do not change main title text anymore.
        // if (loadingText) loadingText.textContent = text;
        console.log(`[Loader Status] ${text}`);
    }

    // ====================================================================
    //  Service Worker Update Gate
    //  這是 Loading Page 最核心的職責：
    //  確認「是否有更新？」→「更新完了嗎？」→ 才放行
    // ====================================================================

    /**
     * 當 SW 正在安裝（precaching 資源）時，等待它完成。
     * 安裝完成後（所有資源已下載到 Cache），才通知 SW 接管並重整頁面。
     */
    async function waitForInstallingWorker(worker: ServiceWorker): Promise<void> {
        document.body.classList.add("is-updating");
        setLoadingStatus("正在同步更新...");

        return new Promise<void>((resolve) => {
            const onStateChange = () => {
                console.log(`[Loader] SW state: ${worker.state}`);

                if (worker.state === "installed") {
                    // ★ 關鍵：installed 表示 precache 全部完成
                    // 所有提交的資源已經寫入 Cache Storage
                    console.log("[Loader] ✓ 所有資源已同步完成");

                    if (navigator.serviceWorker.controller) {
                        // 有舊版 → 需要切換：告訴新 SW 接管，然後重整
                        setLoadingStatus("安裝完成，重新載入...");
                        activateAndReload(worker);
                    } else {
                        // 全新安裝（第一次造訪）→ 直接放行
                        setLoadingStatus("農民曆");
                        markDone("update");
                        resolve();
                    }
                } else if (worker.state === "activating" || worker.state === "activated") {
                    // 如果 skipWaiting 在 SW 內被觸發（配合 registerType: autoUpdate）
                    // 直接重整確保一致性
                    if (navigator.serviceWorker.controller) {
                        setLoadingStatus("版本切換中...");
                        window.location.reload();
                    } else {
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
            // Check current state immediately
            onStateChange();
        });
    }

    /**
     * 命令 waiting SW 接管，並在接管完成後重整頁面。
     */
    function activateAndReload(worker: ServiceWorker): void {
        // 監聽 controller 切換
        navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
                console.log("[Loader] Controller changed, reloading...");
                window.location.reload();
            },
            { once: true },
        );

        // 發送 SKIP_WAITING 給新 SW
        worker.postMessage({ type: "SKIP_WAITING" });

        // 備援：如果 controllerchange 沒有觸發，強制重整
        setTimeout(() => {
            console.warn("[Loader] controllerchange timeout, forcing reload.");
            window.location.reload();
        }, 5000);
    }

    /**
     * 主更新檢測邏輯
     */
    async function checkSWUpdate(): Promise<void> {
        // 开发模式下跳过 SW 检查 (Skip SW check in dev mode)
        if (import.meta.env.DEV) {
            console.log("[Loader] Development mode detected. Skipping SW update check.");
            markDone("update");
            return;
        }

        if (!("serviceWorker" in navigator)) {
            markDone("update");
            return;
        }

        try {
            setLoadingStatus("檢查版本...");

            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                // 尚未註冊 SW（首次載入，SW 會由 registerSW.js 處理）
                // 等待 SW 註冊並安裝完成
                console.log("[Loader] No SW registration yet, waiting for first install...");
                await waitForFirstInstall();
                return;
            }

            // ─── 情境 A：已有一個新版 SW 在等待 ───
            if (registration.waiting) {
                console.log("[Loader] Found waiting SW → 同步更新中...");
                setLoadingStatus("版本更新中...");
                document.body.classList.add("is-updating");
                activateAndReload(registration.waiting);
                return; // 等待重整，不繼續
            }

            // ─── 情境 B：正在安裝中 ───
            if (registration.installing) {
                console.log("[Loader] Found installing SW → 等待完成...");
                await waitForInstallingWorker(registration.installing);
                return;
            }

            // ─── 情境 C：主動向伺服器查詢是否有新版 ───
            console.log("[Loader] Checking for updates...");

            // 設立 updatefound 監聽（在 .update() 之前）
            const updatePromise = new Promise<boolean>((resolve) => {
                registration.addEventListener(
                    "updatefound",
                    () => {
                        console.log("[Loader] ⚡ updatefound event detected!");
                        resolve(true);
                    },
                    { once: true },
                );

                // 超時：如果 3 秒內沒有 updatefound，視為沒有更新
                setTimeout(() => resolve(false), 3000);
            });

            // 觸發 SW 更新檢查
            await registration.update();

            const hasUpdate = await updatePromise;

            if (hasUpdate) {
                console.log("[Loader] Update detected, waiting for installation...");
                // 更新已觸發，等待安裝完成
                if (registration.installing) {
                    await waitForInstallingWorker(registration.installing);
                } else if (registration.waiting) {
                    // 安裝極快，已經到 waiting
                    console.log("[Loader] Update already waiting.");
                    document.body.classList.add("is-updating");
                    activateAndReload(registration.waiting);
                }
                return;
            }

            // ─── 沒有更新 → 當前版本即最新 ───
            console.log("[Loader] ✓ No update found. System is up to date.");

            // 強制延遲 800ms 讓使用者看到「版本同步」打勾的過程
            // (Make the checkmark visible for at least a moment)
            await new Promise(r => setTimeout(r, 800));

            markDone("update");

        } catch (e) {
            console.warn("[Loader] SW check failed:", e);
            // 網路錯誤時仍允許放行（離線使用）
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
                        reg.addEventListener("updatefound", async () => {
                            if (reg.installing) {
                                await waitForInstallingWorker(reg.installing);
                            }
                        }, { once: true });
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
})();
