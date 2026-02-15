import type { HeroIdleManager } from "../idleManager";
import type { RenderPanelsDetail, ToggleGridViewDetail, TogglePanelDetail } from "../types";
import type { HeroUIManager } from "../uiManager";

export class PanelUIHandler {
    constructor(
        private uiManager: HeroUIManager,
        private idleManager: HeroIdleManager,
    ) {}

    public init(): void {
        this.bindEvents();
    }

    public setupInteractionButtons(): void {
        // 切換網格按鈕 (Toggle Grid Button)
        this.uiManager.bindToggleGrid(() => {
            this.idleManager.reset();
            window.dispatchEvent(new CustomEvent("toggle-grid"));
        });

        // 切換年月面板按鈕 (Toggle Year/Month Button)
        this.uiManager.bindToggleYearMonth(() => {
            this.idleManager.reset();
            window.dispatchEvent(
                new CustomEvent<TogglePanelDetail>("toggle-panel", { detail: "yearMonth" }),
            );
        });
    }

    private bindEvents(): void {
        // 切換網格視圖 (Toggle Grid View)
        window.addEventListener("toggle-grid-view", ((e: CustomEvent<ToggleGridViewDetail>) => {
            this.uiManager.toggleGridView(e.detail.show);
        }) as EventListener);

        // 渲染面板 (Render Panels)
        window.addEventListener("render-panels", ((e: CustomEvent<RenderPanelsDetail>) => {
            this.uiManager.updatePanelsForType(e.detail.type);
        }) as EventListener);

        // 隱藏面板 (Hide Panels)
        window.addEventListener("hide-panels", () => {
            this.uiManager.hidePanelActiveStates();
        });

        // 打開筆記本 (Open NotePad)
        window.addEventListener("open-notepad", ((_e: CustomEvent) => {
            const overlay = document.getElementById("notePadOverlay");
            if (overlay) {
                overlay.classList.add("active");
                document.body.classList.add("note-mode-active");

                // Hide other panels
                window.dispatchEvent(new CustomEvent("hide-panels"));
            }
        }) as EventListener);

        // 綁定筆記本關閉按鈕 (Bind NotePad Close)
        const btnCloseNote = document.getElementById("btnNoteClose");
        if (btnCloseNote) {
            btnCloseNote.addEventListener("click", () => {
                const overlay = document.getElementById("notePadOverlay");
                if (overlay) {
                    overlay.classList.remove("active");
                    document.body.classList.remove("note-mode-active");

                    // Re-open Today Panel? Or just go back to nothing?
                    // Currently default to just close.
                    window.dispatchEvent(new CustomEvent("toggle-panel", { detail: "today" }));
                }
            });
        }
    }
}
