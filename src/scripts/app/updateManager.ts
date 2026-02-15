/**
 * Update Manager
 * 負責檢測 Service Worker 更新並強制刷新，確保使用者總是看到最新版本
 */
export class UpdateManager {
    public async checkUpdates(): Promise<void> {
        if (!("serviceWorker" in navigator)) return;

        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // 如果已經有等待中的 Service Worker，直接更新
        if (registration.waiting) {
            this.forceUpdate(registration.waiting);
            return;
        }

        // 監聽新的 Service Worker 安裝
        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                        // 新版本已安裝好，準備接管
                        this.forceUpdate(newWorker);
                    }
                });
            }
        });

        // 監聽控制權變更 (代表更新完成)，重新整理頁面
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });

        // 主動檢查更新
        try {
            await registration.update();
        } catch (_e) {
            // Ignore offline errors
        }
    }

    private forceUpdate(worker: ServiceWorker): void {
        console.log("[UpdateManager] New version found, forcing update...");
        // 通知 SW 跳過等待
        worker.postMessage({ type: "SKIP_WAITING" });
    }
}
