import { AppEventOrchestrator } from "./eventOrchestrator";
import { AppStateManager } from "./stateManager";

// Initialize
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
    window.dispatchEvent(new CustomEvent("toggle-grid-view", { detail: { show: false } }));
    window.dispatchEvent(
        new CustomEvent("render-panels", {
            detail: {
                type: "today",
                ...stateManager.getState(),
            },
        }),
    );

    window.dispatchEvent(
        new CustomEvent("slideshow-control", {
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
    if (document.body.classList.contains("app-loaded")) {
        activateWelcome();
    } else {
        const loadObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === "class" && document.body.classList.contains("app-loaded")) {
                    loadObserver.disconnect();
                    activateWelcome();
                    break;
                }
            }
        });
        loadObserver.observe(document.body, { attributes: true });
    }
}

initWelcomeMode();
