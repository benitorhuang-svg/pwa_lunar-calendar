/**
 * Application Initializer (Modular Version)
 * 負責應用初始化邏輯
 *
 * STATUS: 未啟用 — 目前由 index.astro 的 inline script 負責載入與歡迎頁面邏輯
 * [dev]  本地端使用 index.astro inline script (含百分比進度條)
 * [deploy] GitHub Pages 部署時可考慮切換至此 modular 版本
 */

export class AppInitializer {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }

    async initLoader() {
        let progress = 0;
        const bar = document.querySelector(".loading-bar");

        const updateProgress = (val) => {
            progress = Math.max(progress, val);
            if (bar) bar.style.width = progress + "%";
        };

        const revealApp = () => {
            updateProgress(100);

            setTimeout(() => {
                document.body.classList.add("app-loaded");
                setTimeout(() => {
                    const overlay = document.getElementById("loadingOverlay");
                    if (overlay) overlay.style.display = "none";
                }, 1000);
            }, 500);
        };

        const preloadHeroImage = async () => {
            if (typeof GALLERY_MANIFEST === "undefined") return;

            const month = new Date().getMonth() + 1;
            const season =
                month >= 2 && month <= 4
                    ? "spring"
                    : month >= 5 && month <= 7
                        ? "summer"
                        : month >= 8 && month <= 10
                            ? "autumn"
                            : "winter";

            const images = GALLERY_MANIFEST[season] || [];
            if (images.length > 0) {
                let base = window.APP_BASE_URL || "/";
                if (!base.endsWith("/")) base += "/";

                const src = base + "assets/gallery/" + season + "/" + images[0];
                const finalSrc = src.replace(/([^:]\/)\/+/g, "$1");

                const img = new Image();
                img.src = finalSrc;

                try {
                    await img.decode();
                } catch (err) {
                    console.warn("Hero image preload failed (non-fatal):", finalSrc, err);
                }
            }
        };

        const scriptCheck = setInterval(async () => {
            if (
                typeof Lunar !== "undefined" &&
                typeof GALLERY_MANIFEST !== "undefined"
            ) {
                clearInterval(scriptCheck);

                updateProgress(30);

                await document.fonts.ready;
                updateProgress(60);

                try {
                    await preloadHeroImage();
                } catch (e) {
                    console.log("Image preload warn", e);
                }
                updateProgress(90);

                revealApp();
            }
        }, 50);

        setTimeout(() => {
            if (progress < 100) revealApp();
        }, 5000);
    }

    initWelcomeMode() {
        document.body.classList.add("initial-welcome");
        window.dispatchEvent(
            new CustomEvent("welcome-mode", { detail: { active: true } })
        );

        const state = this.orchestrator.state.getState();
        this.orchestrator.state.setActivePanel("today");

        window.dispatchEvent(
            new CustomEvent("toggle-grid-view", { detail: { show: false } })
        );

        window.dispatchEvent(
            new CustomEvent("show-welcome-panel")
        );

        window.dispatchEvent(
            new CustomEvent("render-panels", {
                detail: {
                    type: "today",
                    selectedYear: state.selectedYear,
                    selectedMonth: state.selectedMonth,
                    selectedDay: state.selectedDay,
                    today: state.today,
                },
            })
        );

        window.dispatchEvent(
            new CustomEvent("slideshow-control", {
                detail: { action: "start", isArtwork: false },
            })
        );
    }

    init() {
        this.orchestrator.init();
        this.orchestrator.updateState();
        this.initWelcomeMode();
    }
}
