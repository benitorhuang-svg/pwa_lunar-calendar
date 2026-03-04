/**
 * NotePad Template (Orchestrator)
 * Thin coordinator that delegates to atomic modules.
 * 薄協調層：將邏輯委派給原子化模組
 */

import { NoteManager } from "../core/NoteManager";

// Atomic imports
import { updateCharCount, updatePinButton } from "./notepad/atoms";
import { bindNotepadEvents } from "./notepad/eventBindings";
import { initPresetTags, initTagFilters, renderCustomPicker, renderTagBar } from "./notepad/molecules";
import { renderList, showEditorView, showListView } from "./notepad/organisms";

export class NotePadHandler {
    private notePadOverlay: HTMLElement | null = null;
    private noteTextarea: HTMLTextAreaElement | null = null;
    private noteDatePicker: HTMLInputElement | null = null;
    private noteDateText: HTMLElement | null = null;
    private btnSave: HTMLButtonElement | null = null;
    private btnList: HTMLButtonElement | null = null;
    private panelBackOverlay: HTMLElement | null = null;

    // Custom Date Picker Elements
    private customDatePicker: HTMLElement | null = null;
    private pickerMonthDisplay: HTMLElement | null = null;
    private pickerGrid: HTMLElement | null = null;
    private pickerPrevBtn: HTMLElement | null = null;
    private pickerNextBtn: HTMLElement | null = null;

    // Picker State
    private pickerYear: number = new Date().getFullYear();
    private pickerMonth: number = new Date().getMonth();

    // Enhanced UI Elements
    private noteCharCount: HTMLElement | null = null;
    private noteSearchInput: HTMLInputElement | null = null;
    private noteListInfo: HTMLElement | null = null;
    private btnNoteToday: HTMLElement | null = null;
    private btnNoteClear: HTMLElement | null = null;
    private btnNotePin: HTMLElement | null = null;
    private btnNoteExport: HTMLElement | null = null;

    // Tag Elements
    private noteCurrentTags: HTMLElement | null = null;
    private noteTagPresets: HTMLElement | null = null;
    private noteTagInput: HTMLInputElement | null = null;
    private noteTagFilter: HTMLElement | null = null;
    private activeTagFilter: string = "all";

    // View containers
    private noteEditorContainer: HTMLElement | null = null;
    private noteListContainer: HTMLElement | null = null;
    private noteListScroll: HTMLElement | null = null;

    // Default to today
    private currentYear: number = new Date().getFullYear();
    private currentMonth: number = new Date().getMonth();
    private currentDay: number = new Date().getDate();

    private noteManager = NoteManager.getInstance();

    constructor() { }

    public init(): void {
        this.notePadOverlay = document.getElementById("notePadOverlay");
        this.noteTextarea = document.getElementById("noteTextarea") as HTMLTextAreaElement;
        this.noteDatePicker = document.getElementById("noteDatePicker") as HTMLInputElement;
        this.noteDateText = document.getElementById("noteDateText");
        this.btnSave = document.getElementById("btnNoteSave") as HTMLButtonElement;
        this.btnList = document.getElementById("btnNoteList") as HTMLButtonElement;
        this.panelBackOverlay = document.getElementById("panelBackOverlay");

        // Custom Picker
        this.customDatePicker = document.getElementById("customDatePicker");
        this.pickerMonthDisplay = document.getElementById("pickerMonthDisplay");
        this.pickerGrid = document.getElementById("pickerGrid");
        this.pickerPrevBtn = document.getElementById("pickerPrevBtn");
        this.pickerNextBtn = document.getElementById("pickerNextBtn");

        // Enhanced UI
        this.noteCharCount = document.getElementById("noteCharCount");
        this.noteSearchInput = document.getElementById("noteSearchInput") as HTMLInputElement;
        this.noteListInfo = document.getElementById("noteListInfo");
        this.btnNoteToday = document.getElementById("btnNoteToday");
        this.btnNoteClear = document.getElementById("btnNoteClear");
        this.btnNotePin = document.getElementById("btnNotePin");
        this.btnNoteExport = document.getElementById("btnNoteExport");

        // Tag Elements
        this.noteCurrentTags = document.getElementById("noteCurrentTags");
        this.noteTagPresets = document.getElementById("noteTagPresets");
        this.noteTagInput = document.getElementById("noteTagInput") as HTMLInputElement;
        this.noteTagFilter = document.getElementById("noteTagFilter");

        // Close button
        const btnClose = document.getElementById("btnNoteClose");
        if (btnClose) btnClose.addEventListener("click", () => this.closeNotePad());

        // View containers
        this.noteEditorContainer = document.getElementById("noteEditorContainer");
        this.noteListContainer = document.getElementById("noteListContainer");
        this.noteListScroll = document.getElementById("noteListScroll");

        // Delegate initialization to molecules
        initPresetTags(this.noteTagPresets, (label) => this.addTag(label));
        initTagFilters(this.noteTagFilter, (tag) => this.setTagFilter(tag));

        // Delegate event binding to eventBindings module
        bindNotepadEvents({
            notePadOverlay: this.notePadOverlay,
            noteTextarea: this.noteTextarea,
            panelBackOverlay: this.panelBackOverlay,
            customDatePicker: this.customDatePicker,
            pickerPrevBtn: this.pickerPrevBtn,
            pickerNextBtn: this.pickerNextBtn,
            noteCharCount: this.noteCharCount,
            noteSearchInput: this.noteSearchInput,
            noteTagInput: this.noteTagInput,
            btnSave: this.btnSave,
            btnList: this.btnList,
            btnNoteToday: this.btnNoteToday,
            btnNoteClear: this.btnNoteClear,
            btnNotePin: this.btnNotePin,
            btnNoteExport: this.btnNoteExport,
            noteManager: this.noteManager,
            getCurrentDate: () => ({ year: this.currentYear, month: this.currentMonth, day: this.currentDay }),
            setCurrentDate: (y, m, d) => { this.currentYear = y; this.currentMonth = m; this.currentDay = d; },
            closeNotePad: () => this.closeNotePad(),
            toggleListView: () => this.toggleListView(),
            doShowEditorView: () => this.doShowEditorView(),
            refreshContent: () => this.refreshContent(),
            doRenderTagBar: () => this.doRenderTagBar(),
            doRenderList: () => this.doRenderList(),
            addTag: (label) => this.addTag(label),
            openCustomPicker: () => this.openCustomPicker(),
            closeCustomPicker: () => this.closeCustomPicker(),
            changePickerMonth: (delta) => this.changePickerMonth(delta),
            openNotePad: () => this.openNotePad(),
        });
    }

    // ── Tag Delegation ────────────────────────────────────

    private addTag(label: string): void {
        const tags = this.noteManager.getTags(this.currentYear, this.currentMonth, this.currentDay);
        if (!tags.includes(label)) {
            tags.push(label);
            this.noteManager.saveTags(this.currentYear, this.currentMonth, this.currentDay, tags);
            this.doRenderTagBar();
        }
    }

    private removeTag(label: string): void {
        let tags = this.noteManager.getTags(this.currentYear, this.currentMonth, this.currentDay);
        tags = tags.filter(t => t !== label);
        this.noteManager.saveTags(this.currentYear, this.currentMonth, this.currentDay, tags);
        this.doRenderTagBar();
    }

    private doRenderTagBar(): void {
        renderTagBar({
            noteCurrentTags: this.noteCurrentTags,
            noteTagPresets: this.noteTagPresets,
            noteManager: this.noteManager,
            year: this.currentYear,
            month: this.currentMonth,
            day: this.currentDay,
            onRemoveTag: (label) => this.removeTag(label),
        });
    }

    private setTagFilter(tag: string): void {
        this.activeTagFilter = tag;
        if (this.noteTagFilter) {
            this.noteTagFilter.querySelectorAll(".tag-filter-btn").forEach(btn => {
                btn.classList.toggle("active", (btn as HTMLElement).dataset.tag === tag);
            });
        }
        this.doRenderList();
    }

    // ── Custom Picker Delegation ──────────────────────────

    private openCustomPicker(): void {
        if (!this.customDatePicker) return;
        this.pickerYear = this.currentYear;
        this.pickerMonth = this.currentMonth;
        this.doRenderCustomPicker();
        this.customDatePicker.classList.add("active");
    }

    private closeCustomPicker(): void {
        if (this.customDatePicker) this.customDatePicker.classList.remove("active");
    }

    private changePickerMonth(delta: number): void {
        let newMonth = this.pickerMonth + delta;
        let newYear = this.pickerYear;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        else if (newMonth < 0) { newMonth = 11; newYear--; }
        this.pickerMonth = newMonth;
        this.pickerYear = newYear;
        this.doRenderCustomPicker();
    }

    private doRenderCustomPicker(): void {
        renderCustomPicker({
            pickerGrid: this.pickerGrid,
            pickerMonthDisplay: this.pickerMonthDisplay,
            noteManager: this.noteManager,
            pickerYear: this.pickerYear,
            pickerMonth: this.pickerMonth,
            currentYear: this.currentYear,
            currentMonth: this.currentMonth,
            currentDay: this.currentDay,
            onSelectDate: (y, m, d) => this.selectDate(y, m, d),
        });
    }

    private selectDate(y: number, m: number, d: number): void {
        this.currentYear = y;
        this.currentMonth = m;
        this.currentDay = d;
        this.doShowEditorView();
        this.refreshContent();
        this.closeCustomPicker();
    }

    // ── View Switching Delegation ─────────────────────────

    private toggleListView(): void {
        const isListVisible = this.noteListContainer && !this.noteListContainer.classList.contains("hidden");
        if (isListVisible) {
            this.doShowEditorView();
        } else {
            showListView(this.noteEditorContainer, this.noteListContainer, this.noteSearchInput);
            this.setTagFilter("all");
            this.doRenderList();
        }
    }

    private doShowEditorView(): void {
        showEditorView(this.noteEditorContainer, this.noteListContainer);
        this.refreshContent();
    }

    // ── List Delegation ───────────────────────────────────

    private doRenderList(): void {
        renderList({
            noteListScroll: this.noteListScroll,
            noteSearchInput: this.noteSearchInput,
            noteListInfo: this.noteListInfo,
            noteManager: this.noteManager,
            activeTagFilter: this.activeTagFilter,
            onItemClick: (year, month, day) => {
                this.currentYear = year;
                this.currentMonth = month;
                this.currentDay = day;
                this.doShowEditorView();
            },
            onDeleteItem: (year, month, day) => {
                this.noteManager.deleteNote(year, month, day);
                this.doRenderList();
            },
        });
    }

    // ── Open / Close / Refresh ────────────────────────────

    private openNotePad(): void {
        if (!this.notePadOverlay) return;
        this.refreshContent();
        this.notePadOverlay.classList.add("active");
        if (this.panelBackOverlay) {
            this.panelBackOverlay.classList.add("note-mode");
        }
    }

    private refreshContent(): void {
        if (!this.noteTextarea) return;

        const content = this.noteManager.getNote(this.currentYear, this.currentMonth, this.currentDay);
        this.noteTextarea.value = content;

        if (this.noteDateText) {
            this.noteDateText.textContent = `${this.currentYear}年${this.currentMonth + 1}月${this.currentDay}日`;
        }

        if (this.noteDatePicker) {
            const y = this.currentYear;
            const m = (this.currentMonth + 1).toString().padStart(2, "0");
            const d = this.currentDay.toString().padStart(2, "0");
            this.noteDatePicker.value = `${y}-${m}-${d}`;
        }

        updateCharCount(this.noteCharCount, this.noteTextarea);
        this.doRenderTagBar();
        updatePinButton(this.btnNotePin, this.noteManager, this.currentYear, this.currentMonth, this.currentDay);
    }

    private closeNotePad(): void {
        const btnNote = document.getElementById("btnNote");
        if (btnNote) btnNote.classList.remove("active");

        this.closeCustomPicker();
        if (this.notePadOverlay) {
            this.notePadOverlay.classList.remove("active");
            setTimeout(() => {
                if (this.notePadOverlay && !this.notePadOverlay.classList.contains("active")) {
                    this.doShowEditorView();
                }
            }, 400);
        }
        if (this.panelBackOverlay) {
            this.panelBackOverlay.classList.remove("note-mode");
        }
    }
}
