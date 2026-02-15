/**
 * Note Manager
 * 負責處理隨筆記錄功能，包括介面顯示、儲存、字體切換與匯出
 * Responsible for note-taking features: UI toggle, storage, font switching, and export
 */

import { HeroIdleManager } from "./idleManager";

export class NoteManager {
    private btnClose: HTMLElement | null = null;
    private btnExport: HTMLElement | null = null;
    private btnPen: HTMLElement | null = null;
    private btnSave: HTMLElement | null = null;
    private datePicker: HTMLInputElement | null = null;
    private editor: HTMLTextAreaElement | null = null;
    private fontSelect: HTMLSelectElement | null = null;
    private idleManager: HeroIdleManager;
    private statusIndicator: HTMLElement | null = null;

    private overlay: HTMLElement | null = null;

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
        this.statusIndicator = document.getElementById("noteStatus");

        // Set date picker to today
        if (this.datePicker) {
            this.datePicker.valueAsDate = new Date();
        }
    }

    private closeNotePad(): void {
        if (this.overlay) {
            this.overlay.classList.remove("active");
            document.body.classList.remove("note-mode-active"); // UI Cleanup
            this.idleManager.isNoteMode = false; // Resume immersion potential
            this.idleManager.reset(); // Reset timer
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

    private getNoteKey(date: Date): string {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        return `zen_note_${y}-${m}-${d}`;
    }

    private loadNote(date: Date): void {
        const key = this.getNoteKey(date);
        const content = localStorage.getItem(key);

        if (this.editor) {
            this.editor.value = content || "";
        }
    }

    private openNotePad(): void {
        if (this.overlay) {
            // 1. Force Exit Welcome/Immersion Mode & Close other panels to avoid overlap
            window.dispatchEvent(new CustomEvent("welcome-mode", { detail: { active: false } }));
            window.dispatchEvent(new CustomEvent("close-panels", { detail: { showGrid: false } }));
            document.body.classList.remove("initial-welcome");

            // 2. Activate Note Focus Mode
            this.overlay.classList.add("active");
            document.body.classList.add("note-mode-active");
            this.idleManager.isNoteMode = true;

            // 3. Load content
            if (this.datePicker?.valueAsDate) {
                this.loadNote(this.datePicker.valueAsDate);
            }
        }
    }

    private saveNote(): void {
        if (!this.datePicker?.valueAsDate || !this.editor) return;

        const key = this.getNoteKey(this.datePicker.valueAsDate);
        const content = this.editor.value;

        localStorage.setItem(key, content);
    }

    private setupEventListeners(): void {
        // Toggle Open
        this.btnPen?.addEventListener("mousedown", (e: MouseEvent) => {
            e.stopPropagation();
            this.openNotePad();
        });

        // Close
        this.btnClose?.addEventListener("click", (e: Event) => {
            e.stopPropagation();
            this.closeNotePad();
        });

        // Save
        this.btnSave?.addEventListener("click", (e: Event) => {
            e.stopPropagation();
            this.saveNote();
            // Feedback
            if (this.statusIndicator) {
                this.statusIndicator.textContent = "✧ 記憶已留存 (Saved)";
                this.statusIndicator.style.color = "rgba(255, 255, 255, 0.6)";
                setTimeout(() => {
                    if (this.statusIndicator) {
                        this.statusIndicator.textContent = "在此刻寫下感受";
                        this.statusIndicator.style.color = "";
                    }
                }, 3000);
            }
        });

        // Export (TXT)
        this.btnExport?.addEventListener("click", (e: Event) => {
            e.stopPropagation();
            this.exportNote();
        });

        // Font Change
        this.fontSelect?.addEventListener("change", (e: Event) => {
            e.stopPropagation();
            const fontClass = (e.target as HTMLSelectElement).value;
            if (this.editor) {
                this.editor.className = `note-textarea-zen ${fontClass}`;
                // Save font preference
                localStorage.setItem("note_font_pref", fontClass);
            }
        });

        // Date Change -> Load note for that date
        this.datePicker?.addEventListener("change", (e: Event) => {
            e.stopPropagation();
            if (this.datePicker?.valueAsDate) {
                this.loadNote(this.datePicker.valueAsDate);
            }
        });

        // Prevent typing/clicks in canvas from bubbling to window (avoid idle reset interference)
        this.editor?.addEventListener("mousedown", (e: MouseEvent) => e.stopPropagation());
        this.editor?.addEventListener("touchstart", (e: TouchEvent) => e.stopPropagation());
        this.editor?.addEventListener("keypress", (e: KeyboardEvent) => e.stopPropagation());

        this.overlay?.addEventListener("mousedown", (e: MouseEvent) => e.stopPropagation());
        this.overlay?.addEventListener("touchstart", (e: TouchEvent) => e.stopPropagation());

        // Load font preference
        const savedFont = localStorage.getItem("note_font_pref");
        if (savedFont && this.editor && this.fontSelect) {
            this.editor.className = `note-textarea-zen ${savedFont}`;
            this.fontSelect.value = savedFont;
        }
    }
}
