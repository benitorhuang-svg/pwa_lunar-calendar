/**
 * Note Manager
 * 負責處理隨筆記錄功能，包括介面顯示、儲存、字體切換與匯出
 * Responsible for note-taking features: UI toggle, storage, font switching, and export
 */

import { HeroIdleManager } from "./idleManager";

export class NoteManager {
    private overlay: HTMLElement | null = null;
    private btnPen: HTMLElement | null = null;
    private btnClose: HTMLElement | null = null;
    private btnSave: HTMLElement | null = null;
    private btnExport: HTMLElement | null = null;
    private fontSelect: HTMLSelectElement | null = null;
    private datePicker: HTMLInputElement | null = null;
    private editor: HTMLTextAreaElement | null = null;

    private idleManager: HeroIdleManager;

    constructor(idleManager: HeroIdleManager) {
        this.idleManager = idleManager;
    }

    public init(): void {
        this.cacheElements();
        this.setupEventListeners();

        // Load today's note by default
        this.loadNote(new Date());
    }

    private cacheElements(): void {
        this.overlay = document.getElementById("notePadOverlay");
        this.btnPen = document.getElementById("btnPen");
        this.btnClose = document.getElementById("btnNoteClose");
        this.btnSave = document.getElementById("btnNoteSave");
        this.btnExport = document.getElementById("btnNoteExport");
        this.fontSelect = document.getElementById("noteFontSelect") as HTMLSelectElement;
        this.datePicker = document.getElementById("noteDatePicker") as HTMLInputElement;
        this.editor = document.getElementById("noteEditor") as HTMLTextAreaElement;

        // Set date picker to today
        if (this.datePicker) {
            this.datePicker.valueAsDate = new Date();
        }
    }

    private setupEventListeners(): void {
        // Toggle Open
        this.btnPen?.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.openNotePad();
        });

        // Close
        this.btnClose?.addEventListener("click", () => {
            this.closeNotePad();
        });

        // Save
        this.btnSave?.addEventListener("click", () => {
            this.saveNote();
            // Feedback
            const originalText = this.btnSave?.textContent;
            if (this.btnSave) this.btnSave.textContent = "已儲存 (Saved)";
            setTimeout(() => {
                if (this.btnSave) this.btnSave.textContent = originalText || "儲存 (Save)";
            }, 2000);
        });

        // Export (TXT)
        this.btnExport?.addEventListener("click", () => {
            this.exportNote();
        });

        // Font Change
        this.fontSelect?.addEventListener("change", (e) => {
            const fontClass = (e.target as HTMLSelectElement).value;
            if (this.editor) {
                this.editor.className = `note-textarea ${fontClass}`;
                // Save font preference
                localStorage.setItem("note_font_pref", fontClass);
            }
        });

        // Date Change -> Load note for that date
        this.datePicker?.addEventListener("change", () => {
            if (this.datePicker?.valueAsDate) {
                this.loadNote(this.datePicker.valueAsDate);
            }
        });

        // Load font preference
        const savedFont = localStorage.getItem("note_font_pref");
        if (savedFont && this.editor && this.fontSelect) {
            this.editor.className = `note-textarea ${savedFont}`;
            this.fontSelect.value = savedFont;
        }
    }

    private openNotePad(): void {
        if (this.overlay) {
            this.overlay.classList.add("active");
            this.idleManager.isNoteMode = true; // Pause immersion

            // Reload note to ensure fresh state if date changed externally (though date picker handles it)
            if (this.datePicker?.valueAsDate) {
                this.loadNote(this.datePicker.valueAsDate);
            }
        }
    }

    private closeNotePad(): void {
        if (this.overlay) {
            this.overlay.classList.remove("active");
            this.idleManager.isNoteMode = false; // Resume immersion potential
            this.idleManager.reset(); // Reset timer
        }
    }

    private getNoteKey(date: Date): string {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        return `zen_note_${y}-${m}-${d}`;
    }

    private saveNote(): void {
        if (!this.datePicker?.valueAsDate || !this.editor) return;

        const key = this.getNoteKey(this.datePicker.valueAsDate);
        const content = this.editor.value;

        localStorage.setItem(key, content);
    }

    private loadNote(date: Date): void {
        const key = this.getNoteKey(date);
        const content = localStorage.getItem(key);

        if (this.editor) {
            this.editor.value = content || "";
        }
    }

    private exportNote(): void {
        if (!this.editor) return;

        const content = this.editor.value;
        if (!content) {
            alert("目前沒有內容可匯出 (No content to export)");
            return;
        }

        const dateStr = this.datePicker?.value || "untited";
        const filename = `zen_note_${dateStr}.txt`;

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
