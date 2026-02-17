import type {
    RequestHeroChangeDetail,
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
    /**
     * 檢查日曆視圖是否處於活動狀態
     */
    public get isCalendarActive(): boolean {
        return this.layoutManager.dayBtn?.classList.contains("active") ?? false;
    }
    private galleryManager: HeroGalleryManager;
    private layoutManager: HeroLayoutManager;
    private modeUIManager: HeroModeUIManager;
    private toastContainer: HTMLElement | null = null;

    private zenGestureHint: HTMLElement | null = null;

    private faqOverlay: HTMLElement | null = null;
    private btnFaq: HTMLElement | null = null;

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
                    "button, a, input, textarea, select, .hero-dock, .hero-gallery-submenu, .music-control-wrapper, .faq-panel, .faq-panel-overlay.active, .suspension-panel, .panel-back-overlay, #welcomeInteractionOverlay, .day-cell",
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
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));
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

        document.addEventListener("click", handler, true);

        // T211: Sync mode if user exits fullscreen via system (e.g., ESC key) with Transition Lock Guard
        document.addEventListener("fullscreenchange", () => {
            const isImmersion = document.body.classList.contains("immersion-mode");
            const isArtwork = document.body.classList.contains("mode-artwork");
            const isWelcome = document.body.classList.contains("initial-welcome");

            // If we're in Zen mode but no longer fullscreen, return to Artwork
            if (isImmersion && !isArtwork && !isWelcome && !document.fullscreenElement) {
                // Note: Transitioning state is checked in stateManager, 
                // but we dispatch here. Orchestrator's queue will handle it if locked.
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
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));
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
            if (e.type === "mousedown") e.preventDefault();
            resetIdle();

            const isImmersion = document.body.classList.contains("immersion-mode");

            if (isImmersion) {
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "calendar" } }));
            } else {
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));
            }
        };
        const btn = this.modeUIManager.immersionBtn;
        btn?.addEventListener("mousedown", handler);
        btn?.addEventListener("touchstart", handler, { passive: false });
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

    public bindToggleYearMonth(callback: () => void): void {
        this.layoutManager.yearMonthBtn?.addEventListener("click", (e) => {
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

    public hapticFeedback(style: "heavy" | "light" | "medium" = "light"): void {
        if (!("vibrate" in navigator)) return;

        const patterns = {
            heavy: [40, 30, 40],
            light: [10],
            medium: [20],
        };

        navigator.vibrate(patterns[style]);
    }

    // --- 代理子管理器方法 (Delegate Methods) ---

    // Layout
    public hideInstallButton(): void {
        this.layoutManager.hideInstallButton();
    }

    public hidePanelActiveStates(): void {
        this.layoutManager.removeActiveState(this.layoutManager.yearMonthBtn);
        this.layoutManager.removeActiveState(this.layoutManager.dayBtn);
        this.layoutManager.removeActiveState(this.modeUIManager.changeImageBtn);
    }

    public init(): void {
        this.layoutManager.init();
        this.galleryManager.init();
        this.modeUIManager.init();

        this.zenGestureHint = document.getElementById("zenGestureHint");
        this.toastContainer = document.getElementById("toastContainer");
        this.faqOverlay = document.getElementById("faqPanelOverlay");
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

    public showToast(
        message: string,
        type: "error" | "info" = "info",
        action?: { callback: () => void; label: string },
    ): void {
        if (!this.toastContainer) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type === "error" ? "toast-error" : ""}`;

        const content = document.createElement("span");
        content.innerHTML = `<span class="toast-icon">${type === "error" ? "⚠️" : "✨"}</span> ${message}`;
        toast.appendChild(content);

        if (action) {
            const btn = document.createElement("button");
            btn.className = "toast-action";
            btn.textContent = action.label;
            btn.onclick = (e) => {
                e.stopPropagation();
                action.callback();
                toast.classList.add("hiding");
                setTimeout(() => toast.remove(), 400);
                this.hapticFeedback("light");
            };
            toast.appendChild(btn);
        }

        this.toastContainer.appendChild(toast);

        setTimeout(
            () => {
                if (toast.parentElement) {
                    toast.classList.add("hiding");
                    toast.addEventListener("animationend", () => {
                        toast.remove();
                    });
                }
            },
            action ? 6000 : 3000,
        );
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

    public updatePanelsForType(type?: "today" | "yearMonth"): void {
        this.layoutManager.updatePanelsForType(type);
        this.modeUIManager.changeImageBtn?.classList.remove("active");
    }

    public showZenHint(): void {
        this.showZenGestureHint();
    }

    private bindFaqButton(): void {
        const closeBtn = document.getElementById("btnFaqClose");

        this.btnFaq?.addEventListener("click", () => {
            if (this.faqOverlay) {
                const isActive = this.faqOverlay.classList.contains("active");
                if (isActive) {
                    this.faqOverlay.classList.remove("active");
                    this.btnFaq?.classList.remove("active");
                } else {
                    this.faqOverlay.classList.add("active");
                    this.btnFaq?.classList.add("active");

                    // Open first item by default if none are open
                    const openItem = this.faqOverlay.querySelector(".faq-item.open");
                    if (!openItem) {
                        this.faqOverlay.querySelector(".faq-item")?.classList.add("open");
                    }
                }
            }
            this.hapticFeedback("light");
        });

        closeBtn?.addEventListener("click", () => {
            this.faqOverlay?.classList.remove("active");
            this.btnFaq?.classList.remove("active");
        });

        // Accordion functionality for FAQ items
        const faqItems = this.faqOverlay?.querySelectorAll(".faq-item");
        faqItems?.forEach((item) => {
            const question = item.querySelector(".faq-question");
            question?.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = item.classList.contains("open");
                // Close all others
                faqItems.forEach((i) => i.classList.remove("open"));
                // Toggle current
                if (!isOpen) {
                    item.classList.add("open");
                }
                this.hapticFeedback("light");
            });
        });

        // Close on overlay background click
        this.faqOverlay?.addEventListener("click", (e) => {
            if (e.target === this.faqOverlay) {
                this.faqOverlay?.classList.remove("active");
                this.btnFaq?.classList.remove("active");
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
                this.hapticFeedback("medium");
            });
        });

        // Add haptic to dock items
        const dockItems = document.querySelectorAll(".hero-dock-item");
        dockItems.forEach((item) => {
            item.addEventListener("click", () => this.hapticFeedback("light"));
        });
    }

    private async shareAppContent(): Promise<void> {
        if (!navigator.share) {
            this.showToast("您的瀏覽器不支援原生分享", "info");
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
}
