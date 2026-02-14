/**
 * Hero Header Manager
 * 負責管理 Hero 區域頂部的日期顯示 (Manages the date display in the Hero header)
 */
export class HeroHeaderManager {
    private yearEl: HTMLElement | null = null;
    private monthEl: HTMLElement | null = null;
    private dayEl: HTMLElement | null = null;

    public init(): void {
        this.yearEl = document.getElementById("infoYear");
        this.monthEl = document.getElementById("infoMonth");
        this.dayEl = document.getElementById("infoDay");

        // Initial render with current date
        this.updateDate(new Date());

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for hero render events which contain the current date context
        window.addEventListener("render-hero", (e: any) => {
            const { date } = e.detail;
            if (date) {
                this.updateDate(new Date(date));
            }
        });

        // Listen for panel render events which might reflect date changes
        window.addEventListener("render-panels", (e: any) => {
            const { date } = e.detail;
            if (date) {
                this.updateDate(new Date(date));
            }
        });
    }

    public updateDate(date: Date): void {
        if (!this.yearEl || !this.monthEl || !this.dayEl) return;

        // Formats:
        // Year: "2024"
        // Month: "02" (padded)
        // Day: "14" (padded)

        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        this.yearEl.textContent = year;
        this.monthEl.textContent = month;
        this.dayEl.textContent = day;
    }
}
