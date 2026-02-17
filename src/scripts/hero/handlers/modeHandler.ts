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

export class ModeHandler {
    constructor(
        private idleManager: HeroIdleManager,
        private imageManager: HeroImageManager, // Needed for reset logic? Or just slideshowManager handles it.
        private slideshowManager: HeroSlideshowManager,
        private uiManager: HeroUIManager,
    ) {}

    public init(): void {
        this.setupEventListeners();
        this.bindUI();
    }

    private bindUI(): void {
        // 歡迎畫面遮罩點擊 (Welcome Overlay)
        this.uiManager.bindWelcomeOverlay((e) => {
            e?.stopPropagation();
            this.idleManager.reset();

            // Welcome Overlay Click -> Go to Calendar Mode
            window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "calendar" } }));
        });

        // 沉浸模式手動切換 (Immersion Mode Toggle)
        this.uiManager.bindImmersionMode(() => this.idleManager.reset());

        // 更換圖片/映畫按鈕 (Change Image / Artwork Button)
        this.uiManager.bindChangeImage(() => this.idleManager.reset());

        // Background Click
        this.uiManager.bindBackgroundClick();
    }

    private setupEventListeners(): void {
        // Centralized mode side effects (single source of truth)
        window.addEventListener("mode-changed", ((e: CustomEvent<ModeChangedDetail>) => {
            this.applyModeSideEffects(e.detail.from, e.detail.to);
        }) as EventListener);

        // Artwork Idle Slide (New)
        window.addEventListener("artwork-idle-slide", () => {
            this.imageManager.switchHero(1, true);
        });

        // 幻燈片控制 (Slideshow Control)
        window.addEventListener("slideshow-control", ((e: CustomEvent<SlideshowControlDetail>) => {
            const { action, isArtwork } = e.detail;

            if (action === "start") {
                this.idleManager.setArtworkMode(isArtwork === true);

                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length,
                );

                if (isArtwork === true) {
                    this.uiManager.updateArtworkModeUI(true);
                    this.idleManager.reset();
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
                this.idleManager.setArtworkMode(false);
                this.slideshowManager.stop();
                this.uiManager.updateArtworkModeUI(false);
            }
        }) as EventListener);

        // Legacy bridge: welcome-mode -> transition-mode
        window.addEventListener("welcome-mode", ((e: CustomEvent<WelcomeModeDetail>) => {
            const { active, targetMode } = e.detail;

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
        }) as EventListener);
    }

    private applyModeSideEffects(from: AppMode, to: AppMode): void {
        switch (to) {
            case "welcome":
                this.idleManager.clear();
                this.uiManager.updateImmersionUI(true);
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: false },
                    }),
                );
                break;
            case "artwork":
                this.idleManager.clear();
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
                this.idleManager.reset();
                break;
            case "zen":
                this.idleManager.clear();
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
                if (from === "artwork") {
                    this.uiManager.showZenHint();
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
        }
    }
}
