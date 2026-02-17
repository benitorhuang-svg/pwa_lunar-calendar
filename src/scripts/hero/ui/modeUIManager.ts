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
    public get slideshowSettingsBtn(): HTMLElement | null {
        return this.btnSlideshowSettings;
    }
    private btnChangeImage: HTMLElement | null = null;

    private btnImmersion: HTMLElement | null = null;

    private btnNextHero: HTMLElement | null = null;

    private btnPrevHero: HTMLElement | null = null;

    private btnSlideshowSettings: HTMLElement | null = null;

    private galleryManager: HeroGalleryManager;

    constructor(galleryManager: HeroGalleryManager) {
        this.galleryManager = galleryManager;
    }

    public init(): void {
        this.btnChangeImage = document.getElementById("btnChangeImage");
        this.btnImmersion = document.getElementById("btnImmersion");
        this.btnPrevHero = document.getElementById("btnPrevHero");
        this.btnNextHero = document.getElementById("btnNextHero");
        this.btnSlideshowSettings = document.getElementById("btnSlideshowSettings");
    }

    public updateArtworkModeUI(isArtwork: boolean, layoutManager: HeroLayoutManager): void {
        this.updateModeTheme(isArtwork);

        if (isArtwork) {
            this.btnChangeImage?.classList.add("active");

            // Reset Active States
            layoutManager.removeActiveState(layoutManager.dayBtn);
            layoutManager.removeActiveState(layoutManager.yearMonthBtn);

            this.galleryManager.setVisibility(true);
        } else {
            this.btnChangeImage?.classList.remove("active");
            this.galleryManager.setVisibility(false);
        }
    }

    public updateImmersionUI(active: boolean): void {
        if (active) {
            this.btnImmersion?.classList.add("active");
        } else {
            this.btnImmersion?.classList.remove("active");
        }
    }

    public updateModeTheme(isArtwork: boolean): void {
        // body.mode-artwork is managed exclusively by stateManager.setMode()
        if (isArtwork) {
            this.btnPrevHero?.classList.remove("group-calendar");
            this.btnPrevHero?.classList.add("group-image");
            this.btnNextHero?.classList.remove("group-calendar");
            this.btnNextHero?.classList.add("group-image");
        } else {
            this.btnPrevHero?.classList.remove("group-image");
            this.btnPrevHero?.classList.add("group-calendar");
            this.btnNextHero?.classList.remove("group-image");
            this.btnNextHero?.classList.add("group-calendar");
        }
    }
}
