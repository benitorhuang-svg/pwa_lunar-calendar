/**
 * Hero Event Handlers
 * 負責 Hero 相關的事件監聽和處理 (Responsible for Hero-related event listening and handling)
 */

import type { HeroIdleManager } from "./idleManager";
import type { HeroImageManager } from "./imageManager";
import type { HeroSlideshowManager } from "./slideshowManager";

export class HeroEventHandlers {
    private heroDockWrapper: HTMLElement | null = null;
    private heroHeader: HTMLElement | null = null;
    private idleManager: HeroIdleManager;
    private imageManager: HeroImageManager;
    private slideshowManager: HeroSlideshowManager;
    private welcomeOverlay: HTMLElement | null = null;

    constructor(
        imageManager: HeroImageManager,
        slideshowManager: HeroSlideshowManager,
        idleManager: HeroIdleManager,
    ) {
        this.imageManager = imageManager;
        this.slideshowManager = slideshowManager;
        this.idleManager = idleManager;
    }

    public init(): void {
        this.heroDockWrapper = document.querySelector(".hero-dock-wrapper");
        this.heroHeader = document.querySelector(".hero-header");
        this.welcomeOverlay = document.getElementById("welcomeInteractionOverlay");

        this.setupEventListeners();
        this.setupUIHandlers();
        this.setupPWAInstall();
        this.setupTouchGestures();
    }

    private handleNavigation(direction: number): void {
        this.idleManager.reset();
        const btnDay = document.getElementById("btnDay");
        const isCalendarActive = btnDay?.classList.contains("active");

        if (isCalendarActive) {
            window.dispatchEvent(new CustomEvent("navigate-month", { detail: direction }));
        } else {
            this.imageManager.switchHero(direction, false, () =>
                this.slideshowManager.reset(
                    (o, a) => this.imageManager.switchHero(o, a),
                    Math.max(
                        this.imageManager.specialHeroList.length,
                        this.imageManager.heroList.length,
                    ),
                ),
            );
        }
    }

    private setupTouchGestures(): void {
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50; // Minimum distance for a swipe
        const maxVerticalVariance = 50; // Maximum vertical movement allowed

        document.body.addEventListener(
            "touchstart",
            (e: TouchEvent) => {
                const touch = e.changedTouches[0];
                if (touch) {
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                }
            },
            { passive: true },
        );

        document.body.addEventListener(
            "touchend",
            (e: TouchEvent) => {
                const touch = e.changedTouches[0];
                if (!touch) return;

                const touchEndX = touch.clientX;
                const touchEndY = touch.clientY;

                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;

                // Check if it's a horizontal swipe
                if (
                    Math.abs(diffX) > minSwipeDistance &&
                    Math.abs(diffY) < maxVerticalVariance
                ) {
                    // Reset idle time on user interaction
                    this.idleManager.reset();

                    // Swipe Left (Next)
                    if (diffX < 0) {
                        this.handleNavigation(1);
                    }
                    // Swipe Right (Prev)
                    else {
                        this.handleNavigation(-1);
                    }
                }
            },
            { passive: true },
        );
    }

    private setupEventListeners(): void {
        // Render Hero
        window.addEventListener("render-hero", (e: any) => {
            const { changeBg, date, lunar, transitionOverride } = e.detail;
            this.imageManager.updateHeroLogic(changeBg, transitionOverride, date, lunar);
        });

        // Slideshow Control
        window.addEventListener("slideshow-control", (e: any) => {
            const { action } = e.detail;
            if (action === "start") {
                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length,
                );
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
            if (action === "stop") {
                this.slideshowManager.stop();
            }
        });

        // Welcome Mode
        window.addEventListener("welcome-mode", (e: any) => {
            const { active } = e.detail;
            if (active) {
                document.body.classList.add("immersion-mode");
                this.idleManager.clear();

                // 進入沉浸模式時強制啟動幻燈片 (Force start slideshow in immersion mode)
                window.dispatchEvent(
                    new CustomEvent("slideshow-control", {
                        detail: { action: "start", isArtwork: false },
                    }),
                );

                if (document.body.classList.contains("initial-welcome")) {
                    this.idleManager.reset();
                }
            } else {
                document.body.classList.remove("immersion-mode");
                document.body.classList.remove("initial-welcome");

                // 退出沉浸模式時暫停幻燈片，交由 Orchestrator 決定是否繼續播放
                // (Stop slideshow when exiting, let Orchestrator decide if it should continue)
                window.dispatchEvent(
                    new CustomEvent("slideshow-control", {
                        detail: { action: "stop" },
                    }),
                );
            }
        });

        // Toggle Grid View
        window.addEventListener("toggle-grid-view", (e: any) => {
            const { show } = e.detail;
            const btnYM = document.getElementById("btnYearMonth");
            const btnDay = document.getElementById("btnDay");
            const btnChangeImage = document.getElementById("btnChangeImage");

            if (show) {
                if (this.heroDockWrapper) {
                    this.heroDockWrapper.classList.remove("hidden");
                    this.heroDockWrapper.style.opacity = "1";
                    this.heroDockWrapper.style.pointerEvents = "auto";
                }
                if (btnDay) btnDay.classList.add("active");
                if (btnChangeImage) btnChangeImage.classList.remove("active");
                if (btnYM) {
                    btnYM.classList.remove("active");
                    btnYM.style.display = "flex";
                }

                if (this.heroHeader) this.heroHeader.style.opacity = "1";
            } else {
                if (btnDay) btnDay.classList.remove("active");
            }
        });

        // Render Panels
        window.addEventListener("render-panels", (e: any) => {
            const { type } = e.detail || {};
            const btnYM = document.getElementById("btnYearMonth");
            const btnDay = document.getElementById("btnDay");
            const btnChangeImage = document.getElementById("btnChangeImage");

            if (type === "yearMonth") {
                if (btnYM) {
                    btnYM.style.display = "flex";
                    btnYM.classList.add("active");
                }
                if (this.heroHeader) this.heroHeader.style.opacity = "1";
                if (this.heroDockWrapper) {
                    this.heroDockWrapper.style.opacity = "1";
                    this.heroDockWrapper.style.pointerEvents = "auto";
                }
            } else if (type === "today") {
                if (btnYM) {
                    btnYM.style.display = "none";
                    btnYM.classList.remove("active");
                }
                if (this.heroHeader) this.heroHeader.style.opacity = "0";
                if (this.heroDockWrapper) {
                    this.heroDockWrapper.style.opacity = "0";
                    this.heroDockWrapper.style.pointerEvents = "none";
                }
            }

            if (btnDay) btnDay.classList.remove("active");
            if (btnChangeImage) btnChangeImage.classList.remove("active");
        });

        // Hide Panels
        window.addEventListener("hide-panels", () => {
            const btnYM = document.getElementById("btnYearMonth");
            if (btnYM) btnYM.classList.remove("active");
        });

        // Slideshow Control with Artwork Mode
        window.addEventListener("slideshow-control", (e: any) => {
            const { action, isArtwork } = e.detail;
            const btnYM = document.getElementById("btnYearMonth");
            const btnDay = document.getElementById("btnDay");
            const btnChangeImage = document.getElementById("btnChangeImage");
            const btnMusic = document.getElementById("btnMusic");

            if (action === "start") {
                this.idleManager.setArtworkMode(isArtwork !== false);

                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length,
                );
                this.slideshowManager.start(
                    (offset, isAuto) => this.imageManager.switchHero(offset, isAuto),
                    minImages,
                );

                if (isArtwork !== false) {
                    if (btnChangeImage) btnChangeImage.classList.add("active");
                    if (btnYM) btnYM.style.display = "none";
                    if (btnMusic) btnMusic.style.display = "flex";
                    if (btnDay) btnDay.classList.remove("active");
                    if (btnYM) btnYM.classList.remove("active");
                    this.idleManager.reset();
                }
            }
            if (action === "stop") {
                this.idleManager.setArtworkMode(false);
                this.slideshowManager.stop();
                if (btnChangeImage) btnChangeImage.classList.remove("active");
                if (btnYM) btnYM.style.display = "flex";
                if (btnMusic) btnMusic.style.display = "none";
            }
        });
    }

    private setupPWAInstall(): void {
        let deferredPrompt: any;
        const installBtn = document.getElementById("installBtn");

        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installBtn) installBtn.style.display = "block";
        });

        if (installBtn) {
            installBtn.addEventListener("click", async () => {
                if (deferredPrompt) {
                    await deferredPrompt.prompt();
                    deferredPrompt = null;
                    installBtn.style.display = "none";
                }
            });
        }
    }

    private setupUIHandlers(): void {
        const btnDay = document.getElementById("btnDay");
        const btnChangeImage = document.getElementById("btnChangeImage");
        const btnPrevHero = document.getElementById("btnPrevHero");
        const btnNextHero = document.getElementById("btnNextHero");
        const btnYearMonth = document.getElementById("btnYearMonth");

        // Welcome Overlay Click
        if (this.welcomeOverlay) {
            this.welcomeOverlay.addEventListener("click", (e) => {
                e.stopPropagation();

                this.idleManager.reset();

                window.dispatchEvent(
                    new CustomEvent("welcome-mode", { detail: { active: false } }),
                );

                // For now, let's stick to the previous logic but keep it TS safe
                document.body.classList.remove("initial-welcome");
                window.dispatchEvent(
                    new CustomEvent("close-panels", { detail: { showGrid: true } }),
                );
            });
        }

        // Change Image Button
        if (btnChangeImage) {
            btnChangeImage.onclick = () => {
                window.dispatchEvent(
                    new CustomEvent("slideshow-control", {
                        detail: { action: "start", isArtwork: true },
                    }),
                );

                window.dispatchEvent(
                    new CustomEvent("request-hero-change", {
                        detail: {
                            changeBg: true,
                            transitionOverride: "slide-from-right",
                        },
                    }),
                );
                window.dispatchEvent(
                    new CustomEvent("close-panels", { detail: { showGrid: false } }),
                );
            };
        }

        // Navigation Handlers
        if (btnPrevHero) btnPrevHero.onclick = () => this.handleNavigation(-1);
        if (btnNextHero) btnNextHero.onclick = () => this.handleNavigation(1);

        if (btnYearMonth) {
            btnYearMonth.onclick = () => {
                this.idleManager.reset();
                window.dispatchEvent(new CustomEvent("toggle-panel", { detail: "yearMonth" }));
            };
        }

        if (btnDay) {
            btnDay.onclick = () => {
                this.idleManager.reset();
                window.dispatchEvent(new CustomEvent("toggle-grid"));
            };
        }
    }
}
