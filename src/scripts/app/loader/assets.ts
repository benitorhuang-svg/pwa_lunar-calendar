/**
 * Asset Loaders — 字體、音訊、圖庫預載
 */
import { APP_BASE_URL } from "../../core/appConfig";
import { GALLERY_MANIFEST } from "../../generated/galleryManifest";
import { markActive, markDone } from "./ui";

// --- Script Loader ---

export function loadScripts(): void {
    markActive("scripts");
    if ((window as any).__APP_LOGIC_READY__) {
        markDone("scripts");
    } else {
        window.addEventListener("app-logic-ready", () => markDone("scripts"));
    }
}

// --- Font Loader ---

export function checkFonts(): void {
    markActive("fonts");

    const criticalFonts = [
        { family: "Ma Shan Zheng", weight: "400" },
        { family: "Zhi Mang Xing", weight: "400" },
        { family: "Noto Serif TC", weight: "400" },
    ];

    const checkAllFonts = (): boolean => {
        return criticalFonts.every((f) => {
            try {
                return document.fonts.check(`${f.weight} 16px "${f.family}"`);
            } catch {
                return false;
            }
        });
    };

    if (checkAllFonts()) {
        console.log("[Loader] Fonts already cached and ready");
        markDone("fonts");
        return;
    }

    document.fonts.ready.then(() => {
        if (checkAllFonts()) {
            console.log("[Loader] All critical fonts loaded via fonts.ready");
            markDone("fonts");
        } else {
            console.warn("[Loader] fonts.ready fired but critical fonts still missing, polling...");
            pollFonts();
        }
    });

    let pollCount = 0;
    const MAX_POLLS = 16; // 16 × 500ms = 8 seconds
    function pollFonts(): void {
        const interval = setInterval(() => {
            pollCount++;
            if (checkAllFonts()) {
                clearInterval(interval);
                console.log(`[Loader] Critical fonts loaded after ${pollCount * 500}ms polling`);
                markDone("fonts");
            } else if (pollCount >= MAX_POLLS) {
                clearInterval(interval);
                console.warn("[Loader] ⚠️ Font loading timeout (8s). Proceeding with fallback fonts.");
                markDone("fonts");
            }
        }, 500);
    }

    pollFonts();
}

// --- Image & Audio Preloader ---

export function preloadAssets(): void {
    markActive("heroFirst");
    markActive("heroAll");
    markActive("audio");

    // Audio
    const baseDir = APP_BASE_URL || "/";
    const audioSrc = (baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/");
    const audio = new Audio();
    audio.oncanplaythrough = () => markDone("audio");
    audio.onerror = () => markDone("audio");
    audio.src = audioSrc;
    setTimeout(() => markDone("audio"), 2000); // Timeout

    // Images
    const m = new Date().getMonth() + 1;
    let season = "winter";
    if (m >= 2 && m <= 4) season = "spring";
    else if (m >= 5 && m <= 7) season = "summer";
    else if (m >= 8 && m <= 10) season = "autumn";

    importGalleryAndLoad(season);
}

function importGalleryAndLoad(season: string): void {
    const baseDir = APP_BASE_URL || "/";
    const manifest = GALLERY_MANIFEST as any;
    let list = manifest[season] || [];
    if (!list.length) {
        list = manifest["default"] || [];
    }

    if (!list.length) {
        markDone("heroFirst");
        markDone("heroAll");
        return;
    }

    // Load First
    const img = new Image();
    img.onload = () => markDone("heroFirst");
    img.onerror = () => markDone("heroFirst");
    img.src = (baseDir + "assets/gallery/" + season + "/" + list[0]).replace(/\/+/g, "/");

    // Wait for full preload signal
    if ((window as any).__APP_IMAGES_PRELOADED__) {
        markDone("heroAll");
    } else {
        window.addEventListener("app-images-preloaded", () => markDone("heroAll"));
    }
}
