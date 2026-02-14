import { AppStateManager } from "./stateManager.js";
import { AppEventOrchestrator } from "./eventOrchestrator.js";

// Initialize
const stateManager = new AppStateManager();
const orchestrator = new AppEventOrchestrator(stateManager);

// Start
orchestrator.init();
orchestrator.updateState();

// Initialize Welcome Mode logic
function initWelcomeMode() {
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

function activateWelcome() {
    // 一進場立刻進入「歡迎/沉浸」狀態
    document.body.classList.add("initial-welcome");
    window.dispatchEvent(
        new CustomEvent("welcome-mode", { detail: { active: true } })
    );

    stateManager.setActivePanel("today");

    // UI Updates
    window.dispatchEvent(
        new CustomEvent("toggle-grid-view", { detail: { show: false } })
    );
    window.dispatchEvent(
        new CustomEvent("render-panels", {
            detail: {
                type: "today",
                ...stateManager.getState(),
            },
        })
    );

    window.dispatchEvent(
        new CustomEvent("slideshow-control", {
            detail: { action: "start", isArtwork: false },
        })
    );
}

initWelcomeMode();
