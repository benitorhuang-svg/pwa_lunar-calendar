export class HeroLayoutManager {
    public get dayBtn(): HTMLElement | null {
        return this.btnDay;
    }
    public get dockWrapper(): HTMLElement | null {
        return this.heroDockWrapper;
    }
    public get header(): HTMLElement | null {
        return this.heroHeader;
    }
    public get headerInfoStrip(): HTMLElement | null {
        return this.infoStrip;
    }

    public get installButton(): HTMLElement | null {
        return this.installBtn;
    }
    public get overlay(): HTMLElement | null {
        return this.welcomeOverlay;
    }
    public get yearMonthBtn(): HTMLElement | null {
        return this.btnYearMonth;
    }

    private btnDay: HTMLElement | null = null;

    private btnYearMonth: HTMLElement | null = null;

    private heroDockWrapper: HTMLElement | null = null;

    private heroHeader: HTMLElement | null = null;

    private infoStrip: HTMLElement | null = null;

    private installBtn: HTMLElement | null = null;

    private welcomeOverlay: HTMLElement | null = null;

    public hideInstallButton(): void {
        this.installBtn?.classList.add("hidden");
    }

    public init(): void {
        this.heroDockWrapper = document.querySelector(".hero-dock-wrapper");
        this.heroHeader = document.querySelector(".hero-header");
        this.welcomeOverlay = document.getElementById("welcomeInteractionOverlay");
        this.btnYearMonth = document.getElementById("btnYearMonth");
        this.btnDay = document.getElementById("btnDay");

        this.installBtn = document.getElementById("installBtn");
        this.infoStrip = document.getElementById("heroInfoStrip");
    }

    public removeActiveState(element: HTMLElement | null): void {
        element?.classList.remove("active");
    }

    public showInstallButton(): void {
        this.installBtn?.classList.remove("hidden");
    }

    public toggleGridView(show: boolean): void {
        if (show) {
            // Reset active states for clarity
            if (this.btnYearMonth) this.btnYearMonth.classList.remove("active");
        } else {
            this.btnDay?.classList.remove("active");
        }
    }

    public updatePanelsForType(type?: "today" | "yearMonth"): void {
        if (type === "yearMonth") {
            if (this.btnYearMonth) {
                this.btnYearMonth.classList.add("active");
            }
        } else if (type === "today") {
            if (this.btnYearMonth) {
                this.btnYearMonth.classList.remove("active");
            }
        }
        this.btnDay?.classList.remove("active");
    }
}
