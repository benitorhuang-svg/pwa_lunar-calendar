/**
 * Resource Loading & Splash Screen Orchestrator
 * Loading Page 的職責：
 * 1. 版本同步：檢查 Service Worker 狀態，確保是最新的核心與資源。
 * 2. 資源預載：字體、音訊、關鍵圖片。
 * 3. 系統初始化：等待 App 邏輯就緒。
 *
 * 拆分架構：
 * - loader/state.ts  → 進度追蹤狀態
 * - loader/ui.ts     → UI 更新、動畫迴圈、揭示動畫
 * - loader/worker.ts → Service Worker 生命週期管理
 * - loader/assets.ts → 字體、音訊、圖庫預載
 */

import { loadScripts, checkFonts, preloadAssets } from "./loader/assets";
import { startAnimationLoop, revealApp } from "./loader/ui";
import { checkSWandSync } from "./loader/worker";

(async function () {
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
        checkSWandSync();

        // 5. Global Failsafe
        setTimeout(() => {
            const isUpdating = document.body.classList.contains("is-updating");
            const overlay = document.getElementById("loadingOverlay");
            const isStillVisible = overlay && overlay.style.display !== "none";
            if (isStillVisible && !isUpdating) {
                console.warn("[Loader] ⚠️ Global Timeout - Revealing App");
                revealApp();
            }
        }, 10000);
    } catch (e) {
        console.error("Critical Loader Error", e);
        revealApp();
    }
})();
