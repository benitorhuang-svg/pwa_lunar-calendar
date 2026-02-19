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

        // 處理由於腳本載入順序導致的競爭條件 (Handle race conditions due to script loading order)
        // Check if we are already in welcome mode or if a panel is already marked as active
        const isActiveToday = document.body.getAttribute("data-active-panel") === "today";
        const isInitialWelcome = document.body.classList.contains("initial-welcome");

        if (isActiveToday || isInitialWelcome) {
            console.log("[Floater] Late init or Active state detected, rendering today panel.");
            const today = new Date();
            this.renderers.renderTodayPanel(today.getFullYear(), today.getMonth(), today.getDate());

            // If it's active but not shown yet (due to race), show it
            if (isActiveToday && this.panelToday) {
                this.panelToday.style.display = "flex";
                this.panelToday.classList.add("bottom-panel");
            }
        }
    }

    private setupClickHandlers(): void {
        const handleClosePanel = () => {
            window.dispatchEvent(
                new CustomEvent("transition-mode", { detail: { to: "calendar" } }),
            );
            window.dispatchEvent(new CustomEvent("close-panels", { detail: { showGrid: true } }));
        };

        if (this.panelBackOverlay) this.panelBackOverlay.onclick = handleClosePanel;
        if (this.panelToday) {
            this.panelToday.onclick = (e) => {
                // 如果點擊的是筆記區域 (包含標題或輸入框)，不要關閉面板
                // If clicking inside the note section (including title or input), do not close the panel
                if ((e.target as HTMLElement).closest(".panel-note-section")) {
                    return;
                }
                handleClosePanel();
            };

            // 手機滑動功能 (Mobile Swipe Functionality)
            let touchStartX = 0;
            let touchStartY = 0;

            this.panelToday.addEventListener("touchstart", (e) => {
                const touch = e.changedTouches?.[0];
                if (!touch) return;
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }, { passive: true });

            this.panelToday.addEventListener("touchend", (e) => {
                const touch = e.changedTouches?.[0];
                if (!touch) return;
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                // 只有當水平滑動遠大於垂直滑動時才動作 (Only trigger if horizontal swipe is dominant)
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 40) {
                    if (deltaX > 0) {
                        // 右滑 -> 前一天 (Swipe Right -> Prev Day)
                        window.dispatchEvent(new CustomEvent("navigate-day", { detail: -1 }));
                    } else {
                        // 左滑 -> 下一天 (Swipe Left -> Next Day)
                        window.dispatchEvent(new CustomEvent("navigate-day", { detail: 1 }));
                    }
                }
            }, { passive: true });
        }

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
                // 防止全域點擊事件干擾面板內部的點擊處理 (Defer to panel's own handler)
                if (isTodayVisible && target.closest("#panelToday")) return;

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
