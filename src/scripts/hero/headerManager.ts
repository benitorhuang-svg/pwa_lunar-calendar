/**
 * Hero Header Manager
 * 負責管理 Hero 區域頂部的日期顯示
 * Responsible for managing the date display in the Hero header area
 */



export class HeroHeaderManager {
    // UI Elements
    private dayEl: HTMLElement | null = null;
    private monthEl: HTMLElement | null = null;
    private yearEl: HTMLElement | null = null;

    public init(): void {
        this.cacheElements();

        // 初始渲染：使用當前日期
        // Initial render: use current date
        this.updateDate(new Date());

        this.setupEventListeners();
    }

    public updateDate(date: Date): void {
        if (!this.yearEl || !this.monthEl || !this.dayEl) return;

        // 格式化日期：
        // 年: "2024"
        // 月: "02" (補零)
        // 日: "14" (補零)
        // Format Date:
        // Year: "2024"
        // Month: "02" (padded)
        // Day: "14" (padded)

        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        if (this.yearEl.textContent !== year) this.yearEl.textContent = year;
        if (this.monthEl.textContent !== month) this.monthEl.textContent = month;
        if (this.dayEl.textContent !== day) this.dayEl.textContent = day;
    }

    private cacheElements(): void {
        this.yearEl = document.getElementById("infoYear");
        this.monthEl = document.getElementById("infoMonth");
        this.dayEl = document.getElementById("infoDay");
    }

    private setupEventListeners(): void {
        // 為了將左上角日期鎖定為「今日」，我們不再監聽 render-hero 或 render-panels 事件來更新日期
        // To lock the top-left date to "Today", we no longer listen to render-hero or render-panels events to update the date.

        // 如果需要每分鐘更新一次（跨日更新），可以在此處添加 setInterval
        // If minute-by-minute updates (for date rollover) are needed, a setInterval could be added here.
        setInterval(() => {
            this.updateDate(new Date());
        }, 60000); // Check every minute
    }
}
