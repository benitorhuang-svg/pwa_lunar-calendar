// Resource Loading & Splash Screen Logic
// MODE: dev (local) — tracks actual progress percentage
// TODO [deploy]: Adjust fallback logic for GitHub Pages deployment

(function () {
    let isLoaded = false;
    const loadingBar = document.getElementById("loadingBar");
    const loadingPercent = document.getElementById("loadingPercent");

    // --- Resource Tracker ---
    // Weight Distribution: scripts 20%, fonts 20%, hero images 50%, audio 10%
    const progress = {
        scripts: false,   // 20%
        fonts: false,     // 20%
        heroFirst: false, // 30% (First hero image)
        heroAll: false,   // 20% (Preload remaining hero images)
        audio: false,     // 10%
    };
    const weights = {
        scripts: 20,
        fonts: 20,
        heroFirst: 30,
        heroAll: 20,
        audio: 10,
    };

    function calcPercent() {
        let total = 0;
        for (const key in progress) {
            if (progress[key]) total += weights[key];
        }
        return total;
    }

    function updateUI() {
        const pct = calcPercent();
        if (loadingBar) loadingBar.style.width = pct + "%";
        if (loadingPercent) loadingPercent.textContent = pct + "%";

        if (pct >= 100) {
            revealApp();
        }
    }

    function markDone(key) {
        if (!progress[key]) {
            progress[key] = true;
            console.log("[Loader] ✓ " + key + " (" + calcPercent() + "%)");
            updateUI();
        }
    }

    function revealApp() {
        if (isLoaded) return;
        isLoaded = true;

        document.body.classList.add("app-loaded");

        setTimeout(() => {
            const overlay = document.getElementById("loadingOverlay");
            if (overlay) overlay.style.display = "none";
        }, 1000);
    }

    // --- 1. 檢查 Scripts (Lunar + GALLERY_MANIFEST) ---
    function checkScripts() {
        if (typeof Lunar !== "undefined" && typeof GALLERY_MANIFEST !== "undefined") {
            markDone("scripts");
            return true;
        }
        return false;
    }

    // --- 2. 檢查 Fonts ---
    function checkFonts() {
        if (document.fonts && document.fonts.status === "loaded") {
            markDone("fonts");
            return true;
        }
        return false;
    }

    // --- 3. 預載 Hero 圖片 ---
    function preloadHeroImages() {
        if (typeof GALLERY_MANIFEST === "undefined") return;

        // 決定當季
        const m = new Date().getMonth() + 1;
        let season;
        if (m >= 2 && m <= 4) season = "spring";
        else if (m >= 5 && m <= 7) season = "summer";
        else if (m >= 8 && m <= 10) season = "autumn";
        else season = "winter";

        const baseDir = window.APP_BASE_URL || "/";
        const galleryDir = (baseDir + "assets/gallery/" + season + "/").replace(/\/+/g, "/");

        let imageList = (GALLERY_MANIFEST[season] || []).map(f => galleryDir + f);
        // fallback to default
        if (imageList.length === 0) {
            const defaultDir = (baseDir + "assets/gallery/default/").replace(/\/+/g, "/");
            imageList = (GALLERY_MANIFEST["default"] || []).map(f => defaultDir + f);
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
            let remaining = imageList.length - 1;
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
    function preloadAudio() {
        const baseDir = window.APP_BASE_URL || "/";
        const audioFiles = [
            (baseDir + "assets/audio/ambient.mp3").replace(/\/+/g, "/"),
        ];
        // 只測試第一個音頻是否可載入
        if (audioFiles.length === 0) {
            markDone("audio");
            return;
        }
        const audio = new Audio();
        audio.preload = "auto";
        // [dev] 本地端音頻載入通常很快
        audio.oncanplaythrough = () => markDone("audio");
        audio.onerror = () => markDone("audio"); // 即使失敗也不阻塞
        audio.src = audioFiles[0];

        // [dev] 音頻 fallback 超時 2 秒
        setTimeout(() => markDone("audio"), 2000);
    }

    // --- 主邏輯 ---
    window.addEventListener("load", () => {
        // 立即檢查 scripts
        if (!checkScripts()) {
            const si = setInterval(() => {
                if (checkScripts()) clearInterval(si);
            }, 50);
        }

        // 字體
        if (!checkFonts()) {
            document.fonts.ready.then(() => markDone("fonts"));
            // fallback
            setTimeout(() => markDone("fonts"), 3000);
        }

        // 圖片 — 等 scripts ready 後才知道 manifest
        const waitManifest = setInterval(() => {
            if (progress.scripts) {
                clearInterval(waitManifest);
                preloadHeroImages();
            }
        }, 50);

        // 音頻
        preloadAudio();

        // [dev] 安全網：最多等 8 秒強制進入
        // TODO [deploy]: GitHub Pages 可能需要更長時間，可調整此值
        setTimeout(() => {
            for (const key in progress) {
                if (!progress[key]) {
                    console.warn("[Loader] Force-completing: " + key);
                    progress[key] = true;
                }
            }
            updateUI();
        }, 8000);
    });
})();
