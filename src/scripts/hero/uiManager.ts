import type {
    ClosePanelsDetail,
    RequestHeroChangeDetail,
    SlideshowControlDetail,
    WelcomeModeDetail,
} from "./types";

/**
 * Hero UI Manager
 * 負責管理 Hero 區域的所有 UI 元素、狀態切換與事件綁定
 * Manages all UI elements, state transitions, and event bindings for the Hero section
 */
export class HeroUIManager {
    /**
     * 檢查日曆視圖是否處於活動狀態
     * Check if the calendar view is currently active
     */
    public get isCalendarActive(): boolean {
        return this.btnDay?.classList.contains("active") ?? false;
    }
    // Buttons
    private btnChangeImage: HTMLElement | null = null;
    private btnDay: HTMLElement | null = null;

    private btnNextHero: HTMLElement | null = null;
    private btnPrevHero: HTMLElement | null = null;

    private btnYearMonth: HTMLElement | null = null;

    // Gallery Management
    private btnGalleryMenu: HTMLElement | null = null;
    private gallerySubmenu: HTMLElement | null = null;
    private btnGalleryAdd: HTMLElement | null = null;
    private btnGalleryFitToggle: HTMLElement | null = null;
    private textGalleryFit: HTMLElement | null = null;
    private galleryInput: HTMLInputElement | null = null;
    private submenuItems: NodeListOf<HTMLElement> | null = null;
    // Containers & Overlays
    private heroBgContainer: HTMLElement | null = null;
    private heroDockWrapper: HTMLElement | null = null;
    private heroHeader: HTMLElement | null = null;
    private installBtn: HTMLElement | null = null;

    private welcomeOverlay: HTMLElement | null = null;

    /**
     * 綁定背景點擊事件 (處理沉浸模式)
     * Bind background click event (Handle immersion mode)
     */
    public bindBackgroundClick(isArtworkMode: () => boolean): void {
        this.heroBgContainer?.addEventListener("click", (e) => {
            // 忽略點擊背景內的其他互動元素
            // Ignore clicks on interactive elements within background
            if (
                e.target !== this.heroBgContainer &&
                !(e.target as HTMLElement).classList.contains("hero-bg-item")
            )
                return;

            const isImmersion = document.body.classList.contains("immersion-mode");
            const isArtwork = isArtworkMode();

            // 若在映畫模式且非沉浸模式，點擊背景進入沉浸模式
            // If in artwork mode and not immersion, click bg to enter immersion
            if (!isImmersion && isArtwork) {
                window.dispatchEvent(
                    new CustomEvent<WelcomeModeDetail>("welcome-mode", {
                        detail: { active: true },
                    }),
                );
            }
        });
    }

    // --- 事件綁定函數 (Event Binding Functions) ---

    /**
     * 綁定更換圖片按鈕事件 (切換映畫模式)
     * Bind change image button event (Toggle artwork mode)
     */
    public bindChangeImage(resetIdle: () => void, isArtworkMode: () => boolean): void {
        this.btnChangeImage?.addEventListener("click", () => {
            resetIdle();
            const isArtwork = isArtworkMode();

            if (isArtwork) {
                // 退出映畫模式
                // Exit Artwork Mode
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
                // 進入映畫模式
                // Enter Artwork Mode
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

    // --- PWA Helper ---
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

    public bindWelcomeOverlay(callback: () => void): void {
        const handler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            callback();
        };

        if (this.welcomeOverlay) {
            this.welcomeOverlay.addEventListener("click", handler);
            this.welcomeOverlay.addEventListener("touchstart", handler, { passive: false });
            // Add a transparent background to ensure it's clickable in all browsers
            this.welcomeOverlay.style.background = "rgba(0,0,0,0)";
        }
    }

    public bindGalleryControls(
        onFileSelect: (files: FileList) => void,
        onModeChange: (mode: "default" | "custom" | "hybrid") => void,
        onFitToggle: (isContain: boolean) => void
    ): void {
        // Toggle Submenu
        this.btnGalleryMenu?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.gallerySubmenu?.classList.toggle("show");
        });

        // Toggle Fit Mode
        this.btnGalleryFitToggle?.addEventListener("click", () => {
            const isContain = !document.body.classList.contains("bg-fit-contain");
            onFitToggle(isContain);

            if (this.textGalleryFit) {
                this.textGalleryFit.textContent = isContain ? "填滿畫面" : "完整顯示";
            }
            this.gallerySubmenu?.classList.remove("show");
        });

        // Close submenu when clicking outside
        const closeSubmenu = (e: MouseEvent) => {
            if (this.gallerySubmenu?.classList.contains("show") &&
                !this.gallerySubmenu.contains(e.target as Node) &&
                e.target !== this.btnGalleryMenu) {
                this.gallerySubmenu.classList.remove("show");
            }
        };
        document.addEventListener("click", closeSubmenu);

        // Add Button -> Trigger hidden input
        this.btnGalleryAdd?.addEventListener("click", () => {
            this.galleryInput?.click();
            this.gallerySubmenu?.classList.remove("show");
        });

        // File Input Change
        this.galleryInput?.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                onFileSelect(files);
            }
        });

        // Mode Switching
        this.submenuItems?.forEach(item => {
            item.addEventListener("click", () => {
                const mode = item.dataset.mode as "default" | "custom" | "hybrid";
                if (mode) {
                    onModeChange(mode);
                    // Update Active UI
                    this.submenuItems?.forEach(i => i.classList.remove("active"));
                    item.classList.add("active");
                    this.gallerySubmenu?.classList.remove("show");
                }
            });
        });
    }

    public hideInstallButton(): void {
        if (this.installBtn) this.installBtn.style.display = "none";
    }

    // --- UI 狀態控制函數 (UI State Control Functions) ---

    public hidePanelActiveStates(): void {
        this.btnYearMonth?.classList.remove("active");
    }

    /**
     * 初始化 UI 管理器，選取所有必要的 DOM 元素
     * Initialize UI Manager, querying all necessary DOM elements
     */
    public init(): void {
        this.heroDockWrapper = document.querySelector(".hero-dock-wrapper");
        this.heroHeader = document.querySelector(".hero-header");
        this.welcomeOverlay = document.getElementById("welcomeInteractionOverlay");

        this.btnDay = document.getElementById("btnDay");
        this.btnYearMonth = document.getElementById("btnYearMonth");
        this.btnChangeImage = document.getElementById("btnChangeImage");
        this.btnPrevHero = document.getElementById("btnPrevHero");
        this.btnNextHero = document.getElementById("btnNextHero");

        this.heroBgContainer = document.getElementById("heroBgContainer");
        this.installBtn = document.getElementById("installBtn");

        // Gallery
        this.btnGalleryMenu = document.getElementById("btnGalleryMenu");
        this.gallerySubmenu = document.getElementById("gallerySubmenu");
        this.btnGalleryAdd = document.getElementById("btnGalleryAdd");
        this.btnGalleryFitToggle = document.getElementById("btnGalleryFitToggle");
        this.textGalleryFit = document.getElementById("textGalleryFit");
        this.galleryInput = document.getElementById("galleryInput") as HTMLInputElement;
        this.submenuItems = document.querySelectorAll(".submenu-item[data-mode]");
    }

    public showInstallButton(): void {
        if (this.installBtn) this.installBtn.style.display = "block";
    }

    /**
     * 切換網格視圖顯示狀態
     * Toggle grid view visibility
     */
    public toggleGridView(show: boolean): void {
        if (show) {
            if (this.heroDockWrapper) {
                this.heroDockWrapper.classList.remove("hidden");
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            }
            this.btnDay?.classList.add("active");
            this.btnChangeImage?.classList.remove("active");
            if (this.btnYearMonth) {
                this.btnYearMonth.classList.remove("active");
                this.btnYearMonth.style.display = "flex";
            }
            if (this.heroHeader) this.heroHeader.style.opacity = "1";

            // 日曆模式隱藏藝廊選單 (Hide gallery menu in calendar mode)
            if (this.btnGalleryMenu) this.btnGalleryMenu.style.display = "none";
        } else {
            this.btnDay?.classList.remove("active");
        }
    }

    /**
     * 更新映畫模式的 UI 狀態
     * Update UI state for Artwork Mode
     */
    public updateArtworkModeUI(isArtwork: boolean): void {
        if (isArtwork) {
            this.btnChangeImage?.classList.add("active");
            if (this.btnYearMonth) this.btnYearMonth.style.display = "none";
            this.btnDay?.classList.remove("active");
            this.btnYearMonth?.classList.remove("active");

            // 映畫模式隱藏左上角日期 (Hide top-left date in artwork mode)
            if (this.heroHeader) {
                this.heroHeader.style.opacity = "0";
                this.heroHeader.style.pointerEvents = "none";
            }
        } else {
            this.btnChangeImage?.classList.remove("active");
            if (this.btnYearMonth) this.btnYearMonth.style.display = "flex";

            // 恢復左上角日期 (Restore top-left date)
            if (this.heroHeader) {
                this.heroHeader.style.opacity = "1";
                this.heroHeader.style.pointerEvents = "auto";
            }

            // 非映畫模式隱藏藝廊選單 (Hide gallery menu when not in artwork mode)
            if (this.btnGalleryMenu) this.btnGalleryMenu.style.display = "none";
        }
    }

    /**
     * 切換背景適應模式 (Toggle background fit mode)
     */
    public setBackgroundFit(isContain: boolean): void {
        const items = document.querySelectorAll(".hero-bg-item");
        items.forEach(item => {
            (item as HTMLElement).style.backgroundSize = isContain ? "contain" : "cover";
            (item as HTMLElement).style.backgroundRepeat = "no-repeat";
            (item as HTMLElement).style.backgroundColor = isContain ? "#000" : "transparent";
        });

        // Update persistent default via body class
        if (isContain) {
            document.body.classList.add("bg-fit-contain");
        } else {
            document.body.classList.remove("bg-fit-contain");
        }
    }

    /**
     * 根據面板類型更新 UI 顯示 (今日資訊 或 年月選擇)
     * Update panels based on type (Today Info or Year/Month Selector)
     */
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
}
