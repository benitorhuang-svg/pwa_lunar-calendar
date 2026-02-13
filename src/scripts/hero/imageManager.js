/**
 * Hero Image Manager
 * 負責圖片偵測、切換、預載邏輯
 */

export class HeroImageManager {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.BASE_HERO_DIR = (baseDir + "assets/gallery/").replace(/\/+/g, "/");
        this.heroList = [];
        this.heroIdx = 0;
        this.requestedSeason = null;
        this.currentSpecialName = null;
        this.specialHeroList = [];
        this.specialHeroIdx = 0;
        this.currentSeason = null;
        this.heroCache = {};
        this.heroBgContainer = null;
    }

    init() {
        this.heroBgContainer = document.getElementById("heroBgContainer");
    }

    getSeason(date) {
        const m = date.getMonth();
        if (m >= 1 && m <= 3) return "spring";
        if (m >= 4 && m <= 6) return "summer";
        if (m >= 7 && m <= 9) return "autumn";
        return "winter";
    }

    checkImageExists(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    async detectHeroImages(season = "default", isFallback = false) {
        const seasonDir = `${this.BASE_HERO_DIR}${season}/`;
        let detected = [];

        // 1. Try to load from Global Manifest JS
        if (typeof GALLERY_MANIFEST !== "undefined") {
            if (GALLERY_MANIFEST[season] && GALLERY_MANIFEST[season].length > 0) {
                detected = GALLERY_MANIFEST[season].map(
                    (filename) => `${seasonDir}${filename}`
                );
                console.log(`[Hero] Loaded ${detected.length} images from JS Manifest for ${season}`);
            }
        }
        // 2. Try to load from JSON manifest
        else {
            try {
                const response = await fetch("assets/gallery/gallery.json");
                if (response.ok) {
                    const manifest = await response.json();
                    if (manifest[season] && manifest[season].length > 0) {
                        detected = manifest[season].map(
                            (filename) => `${seasonDir}${filename}`
                        );
                        console.log(`[Hero] Loaded ${detected.length} images from JSON Manifest for ${season}`);
                    }
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
                        const exists = await new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve(true);
                            img.onerror = () => resolve(false);
                            img.src = src;
                        });
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
            if (!isFallback) null;
            return;
        }

        this.heroList = detected.length > 0 ? detected : [`${this.BASE_HERO_DIR}default/1.png`];
        this.heroList.sort(() => Math.random() - 0.5);
        this.heroIdx = 0;
        this.currentSeason = season;

        this.preloadHeroImages();

        if (!isFallback) {
            window.dispatchEvent(new CustomEvent("request-hero-change"));
        }
    }

    preloadHeroImages() {
        this.heroList.forEach((src) => {
            const img = new Image();
            img.src = src;
            this.heroCache[src] = img;
        });
    }

    switchHero(offset, isAuto = false, resetSlideshowCallback) {
        if (!isAuto && resetSlideshowCallback) {
            resetSlideshowCallback();
        }

        let list;
        let idx;
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
        this.setHeroBackground(list[newIdx], transType);

        window.dispatchEvent(
            new CustomEvent("close-panels", { detail: { showGrid: false } })
        );
    }

    setHeroBackground(url, transition) {
        const newItem = document.createElement("div");
        newItem.className = "hero-bg-item";
        newItem.style.backgroundImage = `url('${url}')`;

        const currentItem = this.heroBgContainer.querySelector(".hero-bg-item:last-child");

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
        newItem.offsetHeight; // Reflow

        requestAnimationFrame(() => {
            newItem.classList.remove("is-new", "is-next", "is-prev");

            if (currentItem) {
                currentItem.classList.add("blur-out");
                if (transition === "fade-next") currentItem.style.transform = "scale(0.95)";
                if (transition === "fade-prev") currentItem.style.transform = "scale(1.05)";
            }

            setTimeout(() => {
                if (currentItem && currentItem.parentNode) {
                    this.heroBgContainer.removeChild(currentItem);
                }
                newItem.style.zIndex = "";
            }, 850);
        });
    }

    async updateHeroLogic(changeBg, transitionOverride, date, lunar) {
        const targetSeason = this.getSeason(date);

        if (targetSeason !== this.requestedSeason) {
            this.requestedSeason = targetSeason;
            await this.detectHeroImages(targetSeason);
            return;
        }

        const festival = lunar.getFestival();
        const term = lunar.getJieQi();
        const specialName = festival || term;
        let finalUrl = null;

        if (specialName) {
            if (specialName !== this.currentSpecialName) {
                this.currentSpecialName = specialName;
                this.specialHeroList = [];
                this.specialHeroIdx = 0;

                const exts = [".png", ".webp", ".jpg"];
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

            if (this.specialHeroList.length > 0) {
                if (changeBg) {
                    this.specialHeroIdx = (this.specialHeroIdx + 1) % this.specialHeroList.length;
                }
                finalUrl = this.specialHeroList[this.specialHeroIdx];
            }
        } else {
            this.currentSpecialName = null;
            this.specialHeroList = [];
        }

        if (!finalUrl && this.heroList.length > 0) {
            if (changeBg) {
                this.heroIdx = (this.heroIdx + 1) % this.heroList.length;
            }
            finalUrl = this.heroList[this.heroIdx];
        }

        if (finalUrl) {
            let transType = "fade";
            if (changeBg) {
                transType = transitionOverride || "fade";
            }
            this.setHeroBackground(finalUrl, transType);
        }
    }
}
