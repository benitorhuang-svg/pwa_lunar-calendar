/**
 * Hero PWA Handler
 * 負責處理 PWA 安裝提示與按鈕邏輯
 * Handles PWA installation prompts and button logic
 */
export class HeroPWAHandler {
    // 暫存 PWA 安裝事件，類型設為 any 因為 BeforeInstallPromptEvent 非標準介面
    // Store PWA install prompt event, typed as any because BeforeInstallPromptEvent is non-standard
    private deferredPrompt: any;

    constructor(
        private showInstallBtn: () => void, // 顯示安裝按鈕的回呼 (Callback to show install button)
        private hideInstallBtn: () => void, // 隱藏安裝按鈕的回呼 (Callback to hide install button)
        private bindInstallClick: (cb: () => void) => void, // 綁定點擊事件的函數 (Function to bind click event)
    ) {}

    public init(): void {
        // 監聽瀏覽器的 PWA 安裝提示事件
        // Listen for browser's PWA install prompt event
        window.addEventListener("beforeinstallprompt", (e) => {
            // 阻止預設的瀏覽器提示 (Prevent default browser prompt)
            e.preventDefault();
            this.deferredPrompt = e;
            // 顯示自定義安裝按鈕 (Show custom install button)
            this.showInstallBtn();
        });

        // 綁定自定義安裝按鈕點擊事件
        // Bind custom install button click event
        this.bindInstallClick(async () => {
            if (this.deferredPrompt) {
                // 觸發瀏覽器安裝視窗 (Trigger browser install prompt)
                await this.deferredPrompt.prompt();
                this.deferredPrompt = null;
                // 安裝後隱藏按鈕 (Hide button after install)
                this.hideInstallBtn();
            }
        });
    }
}
