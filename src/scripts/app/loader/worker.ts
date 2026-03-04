import { markActive, markDone, setLoadingStatus } from "./ui";

async function monitorWorker(worker: ServiceWorker): Promise<void> {
    return new Promise((resolve) => {
        const stateHandler = () => {
            console.log(`[SW Monitor] State: ${worker.state}`);
            switch (worker.state) {
                case "installing":
                    setLoadingStatus("正在下載更新...");
                    break;
                case "installed":
                    setLoadingStatus("下載完成，準備安裝...");
                    // Standard: Skip Waiting to activate immediately
                    worker.postMessage({ type: "SKIP_WAITING" });
                    break;
                case "activating":
                    setLoadingStatus("更新中...");
                    break;
                case "activated":
                    setLoadingStatus("更新完成");
                    resolve(); // Ready
                    break;
                case "redundant":
                    console.warn("[SW Monitor] Worker became redundant");
                    resolve();
                    break;
            }
        };

        worker.addEventListener("statechange", stateHandler);
        // Fire immediately to catch current state
        stateHandler();
    });
}

export async function checkSWandSync(): Promise<void> {
    markActive("update");

    // 1. 環境檢查 (Environment Check)
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
        console.log("[Loader] Skipping SW sync (Dev/NoSupport)");
        markDone("update");
        return;
    }

    try {
        // 2. 監聽控制器變更 (Reload trigger)
        let isReloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (isReloading) return;
            isReloading = true;
            console.log("[Loader] ★ Version Sync -> Reloading");
            setLoadingStatus("發現新版本，同步並重整中...");
            document.body.classList.add("is-updating");
            window.location.reload();
        });

        // 3. 獲取當前註冊狀態 (Get Registration)
        // 稍微等待以確保瀏覽器已處理底層註冊
        const reg = await Promise.race([
            navigator.serviceWorker.getRegistration(),
            new Promise<undefined>((resolve) => setTimeout(resolve, 2000)), // 2秒逾時
        ]);

        if (!reg) {
            console.log("[Loader] No active registration found or timeout.");
            markDone("update");
            return;
        }

        // 4. 檢查更新 (Check for Updates)
        setLoadingStatus("檢查更新...");

        // 如果已有等待中的更新，直接處理
        if (reg.waiting) {
            console.log("[Loader] Update found (Waiting) -> Activating");
            document.body.classList.add("is-updating");
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
            return;
        }

        // 如果正在安裝，進行監控
        if (reg.installing) {
            console.log("[Loader] Update found (Installing) -> Monitoring");
            document.body.classList.add("is-updating");
            await monitorWorker(reg.installing);
            return;
        }

        try {
            await reg.update();
            // 如果沒有新更新 (reg.update 不一定回傳 boolean，需視狀態而定)
            if (!reg.installing && !reg.waiting) {
                console.log("[Loader] Current version is up to date.");
                markDone("update");
            }
        } catch (e) {
            console.warn("[Loader] Manual update check failed, assuming up-to-date.");
            markDone("update");
        }
    } catch (error) {
        console.error("[Loader] SW Sync Error:", error);
        markDone("update");
    }
}
