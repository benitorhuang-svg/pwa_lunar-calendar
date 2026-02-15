/**
 * Hero Image Manager
 * 負責圖片偵測、切換、預載邏輯 (Responsible for image detection, switching, and preloading logic)
 */

import { GALLERY_MANIFEST } from "../generated/galleryManifest";
import { ImageRules } from "./imageRules";

export class HeroImageManager {
    public heroList: string[] = [];
    public specialHeroList: string[] = [];
    private BASE_HERO_DIR: string;
    private currentSpecialName: null | string = null;
    private customHeroList: string[] = [];
    private galleryMode: "custom" | "default" | "hybrid" = "default";
    private heroBgContainer: HTMLElement | null = null;
    private heroCache: Record<string, HTMLImageElement> = {};
    private heroIdx = 0;
    private manifest: null | Record<string, string[]> = null;
    private requestedSeason: null | string = null;
    private specialHeroIdx = 0;

    constructor(baseDir: string) {
        this.BASE_HERO_DIR = (baseDir + "assets/gallery/").replace(/\/+/g, "/");
    }

    public async detectHeroImages(targetSeason = "default", isFallback = false): Promise<void> {
        const seasonalPlaylist: string[] = [];
        this.manifest = await this.loadManifest(); // Ensure manifest is loaded once

        // 1. 取得季節圖片 (Get seasonal images)
        for (const season of ImageRules.SEASONS) {
            const images = await this.getImagesForSeason(season);
            if (ImageRules.ENABLE_RANDOM_SHUFFLE) {
                images.sort(() => Math.random() - 0.5);
            }
            const selected = images.slice(0, ImageRules.MAX_IMAGES_PER_SEASON);
            seasonalPlaylist.push(...selected);
        }

        // 2. 取得自訂圖片 (Get custom images)
        const { galleryStorage } = await import("./galleryStorage");
        const customImages = await galleryStorage.getAllImages();
        this.customHeroList = customImages.map((img) => URL.createObjectURL(img.blob));

        // 3. 根據模式合成清單 (Compose list based on mode)
        let fullPlaylist: string[] = [];

        if (this.galleryMode === "default") {
            // 純預設模式：只播放季節圖片
            fullPlaylist = seasonalPlaylist;
        } else if (this.galleryMode === "custom") {
            // 純自選模式：只播放使用者匯入圖片
            if (this.customHeroList.length > 0) {
                fullPlaylist = this.customHeroList;
            } else {
                console.warn("[Hero] Custom mode selected but no images found. Showing placeholder.");
                // Fallback: Show a specific placeholder (e.g., default/1.png) to indicate "No Images"
                // Instead of silently falling back to seasonal playlist.
                fullPlaylist = [`${this.BASE_HERO_DIR}default/1.png`];

                // Notify UI to prompt user to import images
                window.dispatchEvent(new CustomEvent("custom-list-empty"));
            }
        } else if (this.galleryMode === "hybrid") {
            // 混合模式：兩者合併並隨機 (Hybrid: Mixed)
            fullPlaylist = [...seasonalPlaylist, ...this.customHeroList];
            if (ImageRules.ENABLE_RANDOM_SHUFFLE) {
                fullPlaylist.sort(() => Math.random() - 0.5);
            }
        }

        // Fallback: If absolutely no images found
        if (fullPlaylist.length === 0) {
            if (targetSeason !== "default") {
                await this.detectHeroImages("default", true);
            } else {
                this.heroList = [`${this.BASE_HERO_DIR}default/1.png`];
                this.heroIdx = 0;
            }
            return;
        }

        this.heroList = fullPlaylist;

        // Set initial index
        let startIdx = 0;
        if (this.galleryMode !== "custom") {
            startIdx = this.heroList.findIndex((path) => path.includes(`/${targetSeason}/`));
        }
        this.heroIdx = startIdx !== -1 ? startIdx : 0;

        console.log(`[Hero] Mode: ${this.galleryMode}, Playlist Size: ${this.heroList.length}`);

        await this.preloadHeroImages();

        if (!isFallback) {
            window.dispatchEvent(new CustomEvent("request-hero-change"));
        }
    }

    public getSeason(date: Date): string {
        return ImageRules.getSeason(date);
    }

    public init(): void {
        this.heroBgContainer = document.getElementById("heroBgContainer");
    }

    public async setGalleryMode(mode: "custom" | "default" | "hybrid"): Promise<void> {
        if (this.galleryMode === mode) return;
        this.galleryMode = mode;
        const season = this.getSeason(new Date());
        await this.detectHeroImages(season);
    }

    public switchHero(offset: number, isAuto = false, resetSlideshowCallback?: () => void): void {
        if (!isAuto && resetSlideshowCallback) {
            resetSlideshowCallback();
        }

        let list: string[];
        let idx: number;
        let isSpecial = false;

        if (this.specialHeroList && this.specialHeroList.length > 0) {
            list = this.specialHeroList;
            idx = this.specialHeroIdx;
            isSpecial = true;
        } else {
            list = this.heroList;
            idx = this.heroIdx;
        }

        let newIdx = idx + offset;
        if (newIdx >= list.length) newIdx = 0;
        if (newIdx < 0) newIdx = list.length - 1;

        if (isSpecial) {
            this.specialHeroIdx = newIdx;
        } else {
            this.heroIdx = newIdx;
        }

        const transType = isAuto ? "fade" : offset > 0 ? "fade-next" : "fade-prev";
        const targetUrl = list[newIdx] || list[0] || "";
        this.setHeroBackground(targetUrl, transType);

        // Haptic feedback for tactile switch (only manual)
        if (!isAuto && "vibrate" in navigator) {
            navigator.vibrate(10);
        }

        // --- Predictive Preloading ---
        // Preload the "next" image after this switch
        const predictIdx = (newIdx + (offset > 0 ? 1 : -1) + list.length) % list.length;
        const predictUrl = list[predictIdx];
        if (predictUrl && !this.heroCache[predictUrl]) {
            const img = new Image();
            img.src = predictUrl;
            this.heroCache[predictUrl] = img;
        }

        window.dispatchEvent(new CustomEvent("close-panels", { detail: { showGrid: false } }));
    }

    public async updateHeroLogic(
        changeBg: boolean,
        transitionOverride: null | string,
        date: Date,
        lunar: any,
    ): Promise<void> {
        const targetSeason = this.getSeason(date);

        if (targetSeason !== this.requestedSeason) {
            this.requestedSeason = targetSeason;
            await this.detectHeroImages(targetSeason);
            return;
        }

        const festival = lunar.getFestival();
        const term = lunar.getJieQi();
        const specialName = festival || term;
        let finalUrl: null | string = null;

        if (specialName) {
            if (specialName !== this.currentSpecialName) {
                this.currentSpecialName = specialName;
                this.specialHeroList = [];
                this.specialHeroIdx = 0;

                if (this.manifest && this.manifest[targetSeason]) {
                    const seasonFiles = this.manifest[targetSeason];

                    // Check base: e.g. "DragonBoat.png"
                    for (const ext of ImageRules.SUPPORTED_EXTENSIONS) {
                        const filename = `${specialName}${ext}`;
                        if (seasonFiles.includes(filename)) {
                            this.specialHeroList.push(
                                `${this.BASE_HERO_DIR}${targetSeason}/${filename}`,
                            );
                            break; // Found base
                        }
                    }

                    // Check variants: e.g. "DragonBoat1.png"
                    for (let i = 1; i <= ImageRules.MAX_VARIANT_COUNT; i++) {
                        let variantFound = false;
                        for (const ext of ImageRules.SUPPORTED_EXTENSIONS) {
                            const filename = `${specialName}${i}${ext}`;
                            if (seasonFiles.includes(filename)) {
                                this.specialHeroList.push(
                                    `${this.BASE_HERO_DIR}${targetSeason}/${filename}`,
                                );
                                variantFound = true;
                                break;
                            }
                        }
                        if (!variantFound) break;
                    }
                } else {
                    // Fallback to probing
                    let baseFound = false;

                    for (const ext of ImageRules.SUPPORTED_EXTENSIONS) {
                        const src = `${this.BASE_HERO_DIR}${targetSeason}/${specialName}${ext}`;
                        const exists = await this.checkImageExists(src);
                        if (exists) {
                            this.specialHeroList.push(src);
                            baseFound = true;
                            break;
                        }
                    }

                    if (baseFound) {
                        for (let i = 1; i <= ImageRules.MAX_VARIANT_COUNT; i++) {
                            let variantFound = false;
                            for (const ext of ImageRules.SUPPORTED_EXTENSIONS) {
                                const src = `${this.BASE_HERO_DIR}${targetSeason}/${specialName}${i}${ext}`;
                                const exists = await this.checkImageExists(src);
                                if (exists) {
                                    this.specialHeroList.push(src);
                                    variantFound = true;
                                    break;
                                }
                            }
                            if (!variantFound) break;
                        }
                    }
                }
            }

            if (this.specialHeroList.length > 0) {
                if (changeBg) {
                    this.specialHeroIdx = (this.specialHeroIdx + 1) % this.specialHeroList.length;
                }
                finalUrl = this.specialHeroList[this.specialHeroIdx] ?? null;
            }
        } else {
            this.currentSpecialName = null;
            this.specialHeroList = [];
        }

        if (!finalUrl && this.heroList.length > 0) {
            if (changeBg) {
                this.heroIdx = (this.heroIdx + 1) % this.heroList.length;
            }
            finalUrl = this.heroList[this.heroIdx] ?? null;
        }

        if (finalUrl) {
            let transType = "fade";
            if (changeBg) {
                transType = transitionOverride || "fade";
            }
            this.setHeroBackground(finalUrl, transType);
        }
    }

    private checkImageExists(src: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    private async getImagesForSeason(season: string): Promise<string[]> {
        const seasonDir = `${this.BASE_HERO_DIR}${season}/`;
        const detected: string[] = [];

        // 1. Try Manifest
        if (this.manifest && this.manifest[season] && this.manifest[season].length > 0) {
            // Filter out files with Chinese characters (Solar terms) for the slideshow
            // User requested these to be shown ONLY on date click, not in rotation
            const slideshowFiles = this.manifest[season].filter((f) => !/[\u4e00-\u9fa5]/.test(f));
            return slideshowFiles.map((f) => `${seasonDir}${f}`);
        }

        // 2. Probe (Fallback)
        let i = 1;
        while (i <= ImageRules.MAX_PROBE_COUNT) {
            let found = false;
            for (const ext of ImageRules.SUPPORTED_EXTENSIONS) {
                const src = `${seasonDir}${i}${ext}`;
                try {
                    if (await this.checkImageExists(src)) {
                        detected.push(src);
                        found = true;
                        i++;
                        break;
                    }
                } catch {
                    // ignore
                }
            }
            if (!found) break; // Gap found or end
        }
        return detected;
    }

    private async loadManifest(): Promise<null | Record<string, string[]>> {
        if (GALLERY_MANIFEST) {
            return GALLERY_MANIFEST as Record<string, string[]>;
        }
        if (this.manifest) return this.manifest;

        try {
            const response = await fetch("assets/gallery/gallery.json");
            if (response.ok) {
                return await response.json();
            }
        } catch {
            // Ignore
        }
        return null;
    }

    private async preloadHeroImages(): Promise<void> {
        for (const src of this.heroList) {
            // Optional: Check existence before preloading to avoid 404 console errors
            // This might add some overhead but keeps the console clean if manifest is stale
            if (await this.checkImageExists(src)) {
                const img = new Image();
                img.src = src;
                this.heroCache[src] = img;
            }
        }
    }

    private setHeroBackground(url: string, transition: string): void {
        if (!this.heroBgContainer) return;

        const newItem = document.createElement("div");
        newItem.className = "hero-bg-item";
        newItem.style.backgroundImage = `url('${url}')`;

        const currentItem = this.heroBgContainer.querySelector(
            ".hero-bg-item:last-child",
        ) as HTMLElement | null;

        if (transition === "fade-next") {
            newItem.classList.add("is-next");
        } else if (transition === "fade-prev") {
            newItem.classList.add("is-prev");
        } else {
            newItem.classList.add("is-new");
        }

        newItem.style.zIndex = "2";
        if (currentItem) currentItem.style.zIndex = "1";

        this.heroBgContainer.appendChild(newItem);
        void newItem.offsetHeight; // Reflow

        requestAnimationFrame(() => {
            newItem.classList.remove("is-new", "is-next", "is-prev");

            if (currentItem) {
                currentItem.classList.add("blur-out");
                // Add directional leaving classes for CSS transitions
                if (transition === "fade-next") currentItem.classList.add("is-leaving-next");
                if (transition === "fade-prev") currentItem.classList.add("is-leaving-prev");
            }

            setTimeout(() => {
                if (currentItem && currentItem.parentNode) {
                    currentItem.parentNode.removeChild(currentItem);
                }
                newItem.style.zIndex = "";
            }, 1800); // Increased timeout to match longer slide transition
        });
    }
}
