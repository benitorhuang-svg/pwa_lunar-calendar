import type { HeroIdleManager } from "../idleManager";
import type { RenderPanelsDetail, ToggleGridViewDetail } from "../types";
import type { HeroUIManager } from "../uiManager";

export class PanelUIHandler {
    constructor(
        private uiManager: HeroUIManager,
        private idleManager: HeroIdleManager,
    ) { }

    public init(): void {
        this.bindEvents();
    }

    public setupInteractionButtons(): void {
        // 切換網格按鈕 (Toggle Grid Button / Day Button)
        this.uiManager.bindToggleGrid(() => {
            this.idleManager.resetInteraction();

            // T212: Mode-switching logic moved to button handler layer
            const isImmersion = document.body.classList.contains("immersion-mode");
            const isWelcome = document.body.classList.contains("initial-welcome");

            if (isImmersion || isWelcome) {
                // immersion/artwork/zen/welcome -> calendar
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "calendar" } }),
                );
            } else {
                // calendar -> artwork (or toggle grid if preferred, but usually this button is mode toggle)
                // If we want it to toggle grid in calendar mode:
                // window.dispatchEvent(new CustomEvent("toggle-grid"));
                // But current user flow says it switches to Artwork.
                window.dispatchEvent(
                    new CustomEvent("transition-mode", { detail: { to: "artwork" } }),
                );
            }
        });

        // 綁定筆記按鈕 (Bind Note Button)
        const btnNote = document.getElementById("btnNote");
        if (btnNote) {
            btnNote.addEventListener("click", () => {
                this.idleManager.resetInteraction();
                window.dispatchEvent(new CustomEvent("open-notepad"));
            });
        }
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


    }
}
