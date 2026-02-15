import { HeroIdleManager } from "./idleManager";

export class NoteManager {
    private btnPen: HTMLElement | null = null;

    constructor(_idleManager: HeroIdleManager) {
        // idleManager no longer needed for unified panel
    }

    public init(): void {
        this.setupEventListeners();
    }

    private closeOverlay(): void {
        const overlay = document.getElementById("notePadOverlay");
        if (overlay) overlay.classList.remove("active");
        document.body.classList.remove("note-mode-active");
        window.dispatchEvent(new CustomEvent("toggle-panel", { detail: "today" }));
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

        // Bind Save (Close)
        const btnSave = document.getElementById("btnNoteSave");
        if (btnSave) {
            btnSave.onclick = () => {
                this.closeOverlay();
            };
        }

        // Close button logic
        const btnClose = document.getElementById("btnNoteClose");
        if (btnClose) {
            btnClose.onclick = () => {
                this.closeOverlay();
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
