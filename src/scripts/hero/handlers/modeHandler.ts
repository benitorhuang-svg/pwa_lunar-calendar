import type { HeroIdleManager } from "../idleManager";
import type { HeroImageManager } from "../imageManager";
import type { HeroSlideshowManager } from "../slideshowManager";
import type { ClosePanelsDetail, SlideshowControlDetail, WelcomeModeDetail } from "../types";

import { HeroUIManager } from "../uiManager";

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

    private bindUI(): void {
        // 歡迎畫面遮罩點擊 (Welcome Overlay)
        this.uiManager.bindWelcomeOverlay((e) => {
            e?.stopPropagation();
            this.idleManager.reset();

            // Welcome Overlay Click -> Go to Calendar Mode
            // 統一透過 welcome-mode 事件處理所有清理工作 (Remove initial-welcome, immersion-mode, show grid)
            window.dispatchEvent(
                new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                    detail: { active: false, targetMode: "calendar" },
                }),
            );
        });

        // 沉浸模式手動切換 (Immersion Mode Toggle)
        this.uiManager.bindImmersionMode(() => this.idleManager.reset());

        // 更換圖片/映畫按鈕 (Change Image / Artwork Button)
        this.uiManager.bindChangeImage(() => this.idleManager.reset());

        // Background Click
        this.uiManager.bindBackgroundClick();
    }

    private setupEventListeners(): void {
        // Artwork Idle Slide (New)
        window.addEventListener("artwork-idle-slide", () => {
            this.imageManager.switchHero(1, true);
        });

        // 幻燈片控制 (Slideshow Control)
        window.addEventListener("slideshow-control", ((e: CustomEvent<SlideshowControlDetail>) => {
            const { action, isArtwork } = e.detail;

            if (action === "start") {
                this.idleManager.setArtworkMode(isArtwork !== false);

                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length,
                );

                if (isArtwork !== false) {
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

        // 歡迎模式/沉浸模式 (Welcome/Immersion Mode)
        window.addEventListener("welcome-mode", ((e: CustomEvent<WelcomeModeDetail>) => {
            const { active, targetMode } = e.detail;
            const wasArtwork = this.idleManager.isArtwork;

            // 更新 UI 狀態 (按鈕圖示與樣式)
            this.uiManager.updateImmersionUI(active);

            if (active) {
                document.body.classList.add("immersion-mode");
                this.idleManager.clear();

                // determine if we should enter Artwork mode or Zen mode
                const targetIsArtwork = targetMode === "artwork" ? true : wasArtwork;

                // 進入沉浸模式時強制啟動幻燈片 (Force start slideshow in immersion mode)
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: targetIsArtwork },
                    }),
                );

                if (document.body.classList.contains("initial-welcome")) {
                    this.idleManager.reset();
                }
            } else {
                document.body.classList.remove("immersion-mode");
                document.body.classList.remove("initial-welcome");

                // 停止幻燈片播放 (Stop slideshow)
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "stop" },
                    }),
                );

                // 判斷是否強制切換至 Calendar 或 Artwork，否則執行喚醒邏輯
                if (targetMode === "calendar") {
                    // Explicitly switch to Calendar Mode
                    this.uiManager.updateArtworkModeUI(false);
                    window.dispatchEvent(
                        new CustomEvent<ClosePanelsDetail>("close-panels", {
                            detail: { showGrid: true },
                        }),
                    );
                } else if (targetMode === "artwork") {
                    // Explicitly switch to Artwork Mode (though usually active=true for this)
                    this.uiManager.updateArtworkModeUI(true);
                    window.dispatchEvent(
                        new CustomEvent<ClosePanelsDetail>("close-panels", {
                            detail: { showGrid: false },
                        }),
                    );
                } else {
                    // 喚醒時的還原行為 (Wakeup restoration - default behavior)
                    if (wasArtwork) {
                        // 正處於映畫模式：還原藝廊選單，不顯示日曆網格
                        this.uiManager.updateArtworkModeUI(true);
                        window.dispatchEvent(
                            new CustomEvent<ClosePanelsDetail>("close-panels", {
                                detail: { showGrid: false },
                            }),
                        );
                    } else {
                        // 正處於日曆模式：回到日曆網格封面
                        window.dispatchEvent(
                            new CustomEvent<ClosePanelsDetail>("close-panels", {
                                detail: { showGrid: true },
                            }),
                        );
                    }
                }
            }
        }) as EventListener);
    }
}
