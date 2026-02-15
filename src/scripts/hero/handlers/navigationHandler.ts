import type { HeroIdleManager } from "../idleManager";
import type { HeroImageManager } from "../imageManager";
import type { HeroSlideshowManager } from "../slideshowManager";
import type { ClosePanelsDetail, NavigateMonthDetail, RenderHeroDetail, SlideshowControlDetail, WelcomeModeDetail } from "../types";
import { HeroUIManager } from "../uiManager";

export class NavigationHandler {
    constructor(
        private idleManager: HeroIdleManager,
        private imageManager: HeroImageManager,
        private slideshowManager: HeroSlideshowManager,
        private uiManager: HeroUIManager
    ) { }

    public init(): void {
        this.bindNavigationEvents();
        this.bindGlobalEvents();
    }

    public handleNavigation(direction: number): void {
        this.idleManager.reset();

        // 映畫模式下切換圖片 (Switch images in Artwork Mode)
        if (this.idleManager.isArtwork) {
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

    private bindNavigationEvents(): void {
        // 導航按鈕 (Navigation Buttons)
        this.uiManager.bindNavigation(
            () => this.handleNavigation(-1),
            () => this.handleNavigation(1),
        );

        // 綁定「切換視圖」按鈕 (Bind Header View Toggle)
        this.uiManager.bindHeaderToggle((e) => {
            e.stopPropagation();
            this.idleManager.reset();

            const isImmersion = document.body.classList.contains("immersion-mode") ||
                document.body.classList.contains("initial-welcome");

            if (isImmersion) {
                // Go to Calendar Grid
                window.dispatchEvent(
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", { detail: { active: false, targetMode: "calendar" } }),
                );
                document.body.classList.remove("initial-welcome");
                window.dispatchEvent(
                    new CustomEvent<ClosePanelsDetail>("close-panels", { detail: { showGrid: true } }),
                );
            } else {
                // Go to Immersion Mode (Artwork Mode)
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
                window.dispatchEvent(
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", { detail: { active: true } }),
                );
            }
        });
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
}
