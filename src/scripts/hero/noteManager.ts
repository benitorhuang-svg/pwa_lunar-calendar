/**
 * Note Manager
 * 負責處理隨筆記錄功能 (Responsible for note-taking features)
 * Refactored to use the unified Daily Card (panelToday).
 */

import { HeroIdleManager } from "./idleManager";

export class NoteManager {
    private btnPen: HTMLElement | null = null;

    constructor(_idleManager: HeroIdleManager) {
        // idleManager no longer needed for unified panel
    }

    public init(): void {
        this.setupEventListeners();
    }

    private exportPanelNote(date: Date, content: string, format: string): void {
        if (!content && format !== "png") {
            // PNG might handle empty generic view?
            alert("目前沒有內容可匯出");
            return;
        }

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
        const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
        const filename = `zen_note_${dateStr}_${timeStr}.${format}`;

        if (format === "txt") {
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            alert(`目前尚未支援 ${format.toUpperCase()} 匯出功能，請等待後續更新。`);
        }
    }

    private getNoteKey(date: Date): string {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        return `zen_note_${y}-${m}-${d}`;
    }

    private loadNoteForOverlay(year: number, month: number, day: number): void {
        const date = new Date(year, month, day);
        const key = this.getNoteKey(date);
        const content = localStorage.getItem(key);

        const overlayEditor = document.getElementById("noteEditor") as HTMLTextAreaElement;
        const datePicker = document.getElementById("noteDatePicker") as HTMLInputElement;

        if (overlayEditor) {
            overlayEditor.value = content || "";

            // Auto-save
            overlayEditor.oninput = () => {
                localStorage.setItem(key, overlayEditor.value);
            };

            // Font preference (Overlay)
            const savedFont = localStorage.getItem("note_font_pref");
            const overlayFontSelect = document.getElementById(
                "noteFontSelect",
            ) as HTMLSelectElement;
            if (savedFont) {
                overlayEditor.className = `note-textarea-zen ${savedFont}`;
                if (overlayFontSelect) overlayFontSelect.value = savedFont;
            }

            if (overlayFontSelect) {
                overlayFontSelect.onchange = (e) => {
                    const fontClass = (e.target as HTMLSelectElement).value;
                    overlayEditor.className = `note-textarea-zen ${fontClass}`;
                    localStorage.setItem("note_font_pref", fontClass);
                };
            }
        }

        // Setup Date Picker Display
        if (datePicker) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            datePicker.value = dateStr;

            // Handle date change
            datePicker.onchange = (e) => {
                const newDateStr = (e.target as HTMLInputElement).value;
                if (newDateStr) {
                    const parts = newDateStr.split("-").map(Number);
                    if (parts.length >= 3) {
                        const y = parts[0]!;
                        const m = parts[1]!;
                        const d = parts[2]!;
                        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                            this.loadNoteForOverlay(y, m - 1, d);
                        }
                    }
                }
            };
        }

        // Bind Save/Export in Overlay
        const btnSave = document.getElementById("btnNoteSave");
        if (btnSave) {
            btnSave.onclick = () => {
                const overlay = document.getElementById("notePadOverlay");
                if (overlay) overlay.classList.remove("active");
                document.body.classList.remove("note-mode-active");
                window.dispatchEvent(new CustomEvent("toggle-panel", { detail: "today" }));
            };
        }

        const btnExport = document.getElementById("btnNoteExport");
        if (btnExport) {
            btnExport.onclick = () => {
                this.exportPanelNote(date, overlayEditor?.value || "", "txt");
            };
        }

        // Close button logic (also handled in eventHandlers but binding here ensures data safety if needed)
        const btnClose = document.getElementById("btnNoteClose");
        if (btnClose) {
            btnClose.onclick = () => {
                const overlay = document.getElementById("notePadOverlay");
                if (overlay) overlay.classList.remove("active");
                document.body.classList.remove("note-mode-active");
                window.dispatchEvent(new CustomEvent("toggle-panel", { detail: "today" }));
            };
        }
    }

    private loadNoteForPanel(year: number, month: number, day: number): void {
        const date = new Date(year, month, day);
        const key = this.getNoteKey(date);

        // Font preference binding (Global setting)
        const savedFont = localStorage.getItem("note_font_pref");
        const fontSelect = document.getElementById("panelNoteFontSelect") as HTMLSelectElement;
        if (fontSelect && savedFont) {
            fontSelect.value = savedFont;
        }

        // Open Notepad Trigger
        const btnOpen = document.getElementById("btnOpenNotePad");
        if (btnOpen) {
            btnOpen.onclick = (e) => {
                e.stopPropagation();
                window.dispatchEvent(
                    new CustomEvent("open-notepad", {
                        detail: { day, month, year }, // Pass date context
                    }),
                );
            };
        }

        // Export binding (Select Menu)
        const exportSelect = document.getElementById("panelNoteExportSelect") as HTMLSelectElement;
        if (exportSelect) {
            exportSelect.onchange = (e) => {
                e.stopPropagation();
                const format = exportSelect.value;
                if (format) {
                    const content = localStorage.getItem(key) || "";
                    this.exportPanelNote(date, content, format);
                    exportSelect.value = ""; // Reset selection
                }
            };
        }

        // Font selector change (Save pref only)
        if (fontSelect) {
            fontSelect.onchange = (e) => {
                e.stopPropagation();
                const fontClass = (e.target as HTMLSelectElement).value;
                localStorage.setItem("note_font_pref", fontClass);
            };
        }
    }

    private setupEventListeners(): void {
        this.btnPen = document.getElementById("btnPen");

        // Toggle Open (Unified Panel) - Force Open for 'Enter Note Mode'
        this.btnPen?.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
            window.dispatchEvent(
                new CustomEvent("toggle-panel", { detail: { force: "open", type: "today" } }),
            );
        });

        // Listen for Panel Render
        window.addEventListener("today-panel-rendered", ((e: CustomEvent) => {
            const { day, month, year } = e.detail || {};
            if (year && month !== undefined && day) {
                this.loadNoteForPanel(year, month, day);
            } else {
                const today = new Date();
                this.loadNoteForPanel(today.getFullYear(), today.getMonth(), today.getDate());
            }
        }) as EventListener);

        // Listen for Open NotePad (Full Screen)
        window.addEventListener("open-notepad", ((e: CustomEvent) => {
            const { day, month, year } = e.detail || {};
            if (year && month !== undefined && day) {
                this.loadNoteForOverlay(year, month, day);
            } else {
                // Fallback to today
                const today = new Date();
                this.loadNoteForOverlay(today.getFullYear(), today.getMonth(), today.getDate());
            }
        }) as EventListener);
    }
}
