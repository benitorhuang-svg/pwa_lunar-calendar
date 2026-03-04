/**
 * NotePad Molecules - Tag bar rendering & custom date picker
 * 標籤列渲染、自訂日期選擇器等組合元件
 */

import { NoteManager, PRESET_TAGS } from "../../core/NoteManager";
import { getTagColor } from "./atoms";

// ── Tag Bar ──────────────────────────────────────────────

export interface TagBarContext {
    noteCurrentTags: HTMLElement | null;
    noteTagPresets: HTMLElement | null;
    noteManager: NoteManager;
    year: number;
    month: number;
    day: number;
    onRemoveTag: (label: string) => void;
}

/**
 * Render the tag bar with current tags and preset highlight states.
 */
export function renderTagBar(ctx: TagBarContext): void {
    if (!ctx.noteCurrentTags) return;

    const tags = ctx.noteManager.getTags(ctx.year, ctx.month, ctx.day);
    ctx.noteCurrentTags.innerHTML = "";

    tags.forEach(tag => {
        const pill = document.createElement("span");
        pill.className = "note-tag-pill";
        pill.style.background = getTagColor(tag);
        pill.innerHTML = `${tag}<span class="tag-remove" title="移除">&times;</span>`;

        pill.querySelector(".tag-remove")!.addEventListener("click", (e) => {
            e.stopPropagation();
            ctx.onRemoveTag(tag);
        });

        ctx.noteCurrentTags!.appendChild(pill);
    });

    // Highlight active presets
    if (ctx.noteTagPresets) {
        const btns = ctx.noteTagPresets.querySelectorAll(".note-tag-preset-btn");
        btns.forEach(btn => {
            const el = btn as HTMLElement;
            const label = el.textContent || "";
            el.classList.toggle("active", tags.includes(label));
        });
    }
}

// ── Preset Tags Initialization ───────────────────────────

export function initPresetTags(
    container: HTMLElement | null,
    onAddTag: (label: string) => void
): void {
    if (!container) return;
    container.innerHTML = "";
    PRESET_TAGS.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = "note-tag-preset-btn";
        btn.type = "button";
        btn.textContent = tag.label;
        btn.dataset.tagId = tag.id;
        btn.dataset.tagColor = tag.color;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onAddTag(tag.label);
        });
        container.appendChild(btn);
    });
}

// ── Tag Filter Initialization ────────────────────────────

export function initTagFilters(
    container: HTMLElement | null,
    onSetFilter: (tag: string) => void
): void {
    if (!container) return;
    PRESET_TAGS.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = "tag-filter-btn";
        btn.type = "button";
        btn.textContent = tag.label;
        btn.dataset.tag = tag.label;
        btn.addEventListener("click", () => onSetFilter(tag.label));
        container.appendChild(btn);
    });

    const allBtn = container.querySelector('[data-tag="all"]');
    if (allBtn) {
        allBtn.addEventListener("click", () => onSetFilter("all"));
    }
}

// ── Custom Date Picker ───────────────────────────────────

export interface PickerContext {
    pickerGrid: HTMLElement | null;
    pickerMonthDisplay: HTMLElement | null;
    noteManager: NoteManager;
    pickerYear: number;
    pickerMonth: number;
    currentYear: number;
    currentMonth: number;
    currentDay: number;
    onSelectDate: (y: number, m: number, d: number) => void;
}

/**
 * Render the custom date picker grid for a given month.
 */
export function renderCustomPicker(ctx: PickerContext): void {
    if (!ctx.pickerGrid || !ctx.pickerMonthDisplay) return;

    ctx.pickerMonthDisplay.textContent = `${ctx.pickerYear}年 ${ctx.pickerMonth + 1}月`;
    ctx.pickerGrid.innerHTML = "";

    const firstDay = new Date(ctx.pickerYear, ctx.pickerMonth, 1).getDay();
    const daysInMonth = new Date(ctx.pickerYear, ctx.pickerMonth + 1, 0).getDate();
    const prevMonthDays = new Date(ctx.pickerYear, ctx.pickerMonth, 0).getDate();
    const today = new Date();
    const noteDays = ctx.noteManager.getNoteDaysForMonth(ctx.pickerYear, ctx.pickerMonth);

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
        const el = document.createElement("div");
        el.className = "picker-day other-month";
        el.textContent = (prevMonthDays - i).toString();
        ctx.pickerGrid.appendChild(el);
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        const el = document.createElement("div");
        el.className = "picker-day";
        el.textContent = i.toString();

        if (ctx.pickerYear === today.getFullYear() && ctx.pickerMonth === today.getMonth() && i === today.getDate()) {
            el.classList.add("today");
        }
        if (ctx.pickerYear === ctx.currentYear && ctx.pickerMonth === ctx.currentMonth && i === ctx.currentDay) {
            el.classList.add("selected");
        }
        if (noteDays.includes(i)) {
            const dot = document.createElement("span");
            dot.className = "note-dot";
            el.appendChild(dot);
        }

        el.addEventListener("click", (e) => {
            e.stopPropagation();
            ctx.onSelectDate(ctx.pickerYear, ctx.pickerMonth, i);
        });

        ctx.pickerGrid.appendChild(el);
    }

    // Next month padding
    const totalCells = firstDay + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder > 0) {
        for (let i = 1; i <= 7 - remainder; i++) {
            const el = document.createElement("div");
            el.className = "picker-day other-month";
            el.textContent = i.toString();
            ctx.pickerGrid.appendChild(el);
        }
    }
}
