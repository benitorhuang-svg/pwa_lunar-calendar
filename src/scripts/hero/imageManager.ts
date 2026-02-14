/**
 * Hero Image Manager
 * 負責圖片偵測、切換、預載邏輯 (Responsible for image detection, switching, and preloading logic)
 */

export class HeroImageManager {
    public heroList: string[] = [];
    public specialHeroList: string[] = [];
    private BASE_HERO_DIR: string;
    private currentSpecialName: null | string = null;
    private heroBgContainer: HTMLElement | null = null;
    private heroCache: Record<string, HTMLImageElement> = {};
    private heroIdx = 0;
    private manifest: Record<string, string[]> | null = null;
    private requestedSeason: null | string = null;
    private specialHeroIdx = 0;

    constructor(baseDir: string) {
        this.BASE_HERO_DIR = (baseDir + "assets/gallery/").replace(/\/+/g, "/");
    }

    public async detectHeroImages(season = "default", isFallback = false): Promise<void> {
        const seasonDir = `${this.BASE_HERO_DIR}${season}/`;
        let detected: string[] = [];

        // 1. Try to load from Global Manifest JS
        if (typeof GALLERY_MANIFEST !== "undefined") {
            this.manifest = GALLERY_MANIFEST as Record<string, string[]>;
            if (this.manifest[season] && this.manifest[season].length > 0) {
                detected = this.manifest[season].map((filename) => `${seasonDir}${filename}`);
                console.log(
                    `[Hero] Loaded ${detected.length} images from JS Manifest for ${season}`,
                );
            }
        }
        // 2. Try to load from JSON manifest
        else {
            try {
                // Only fetch if we haven't already loaded the manifest or if we need to refresh (though usually static)
                if (!this.manifest) {
                    const response = await fetch("assets/gallery/gallery.json");
                    if (response.ok) {
                        this.manifest = await response.json();
                    }
                }

                if (this.manifest && this.manifest[season] && this.manifest[season].length > 0) {
                    detected = this.manifest[season].map(
                        (filename: string) => `${seasonDir}${filename}`,
                    );
                    console.log(
                        `[Hero] Loaded ${detected.length} images from JSON Manifest for ${season}`,
                    );
                }
            } catch {
                // Expected fail on file:// without local server
            }
        }

        // 3. Fallback to probing
        if (detected.length === 0) {
            console.log(`[Hero] Probing images in: ${seasonDir}`);
            let i = 1;
            const maxProbe = 20;

            while (i <= maxProbe) {
                let found = false;
                const exts = [".png", ".webp", ".jpg"];
                for (const ext of exts) {
                    const src = `${seasonDir}${i}${ext}`;
                    try {
                        const exists = await this.checkImageExists(src);
                        if (exists) {
                            detected.push(src);
                            found = true;
                            i++;
                            break;
                        }
                    } catch {
                        // Ignore
                    }
                }
                if (!found) break;
            }
        }

        // Fallback to default gallery
        if (detected.length === 0 && season !== "default") {
            console.log(`[Hero] No images in ${season}, falling back to default.`);
            await this.detectHeroImages("default", true);
            return;
        }

        this.heroList = detected.length > 0 ? detected : [`${this.BASE_HERO_DIR}default/1.png`];
        this.heroList.sort(() => Math.random() - 0.5);
        this.heroIdx = 0;

        this.preloadHeroImages();

        if (!isFallback) {
            window.dispatchEvent(new CustomEvent("request-hero-change"));
        }
    }

    public getSeason(date: Date): string {
        const m = date.getMonth();
        if (m >= 1 && m <= 3) return "spring";
        if (m >= 4 && m <= 6) return "summer";
        if (m >= 7 && m <= 9) return "autumn";
        return "winter";
    }

    public init(): void {
        this.heroBgContainer = document.getElementById("heroBgContainer");
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

                const exts = [".png", ".webp", ".jpg"];

                // If we have a manifest, use it to check for existence effectively synchronously
                // avoiding 404 network errors
                if (this.manifest && this.manifest[targetSeason]) {
                    const seasonFiles = this.manifest[targetSeason];

                    // Check base: e.g. "DragonBoat.png"
                    for (const ext of exts) {
                        const filename = `${specialName}${ext}`;
                        if (seasonFiles.includes(filename)) {
                            this.specialHeroList.push(`${this.BASE_HERO_DIR}${targetSeason}/${filename}`);
                            break; // Found base
                        }
                    }

                    // Check variants: e.g. "DragonBoat1.png"
                    // Only assume variants if base OR at least one variant exists? 
                    // The logic below mimics the original: check 1..5
                    for (let i = 1; i <= 5; i++) {
                        let variantFound = false;
                        for (const ext of exts) {
                            const filename = `${specialName}${i}${ext}`;
                            if (seasonFiles.includes(filename)) {
                                this.specialHeroList.push(`${this.BASE_HERO_DIR}${targetSeason}/${filename}`);
                                variantFound = true;
                                break;
                            }
                        }
                        if (!variantFound) break;
                    }

                } else {
                    // Fallback to probing if no manifest (original behavior)
                    let baseFound = false;

                    for (const ext of exts) {
                        const src = `${this.BASE_HERO_DIR}${targetSeason}/${specialName}${ext}`;
                        const exists = await this.checkImageExists(src);
                        if (exists) {
                            this.specialHeroList.push(src);
                            baseFound = true;
                            break;
                        }
                    }

                    if (baseFound) {
                        for (let i = 1; i <= 5; i++) {
                            let variantFound = false;
                            for (const ext of exts) {
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

    private preloadHeroImages(): void {
        this.heroList.forEach((src) => {
            const img = new Image();
            img.src = src;
            this.heroCache[src] = img;
        });
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
                if (transition === "fade-next") currentItem.style.transform = "scale(0.95)";
                if (transition === "fade-prev") currentItem.style.transform = "scale(1.05)";
            }

            setTimeout(() => {
                if (currentItem && currentItem.parentNode) {
                    currentItem.parentNode.removeChild(currentItem);
                }
                newItem.style.zIndex = "";
            }, 850);
        });
    }
}
