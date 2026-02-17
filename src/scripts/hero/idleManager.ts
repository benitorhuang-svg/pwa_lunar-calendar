import type { AppMode } from "../types";

/**
 * Hero Idle Manager (Refactored)
 * 負責三域計時器架構：Welcome / Zen / Artwork Slide
 * (Responsible for three-domain timer architecture)
 */
export class HeroIdleManager {
    private static readonly ARTWORK_SLIDE_TIMEOUT = 5000;
    private static readonly WELCOME_IDLE_TIMEOUT = 6000;
    private static readonly ZEN_IDLE_TIMEOUT = 15000;

    private artworkSlideTimer: null | number = null;
    private currentMode: AppMode = "welcome";
    private welcomeTimer: null | number = null;
    private zenTimer: null | number = null;

    constructor() {
        // No auto-init here, wait for AppController/ModeHandler to call activateForMode
    }

    /**
     * T206: 根據模式啟動對應計時器 (Activate timers based on current mode)
     */
    public activateForMode(mode: AppMode): void {
        this.deactivateAll();
        this.currentMode = mode;

        switch (mode) {
            case "artwork":
                this.startZenTimer();
                this.startArtworkSlideTimer();
                break;
            case "welcome":
                this.startWelcomeTimer();
                break;
            case "zen":
                // In Zen mode, we might want to track interaction to go back to Artwork?
                // But usually Zen -> Artwork is handled by click handler in ModeHandler/UIManager.
                break;
            default:
                // Other modes (calendar/note) might have general idle needs if specified later
                break;
        }
    }

    /**
     * T206: 清除所有計時器 (Deactivate all timers)
     */
    public deactivateAll(): void {
        this.clearWelcomeTimer();
        this.clearZenTimer();
        this.clearArtworkSlideTimer();
    }

    /**
     * 暫停/恢復輪播 (Pause/Resume slide timer)
     */
    public pauseSlideTimer(): void {
        this.clearArtworkSlideTimer();
    }

    /**
     * T206: 重置使用者互動計時器 (Reset interaction-based timers)
     * 僅重置閒置轉場計時器，不影響圖片輪播
     */
    public resetInteraction(): void {
        if (this.currentMode === "welcome") {
            this.clearWelcomeTimer();
            this.startWelcomeTimer();
        } else if (this.currentMode === "artwork") {
            this.clearZenTimer();
            this.startZenTimer();
        }
    }

    public resumeSlideTimer(): void {
        if (this.currentMode === "artwork") {
            this.startArtworkSlideTimer();
        }
    }

    /**
     * 綁定全域互動監聽 (Bind global interaction listeners)
     */
    public setupInteractionListeners(): void {
        // According to US1: Welcome tracks mousedown, touchstart, keypress (no mousemove)
        const baseEvents = ["mousedown", "touchstart", "keypress"];
        baseEvents.forEach((evt) => {
            window.addEventListener(evt, () => this.resetInteraction(), { passive: true });
        });

        // According to US3: Artwork mode IDLE includes mousemove?
        // SDD says "Artwork mode Zen timer tracks mousemove", "Welcome mode doesn't track mousemove"
        window.addEventListener(
            "mousemove",
            () => {
                if (this.currentMode === "artwork") {
                    this.resetInteraction();
                }
            },
            { passive: true },
        );
    }

    private clearArtworkSlideTimer(): void {
        if (this.artworkSlideTimer) {
            clearTimeout(this.artworkSlideTimer);
            this.artworkSlideTimer = null;
        }
    }

    private clearWelcomeTimer(): void {
        if (this.welcomeTimer) {
            clearTimeout(this.welcomeTimer);
            this.welcomeTimer = null;
        }
    }

    private clearZenTimer(): void {
        if (this.zenTimer) {
            clearTimeout(this.zenTimer);
            this.zenTimer = null;
        }
    }

    private startArtworkSlideTimer(): void {
        this.clearArtworkSlideTimer();
        this.artworkSlideTimer = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent("artwork-idle-slide"));
            this.startArtworkSlideTimer(); // Loop
        }, HeroIdleManager.ARTWORK_SLIDE_TIMEOUT);
    }

    private startWelcomeTimer(): void {
        this.clearWelcomeTimer();
        this.welcomeTimer = window.setTimeout(() => {
            console.log("[IdleManager] Welcome idle reached (6s): Transitioning to Zen");
            window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "zen" } }));
        }, HeroIdleManager.WELCOME_IDLE_TIMEOUT);
    }

    private startZenTimer(): void {
        this.clearZenTimer();
        this.zenTimer = window.setTimeout(() => {
            console.log("[IdleManager] Artwork idle reached (15s): Transitioning to Zen");
            window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "zen" } }));
        }, HeroIdleManager.ZEN_IDLE_TIMEOUT);
    }
}
