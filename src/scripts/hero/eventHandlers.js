/**
 * Hero Event Handlers
 * 負責 Hero 相關的事件監聽和處理
 */

export class HeroEventHandlers {
    constructor(imageManager, slideshowManager, idleManager) {
        this.imageManager = imageManager;
        this.slideshowManager = slideshowManager;
        this.idleManager = idleManager;
        this.heroDockWrapper = null;
        this.heroHeader = null;
        this.welcomeOverlay = null;
    }

    init() {
        this.heroDockWrapper = document.querySelector(".hero-dock-wrapper");
        this.heroHeader = document.querySelector(".hero-header");
        this.welcomeOverlay = document.getElementById("welcomeInteractionOverlay");

        this.setupEventListeners();
        this.setupUIHandlers();
        this.setupPWAInstall();
    }

    setupEventListeners() {
        // Render Hero
        window.addEventListener("render-hero", (e) => {
            const { date, lunar, changeBg, transitionOverride } = e.detail;
            this.imageManager.updateHeroLogic(changeBg, transitionOverride, date, lunar);
        });

        // Slideshow Control
        window.addEventListener("slideshow-control", (e) => {
            const { action } = e.detail;
            if (action === "start") {
                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length
                );
                this.slideshowManager.start(
                    (offset, isAuto) => this.imageManager.switchHero(offset, isAuto, () => 
                        this.slideshowManager.reset(
                            (o, a) => this.imageManager.switchHero(o, a),
                            minImages
                        )
                    ),
                    minImages
                );
            }
            if (action === "stop") {
                this.slideshowManager.stop();
            }
        });

        // Welcome Mode
        window.addEventListener("welcome-mode", (e) => {
            const { active } = e.detail;
            if (active) {
                document.body.classList.add("immersion-mode");
                this.idleManager.clear();
                if (document.body.classList.contains("initial-welcome")) {
                    this.idleManager.reset();
                }
            } else {
                document.body.classList.remove("immersion-mode");
                document.body.classList.remove("initial-welcome");
            }
        });

        // Toggle Grid View
        window.addEventListener("toggle-grid-view", (e) => {
            const { show } = e.detail;
            const btnYM = document.getElementById("btnYearMonth");
            if (show) {
                this.heroDockWrapper.classList.remove("hidden");
                document.getElementById("btnDay").classList.add("active");
                document.getElementById("btnChangeImage").classList.remove("active");
                btnYM.classList.remove("active");
                btnYM.style.display = "flex";

                this.heroHeader.style.opacity = "1";
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            } else {
                document.getElementById("btnDay").classList.remove("active");
            }
        });

        // Render Panels
        window.addEventListener("render-panels", (e) => {
            const { type } = e.detail || {};
            const btnYM = document.getElementById("btnYearMonth");

            if (type === "yearMonth") {
                btnYM.style.display = "flex";
                btnYM.classList.add("active");
                this.heroHeader.style.opacity = "1";
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            } else if (type === "today") {
                btnYM.style.display = "none";
                btnYM.classList.remove("active");
                this.heroHeader.style.opacity = "0";
                this.heroDockWrapper.style.opacity = "0";
                this.heroDockWrapper.style.pointerEvents = "none";
            }

            document.getElementById("btnDay").classList.remove("active");
            document.getElementById("btnChangeImage").classList.remove("active");
        });

        // Hide Panels
        window.addEventListener("hide-panels", () => {
            document.getElementById("btnYearMonth").classList.remove("active");
        });

        // Slideshow Control with Artwork Mode
        window.addEventListener("slideshow-control", (e) => {
            const { action, isArtwork } = e.detail;
            const btnYM = document.getElementById("btnYearMonth");
            const btnMusic = document.getElementById("btnMusic");

            if (action === "start") {
                this.idleManager.setArtworkMode(isArtwork !== false);

                const minImages = Math.max(
                    this.imageManager.specialHeroList.length,
                    this.imageManager.heroList.length
                );
                this.slideshowManager.start(
                    (offset, isAuto) => this.imageManager.switchHero(offset, isAuto),
                    minImages
                );

                if (this.idleManager.isArtworkMode) {
                    document.getElementById("btnChangeImage").classList.add("active");
                    if (btnYM) btnYM.style.display = "none";
                    if (btnMusic) btnMusic.style.display = "flex";
                    document.getElementById("btnDay").classList.remove("active");
                    if (btnYM) btnYM.classList.remove("active");
                    this.idleManager.reset();
                }
            }
            if (action === "stop") {
                this.idleManager.setArtworkMode(false);
                this.slideshowManager.stop();
                this.idleManager.clear();
                document.getElementById("btnChangeImage").classList.remove("active");
                if (btnYM) btnYM.style.display = "flex";
                if (btnMusic) btnMusic.style.display = "none";
            }
        });
    }

    setupUIHandlers() {
        // Welcome Overlay Click
        this.welcomeOverlay.addEventListener("click", (e) => {
            e.stopPropagation();

            window.dispatchEvent(
                new CustomEvent("welcome-mode", { detail: { active: false } })
            );

            if (!this.idleManager.isArtworkMode) {
                document.body.classList.remove("initial-welcome");
                window.dispatchEvent(
                    new CustomEvent("close-panels", { detail: { showGrid: true } })
                );
            } else {
                window.dispatchEvent(
                    new CustomEvent("close-panels", { detail: { showGrid: false } })
                );
            }
        });

        // Change Image Button
        document.getElementById("btnChangeImage").onclick = () => {
            window.dispatchEvent(
                new CustomEvent("slideshow-control", {
                    detail: { action: "start", isArtwork: true },
                })
            );

            window.dispatchEvent(
                new CustomEvent("request-hero-change", {
                    detail: {
                        changeBg: true,
                        transitionOverride: "slide-from-right",
                    },
                })
            );
            window.dispatchEvent(
                new CustomEvent("close-panels", { detail: { showGrid: false } })
            );
        };

        // Navigation Handlers
        const handleDockNavigation = (direction) => {
            this.idleManager.reset();
            const isCalendarActive = document
                .getElementById("btnDay")
                .classList.contains("active");

            if (isCalendarActive) {
                window.dispatchEvent(
                    new CustomEvent("navigate-month", { detail: direction })
                );
            } else {
                this.imageManager.switchHero(direction, false, () =>
                    this.slideshowManager.reset(
                        (o, a) => this.imageManager.switchHero(o, a),
                        Math.max(
                            this.imageManager.specialHeroList.length,
                            this.imageManager.heroList.length
                        )
                    )
                );
            }
        };

        document.getElementById("btnPrevHero").onclick = () => handleDockNavigation(-1);
        document.getElementById("btnNextHero").onclick = () => handleDockNavigation(1);

        document.getElementById("btnYearMonth").onclick = () => {
            this.idleManager.reset();
            window.dispatchEvent(
                new CustomEvent("toggle-panel", { detail: "yearMonth" })
            );
        };

        document.getElementById("btnDay").onclick = () => {
            this.idleManager.reset();
            window.dispatchEvent(new CustomEvent("toggle-grid"));
        };
    }

    setupPWAInstall() {
        let deferredPrompt;
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

    initHeaderDate() {
        const now = new Date();
        const infoYear = document.getElementById("infoYear");
        const infoMonth = document.getElementById("infoMonth");
        const infoDay = document.getElementById("infoDay");

        if (infoYear) {
            infoYear.innerText = now.getFullYear();
            infoYear.style.fontFamily = "var(--font-serif-num)";
        }
        if (infoMonth) {
            infoMonth.innerText = (now.getMonth() + 1).toString().padStart(2, "0");
            infoMonth.style.fontFamily = "var(--font-serif-num)";
        }
        if (infoDay) {
            infoDay.innerText = now.getDate().toString().padStart(2, "0");
            infoDay.style.fontFamily = "var(--font-serif-num)";
        }
    }
}
