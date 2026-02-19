/** Data structure for a note stored in localStorage */
export interface NoteData {
    content: string;
    tags: string[];
    pinned: boolean;
}

/** Data structure returned by query methods */
export interface NoteEntry extends NoteData {
    year: number;
    month: number; // 0-indexed
    day: number;
}

/** Predefined tag options with labels and colors */
export const PRESET_TAGS = [
    { id: "important", label: "重要", color: "#ff6b6b" },
    { id: "work", label: "工作", color: "#4ecdc4" },
    { id: "life", label: "生活", color: "#45b7d1" },
    { id: "event", label: "行程", color: "#f7dc6f" },
    { id: "idea", label: "靈感", color: "#a29bfe" },
    { id: "memory", label: "紀念", color: "#fd79a8" },
] as const;

export class NoteManager {
    private static instance: NoteManager;
    private storagePrefix = "lunar_note_";

    private constructor() { }

    public static getInstance(): NoteManager {
        if (!NoteManager.instance) {
            NoteManager.instance = new NoteManager();
        }
        return NoteManager.instance;
    }

    // ── Read ──────────────────────────────────────────────

    /** Get structured note data (with backward-compat for plain string) */
    public getNoteData(year: number, month: number, day: number): NoteData {
        const key = this.getKey(year, month, day);
        const raw = localStorage.getItem(key);
        if (!raw) return { content: "", tags: [], pinned: false };
        return this.parseRaw(raw);
    }

    /** Shortcut: get content string only */
    public getNote(year: number, month: number, day: number): string {
        return this.getNoteData(year, month, day).content;
    }

    /** Get tags for a date */
    public getTags(year: number, month: number, day: number): string[] {
        return this.getNoteData(year, month, day).tags;
    }

    /** Check pinned status */
    public isPinned(year: number, month: number, day: number): boolean {
        return this.getNoteData(year, month, day).pinned;
    }

    // ── Write ─────────────────────────────────────────────

    /** Save content (preserves existing tags/pinned) */
    public saveNote(year: number, month: number, day: number, content: string): void {
        const key = this.getKey(year, month, day);
        const existing = this.getNoteData(year, month, day);
        existing.content = content;

        if (!content.trim() && existing.tags.length === 0 && !existing.pinned) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(existing));
        }
    }

    /** Save tags (preserves existing content/pinned) */
    public saveTags(year: number, month: number, day: number, tags: string[]): void {
        const key = this.getKey(year, month, day);
        const existing = this.getNoteData(year, month, day);
        existing.tags = tags;

        if (!existing.content.trim() && tags.length === 0 && !existing.pinned) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(existing));
        }
    }

    /** Toggle pin status */
    public togglePin(year: number, month: number, day: number): boolean {
        const key = this.getKey(year, month, day);
        const existing = this.getNoteData(year, month, day);
        existing.pinned = !existing.pinned;

        if (!existing.content.trim() && existing.tags.length === 0 && !existing.pinned) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(existing));
        }
        return existing.pinned;
    }

    /** Delete note entirely */
    public deleteNote(year: number, month: number, day: number): void {
        const key = this.getKey(year, month, day);
        localStorage.removeItem(key);
    }

    // ── Query ─────────────────────────────────────────────

    /** Get all notes as structured entries */
    public getAllNotes(): NoteEntry[] {
        const notes: NoteEntry[] = [];
        if (typeof localStorage === "undefined") return notes;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                try {
                    const datePart = key.replace(this.storagePrefix, "");
                    const parts = datePart.split("-").map(Number);

                    if (parts.length === 3) {
                        const [y, m, d] = parts;
                        if (!isNaN(y!) && !isNaN(m!) && !isNaN(d!)) {
                            const raw = localStorage.getItem(key) || "";
                            const data = this.parseRaw(raw);
                            if (data.content.trim() || data.tags.length > 0) {
                                notes.push({
                                    year: y!,
                                    month: m! - 1,
                                    day: d!,
                                    ...data,
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing note key", key, e);
                }
            }
        }

        // Sort: pinned first, then by date descending
        return notes.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            const dateA = new Date(a.year, a.month, a.day).getTime();
            const dateB = new Date(b.year, b.month, b.day).getTime();
            return dateB - dateA;
        });
    }

    /** Check if a specific date has meaningful data */
    public hasNote(year: number, month: number, day: number): boolean {
        const data = this.getNoteData(year, month, day);
        return data.content.trim().length > 0 || data.tags.length > 0;
    }

    /** Get all days in a month that have notes */
    public getNoteDaysForMonth(year: number, month: number): number[] {
        const days: number[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            if (this.hasNote(year, month, d)) days.push(d);
        }
        return days;
    }

    /** Search notes by keyword (searches content, tags, and date) */
    public searchNotes(keyword: string): NoteEntry[] {
        const allNotes = this.getAllNotes();
        if (!keyword.trim()) return allNotes;

        const lower = keyword.toLowerCase();
        return allNotes.filter((note) => {
            const dateStr = `${note.year}.${note.month + 1}.${note.day}`;
            const tagStr = note.tags.join(" ").toLowerCase();
            return (
                note.content.toLowerCase().includes(lower) ||
                dateStr.includes(lower) ||
                tagStr.includes(lower)
            );
        });
    }

    /** Get total number of saved notes */
    public getNoteCount(): number {
        return this.getAllNotes().length;
    }

    /** Export all notes as formatted text */
    public exportAsText(): string {
        const notes = this.getAllNotes();
        if (notes.length === 0) return "暫無紀錄";

        const lines: string[] = ["═══ 每日記事 ═══", ""];
        notes.forEach((note) => {
            const date = `${note.year}年${note.month + 1}月${note.day}日`;
            const pin = note.pinned ? " 📌" : "";
            const tags = note.tags.length > 0 ? ` [${note.tags.join(", ")}]` : "";
            lines.push(`── ${date}${pin}${tags} ──`);
            lines.push(note.content);
            lines.push("");
        });
        return lines.join("\n");
    }

    // ── Internal ──────────────────────────────────────────

    private getKey(year: number, month: number, day: number): string {
        const m = (month + 1).toString().padStart(2, "0");
        const d = day.toString().padStart(2, "0");
        return `${this.storagePrefix}${year}-${m}-${d}`;
    }

    /** Parse raw localStorage value — handles both legacy plain text and new JSON */
    private parseRaw(raw: string): NoteData {
        if (!raw) return { content: "", tags: [], pinned: false };
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "object" && parsed !== null && "content" in parsed) {
                return {
                    content: parsed.content || "",
                    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
                    pinned: !!parsed.pinned,
                };
            }
        } catch {
            // Not JSON — legacy plain text format
        }
        // Legacy: raw string is the content
        return { content: raw, tags: [], pinned: false };
    }
}
