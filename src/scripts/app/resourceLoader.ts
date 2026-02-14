/**
 * Resource Loading & Splash Screen Logic
 * 負責首屏加載遮罩邏輯
 */
import { Lunar } from "../core/lunar";
import { GALLERY_MANIFEST } from "../generated/galleryManifest";

(function () {
    let isLoaded = false;
    const loadingText = document.getElementById("loadingText") as HTMLElement | null;

    type ProgressKey = "audio" | "fonts" | "heroAll" | "heroFirst" | "scripts";

    // --- Resource Tracker ---
    // Weight Distribution: scripts 20%, fonts 20%, hero images 50%, audio 10%
    const progress: Record<ProgressKey, boolean> = {
        audio: false, // 10%
        fonts: false, // 20%
        heroAll: false, // 20% (Preload remaining hero images)
        heroFirst: false, // 30% (First hero image)
        scripts: true, // 20% (Always true since we bundle imports)
    };

    const weights: Record<ProgressKey, number> = {
        audio: 10,
        fonts: 20,
        heroAll: 20,
        heroFirst: 30,
        scripts: 20,
    };

    function calcPercent(): number {
        let total = 0;
        let key: keyof typeof progress;
        for (key in progress) {
            if (progress[key]) total += weights[key];
        }
        return total;
    }

    let actualPercent = 0;
    let visualPercent = 0;
    const startTime = Date.now();
    const MIN_LOADING_TIME = 2000; // 至少動畫 2 秒

    function updateUI(): void {
        actualPercent = calcPercent();
    }

    function markDone(key: ProgressKey): void {
        if (!progress[key]) {
            progress[key] = true;
            console.log("[Loader] ✓ " + key + " (" + calcPercent() + "%)");
            updateUI();
        }
    }

    // 啟動平滑動畫循環 (Start smooth animation loop)
    function startAnimationLoop(): void {
        const frame = () => {
            const elapsedTime = Date.now() - startTime;
            const timePercent = (elapsedTime / MIN_LOADING_TIME) * 100;

            // 視覺進度取「實際資源進度」與「時間進度」的最小值
            // 確保即使資源載入極快，也要花 2 秒才跑完動畫
            visualPercent = Math.min(actualPercent, timePercent);

            if (loadingText) {
                loadingText.style.setProperty("--loading-progress", visualPercent.toFixed(1) + "%");
            }

            if (visualPercent < 100 || actualPercent < 100) {
                requestAnimationFrame(frame);
            } else {
                // 當兩者都達到 100% 時，觸發揭幕
                revealApp();
            }
        };
        requestAnimationFrame(frame);
    }

    function revealApp(): void {
        if (isLoaded) return;
        isLoaded = true;

        document.body.classList.add("app-loaded");

        // 等待 clip-path 動畫執行完畢 (1.4s) 後再完全隱藏 DOM
        setTimeout(() => {
            const overlay = document.getElementById("loadingOverlay");
            if (overlay) overlay.style.display = "none";
        }, 1500);
    }

    // --- 2. 檢查 Fonts ---
    function checkFonts(): boolean {
        if (document.fonts && document.fonts.status === "loaded") {
            markDone("fonts");
            return true;
        }
        return false;
    }

    // --- 3. 預載 Hero 圖片 ---
    function preloadHeroImages(): void {
        // 決定當季
        const m = new Date().getMonth() + 1;
        let season: string;
        if (m >= 2 && m <= 4) season = "spring";
        else if (m >= 5 && m <= 7) season = "summer";
        else if (m >= 8 && m <= 10) season = "autumn";
        else season = "winter";

        const baseDir = (window as any).APP_BASE_URL || "/";
        const galleryDir = (baseDir + "assets/gallery/" + season + "/").replace(/\/+/g, "/");

        const manifest = GALLERY_MANIFEST as Record<string, string[]>;
        let imageList = (manifest[season] || []).map((f: string) => galleryDir + f);
        // fallback to default
        if (imageList.length === 0) {
            const defaultDir = (baseDir + "assets/gallery/default/").replace(/\/+/g, "/");
            imageList = (manifest["default"] || []).map((f: string) => defaultDir + f);
        }

        if (imageList.length === 0) {
            markDone("heroFirst");
            markDone("heroAll");
            return;
        }

        // 載入第一張 (權重最高)
        const firstImg = new Image();
        firstImg.onload = firstImg.onerror = () => {
            markDone("heroFirst");
        };
        firstImg.src = imageList[0];

        // 載入其餘
        if (imageList.length <= 1) {
            markDone("heroAll");
        } else {
            const remaining = imageList.length - 1;
            let loaded = 0;
            for (let i = 1; i < imageList.length; i++) {
                const img = new Image();
                img.onload = img.onerror = () => {
                    loaded++;
                    if (loaded >= remaining) {
                        markDone("heroAll");
                    }
                };
                img.src = imageList[i];
            }
        }
    }

    // --- 4. 預載 Audio ---
    function preloadAudio(): void {
        const baseDir = (window as any).APP_BASE_URL || "/";
        const audioFiles = [(baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/")];
        // 只測試第一個音頻是否可載入
        if (audioFiles.length === 0) {
            markDone("audio");
            return;
        }
        const firstAudio = audioFiles[0];
        if (!firstAudio) {
            markDone("audio");
            return;
        }
        const audio = new Audio();
        audio.preload = "auto";
        audio.oncanplaythrough = () => markDone("audio");
        audio.onerror = () => markDone("audio"); // 即使失敗也不阻塞
        audio.src = firstAudio;

        // 音頻 fallback 超時 2 秒
        setTimeout(() => markDone("audio"), 2000);
    }

    // --- 主邏輯 ---
    // Make sure we mark scripts as done immediately since we imported them
    markDone("scripts");

    // Start checking other resources
    if (!checkFonts()) {
        document.fonts.ready.then(() => markDone("fonts"));
        // fallback
        setTimeout(() => markDone("fonts"), 3000);
    }

    preloadHeroImages();
    preloadAudio();
    startAnimationLoop();

    // 安全網：最多等 8 秒強制進入
    setTimeout(() => {
        let key: ProgressKey;
        for (key in progress) {
            if (!progress[key]) {
                console.warn("[Loader] Force-completing: " + key);
                markDone(key);
            }
        }
    }, 8000);
})();
