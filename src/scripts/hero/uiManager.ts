import type {
    ClosePanelsDetail,
    RequestHeroChangeDetail,
    SlideshowControlDetail,
    WelcomeModeDetail,
} from "./types";

import { HeroGalleryManager } from "./galleryManager";
import { HeroLayoutManager } from "./ui/layoutManager";
import { HeroModeUIManager } from "./ui/modeUIManager";

/**
 * Hero UI Manager (Facade)
 * 負責協調 LayoutManager 與 ModeUIManager，但保留事件綁定邏輯
 * Coordinates LayoutManager and ModeUIManager, while keeping event binding logic
 */
export class HeroUIManager {
    private layoutManager: HeroLayoutManager;
    private modeUIManager: HeroModeUIManager;
    private galleryManager: HeroGalleryManager;
    private heroBgContainer: HTMLElement | null = null;

    constructor() {
        this.layoutManager = new HeroLayoutManager();
        this.galleryManager = new HeroGalleryManager();
        this.modeUIManager = new HeroModeUIManager(this.galleryManager);
    }

    /**
     * 檢查日曆視圖是否處於活動狀態
     */
    public get isCalendarActive(): boolean {
        return this.layoutManager.dayBtn?.classList.contains("active") ?? false;
    }

    public init(): void {
        this.layoutManager.init();
        this.galleryManager.init();
        this.modeUIManager.init();

        this.heroBgContainer = document.getElementById("heroBgContainer");
    }

    // --- 事件綁定 (Event Binding) ---

    public bindBackgroundClick(): void {
        const handler = (e: Event) => {
            // Check if we are interacting with a control that shouldn't trigger background click
            if ((e.target as HTMLElement).closest('button, .hero-dock, .hero-gallery-submenu, .music-control-wrapper')) {
                return;
            }

            e.stopPropagation();

            const isImmersion = document.body.classList.contains("immersion-mode");
            const isArtwork = document.body.classList.contains("mode-artwork");

            if (!isImmersion) {
                // Status 2 (Calendar) -> Status 3 (Artwork)
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
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                        detail: { active: true, targetMode: "artwork" },
                    }),
                );
            } else {
                if (isArtwork) {
                    // Status 3 (Artwork) -> Status 4 (Zen)
                    // We stay in immersion mode but disable Artwork UI
                    window.dispatchEvent(
                        new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                            detail: { action: "start", isArtwork: false },
                        }),
                    );
                } else {
                    // Status 4 (Zen) -> Status 3 (Artwork)
                    window.dispatchEvent(
                        new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                            detail: { action: "start", isArtwork: true },
                        }),
                    );
                }
            }
        };

        this.heroBgContainer?.addEventListener("mousedown", handler);
        this.heroBgContainer?.addEventListener("touchstart", handler, { passive: true });
    }

    public bindChangeImage(resetIdle: () => void): void {
        this.modeUIManager.changeImageBtn?.addEventListener("click", () => {
            resetIdle();
            const isArtwork = document.body.classList.contains("mode-artwork");

            if (isArtwork) {
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
            } else {
                window.dispatchEvent(
                    new CustomEvent<SlideshowControlDetail>("slideshow-control", {
                        detail: { action: "start", isArtwork: true },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent<RequestHeroChangeDetail>("request-hero-change", {
                        detail: {
                            changeBg: true,
                            transitionOverride: "slide-from-right",
                        },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent<ClosePanelsDetail>("close-panels", {
                        detail: { showGrid: false },
                    }),
                );
            }
        });
    }

    public bindGalleryControls(callbacks: {
        onClear: () => void;
        onFileSelect: (files: FileList) => void;
        onFitToggle: (isContain: boolean) => void;
        onModeChange: (mode: "custom" | "default" | "hybrid") => void;
        onMusicUrlInput: (name: string, url: string) => void;
        onPlay?: (url: string) => void;
        onStationDelete?: (id: string, name: string) => void;
    }): void {
        this.galleryManager.bindControls(callbacks);
    }

    public bindHeaderToggle(callback: (e: MouseEvent) => void): void {
        this.layoutManager.headerToggleBtn?.addEventListener("click", (e) => callback(e as MouseEvent));
    }

    public bindImmersionMode(resetIdle: () => void): void {
        const handler = (e: Event) => {
            e.stopPropagation();
            if (e.type === "mousedown") e.preventDefault();
            resetIdle();

            const isImmersion = document.body.classList.contains("immersion-mode");


            if (isImmersion) {
                // Immersion (Zen or Artwork) -> Calendar Mode
                window.dispatchEvent(
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                        detail: { active: false, targetMode: "calendar" },
                    }),
                );
            } else {
                // Calendar Mode -> Artwork Mode
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
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                        detail: { active: true },
                    }),
                );
            }
        };
        const btn = this.modeUIManager.immersionBtn;
        btn?.addEventListener("mousedown", handler);
        btn?.addEventListener("touchstart", handler, { passive: false });
    }

    public bindInstallButton(callback: () => void): void {
        this.layoutManager.installButton?.addEventListener("click", callback);
    }

    public bindNavigation(onPrev: () => void, onNext: () => void): void {
        this.modeUIManager.prevHeroBtn?.addEventListener("click", onPrev);
        this.modeUIManager.nextHeroBtn?.addEventListener("click", onNext);
    }

    public bindToggleGrid(callback: () => void): void {
        this.layoutManager.dayBtn?.addEventListener("click", callback);
    }

    public bindToggleYearMonth(callback: () => void): void {
        this.layoutManager.yearMonthBtn?.addEventListener("click", callback);
    }

    public bindWelcomeOverlay(callback: (e: MouseEvent) => void): void {
        const overlay = this.layoutManager.overlay;
        overlay?.addEventListener("click", (e) => callback(e));
        overlay?.addEventListener(
            "touchstart",
            (e) => callback(e as unknown as MouseEvent),
            { passive: false },
        );
    }

    // --- 代理子管理器方法 (Delegate Methods) ---

    // Layout
    public hideInstallButton(): void {
        this.layoutManager.hideInstallButton();
    }

    public showInstallButton(): void {
        this.layoutManager.showInstallButton();
    }

    public hidePanelActiveStates(): void {
        this.layoutManager.removeActiveState(this.layoutManager.yearMonthBtn);
        this.layoutManager.removeActiveState(this.layoutManager.dayBtn);
        this.layoutManager.removeActiveState(this.modeUIManager.changeImageBtn);
    }

    public toggleGridView(show: boolean): void {
        this.layoutManager.toggleGridView(show);
        if (show) {
            this.galleryManager.setVisibility(false);
        }
    }

    public updatePanelsForType(type?: "today" | "yearMonth"): void {
        this.layoutManager.updatePanelsForType(type);
        this.modeUIManager.changeImageBtn?.classList.remove("active");
    }

    // Mode
    public updateArtworkModeUI(isArtwork: boolean): void {
        // Pass layoutManager to allow mode manager to control layout visibility
        this.modeUIManager.updateArtworkModeUI(isArtwork, this.layoutManager);
    }

    public updateImmersionUI(active: boolean): void {
        this.modeUIManager.updateImmersionUI(active);
    }

    public updateModeTheme(isArtwork: boolean): void {
        this.modeUIManager.updateModeTheme(isArtwork);
    }

    // Gallery Delegate
    public renderCustomStations(
        stations: { id: string; name: string; url: string }[],
        onDelete: (id: string, name: string) => void,
        onSelect: (name: string, url: string) => void,
    ): void {
        this.galleryManager.renderCustomStations(stations, onDelete, onSelect);
    }

    public setBackgroundFit(isContain: boolean): void {
        // Logic could move to LayoutManager or ModeManager, but it affects global body class
        const items = document.querySelectorAll(".hero-bg-item");
        items.forEach((item) => {
            (item as HTMLElement).style.backgroundSize = isContain ? "contain" : "cover";
            (item as HTMLElement).style.backgroundRepeat = "no-repeat";
            (item as HTMLElement).style.backgroundColor = isContain ? "#000" : "transparent";
        });
        if (isContain) {
            document.body.classList.add("bg-fit-contain");
        } else {
            document.body.classList.remove("bg-fit-contain");
        }
    }
}
