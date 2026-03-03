import { NoteManager, PRESET_TAGS } from "../core/NoteManager";

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

        this.initPresetTags();
        this.initTagFilters();
        this.bindEvents();
    }

    // ── Initialization ────────────────────────────────────

    private initPresetTags(): void {
        if (!this.noteTagPresets) return;
        this.noteTagPresets.innerHTML = "";
        PRESET_TAGS.forEach(tag => {
            const btn = document.createElement("button");
            btn.className = "note-tag-preset-btn";
            btn.type = "button";
            btn.textContent = tag.label;
            btn.dataset.tagId = tag.id;
            btn.dataset.tagColor = tag.color;
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.addTag(tag.label);
            });
            this.noteTagPresets!.appendChild(btn);
        });
    }

    private initTagFilters(): void {
        if (!this.noteTagFilter) return;
        // Add preset tag filter buttons after "all" button
        PRESET_TAGS.forEach(tag => {
            const btn = document.createElement("button");
            btn.className = "tag-filter-btn";
            btn.type = "button";
            btn.textContent = tag.label;
            btn.dataset.tag = tag.label;
            btn.addEventListener("click", () => {
                this.setTagFilter(tag.label);
            });
            this.noteTagFilter!.appendChild(btn);
        });

        // Bind the "all" button
        const allBtn = this.noteTagFilter.querySelector('[data-tag="all"]');
        if (allBtn) {
            allBtn.addEventListener("click", () => this.setTagFilter("all"));
        }
    }

    // ── Event Binding ─────────────────────────────────────

    private bindEvents(): void {
        // Save button
        if (this.btnSave) {
            this.btnSave.addEventListener("click", () => this.closeNotePad());
        }

        // List toggle
        if (this.btnList) {
            this.btnList.addEventListener("click", () => this.toggleListView());
        }

        // Auto-save + char count
        if (this.noteTextarea) {
            this.noteTextarea.addEventListener("input", () => {
                if (this.noteTextarea) {
                    const content = this.noteTextarea.value || "";
                    this.noteManager.saveNote(this.currentYear, this.currentMonth, this.currentDay, content);
                    this.updateCharCount();
                }
            });
        }

        // Today button
        if (this.btnNoteToday) {
            this.btnNoteToday.addEventListener("click", () => {
                const now = new Date();
                this.currentYear = now.getFullYear();
                this.currentMonth = now.getMonth();
                this.currentDay = now.getDate();
                this.showEditorView();
                this.refreshContent();
            });
        }

        // Clear button
        if (this.btnNoteClear) {
            this.btnNoteClear.addEventListener("click", () => {
                if (this.noteTextarea && this.noteTextarea.value.trim()) {
                    if (confirm("確定要清除目前的筆記內容嗎？")) {
                        this.noteTextarea.value = "";
                        this.noteManager.deleteNote(this.currentYear, this.currentMonth, this.currentDay);
                        this.updateCharCount();
                        this.renderTagBar();
                        this.updatePinButton();
                    }
                }
            });
        }

        // Pin button
        if (this.btnNotePin) {
            this.btnNotePin.addEventListener("click", () => {
                const pinned = this.noteManager.togglePin(this.currentYear, this.currentMonth, this.currentDay);
                this.updatePinButton(pinned);
            });
        }

        // Export button
        if (this.btnNoteExport) {
            this.btnNoteExport.addEventListener("click", () => {
                this.exportNotes();
            });
        }

        // Custom tag input
        if (this.noteTagInput) {
            this.noteTagInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const val = this.noteTagInput!.value.trim();
                    if (val) {
                        this.addTag(val);
                        this.noteTagInput!.value = "";
                    }
                }
            });
        }

        // Search input
        if (this.noteSearchInput) {
            this.noteSearchInput.addEventListener("input", () => {
                this.renderList();
            });
        }

        // Toggle Custom Date Picker
        const dateWrapper = document.querySelector(".note-date-wrapper");
        if (dateWrapper) {
            dateWrapper.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.customDatePicker) {
                    const isActive = this.customDatePicker.classList.contains("active");
                    if (isActive) {
                        this.closeCustomPicker();
                    } else {
                        this.openCustomPicker();
                    }
                }
            });
        }

        // Picker Navigation
        if (this.pickerPrevBtn) {
            this.pickerPrevBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.changePickerMonth(-1);
            });
        }
        if (this.pickerNextBtn) {
            this.pickerNextBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.changePickerMonth(1);
            });
        }

        // Close picker on outside click
        document.addEventListener("click", (e) => {
            if (this.customDatePicker && this.customDatePicker.classList.contains("active")) {
                const target = e.target as HTMLElement;
                if (!target.closest(".note-date-wrapper")) {
                    this.closeCustomPicker();
                }
            }
        });

        // Stop picker clicks from toggling
        if (this.customDatePicker) {
            this.customDatePicker.addEventListener("click", (e) => e.stopPropagation());
        }

        // Open-notepad event
        window.addEventListener("open-notepad", ((e: CustomEvent) => {
            const detail = e.detail;
            if (detail && detail.year) {
                this.currentYear = detail.year;
                this.currentMonth = detail.month;
                this.currentDay = detail.day;
            }
            this.showEditorView();
            this.openNotePad();
            const btnNote = document.getElementById("btnNote");
            if (btnNote) btnNote.classList.add("active");
        }) as EventListener);

        window.addEventListener("close-notepad", (() => {
            this.closeNotePad();
        }) as EventListener);

        // Today panel rendered
        window.addEventListener("today-panel-rendered", ((e: CustomEvent) => {
            const { year, month, day } = e.detail;
            this.currentYear = year;
            this.currentMonth = month;
            this.currentDay = day;
            if (this.notePadOverlay?.classList.contains("active")) {
                if (this.noteEditorContainer && !this.noteEditorContainer.classList.contains("hidden")) {
                    this.refreshContent();
                }
            }
        }) as EventListener);

        // Overlay click to close
        if (this.panelBackOverlay) {
            this.panelBackOverlay.addEventListener("click", () => {
                if (this.notePadOverlay?.classList.contains("active")) {
                    this.closeNotePad();
                }
            });
        }
    }

    // ── Tag Methods ───────────────────────────────────────

    private addTag(label: string): void {
        const tags = this.noteManager.getTags(this.currentYear, this.currentMonth, this.currentDay);
        if (!tags.includes(label)) {
            tags.push(label);
            this.noteManager.saveTags(this.currentYear, this.currentMonth, this.currentDay, tags);
            this.renderTagBar();
        }
    }

    private removeTag(label: string): void {
        let tags = this.noteManager.getTags(this.currentYear, this.currentMonth, this.currentDay);
        tags = tags.filter(t => t !== label);
        this.noteManager.saveTags(this.currentYear, this.currentMonth, this.currentDay, tags);
        this.renderTagBar();
    }

    private getTagColor(label: string): string {
        const preset = PRESET_TAGS.find(t => t.label === label);
        if (preset) return preset.color;
        // Generate a consistent color for custom tags
        let hash = 0;
        for (let i = 0; i < label.length; i++) {
            hash = label.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 65%, 65%)`;
    }

    private renderTagBar(): void {
        if (!this.noteCurrentTags) return;

        const tags = this.noteManager.getTags(this.currentYear, this.currentMonth, this.currentDay);
        this.noteCurrentTags.innerHTML = "";

        tags.forEach(tag => {
            const pill = document.createElement("span");
            pill.className = "note-tag-pill";
            pill.style.background = this.getTagColor(tag);
            pill.innerHTML = `${tag}<span class="tag-remove" title="移除">&times;</span>`;

            pill.querySelector(".tag-remove")!.addEventListener("click", (e) => {
                e.stopPropagation();
                this.removeTag(tag);
            });

            this.noteCurrentTags!.appendChild(pill);
        });

        // Mark presets that are already applied
        if (this.noteTagPresets) {
            const btns = this.noteTagPresets.querySelectorAll(".note-tag-preset-btn");
            btns.forEach(btn => {
                const el = btn as HTMLElement;
                const label = el.textContent || "";
                if (tags.includes(label)) {
                    el.classList.add("active");
                } else {
                    el.classList.remove("active");
                }
            });
        }
    }

    private setTagFilter(tag: string): void {
        this.activeTagFilter = tag;
        if (this.noteTagFilter) {
            this.noteTagFilter.querySelectorAll(".tag-filter-btn").forEach(btn => {
                btn.classList.toggle("active", (btn as HTMLElement).dataset.tag === tag);
            });
        }
        this.renderList();
    }

    // ── Pin Methods ───────────────────────────────────────

    private updatePinButton(pinned?: boolean): void {
        if (!this.btnNotePin) return;
        const isPinned = pinned !== undefined
            ? pinned
            : this.noteManager.isPinned(this.currentYear, this.currentMonth, this.currentDay);
        this.btnNotePin.classList.toggle("pinned", isPinned);
    }

    // ── Export ─────────────────────────────────────────────

    private exportNotes(): void {
        const text = this.noteManager.exportAsText();
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

    // ── Custom Picker Methods ─────────────────────────────

    private openCustomPicker(): void {
        if (!this.customDatePicker) return;
        this.pickerYear = this.currentYear;
        this.pickerMonth = this.currentMonth;
        this.renderCustomPicker();
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
        this.renderCustomPicker();
    }

    private renderCustomPicker(): void {
        if (!this.pickerGrid || !this.pickerMonthDisplay) return;

        this.pickerMonthDisplay.textContent = `${this.pickerYear}年 ${this.pickerMonth + 1}月`;
        this.pickerGrid.innerHTML = "";

        const firstDay = new Date(this.pickerYear, this.pickerMonth, 1).getDay();
        const daysInMonth = new Date(this.pickerYear, this.pickerMonth + 1, 0).getDate();
        const prevMonthDays = new Date(this.pickerYear, this.pickerMonth, 0).getDate();
        const today = new Date();
        const noteDays = this.noteManager.getNoteDaysForMonth(this.pickerYear, this.pickerMonth);

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            const el = document.createElement("div");
            el.className = "picker-day other-month";
            el.textContent = (prevMonthDays - i).toString();
            this.pickerGrid.appendChild(el);
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const el = document.createElement("div");
            el.className = "picker-day";
            el.textContent = i.toString();

            if (this.pickerYear === today.getFullYear() && this.pickerMonth === today.getMonth() && i === today.getDate()) {
                el.classList.add("today");
            }
            if (this.pickerYear === this.currentYear && this.pickerMonth === this.currentMonth && i === this.currentDay) {
                el.classList.add("selected");
            }
            if (noteDays.includes(i)) {
                const dot = document.createElement("span");
                dot.className = "note-dot";
                el.appendChild(dot);
            }

            el.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectDate(this.pickerYear, this.pickerMonth, i);
            });

            this.pickerGrid.appendChild(el);
        }

        // Next month padding
        const totalCells = firstDay + daysInMonth;
        const remainder = totalCells % 7;
        if (remainder > 0) {
            for (let i = 1; i <= 7 - remainder; i++) {
                const el = document.createElement("div");
                el.className = "picker-day other-month";
                el.textContent = i.toString();
                this.pickerGrid.appendChild(el);
            }
        }
    }

    private selectDate(y: number, m: number, d: number): void {
        this.currentYear = y;
        this.currentMonth = m;
        this.currentDay = d;
        this.showEditorView();
        this.refreshContent();
        this.closeCustomPicker();
    }

    // ── View Switching ────────────────────────────────────

    private toggleListView(): void {
        const isListVisible = this.noteListContainer && !this.noteListContainer.classList.contains("hidden");
        if (isListVisible) {
            this.showEditorView();
        } else {
            this.showListView();
        }
    }

    private showEditorView(): void {
        if (this.noteListContainer) this.noteListContainer.classList.add("hidden");
        if (this.noteEditorContainer) this.noteEditorContainer.classList.remove("hidden");
        this.refreshContent();
    }

    private showListView(): void {
        if (this.noteEditorContainer) this.noteEditorContainer.classList.add("hidden");
        if (this.noteListContainer) this.noteListContainer.classList.remove("hidden");
        // Reset search & filter
        if (this.noteSearchInput) this.noteSearchInput.value = "";
        this.setTagFilter("all");
        this.renderList();
    }

    // ── List Rendering ────────────────────────────────────

    private renderList(): void {
        if (!this.noteListScroll) return;

        const keyword = this.noteSearchInput?.value || "";
        let notes = keyword.trim()
            ? this.noteManager.searchNotes(keyword)
            : this.noteManager.getAllNotes();

        // Apply tag filter
        if (this.activeTagFilter !== "all") {
            notes = notes.filter(n => n.tags.includes(this.activeTagFilter));
        }

        this.noteListScroll.innerHTML = "";

        // Update info
        if (this.noteListInfo) {
            const totalCount = this.noteManager.getNoteCount();
            const filterLabel = this.activeTagFilter !== "all" ? ` [${this.activeTagFilter}]` : "";
            if (keyword.trim() || this.activeTagFilter !== "all") {
                this.noteListInfo.textContent = `找到 ${notes.length} 筆${filterLabel}（共 ${totalCount} 筆）`;
            } else {
                this.noteListInfo.textContent = `共 ${totalCount} 筆紀錄`;
            }
        }

        if (notes.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "note-list-empty";
            emptyMsg.textContent = keyword.trim() || this.activeTagFilter !== "all" ? "找不到相關紀錄" : "暫無紀錄";
            this.noteListScroll.appendChild(emptyMsg);
            return;
        }

        notes.forEach(note => {
            const item = document.createElement("div");
            item.className = "note-list-item";

            // Content area
            const contentWrapper = document.createElement("div");
            contentWrapper.style.cssText = "flex:1;display:flex;flex-direction:column;overflow:hidden;";

            // Top row: pin + date + preview
            const topRow = document.createElement("div");
            topRow.style.cssText = "display:flex;align-items:center;overflow:hidden;";

            if (note.pinned) {
                const pinIcon = document.createElement("span");
                pinIcon.className = "note-item-pin";
                pinIcon.textContent = "⭐";
                topRow.appendChild(pinIcon);
            }

            const dateSpan = document.createElement("span");
            dateSpan.className = "note-item-date";
            dateSpan.textContent = `${note.year}.${note.month + 1}.${note.day}`;
            topRow.appendChild(dateSpan);

            const previewSpan = document.createElement("span");
            previewSpan.className = "note-item-preview";
            previewSpan.textContent = note.content;
            topRow.appendChild(previewSpan);

            contentWrapper.appendChild(topRow);

            // Tags row
            if (note.tags.length > 0) {
                const tagsRow = document.createElement("div");
                tagsRow.className = "note-item-tags";
                note.tags.forEach(tag => {
                    const tagEl = document.createElement("span");
                    tagEl.className = "note-item-tag";
                    tagEl.textContent = tag;
                    tagEl.style.background = this.getTagColor(tag);
                    tagsRow.appendChild(tagEl);
                });
                contentWrapper.appendChild(tagsRow);
            }

            item.appendChild(contentWrapper);

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "note-item-delete";
            deleteBtn.title = "刪除";
            deleteBtn.type = "button";
            deleteBtn.innerHTML = `
                <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
            `;
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`確定要刪除 ${note.year}年${note.month + 1}月${note.day}日 的筆記嗎？`)) {
                    this.noteManager.deleteNote(note.year, note.month, note.day);
                    this.renderList();
                }
            });
            item.appendChild(deleteBtn);

            // Click to open
            item.addEventListener("click", () => {
                this.currentYear = note.year;
                this.currentMonth = note.month;
                this.currentDay = note.day;
                this.showEditorView();
            });

            this.noteListScroll!.appendChild(item);
        });
    }

    // ── Open / Close / Refresh ────────────────────────────

    private openNotePad(): void {
        if (!this.notePadOverlay) return;
        this.refreshContent();
        this.notePadOverlay.classList.add("active");
        this.notePadOverlay.style.visibility = "visible";
        if (this.panelBackOverlay) {
            this.panelBackOverlay.style.display = "block";
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

        this.updateCharCount();
        this.renderTagBar();
        this.updatePinButton();
    }

    private updateCharCount(): void {
        if (this.noteCharCount && this.noteTextarea) {
            this.noteCharCount.textContent = `${this.noteTextarea.value.length} 字`;
        }
    }

    private closeNotePad(): void {
        const btnNote = document.getElementById("btnNote");
        if (btnNote) btnNote.classList.remove("active");

        this.closeCustomPicker();
        if (this.notePadOverlay) {
            this.notePadOverlay.classList.remove("active");
            setTimeout(() => {
                if (this.notePadOverlay && !this.notePadOverlay.classList.contains("active")) {
                    this.notePadOverlay.style.visibility = "hidden";
                    this.showEditorView();
                }
            }, 400);
        }
        if (this.panelBackOverlay) {
            this.panelBackOverlay.classList.remove("note-mode");
            const panelToday = document.getElementById("panelToday");
            const isTodayVisible = panelToday && getComputedStyle(panelToday).display !== "none";
            if (!isTodayVisible) {
                this.panelBackOverlay.style.display = "none";
            }
        }
    }
}
