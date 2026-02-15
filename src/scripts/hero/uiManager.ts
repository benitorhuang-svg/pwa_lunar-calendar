import type {
    ClosePanelsDetail,
    RequestHeroChangeDetail,
    SlideshowControlDetail,
    WelcomeModeDetail,
} from "./types";

import { HeroGalleryManager } from "./galleryManager";

/**
 * Hero UI Manager
 * 負責管理 Hero 區域的核心 UI 元素、狀態切換與事件綁定
 * Manages core UI elements, state transitions, and event bindings for the Hero section
 */
export class HeroUIManager {
    /**
     * 檢查日曆視圖是否處於活動狀態
     */
    public get isCalendarActive(): boolean {
        return this.btnDay?.classList.contains("active") ?? false;
    }

    // --- DOM 元素 (Core UI Elements) ---
    private btnChangeImage: HTMLElement | null = null;

    private btnDay: HTMLElement | null = null;

    private btnImmersion: HTMLElement | null = null;
    private btnNextHero: HTMLElement | null = null;
    private btnPrevHero: HTMLElement | null = null;
    private btnYearMonth: HTMLElement | null = null;
    private galleryManager: HeroGalleryManager;
    private heroBgContainer: HTMLElement | null = null;

    private heroDockWrapper: HTMLElement | null = null;
    private heroHeader: HTMLElement | null = null;
    private installBtn: HTMLElement | null = null;
    private welcomeOverlay: HTMLElement | null = null;
    constructor() {
        this.galleryManager = new HeroGalleryManager();
    }

    public bindBackgroundClick(isArtworkMode: () => boolean): void {
        const handler = (e: Event) => {
            e.stopPropagation();
            const isImmersion = document.body.classList.contains("immersion-mode");
            const isArtwork = isArtworkMode();

            if (isImmersion) {
                window.dispatchEvent(
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                        detail: { active: false },
                    }),
                );
                return;
            }

            if (isArtwork) {
                window.dispatchEvent(
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                        detail: { active: true },
                    }),
                );
            }
        };

        this.heroBgContainer?.addEventListener("mousedown", handler);
        this.heroBgContainer?.addEventListener("touchstart", handler, { passive: true });
    }

    // --- 事件綁定 (Event Binding) ---

    public bindChangeImage(resetIdle: () => void, isArtworkMode: () => boolean): void {
        this.btnChangeImage?.addEventListener("click", () => {
            resetIdle();
            const isArtwork = isArtworkMode();

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

    public bindImmersionMode(resetIdle: () => void): void {
        const handler = (e: Event) => {
            e.stopPropagation();
            if (e.type === "mousedown") e.preventDefault();
            const isImmersion = document.body.classList.contains("immersion-mode");
            resetIdle();
            window.dispatchEvent(
                new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                    detail: { active: !isImmersion },
                }),
            );
        };
        this.btnImmersion?.addEventListener("mousedown", handler);
        this.btnImmersion?.addEventListener("touchstart", handler, { passive: false });
    }

    public bindInstallButton(callback: () => void): void {
        this.installBtn?.addEventListener("click", callback);
    }

    public bindNavigation(onPrev: () => void, onNext: () => void): void {
        this.btnPrevHero?.addEventListener("click", onPrev);
        this.btnNextHero?.addEventListener("click", onNext);
    }

    public bindToggleGrid(callback: () => void): void {
        this.btnDay?.addEventListener("click", callback);
    }

    public bindToggleYearMonth(callback: () => void): void {
        this.btnYearMonth?.addEventListener("click", callback);
    }

    public bindWelcomeOverlay(callback: (e: MouseEvent) => void): void {
        this.welcomeOverlay?.addEventListener("click", (e) => callback(e));
        this.welcomeOverlay?.addEventListener(
            "touchstart",
            (e) => callback(e as unknown as MouseEvent),
            {
                passive: false,
            },
        );
    }

    // --- 代理子管理器方法 (Delegate Sub-manager Methods) ---

    public hideInstallButton(): void {
        if (this.installBtn) this.installBtn.style.display = "none";
    }

    public hidePanelActiveStates(): void {
        this.btnYearMonth?.classList.remove("active");
        this.btnDay?.classList.remove("active");
        this.btnChangeImage?.classList.remove("active");
    }

    // --- UI 狀態控制 (State Control) ---

    /**
     * 初始化 UI 管理器 (Initialize UI Manager)
     */
    public init(): void {
        this.heroDockWrapper = document.querySelector(".hero-dock-wrapper");
        this.heroHeader = document.querySelector(".hero-header");
        this.welcomeOverlay = document.getElementById("welcomeInteractionOverlay");

        this.btnDay = document.getElementById("btnDay");
        this.btnYearMonth = document.getElementById("btnYearMonth");
        this.btnChangeImage = document.getElementById("btnChangeImage");
        this.btnImmersion = document.getElementById("btnImmersion");
        this.btnPrevHero = document.getElementById("btnPrevHero");
        this.btnNextHero = document.getElementById("btnNextHero");

        this.heroBgContainer = document.getElementById("heroBgContainer");
        this.installBtn = document.getElementById("installBtn");

        // 初始化子管理器 (Initialize Sub-managers)
        this.galleryManager.init();
    }

    public renderCustomStations(
        stations: { id: string; name: string; url: string }[],
        onDelete: (id: string, name: string) => void,
        onSelect: (name: string, url: string) => void,
    ): void {
        this.galleryManager.renderCustomStations(stations, onDelete, onSelect);
    }

    public setBackgroundFit(isContain: boolean): void {
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

    public showInstallButton(): void {
        if (this.installBtn) this.installBtn.style.display = "block";
    }

    public toggleGridView(show: boolean): void {
        if (show) {
            if (this.heroDockWrapper) {
                this.heroDockWrapper.classList.remove("hidden");
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            }
            if (this.btnYearMonth) this.btnYearMonth.classList.remove("active");
            if (this.heroHeader) this.heroHeader.style.opacity = "1";
            this.galleryManager.setVisibility(false);
            if (this.btnYearMonth) this.btnYearMonth.style.display = "flex";
        } else {
            this.btnDay?.classList.remove("active");
        }
    }

    public updateArtworkModeUI(isArtwork: boolean): void {
        this.updateModeTheme(isArtwork);
        if (isArtwork) {
            this.btnChangeImage?.classList.add("active");
            if (this.btnYearMonth) this.btnYearMonth.style.display = "none";
            this.btnDay?.classList.remove("active");
            this.btnYearMonth?.classList.remove("active");
            if (this.heroHeader) {
                this.heroHeader.style.opacity = "0";
                this.heroHeader.style.pointerEvents = "none";
            }
            this.galleryManager.setVisibility(true);
        } else {
            this.btnChangeImage?.classList.remove("active");
            if (this.heroHeader) {
                this.heroHeader.style.opacity = "1";
                this.heroHeader.style.pointerEvents = "auto";
            }
            this.galleryManager.setVisibility(false);
            if (this.btnYearMonth) this.btnYearMonth.style.display = "flex";
        }
    }

    public updateImmersionUI(active: boolean): void {
        if (active) {
            this.btnImmersion?.classList.add("active");
        } else {
            this.btnImmersion?.classList.remove("active");
        }
    }

    public updatePanelsForType(type?: "today" | "yearMonth"): void {
        if (type === "yearMonth") {
            if (this.btnYearMonth) {
                this.btnYearMonth.style.display = "flex";
                this.btnYearMonth.classList.add("active");
            }
            if (this.heroHeader) this.heroHeader.style.opacity = "1";
            if (this.heroDockWrapper) {
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            }
        } else if (type === "today") {
            if (this.btnYearMonth) {
                this.btnYearMonth.style.display = "none";
                this.btnYearMonth.classList.remove("active");
            }
            if (this.heroHeader) this.heroHeader.style.opacity = "0";
            if (this.heroDockWrapper) {
                this.heroDockWrapper.style.opacity = "0";
                this.heroDockWrapper.style.pointerEvents = "none";
            }
        }
        this.btnDay?.classList.remove("active");
        this.btnChangeImage?.classList.remove("active");
    }

    private updateModeTheme(isArtwork: boolean): void {
        if (isArtwork) {
            document.body.classList.add("mode-artwork");
            this.btnPrevHero?.classList.remove("group-calendar");
            this.btnPrevHero?.classList.add("group-image");
            this.btnNextHero?.classList.remove("group-calendar");
            this.btnNextHero?.classList.add("group-image");
        } else {
            document.body.classList.remove("mode-artwork");
            this.btnPrevHero?.classList.remove("group-image");
            this.btnPrevHero?.classList.add("group-calendar");
            this.btnNextHero?.classList.remove("group-image");
            this.btnNextHero?.classList.add("group-calendar");
        }
    }
}
