import { HeroGalleryManager } from "../galleryManager";
import { HeroLayoutManager } from "./layoutManager";

export class HeroModeUIManager {
    public get changeImageBtn(): HTMLElement | null {
        return this.btnChangeImage;
    }
    public get immersionBtn(): HTMLElement | null {
        return this.btnImmersion;
    }
    public get nextHeroBtn(): HTMLElement | null {
        return this.btnNextHero;
    }
    public get prevHeroBtn(): HTMLElement | null {
        return this.btnPrevHero;
    }
    private btnChangeImage: HTMLElement | null = null;

    private btnImmersion: HTMLElement | null = null;

    private btnNextHero: HTMLElement | null = null;

    private btnPrevHero: HTMLElement | null = null;

    private galleryManager: HeroGalleryManager;

    constructor(galleryManager: HeroGalleryManager) {
        this.galleryManager = galleryManager;
    }

    public init(): void {
        this.btnChangeImage = document.getElementById("btnChangeImage");
        this.btnImmersion = document.getElementById("btnImmersion");
        this.btnPrevHero = document.getElementById("btnPrevHero");
        this.btnNextHero = document.getElementById("btnNextHero");
    }

    public updateArtworkModeUI(isArtwork: boolean, layoutManager: HeroLayoutManager): void {
        this.updateModeTheme(isArtwork);
        const header = layoutManager.header;
        const infoStrip = layoutManager.headerInfoStrip;
        const toggleBtn = layoutManager.headerToggleBtn;

        if (isArtwork) {
            this.btnChangeImage?.classList.add("active");

            // Hide YearMonth Button
            if (layoutManager.yearMonthBtn) layoutManager.yearMonthBtn.style.display = "none";

            // Reset Active States
            layoutManager.removeActiveState(layoutManager.dayBtn);
            layoutManager.removeActiveState(layoutManager.yearMonthBtn);

            // In Artwork Mode:
            // 1. Hide Info Strip (Clean view)
            // 2. Show Toggle Button (To allow exit to Calendar)
            // 3. Keep Header container visible
            if (infoStrip) {
                infoStrip.style.opacity = "0";
                infoStrip.style.pointerEvents = "none";
            }
            if (toggleBtn) {
                toggleBtn.style.display = "none";
            }
            if (header) {
                header.style.opacity = "1";
                header.style.pointerEvents = "auto";
            }

            this.galleryManager.setVisibility(true);
        } else {
            this.btnChangeImage?.classList.remove("active");

            // In Calendar Mode:
            // 1. Show Info Strip
            // 2. Hide Toggle Button (User requested removal in Status 2)
            // 3. Keep Header container visible
            if (infoStrip) {
                infoStrip.style.opacity = "1";
                infoStrip.style.pointerEvents = "auto";
            }
            if (toggleBtn) {
                toggleBtn.style.display = "none";
            }
            if (header) {
                header.style.opacity = "1";
                header.style.pointerEvents = "auto";
            }

            this.galleryManager.setVisibility(false);

            // Show YearMonth Button
            if (layoutManager.yearMonthBtn) layoutManager.yearMonthBtn.style.display = "flex";
        }
    }

    public updateImmersionUI(active: boolean): void {
        const iconCal = document.getElementById("iconCalendar");
        const iconImm = document.getElementById("iconImmersion");

        if (active) {
            this.btnImmersion?.classList.add("active");
            // Show Calendar Icon (to exit immersion), Hide Immersion Icon
            if (iconCal) iconCal.style.display = "block";
            if (iconImm) iconImm.style.display = "none";
        } else {
            this.btnImmersion?.classList.remove("active");
            // Hide Calendar Icon, Show Immersion Icon (to enter immersion)
            if (iconCal) iconCal.style.display = "none";
            if (iconImm) iconImm.style.display = "block";
        }
    }

    public updateModeTheme(isArtwork: boolean): void {
        if (isArtwork) {
            document.body.classList.add("mode-artwork");
            this.btnPrevHero?.classList.remove("group-calendar");
            this.btnPrevHero?.classList.add("group-image");
            this.btnNextHero?.classList.remove("group-calendar");
            this.btnNextHero?.classList.add("group-image");
        } else {
            document.body.classList.remove("mode-artwork");
            this.btnPrevHero?.classList.remove("group-image");
            this.btnPrevHero?.classList.add("group-calendar");
            this.btnNextHero?.classList.remove("group-image");
            this.btnNextHero?.classList.add("group-calendar");
        }
    }
}
