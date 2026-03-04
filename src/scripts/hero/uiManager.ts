import type { RequestHeroChangeDetail } from "./types";

import { uiToggleManager } from "../app/uiToggleManager";
import { hideTodayCard, restoreTodayCard } from "../panels/common/atoms";
import { HeroGalleryManager } from "./galleryManager";
import { HeroLayoutManager } from "./ui/layoutManager";
import { HeroModeUIManager } from "./ui/modeUIManager";
import { showToast, hapticFeedback, initToastContainer } from "../core/feedback";

/**
 * Hero UI Manager (Facade)
 * 負責協調 LayoutManager 與 ModeUIManager，但保留事件綁定邏輯
 * Coordinates LayoutManager and ModeUIManager, while keeping event binding logic
 */
export class HeroUIManager {
    /**
     * 檢查日曆視圖是否處於活動狀態
     */
    public get isCalendarActive(): boolean {
        return this.layoutManager.dayBtn?.classList.contains("active") ?? false;
    }
    private btnFaq: HTMLElement | null = null;
    private galleryManager: HeroGalleryManager;
    private layoutManager: HeroLayoutManager;

    private modeUIManager: HeroModeUIManager;
    private zenGestureHint: HTMLElement | null = null;

    constructor() {
        this.layoutManager = new HeroLayoutManager();
        this.galleryManager = new HeroGalleryManager();
        this.modeUIManager = new HeroModeUIManager(this.galleryManager);
    }

    public bindBackgroundClick(): void {
        const handler = (e: MouseEvent) => {
            if (e.button !== 0) return;

            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Ignore interactive elements / overlays / panels
            if (
                target.closest(
                    "button, a, input, textarea, select, .hero-dock, .hero-gallery-submenu, .music-control-wrapper, .faq-panel, .faq-panel-overlay.active, .suspension-panel, .panel-back-overlay, #welcomeInteractionOverlay, .day-cell, #quickSelectorPopup",
                )
            ) {
                return;
            }

            const isImmersion = document.body.classList.contains("immersion-mode");
            const isArtwork = document.body.classList.contains("mode-artwork");
            const isWelcome = document.body.classList.contains("initial-welcome");

            // T213: Background Click Mode Guard
            if (isWelcome) return;

            if (!isImmersion) {
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
                );
                return;
            }

            if (isArtwork) {
                // Artwork Mode -> Zen Mode (Lifecycle will handle Fullscreen)
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "zen" } }));
                return;
            }

            // Zen Mode -> Artwork Mode (Lifecycle will handle Exit Fullscreen)
            window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));
        };

        // Use BUBBLING phase (not capture) so button handlers with
        // stopPropagation() can prevent this from firing.
        // Using capture phase (true) was the root cause of the
        // "immersion button flicker" bug on mobile.
        document.addEventListener("click", handler);

        // T211: Sync mode if user exits fullscreen via system (e.g., ESC key) with Transition Lock Guard
        document.addEventListener("fullscreenchange", () => {
            const isImmersion = document.body.classList.contains("immersion-mode");
            const isArtwork = document.body.classList.contains("mode-artwork");
            const isWelcome = document.body.classList.contains("initial-welcome");

            // Update icon states via body class
            if (document.fullscreenElement) {
                document.body.classList.add("fullscreen-active");
            } else {
                document.body.classList.remove("fullscreen-active");
            }

            // If we're in Zen mode but no longer fullscreen, return to Artwork
            if (isImmersion && !isArtwork && !isWelcome && !document.fullscreenElement) {
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
                );
            }
        });
    }

    // --- 事件綁定 (Event Binding) ---

    public bindChangeImage(resetIdle: () => void): void {
        this.modeUIManager.changeImageBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            resetIdle();
            const isArtwork = document.body.classList.contains("mode-artwork");

            if (isArtwork) {
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "zen" } }));
            } else {
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
                );
                window.dispatchEvent(
                    new CustomEvent<RequestHeroChangeDetail>("request-hero-change", {
                        detail: {
                            changeBg: true,
                            transitionOverride: "slide-from-right",
                        },
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
            resetIdle();

            const isZen =
                !document.body.classList.contains("mode-artwork") &&
                document.body.classList.contains("immersion-mode") &&
                !document.body.classList.contains("initial-welcome");

            if (isZen) {
                // Currently in Fullscreen (Zen) -> go to Windowed Photos (Artwork)
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
                );
            } else {
                // Otherwise -> go to Fullscreen (Zen)
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "zen" } }));
            }
        };
        const btn = this.modeUIManager.immersionBtn;
        btn?.addEventListener("click", handler);
        // Remove old complex handlers to avoid ghost clicks failing to stop propagation
    }

    public bindInstallButton(callback: () => void): void {
        this.layoutManager.installButton?.addEventListener("click", (e) => {
            e.stopPropagation();
            callback();
        });
    }

    public bindNavigation(onPrev: () => void, onNext: () => void): void {
        this.modeUIManager.prevHeroBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            onPrev();
        });
        this.modeUIManager.nextHeroBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            onNext();
        });
    }

    public bindToggleGrid(callback: () => void): void {
        this.layoutManager.dayBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            callback();
        });
    }

    public bindWelcomeOverlay(callback: (e: MouseEvent) => void): void {
        const overlay = this.layoutManager.overlay;
        overlay?.addEventListener("click", (e) => callback(e));
        overlay?.addEventListener("touchstart", (e) => callback(e as unknown as MouseEvent), {
            passive: false,
        });
    }

    // --- 代理子管理器方法 (Delegate Methods) ---

    // Layout
    public hideInstallButton(): void {
        this.layoutManager.hideInstallButton();
    }

    public hidePanelActiveStates(): void {
        this.layoutManager.removeActiveState(this.layoutManager.dayBtn);
        this.layoutManager.removeActiveState(this.modeUIManager.changeImageBtn);
    }

    public init(): void {
        this.layoutManager.init();
        this.galleryManager.init();
        this.modeUIManager.init();

        this.zenGestureHint = document.getElementById("zenGestureHint");
        initToastContainer(document.getElementById("toastContainer"));
        this.btnFaq = document.getElementById("btnFaq");

        this.bindGlobalActions();
        this.bindFaqButton();
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

    public showInstallButton(): void {
        this.layoutManager.showInstallButton();
    }

    public showZenHint(): void {
        this.showZenGestureHint();
    }

    public toggleFullscreen(enable: boolean): void {
        if (enable) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    console.warn(`Fullscreen request failed: ${err.message}`);
                });
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch((err) => {
                    console.warn(`Fullscreen exit failed: ${err.message}`);
                });
            }
        }
    }

    public toggleGridView(show: boolean): void {
        this.layoutManager.toggleGridView(show);
        if (show) {
            this.galleryManager.setVisibility(false);
        }
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

    public updatePanelsForType(_type?: "today" | "yearMonth"): void {
        this.layoutManager.updatePanelsForType(_type);
        this.modeUIManager.changeImageBtn?.classList.remove("active");
    }

    private bindFaqButton(): void {
        const panelFAQ = document.getElementById("panelFAQ");

        // Register FAQ with UIToggleManager
        uiToggleManager.register({
            close: () => {
                panelFAQ?.classList.remove("panel-force-show");
                this.btnFaq?.classList.remove("active");
                restoreTodayCard();
            },
            id: "faq",
            open: () => {
                // Ensure we leave calendar mode (hide grid) when opening a panel
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));

                hideTodayCard();
                panelFAQ?.classList.add("panel-force-show");
                this.btnFaq?.classList.add("active");
            },
        });

        this.btnFaq?.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!panelFAQ) return;

            const isVisible = panelFAQ.classList.contains("panel-force-show");
            uiToggleManager.toggle("faq", isVisible);

            hapticFeedback("light");
        });

        // Close FAQ when clicking its background area
        panelFAQ?.addEventListener("click", (e) => {
            if (e.target === panelFAQ) {
                uiToggleManager.toggle("faq", true);
            }
        });

        // Close panels when entering modes that shouldn't have them
        window.addEventListener("transition-mode", (e: any) => {
            const toMode = e.detail?.to;
            if (toMode === "calendar" || toMode === "zen" || toMode === "welcome") {
                uiToggleManager.closeAll();
            }
        });
    }

    private bindGlobalActions(): void {
        // Since the Share Button is inside a dynamically rendered panel,
        // we listen for the render event to bind it.
        window.addEventListener("today-panel-rendered", () => {
            const btn = document.getElementById("btnShareCard");
            btn?.addEventListener("click", () => {
                this.shareAppContent();
                hapticFeedback("medium");
            });
        });

        // Add haptic to dock items
        const dockItems = document.querySelectorAll(".hero-dock-item");
        dockItems.forEach((item) => {
            item.addEventListener("click", () => hapticFeedback("light"));
        });
    }

    private async shareAppContent(): Promise<void> {
        if (!navigator.share) {
            showToast("您的瀏覽器不支援原生分享", "info");
            return;
        }

        try {
            const title = "Lunar Calendar | 數位農曆";
            const text = "在這個安靜的時刻，與您分享這份歲月靜好。";
            const url = window.location.href;

            await navigator.share({ text, title, url });
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                console.error("Share failed:", err);
            }
        }
    }

    private showZenGestureHint(): void {
        const hasShown = localStorage.getItem("hasShownZenHint");
        if (!hasShown && this.zenGestureHint) {
            this.zenGestureHint.classList.add("show");
            localStorage.setItem("hasShownZenHint", "true");

            // Auto hide handled by CSS animation, but remove class to reset state
            setTimeout(() => {
                this.zenGestureHint?.classList.remove("show");
            }, 4600);
        }
    }
}
