/**
 * Application Controller
 * 應用程式控制器，負責初始化與歡迎流程
 * Application controller responsible for initialization and welcome sequence
 */

import type { RenderPanelsDetail, ToggleGridViewDetail } from "../types";

import { AppEventOrchestrator } from "./eventOrchestrator";
import { AppStateManager } from "./stateManager";

// 初始化 (Initialize)
const stateManager = new AppStateManager();
const orchestrator = new AppEventOrchestrator(stateManager);
let welcomeActivated = false;

// Start initialization after a short delay to ensure all component scripts are ready
window.addEventListener("DOMContentLoaded", () => {
    orchestrator.init();

    // Give a small breathing room for other module scripts to finish initialization
    setTimeout(() => {
        // 1. 先確定基礎狀態與主題 (Establish base state and theme first)
        orchestrator.updateState();

        // 2. 隨即啟動歡迎流程 (Immediately start welcome sequence)
        // 這樣在 Loading 結束（app-loaded）時，UI 已經是正確的「歡迎模式」佈局
        // This ensures the UI is already in "Welcome Mode" layout when Loading ends.
        if (!welcomeActivated) {
            activateWelcome();
            welcomeActivated = true;
        }

        initWelcomeMode();
    }, 200);
});

/**
 * Activate the welcome sequence
 * 啟動歡迎流程
 */
function activateWelcome(): void {
    console.log("[App] Activating welcome sequence...");
    // 一進場立刻進入「歡迎/沉浸」狀態（統一入口）
    window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "welcome" } }));

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

    // Explicitly update state once more to ensure everything is in sync
    orchestrator.updateState();
}

/**
 * Initialize Welcome Mode logic
 * 負責歡迎模式初始化邏輯 (Kept for secondary event handling / safety)
 */
function initWelcomeMode(): void {
    // Note: The primary activation now happens in the 200ms timeout above.
    // This listener handles backup or late-loading scenarios.
    window.addEventListener("loader-finished", () => {
        if (!welcomeActivated) {
            activateWelcome();
            welcomeActivated = true;
        }
    });
}
