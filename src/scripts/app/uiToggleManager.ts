/**
 * UI Toggle Manager (Atomic Design)
 * 集中管理所有可切換 UI 元件的開關狀態
 * 點選任一元件時，自動關閉其它所有元件
 */

interface ToggleableUI {
    /** 關閉此 UI 元件 */
    close: () => void;
    /** 唯一識別碼 */
    id: string;
    /** 開啟此 UI 元件 */
    open: () => void;
}

export class UIToggleManager {
    private elements: Map<string, ToggleableUI> = new Map();

    /**
     * 註冊一個可切換的 UI 元件
     */
    public register(ui: ToggleableUI): void {
        this.elements.set(ui.id, ui);
    }

    /**
     * 關閉所有 UI 元件
     */
    public closeAll(): void {
        this.elements.forEach((ui) => ui.close());
    }

    /**
     * 關閉指定 ID 以外的所有 UI 元件
     */
    public closeAllExcept(id: string): void {
        this.elements.forEach((ui) => {
            if (ui.id !== id) {
                ui.close();
            }
        });
    }

    /**
     * Toggle 指定 ID 的元件：
     * - 若目前關閉 → 關閉其它所有 → 開啟此元件
     * - 若目前開啟 → 關閉此元件
     */
    public toggle(id: string, isCurrentlyOpen: boolean): void {
        if (isCurrentlyOpen) {
            this.elements.get(id)?.close();
        } else {
            this.closeAllExcept(id);
            this.elements.get(id)?.open();
        }
    }
}

// 全域單例
export const uiToggleManager = new UIToggleManager();
