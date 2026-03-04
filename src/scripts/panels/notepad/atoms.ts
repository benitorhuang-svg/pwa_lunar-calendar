/**
 * NotePad Atoms - Pure utility functions (no DOM dependencies)
 * 標籤顏色計算、匯出邏輯等最小單元
 */

import { NoteManager, PRESET_TAGS } from "../../core/NoteManager";

/**
 * Get the color for a given tag label.
 * Uses preset color if available, otherwise generates a consistent HSL color from label hash.
 */
export function getTagColor(label: string): string {
    const preset = PRESET_TAGS.find(t => t.label === label);
    if (preset) return preset.color;
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 65%)`;
}

/**
 * Export all notes as a downloadable .txt file.
 */
export function exportNotesToFile(noteManager: NoteManager): void {
    const text = noteManager.exportAsText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `每日記事_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Update the character count display.
 */
export function updateCharCount(
    charCountEl: HTMLElement | null,
    textarea: HTMLTextAreaElement | null
): void {
    if (charCountEl && textarea) {
        charCountEl.textContent = `${textarea.value.length} 字`;
    }
}

/**
 * Update the pin button visual state.
 */
export function updatePinButton(
    btnPin: HTMLElement | null,
    noteManager: NoteManager,
    year: number,
    month: number,
    day: number,
    pinned?: boolean
): void {
    if (!btnPin) return;
    const isPinned = pinned !== undefined
        ? pinned
        : noteManager.isPinned(year, month, day);
    btnPin.classList.toggle("pinned", isPinned);
}
