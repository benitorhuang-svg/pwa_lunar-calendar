/**
 * Application Controller
 * 應用程式控制器，負責初始化與歡迎流程
 * Application controller responsible for initialization and welcome sequence
 */

import type { RenderPanelsDetail, SlideshowControlDetail, ToggleGridViewDetail } from "../types";

import { AppEventOrchestrator } from "./eventOrchestrator";
import { AppStateManager } from "./stateManager";

// 初始化 (Initialize)
const stateManager = new AppStateManager();
const orchestrator = new AppEventOrchestrator(stateManager);

// Start initialization after a short delay to ensure all component scripts are ready
window.addEventListener("DOMContentLoaded", () => {
    orchestrator.init();

    // Give a small breathing room for other module scripts to finish initialization
    setTimeout(() => {
        orchestrator.updateState();
        initWelcomeMode();
    }, 100);
});

/**
 * Activate the welcome sequence
 * 啟動歡迎流程
 */
function activateWelcome(): void {
    // 一進場立刻進入「歡迎/沉浸」狀態
    document.body.classList.add("initial-welcome");
    window.dispatchEvent(new CustomEvent("welcome-mode", { detail: { active: true } }));

    stateManager.setActivePanel("today");

    // UI Updates
    window.dispatchEvent(
        new CustomEvent<ToggleGridViewDetail>("toggle-grid-view", { detail: { show: false } }),
    );

    window.dispatchEvent(
        new CustomEvent<RenderPanelsDetail>("render-panels", {
            detail: {
                type: "today",
                ...stateManager.getState(),
            },
        }),
    );

    window.dispatchEvent(
        new CustomEvent<SlideshowControlDetail>("slideshow-control", {
            detail: { action: "start", isArtwork: false },
        }),
    );

    // Explicitly update state once more to ensure everything is in sync
    orchestrator.updateState();
}

/**
 * Initialize Welcome Mode logic
 * 負責歡迎模式初始化邏輯
 */
function initWelcomeMode(): void {
    // 監聽來自 ResourceLoader 的完成事件 (已包含開場動畫結束)
    // Listen for completion event from ResourceLoader (includes mask animation end)
    window.addEventListener("loader-finished", () => {
        console.log("[AppController] Loader finished, activating welcome sequence.");
        activateWelcome();
    }, { once: true });

    // Fallback: 如果因為某種原因沒收到事件但 body 已載入
    if (document.body.classList.contains("app-loaded")) {
        // 如果 overlay 已經隱藏 (display: none)，則直接進入
        const overlay = document.getElementById("loadingOverlay");
        if (overlay && overlay.style.display === "none") {
            activateWelcome();
        }
    }
}

// 立即執行初始化邏輯 (Execute initialization logic immediately if loaded later)
// Note: This call at the end handles cases where the script loads after DOMContentLoaded if using 'defer'
// but we already have a listener above.
// Actually, `initWelcomeMode()` call here is risky if DOM not ready.
// Best to rely on the DOMContentLoaded handler above or check readyState.
if (document.readyState === "complete" || document.readyState === "interactive") {
    // If logic is idempotent or safe to check
    // initWelcomeMode is safe because it checks .app-loaded
}
