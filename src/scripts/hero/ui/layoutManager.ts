export class HeroLayoutManager {
    private heroDockWrapper: HTMLElement | null = null;
    private heroHeader: HTMLElement | null = null;
    private welcomeOverlay: HTMLElement | null = null;
    private btnYearMonth: HTMLElement | null = null;
    private btnDay: HTMLElement | null = null;
    private btnHeaderToggle: HTMLElement | null = null;
    private installBtn: HTMLElement | null = null;
    private infoStrip: HTMLElement | null = null;

    public init(): void {
        this.heroDockWrapper = document.querySelector(".hero-dock-wrapper");
        this.heroHeader = document.querySelector(".hero-header");
        this.welcomeOverlay = document.getElementById("welcomeInteractionOverlay");
        this.btnYearMonth = document.getElementById("btnYearMonth");
        this.btnDay = document.getElementById("btnDay");
        this.btnHeaderToggle = document.getElementById("btnHeaderToggle");
        this.installBtn = document.getElementById("installBtn");
        this.infoStrip = document.getElementById("heroInfoStrip");
    }

    public get overlay(): HTMLElement | null {
        return this.welcomeOverlay;
    }

    public get header(): HTMLElement | null {
        return this.heroHeader;
    }

    public get headerInfoStrip(): HTMLElement | null {
        return this.infoStrip;
    }

    public get yearMonthBtn(): HTMLElement | null {
        return this.btnYearMonth;
    }

    public get dayBtn(): HTMLElement | null {
        return this.btnDay;
    }

    public get headerToggleBtn(): HTMLElement | null {
        return this.btnHeaderToggle;
    }

    public get installButton(): HTMLElement | null {
        return this.installBtn;
    }

    public get dockWrapper(): HTMLElement | null {
        return this.heroDockWrapper;
    }

    public showInstallButton(): void {
        if (this.installBtn) this.installBtn.style.display = "block";
    }

    public hideInstallButton(): void {
        if (this.installBtn) this.installBtn.style.display = "none";
    }

    public toggleGridView(show: boolean): void {
        if (show) {
            if (this.heroDockWrapper) {
                this.heroDockWrapper.classList.remove("hidden");
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            }
            // Reset active states for clarity
            if (this.btnYearMonth) this.btnYearMonth.classList.remove("active");

            if (this.heroHeader) this.heroHeader.style.opacity = "1";

            // Ensure year/month button is visible in grid view
            if (this.btnYearMonth) this.btnYearMonth.style.display = "flex";
        } else {
            this.btnDay?.classList.remove("active");
        }
    }

    public updatePanelsForType(type?: "today" | "yearMonth"): void {
        if (type === "yearMonth") {
            if (this.btnYearMonth) {
                this.btnYearMonth.style.display = "flex";
                this.btnYearMonth.classList.add("active");
            }
            if (this.heroHeader) this.heroHeader.style.opacity = "1";
            if (this.heroDockWrapper) {
                this.heroDockWrapper.style.opacity = "1";
                this.heroDockWrapper.style.pointerEvents = "auto";
            }
        } else if (type === "today") {
            if (this.btnYearMonth) {
                this.btnYearMonth.style.display = "none";
                this.btnYearMonth.classList.remove("active");
            }
            if (this.heroHeader) this.heroHeader.style.opacity = "0";
            if (this.heroDockWrapper) {
                this.heroDockWrapper.style.opacity = "0";
                this.heroDockWrapper.style.pointerEvents = "none";
            }
        }
        this.btnDay?.classList.remove("active");
    }

    public setHeaderVisibility(visible: boolean): void {
        if (this.heroHeader) {
            this.heroHeader.style.opacity = visible ? "1" : "0";
            this.heroHeader.style.pointerEvents = visible ? "auto" : "none";
        }
    }

    public setYearMonthBtnVisibility(visible: boolean): void {
        if (this.btnYearMonth) {
            this.btnYearMonth.style.display = visible ? "flex" : "none";
        }
    }

    public removeActiveState(element: HTMLElement | null): void {
        element?.classList.remove("active");
    }
}
