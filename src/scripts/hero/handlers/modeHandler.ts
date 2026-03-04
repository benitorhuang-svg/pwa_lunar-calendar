import type { HeroIdleManager } from "../idleManager";
import type { HeroImageManager } from "../imageManager";
import type { HeroSlideshowManager } from "../slideshowManager";
import type {
    AppMode,
    ClosePanelsDetail,
    ModeChangedDetail,
    SlideshowControlDetail,
    WelcomeModeDetail,
} from "../types";

import { HeroUIManager } from "../uiManager";
import { onTypedEvent } from "../../core/typedEvents";

export class ModeHandler {
    constructor(
        private idleManager: HeroIdleManager,
        private imageManager: HeroImageManager, // Needed for reset logic? Or just slideshowManager handles it.
        private slideshowManager: HeroSlideshowManager,
        private uiManager: HeroUIManager,
    ) { }

    public init(): void {
        this.setupEventListeners();
        this.bindUI();
    }

    private afterEnter(from: AppMode, to: AppMode): void {
        console.log(`[Lifecycle] after-enter-mode: ${from} → ${to}`);

        // 1. Activate timers for new mode
        this.idleManager.activateForMode(to);

        // 2. Handle specific mode entry side effects
        switch (to) {
            case "artwork":
                this.uiManager.updateImmersionUI(true);
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: true },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent<ClosePanelsDetail>("close-panels", {
                        detail: { showGrid: false },
                    }),
                );

                // T210: Fullscreen Exit if coming from Zen
                if (from === "zen") {
                    this.uiManager.toggleFullscreen(false);
                }
                break;

            case "calendar":
                this.uiManager.updateImmersionUI(false);
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "stop" },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent<ClosePanelsDetail>("close-panels", {
                        detail: { showGrid: true },
                    }),
                );
                break;

            case "note":
                this.uiManager.updateImmersionUI(false);
                break;

            case "welcome":
                this.uiManager.updateImmersionUI(true);
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: false },
                    }),
                );
                break;

            case "zen":
                this.uiManager.updateImmersionUI(true);
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: false },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent<ClosePanelsDetail>("close-panels", {
                        detail: { showGrid: false },
                    }),
                );

                // T210: Fullscreen Entry
                this.uiManager.toggleFullscreen(true);

                if (from === "artwork") {
                    this.uiManager.showZenHint();
                }
                break;
        }
    }

    private beforeExit(from: AppMode): void {
        console.log(`[Lifecycle] before-exit-mode: ${from}`);
        this.idleManager.deactivateAll();

        if (from === "calendar") {
            // Placeholder for calendar-specific cleanup if needed
        }
    }

    private bindUI(): void {
        // 歡迎畫面遮罩點擊 (Welcome Overlay)
        this.uiManager.bindWelcomeOverlay((e) => {
            e?.stopPropagation();
            this.idleManager.resetInteraction();

            // Welcome Overlay Click -> Go to Artwork Mode
            window.dispatchEvent(
                new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
            );
        });

        // 沉浸模式手動切換 (Immersion Mode Toggle)
        this.uiManager.bindImmersionMode(() => this.idleManager.resetInteraction());

        // 更換圖片/映畫按鈕 (Change Image / Artwork Button)
        this.uiManager.bindChangeImage(() => this.idleManager.resetInteraction());

        // Background Click
        this.uiManager.bindBackgroundClick();
    }

    private setupEventListeners(): void {
        // T204: 1. beforeExit Stage
        onTypedEvent<ModeChangedDetail>("before-exit-mode", (detail) => {
            this.beforeExit(detail.from);
        });

        // T204: 4. afterEnter Stage (Replaces old mode-changed listener for lifecycle integration)
        onTypedEvent<ModeChangedDetail>("after-enter-mode", (detail) => {
            this.afterEnter(detail.from, detail.to);
        });

        // Artwork Idle Slide
        window.addEventListener("artwork-idle-slide", () => {
            this.imageManager.switchHero(1, true);
        });

        // 幻燈片控制 (Slideshow Control)
        onTypedEvent<SlideshowControlDetail>("slideshow-control", (detail) => {
            const { action, isArtwork } = detail;

            if (action === "start") {
                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length,
                );

                if (isArtwork === true) {
                    this.uiManager.updateArtworkModeUI(true);
                    this.idleManager.resetInteraction();
                    // In Artwork Mode, we rely on IdleManager (artwork-idle-slide)
                    this.slideshowManager.stop();
                } else {
                    this.uiManager.updateArtworkModeUI(false);
                    this.slideshowManager.start(
                        (offset, isAuto) =>
                            this.imageManager.switchHero(offset, isAuto, () =>
                                this.slideshowManager.reset(
                                    (o, a) => this.imageManager.switchHero(o, a),
                                    minImages,
                                ),
                            ),
                        minImages,
                    );
                }
            } else if (action === "stop") {
                this.slideshowManager.stop();
                this.uiManager.updateArtworkModeUI(false);
            }
        });

        // Legacy bridge: welcome-mode -> transition-mode
        onTypedEvent<WelcomeModeDetail>("welcome-mode", (detail) => {
            const { active, targetMode } = detail;

            let to: AppMode;
            if (active) {
                if (targetMode === "artwork") {
                    to = "artwork";
                } else if (targetMode === "zen") {
                    to = "zen";
                } else {
                    to = document.body.classList.contains("initial-welcome") ? "welcome" : "zen";
                }
            } else {
                to = targetMode === "artwork" ? "artwork" : "calendar";
            }

            window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to } }));
        });
    }
}
