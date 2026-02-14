/**
 * Panel Event Handlers
 * 負責面板相關的事件處理 (Responsible for panel-related event handling)
 */

import type { PanelRenderers } from "./panelRenderers";

export class PanelEventHandlers {
    private panelBackOverlay: HTMLElement | null = null;
    private panelToday: HTMLElement | null = null;
    private panelYearMonth: HTMLElement | null = null;
    private renderers: PanelRenderers;

    constructor(renderers: PanelRenderers) {
        this.renderers = renderers;
    }

    public init(): void {
        this.panelYearMonth = document.getElementById("panelYearMonth");
        this.panelToday = document.getElementById("panelToday");
        this.panelBackOverlay = document.getElementById("panelBackOverlay");

        this.setupEventListeners();
        this.setupClickHandlers();

        // Check if we are already in welcome mode (race condition fix)
        if (document.body.classList.contains("initial-welcome")) {
            console.log("[Floater] Late init detected in welcome mode, rendering today panel.");
            const today = new Date();
            this.renderers.renderTodayPanel(today.getFullYear(), today.getMonth(), today.getDate());
        }
    }

    private setupClickHandlers(): void {
        const handleClosePanel = () => {
            window.dispatchEvent(new CustomEvent("welcome-mode", { detail: { active: false } }));
            window.dispatchEvent(new CustomEvent("close-panels", { detail: { showGrid: true } }));
        };

        if (this.panelBackOverlay) this.panelBackOverlay.onclick = handleClosePanel;
        if (this.panelToday) this.panelToday.onclick = handleClosePanel;

        // Global Click Listener
        document.addEventListener("click", (e: MouseEvent) => {
            if (!this.panelYearMonth || !this.panelToday) return;

            const isYearMonthVisible = this.panelYearMonth.style.display === "block";
            const isTodayVisible =
                this.panelToday.style.display === "block" ||
                this.panelToday.style.display === "flex";

            if (isYearMonthVisible || isTodayVisible) {
                const target = e.target as HTMLElement;

                if (isYearMonthVisible && target.closest("#panelYearMonth")) return;
                if (target.closest(".nav-box") || target.closest(".dock-item")) return;

                handleClosePanel();
            }
        });
    }

    private setupEventListeners(): void {
        // Render Panels
        window.addEventListener("render-panels", (e: any) => {
            const { selectedDay, selectedMonth, selectedYear, today, type } = e.detail;

            if (type === "yearMonth") {
                const todayObj = new Date(today);
                this.renderers.renderYearMonthPanel(selectedYear, selectedMonth, todayObj);
                if (this.panelYearMonth) {
                    this.panelYearMonth.style.display = "block";
                    this.panelYearMonth.classList.add("bottom-panel");
                }
                if (this.panelBackOverlay) this.panelBackOverlay.style.display = "block";
            } else if (type === "today") {
                try {
                    this.renderers.renderTodayPanel(selectedYear, selectedMonth, selectedDay);
                    if (this.panelToday) {
                        this.panelToday.style.display = "flex";
                        this.panelToday.classList.add("bottom-panel");
                    }
                    if (this.panelBackOverlay) this.panelBackOverlay.style.display = "block";
                } catch (err) {
                    console.error("[Floater] Error rendering today panel:", err);
                    if (this.panelToday) {
                        this.panelToday.innerHTML = `<div style="padding:20px;text-align:center;">載入失敗，請稍後再試</div>`;
                        this.panelToday.style.display = "block";
                    }
                    if (this.panelBackOverlay) this.panelBackOverlay.style.display = "block";
                }
            }
        });

        // Hide Panels
        window.addEventListener("hide-panels", () => {
            if (this.panelYearMonth) this.panelYearMonth.style.display = "none";
            if (this.panelToday) this.panelToday.style.display = "none";
            if (this.panelBackOverlay) this.panelBackOverlay.style.display = "none";
        });

        // Show Welcome Panel (Today Content)
        window.addEventListener("show-welcome-panel", () => {
            const today = new Date();
            try {
                this.renderers.renderTodayPanel(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                );
            } catch (err) {
                console.error("Welcome Panel Init Error", err);
            }
        });
    }
}
