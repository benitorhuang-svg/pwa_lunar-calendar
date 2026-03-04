/**
 * NotePad Event Bindings (Atomic: Template-level events)
 * 事件綁定模組：處理所有 NotePad UI 事件的綁定與分派
 */

import type { NoteManager } from "../../core/NoteManager";
import { onTypedEvent } from "../../core/typedEvents";
import { exportNotesToFile, updateCharCount, updatePinButton } from "./atoms";

/** Dependencies injected from NotePadHandler */
export interface NotepadEventContext {
    // DOM Elements
    notePadOverlay: HTMLElement | null;
    noteTextarea: HTMLTextAreaElement | null;
    panelBackOverlay: HTMLElement | null;
    customDatePicker: HTMLElement | null;
    pickerPrevBtn: HTMLElement | null;
    pickerNextBtn: HTMLElement | null;
    noteCharCount: HTMLElement | null;
    noteSearchInput: HTMLInputElement | null;
    noteTagInput: HTMLInputElement | null;
    btnSave: HTMLButtonElement | null;
    btnList: HTMLButtonElement | null;
    btnNoteToday: HTMLElement | null;
    btnNoteClear: HTMLElement | null;
    btnNotePin: HTMLElement | null;
    btnNoteExport: HTMLElement | null;

    // State accessors
    noteManager: NoteManager;
    getCurrentDate: () => { year: number; month: number; day: number };
    setCurrentDate: (y: number, m: number, d: number) => void;

    // Callbacks
    closeNotePad: () => void;
    toggleListView: () => void;
    doShowEditorView: () => void;
    refreshContent: () => void;
    doRenderTagBar: () => void;
    doRenderList: () => void;
    addTag: (label: string) => void;
    openCustomPicker: () => void;
    closeCustomPicker: () => void;
    changePickerMonth: (delta: number) => void;
    openNotePad: () => void;
}

/**
 * Bind all NotePad events. Called once from NotePadHandler.init().
 * 綁定所有筆記面板事件，由 NotePadHandler.init() 呼叫一次。
 */
export function bindNotepadEvents(ctx: NotepadEventContext): void {
    // Save button
    if (ctx.btnSave) {
        ctx.btnSave.addEventListener("click", () => ctx.closeNotePad());
    }

    // List toggle
    if (ctx.btnList) {
        ctx.btnList.addEventListener("click", () => ctx.toggleListView());
    }

    // Auto-save + char count
    if (ctx.noteTextarea) {
        ctx.noteTextarea.addEventListener("input", () => {
            if (ctx.noteTextarea) {
                const content = ctx.noteTextarea.value || "";
                const { year, month, day } = ctx.getCurrentDate();
                ctx.noteManager.saveNote(year, month, day, content);
                updateCharCount(ctx.noteCharCount, ctx.noteTextarea);
            }
        });
    }

    // Today button
    if (ctx.btnNoteToday) {
        ctx.btnNoteToday.addEventListener("click", () => {
            const now = new Date();
            ctx.setCurrentDate(now.getFullYear(), now.getMonth(), now.getDate());
            ctx.doShowEditorView();
            ctx.refreshContent();
        });
    }

    // Clear button
    if (ctx.btnNoteClear) {
        ctx.btnNoteClear.addEventListener("click", () => {
            if (ctx.noteTextarea && ctx.noteTextarea.value.trim()) {
                if (confirm("確定要清除目前的筆記內容嗎？")) {
                    ctx.noteTextarea.value = "";
                    const { year, month, day } = ctx.getCurrentDate();
                    ctx.noteManager.deleteNote(year, month, day);
                    updateCharCount(ctx.noteCharCount, ctx.noteTextarea);
                    ctx.doRenderTagBar();
                    updatePinButton(ctx.btnNotePin, ctx.noteManager, year, month, day);
                }
            }
        });
    }

    // Pin button
    if (ctx.btnNotePin) {
        ctx.btnNotePin.addEventListener("click", () => {
            const { year, month, day } = ctx.getCurrentDate();
            const pinned = ctx.noteManager.togglePin(year, month, day);
            updatePinButton(ctx.btnNotePin, ctx.noteManager, year, month, day, pinned);
        });
    }

    // Export button
    if (ctx.btnNoteExport) {
        ctx.btnNoteExport.addEventListener("click", () => {
            exportNotesToFile(ctx.noteManager);
        });
    }

    // Custom tag input
    if (ctx.noteTagInput) {
        ctx.noteTagInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const val = ctx.noteTagInput!.value.trim();
                if (val) {
                    ctx.addTag(val);
                    ctx.noteTagInput!.value = "";
                }
            }
        });
    }

    // Search input
    if (ctx.noteSearchInput) {
        ctx.noteSearchInput.addEventListener("input", () => {
            ctx.doRenderList();
        });
    }

    // Toggle Custom Date Picker
    const dateWrapper = document.querySelector(".note-date-wrapper");
    if (dateWrapper) {
        dateWrapper.addEventListener("click", (e) => {
            e.stopPropagation();
            if (ctx.customDatePicker) {
                const isActive = ctx.customDatePicker.classList.contains("active");
                if (isActive) {
                    ctx.closeCustomPicker();
                } else {
                    ctx.openCustomPicker();
                }
            }
        });
    }

    // Picker Navigation
    if (ctx.pickerPrevBtn) {
        ctx.pickerPrevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            ctx.changePickerMonth(-1);
        });
    }
    if (ctx.pickerNextBtn) {
        ctx.pickerNextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            ctx.changePickerMonth(1);
        });
    }

    // Close picker on outside click
    document.addEventListener("click", (e) => {
        if (ctx.customDatePicker && ctx.customDatePicker.classList.contains("active")) {
            const target = e.target as HTMLElement;
            if (!target.closest(".note-date-wrapper")) {
                ctx.closeCustomPicker();
            }
        }
    });

    // Stop picker clicks from toggling
    if (ctx.customDatePicker) {
        ctx.customDatePicker.addEventListener("click", (e) => e.stopPropagation());
    }

    // Open-notepad event
    onTypedEvent<any>("open-notepad", (detail) => {
        if (detail && detail.year) {
            ctx.setCurrentDate(detail.year, detail.month, detail.day);
        }
        ctx.doShowEditorView();
        ctx.openNotePad();
        const btnNote = document.getElementById("btnNote");
        if (btnNote) btnNote.classList.add("active");
    });

    onTypedEvent("close-notepad", () => {
        ctx.closeNotePad();
    });

    // Today panel rendered
    onTypedEvent<any>("today-panel-rendered", (detail) => {
        const { year, month, day } = detail;
        ctx.setCurrentDate(year, month, day);
        if (ctx.notePadOverlay?.classList.contains("active")) {
            const editorContainer = document.getElementById("noteEditorContainer");
            if (editorContainer && !editorContainer.classList.contains("hidden")) {
                ctx.refreshContent();
            }
        }
    });

    // Overlay click to close
    if (ctx.panelBackOverlay) {
        ctx.panelBackOverlay.addEventListener("click", () => {
            if (ctx.notePadOverlay?.classList.contains("active")) {
                ctx.closeNotePad();
            }
        });
    }
}
