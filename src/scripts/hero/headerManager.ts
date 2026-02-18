/**
 * Hero Header Manager
 * 負責管理 Hero 區域頂部的日期顯示
 * Responsible for managing the date display in the Hero header area
 */

export class HeroHeaderManager {
    // UI Elements
    private monthEl: HTMLElement | null = null;
    private yearEl: HTMLElement | null = null;
    private stripEl: HTMLElement | null = null;

    public init(): void {
        this.cacheElements();

        // 初始渲染：使用當前日期
        // Initial render: use current date
        this.updateDate(new Date());

        this.setupEventListeners();
    }

    public updateDate(date: Date): void {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");

        if (this.yearEl && this.yearEl.textContent !== year) {
            this.yearEl.textContent = year;
        }
        if (this.monthEl && this.monthEl.textContent !== month) {
            this.monthEl.textContent = month;
        }
        // Day element is removed in new design
    }

    private cacheElements(): void {
        this.yearEl = document.getElementById("infoYear");
        this.monthEl = document.getElementById("infoMonth");
        this.stripEl = document.getElementById("heroInfoStrip");
    }

    private setupEventListeners(): void {
        // Listen for calendar rendering to update the top-left view context
        window.addEventListener("render-calendar", (e: any) => {
            const { year, month } = e.detail;
            // We use the 1st of that month to update the display
            this.updateDate(new Date(year, month, 1));
        });

        // Add click listener for "Back to Today" functionality on the strip
        if (this.stripEl) {
            this.stripEl.addEventListener("click", (e) => {
                const target = e.target as HTMLElement;
                // Don't trigger if clicking the individual year/month buttons (selectors)
                if (target.closest(".calendar-label-btn")) return;

                console.log("[HeroHeader] Back to Today clicked via Strip");
                window.dispatchEvent(new CustomEvent("go-to-today"));
            });
        }

        // 如果需要每分鐘更新一次（跨日更新），可以在此處添加 setInterval
        // If minute-by-minute updates (for date rollover) are needed, a setInterval could be added here.
        setInterval(() => {
            this.updateDate(new Date());
        }, 60000); // Check every minute
    }
}
