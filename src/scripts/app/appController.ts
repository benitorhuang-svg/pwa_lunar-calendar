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
    const checkAndActivate = () => {
        if (document.body.classList.contains("app-loaded")) {
            // Apply initial-welcome immediately to prevent HUD flash
            if (!document.body.classList.contains("initial-welcome")) {
                document.body.classList.add("initial-welcome");
                activateWelcome();
            }
            return true;
        }
        return false;
    };

    if (!checkAndActivate()) {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === "class" && checkAndActivate()) {
                    observer.disconnect();
                    break;
                }
            }
        });
        observer.observe(document.body, { attributes: true });
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
