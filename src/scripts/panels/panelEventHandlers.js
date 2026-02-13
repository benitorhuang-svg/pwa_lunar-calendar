/**
 * Panel Event Handlers
 * 負責面板相關的事件處理
 */

export class PanelEventHandlers {
    constructor(renderers) {
        this.renderers = renderers;
        this.panelYearMonth = null;
        this.panelToday = null;
        this.panelBackOverlay = null;
        this.welcomeInteractionOverlay = null;
    }

    init() {
        this.panelYearMonth = document.getElementById("panelYearMonth");
        this.panelToday = document.getElementById("panelToday");
        this.panelBackOverlay = document.getElementById("panelBackOverlay");
        this.welcomeInteractionOverlay = document.getElementById("welcomeInteractionOverlay");

        this.setupEventListeners();
        this.setupClickHandlers();
    }

    setupEventListeners() {
        // Render Panels
        window.addEventListener("render-panels", (e) => {
            const { type, selectedYear, selectedMonth, selectedDay, today } = e.detail;

            if (type === "yearMonth") {
                const todayObj = new Date(today);
                this.renderers.renderYearMonthPanel(
                    selectedYear,
                    selectedMonth,
                    todayObj
                );
                this.panelYearMonth.style.display = "block";
                this.panelYearMonth.classList.add("bottom-panel");
                this.panelBackOverlay.style.display = "block";
            } else if (type === "today") {
                try {
                    this.renderers.renderTodayPanel(selectedYear, selectedMonth, selectedDay);
                    this.panelToday.style.display = "flex";
                    this.panelToday.classList.add("bottom-panel");
                    this.panelBackOverlay.style.display = "block";
                } catch (err) {
                    console.error("[Floater] Error rendering today panel:", err);
                    this.panelToday.innerHTML = `<div style="padding:20px;text-align:center;">載入失敗，請稍後再試</div>`;
                    this.panelToday.style.display = "block";
                    this.panelBackOverlay.style.display = "block";
                }
            }
        });

        // Hide Panels
        window.addEventListener("hide-panels", () => {
            this.panelYearMonth.style.display = "none";
            this.panelToday.style.display = "none";
            this.panelBackOverlay.style.display = "none";
        });

        // Show Welcome Panel (Today Content)
        window.addEventListener("show-welcome-panel", () => {
            const today = new Date();
            try {
                this.renderers.renderTodayPanel(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                );
                // Content is rendered, CSS handles visibility for .initial-welcome
            } catch (err) {
                console.error("Welcome Panel Init Error", err);
            }
        });
    }

    setupClickHandlers() {
        const handleClosePanel = () => {
            window.dispatchEvent(
                new CustomEvent("welcome-mode", { detail: { active: false } })
            );
            window.dispatchEvent(
                new CustomEvent("close-panels", { detail: { showGrid: true } })
            );
        };

        this.panelBackOverlay.onclick = handleClosePanel;
        this.panelToday.onclick = handleClosePanel;

        if (this.welcomeInteractionOverlay) {
            this.welcomeInteractionOverlay.onclick = handleClosePanel;
        }

        // Global Click Listener
        document.addEventListener("click", (e) => {
            const isYearMonthVisible = this.panelYearMonth.style.display === "block";
            const isTodayVisible =
                this.panelToday.style.display === "block" ||
                this.panelToday.style.display === "flex";

            if (isYearMonthVisible || isTodayVisible) {
                const target = e.target;

                if (isYearMonthVisible && target.closest("#panelYearMonth")) return;
                if (target.closest(".nav-box") || target.closest(".dock-item")) return;

                handleClosePanel();
            }
        });
    }
}
