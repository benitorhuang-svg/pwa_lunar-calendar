import type { HeroIdleManager } from "../idleManager";
import type { HeroImageManager } from "../imageManager";
import type { HeroSlideshowManager } from "../slideshowManager";
import type { NavigateMonthDetail, RenderHeroDetail } from "../types";

import { HeroUIManager } from "../uiManager";

export class NavigationHandler {
    constructor(
        private idleManager: HeroIdleManager,
        private imageManager: HeroImageManager,
        private slideshowManager: HeroSlideshowManager,
        private uiManager: HeroUIManager,
    ) {}

    public handleNavigation(direction: number): void {
        this.idleManager.resetInteraction();

        // 映畫模式下切換圖片 (Switch images in Artwork Mode OR Zen Mode)
        // Check if body has immersion-mode class (Zen) or mode-artwork class
        const isImmersion = document.body.classList.contains("immersion-mode");
        const isArtwork = document.body.classList.contains("mode-artwork");

        if (isArtwork || isImmersion) {
            this.imageManager.switchHero(direction, false, () =>
                this.slideshowManager.reset(
                    (o, a) => this.imageManager.switchHero(o, a),
                    Math.max(
                        this.imageManager.specialHeroList.length,
                        this.imageManager.heroList.length,
                    ),
                ),
            );
        } else {
            // 日曆模式下切換月份 (Switch months in Calendar Mode)
            window.dispatchEvent(
                new CustomEvent<NavigateMonthDetail>("navigate-month", { detail: direction }),
            );
        }
    }

    public init(): void {
        this.bindNavigationEvents();
        this.bindGlobalEvents();
    }

    private bindGlobalEvents(): void {
        // 渲染 Hero (Render Hero)
        window.addEventListener("render-hero", ((e: CustomEvent<RenderHeroDetail>) => {
            const { changeBg, date, lunar, transitionOverride } = e.detail;
            this.imageManager.updateHeroLogic(
                changeBg !== undefined ? changeBg : false,
                transitionOverride || null,
                typeof date === "string" ? new Date(date) : date,
                lunar,
            );
        }) as EventListener);
    }

    private bindNavigationEvents(): void {
        // 導航按鈕 (Navigation Buttons)
        this.uiManager.bindNavigation(
            () => this.handleNavigation(-1),
            () => this.handleNavigation(1),
        );
    }
}
