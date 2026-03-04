import { type ProgressKey, progressState, calcPercent } from "./state";

let actualPercent = 0;
let visualPercent = 0;
const startTime = Date.now();
const MIN_LOADING_TIME = 2000; // ms

let isLoaded = false;
const loadingText = document.getElementById("loadingText") as HTMLElement | null;

export function updateUI(): void {
    actualPercent = calcPercent();
}

export function setLoadingStatus(text: string): void {
    if (loadingText) loadingText.textContent = text;
}

export function setItemStatus(key: ProgressKey, state: "pending" | "active" | "done"): void {
    const icon = document.getElementById(`statusIcon_${key}`);
    const item = icon?.closest(".status-item");

    if (state === "active") {
        if (icon) icon.textContent = "◎";
        if (item) {
            item.classList.add("active");
            item.classList.remove("done");
        }
    } else if (state === "done") {
        if (icon) icon.textContent = "✓";
        if (item) {
            item.classList.remove("active");
            item.classList.add("done");
        }
    }
}

export function markDone(key: ProgressKey): void {
    if (!progressState[key]) {
        progressState[key] = true;
        console.log(`[Loader] ✓ ${key} Done`);
        setItemStatus(key, "done");
        updateUI();
    }
}

export function markActive(key: ProgressKey): void {
    if (!progressState[key]) {
        setItemStatus(key, "active");
    }
}

export function revealApp(): void {
    if (isLoaded) return;
    isLoaded = true;

    console.log("[Loader] 🚀 Revealing App");
    document.body.classList.add("app-loaded");

    setTimeout(() => {
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) overlay.style.display = "none";
        document.body.classList.add("loader-finished");
        window.dispatchEvent(new CustomEvent("loader-finished"));
    }, 1500);
}

export function startAnimationLoop(): void {
    const frame = () => {
        const elapsedTime = Date.now() - startTime;
        const timePercent = Math.min((elapsedTime / MIN_LOADING_TIME) * 100, 100);
        const target = Math.max(actualPercent, timePercent);

        if (visualPercent < target) {
            visualPercent = target;
        }

        if (visualPercent > 100) visualPercent = 100;

        if (loadingText) {
            loadingText.style.setProperty("--loading-progress", visualPercent.toFixed(1) + "%");
        }

        if (actualPercent >= 100 && timePercent >= 99.9) {
            revealApp();
        } else {
            requestAnimationFrame(frame);
        }
    };
    requestAnimationFrame(frame);
}
