/**
 * NotePad Organisms - List rendering & view switching
 * 清單渲染、編輯器/清單切換等自足區塊
 */

import { NoteManager } from "../../core/NoteManager";
import { getTagColor } from "./atoms";

// ── List Rendering ───────────────────────────────────────

export interface ListContext {
    noteListScroll: HTMLElement | null;
    noteSearchInput: HTMLInputElement | null;
    noteListInfo: HTMLElement | null;
    noteManager: NoteManager;
    activeTagFilter: string;
    onItemClick: (year: number, month: number, day: number) => void;
    onDeleteItem: (year: number, month: number, day: number) => void;
}

/**
 * Render the notes list view with search and tag filtering.
 */
export function renderList(ctx: ListContext): void {
    if (!ctx.noteListScroll) return;

    const keyword = ctx.noteSearchInput?.value || "";
    let notes = keyword.trim()
        ? ctx.noteManager.searchNotes(keyword)
        : ctx.noteManager.getAllNotes();

    // Apply tag filter
    if (ctx.activeTagFilter !== "all") {
        notes = notes.filter(n => n.tags.includes(ctx.activeTagFilter));
    }

    ctx.noteListScroll.innerHTML = "";

    // Update info
    if (ctx.noteListInfo) {
        const totalCount = ctx.noteManager.getNoteCount();
        const filterLabel = ctx.activeTagFilter !== "all" ? ` [${ctx.activeTagFilter}]` : "";
        if (keyword.trim() || ctx.activeTagFilter !== "all") {
            ctx.noteListInfo.textContent = `找到 ${notes.length} 筆${filterLabel}（共 ${totalCount} 筆）`;
        } else {
            ctx.noteListInfo.textContent = `共 ${totalCount} 筆紀錄`;
        }
    }

    if (notes.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "note-list-empty";
        emptyMsg.textContent = keyword.trim() || ctx.activeTagFilter !== "all" ? "找不到相關紀錄" : "暫無紀錄";
        ctx.noteListScroll.appendChild(emptyMsg);
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
                tagEl.style.background = getTagColor(tag);
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
                ctx.onDeleteItem(note.year, note.month, note.day);
            }
        });
        item.appendChild(deleteBtn);

        // Click to open
        item.addEventListener("click", () => {
            ctx.onItemClick(note.year, note.month, note.day);
        });

        ctx.noteListScroll!.appendChild(item);
    });
}

// ── View Switching ───────────────────────────────────────

/**
 * Show the editor view and hide the list view.
 */
export function showEditorView(
    editorContainer: HTMLElement | null,
    listContainer: HTMLElement | null
): void {
    if (listContainer) listContainer.classList.add("hidden");
    if (editorContainer) editorContainer.classList.remove("hidden");
}

/**
 * Show the list view and hide the editor view.
 */
export function showListView(
    editorContainer: HTMLElement | null,
    listContainer: HTMLElement | null,
    searchInput: HTMLInputElement | null,
): void {
    if (editorContainer) editorContainer.classList.add("hidden");
    if (listContainer) listContainer.classList.remove("hidden");
    if (searchInput) searchInput.value = "";
}
