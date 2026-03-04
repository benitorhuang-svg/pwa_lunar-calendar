/**
 * Test: NoteManager
 * 驗證筆記管理器的 CRUD、搜尋、匯出、Legacy 相容性
 */

import { beforeEach, describe, expect, it } from "vitest";
import { NoteManager, PRESET_TAGS } from "../src/scripts/core/NoteManager";

describe("NoteManager", () => {
    let manager: NoteManager;

    beforeEach(() => {
        // Reset singleton for isolation
        // @ts-expect-error — private static access for test isolation
        NoteManager.instance = undefined;
        manager = NoteManager.getInstance();
    });

    // ─── Singleton ──────────────────────────────────────

    describe("Singleton", () => {
        it("getInstance 應回傳同一個實例", () => {
            const a = NoteManager.getInstance();
            const b = NoteManager.getInstance();
            expect(a).toBe(b);
        });
    });

    // ─── Read / Write ───────────────────────────────────

    describe("Read / Write", () => {
        it("新日期應回傳空 NoteData", () => {
            const data = manager.getNoteData(2026, 2, 4);
            expect(data).toEqual({ content: "", tags: [], pinned: false });
        });

        it("saveNote 應儲存內容", () => {
            manager.saveNote(2026, 2, 4, "今天天氣很好");
            expect(manager.getNote(2026, 2, 4)).toBe("今天天氣很好");
        });

        it("saveNote 空白內容且無標籤/釘選時應清除 key", () => {
            manager.saveNote(2026, 2, 4, "temp");
            manager.saveNote(2026, 2, 4, "");
            expect(manager.getNote(2026, 2, 4)).toBe("");
            expect(manager.hasNote(2026, 2, 4)).toBe(false);
        });

        it("saveNote 空白內容但有標籤時應保留 key", () => {
            manager.saveNote(2026, 2, 4, "temp");
            manager.saveTags(2026, 2, 4, ["work"]);
            manager.saveNote(2026, 2, 4, "  ");
            // key should persist because tags exist
            expect(manager.getTags(2026, 2, 4)).toEqual(["work"]);
            expect(manager.hasNote(2026, 2, 4)).toBe(true);
        });

        it("saveTags 應儲存標籤並保留內容", () => {
            manager.saveNote(2026, 2, 4, "會議紀錄");
            manager.saveTags(2026, 2, 4, ["work", "important"]);
            expect(manager.getTags(2026, 2, 4)).toEqual(["work", "important"]);
            expect(manager.getNote(2026, 2, 4)).toBe("會議紀錄");
        });

        it("togglePin 應切換釘選狀態", () => {
            manager.saveNote(2026, 2, 4, "重要");
            expect(manager.isPinned(2026, 2, 4)).toBe(false);

            const result = manager.togglePin(2026, 2, 4);
            expect(result).toBe(true);
            expect(manager.isPinned(2026, 2, 4)).toBe(true);

            const result2 = manager.togglePin(2026, 2, 4);
            expect(result2).toBe(false);
        });

        it("deleteNote 應完全移除筆記", () => {
            manager.saveNote(2026, 2, 4, "to delete");
            manager.saveTags(2026, 2, 4, ["work"]);
            manager.deleteNote(2026, 2, 4);
            expect(manager.hasNote(2026, 2, 4)).toBe(false);
            expect(manager.getNote(2026, 2, 4)).toBe("");
        });
    });

    // ─── Query ──────────────────────────────────────────

    describe("Query", () => {
        beforeEach(() => {
            manager.saveNote(2026, 0, 1, "元旦快樂");
            manager.saveNote(2026, 2, 4, "清明節");
            manager.saveTags(2026, 2, 4, ["event"]);
            manager.saveNote(2026, 0, 15, "上班");
            manager.togglePin(2026, 0, 1);
        });

        it("getAllNotes 應回傳所有有效筆記", () => {
            const notes = manager.getAllNotes();
            expect(notes.length).toBe(3);
        });

        it("getAllNotes 應先排釘選、再按日期倒序", () => {
            const notes = manager.getAllNotes();
            // Pinned first
            expect(notes[0]!.pinned).toBe(true);
            expect(notes[0]!.content).toBe("元旦快樂");
            // Then by date descending
            expect(notes[1]!.year).toBe(2026);
            expect(notes[1]!.month).toBe(2); // March (0-indexed)
        });

        it("hasNote 有內容時回傳 true", () => {
            expect(manager.hasNote(2026, 0, 1)).toBe(true);
        });

        it("hasNote 無內容時回傳 false", () => {
            expect(manager.hasNote(2025, 0, 1)).toBe(false);
        });

        it("getNoteDaysForMonth 應列出該月有筆記的日期", () => {
            const days = manager.getNoteDaysForMonth(2026, 0);
            expect(days).toContain(1);
            expect(days).toContain(15);
            expect(days).not.toContain(2);
        });

        it("searchNotes 應依關鍵字過濾內容", () => {
            const results = manager.searchNotes("快樂");
            expect(results.length).toBe(1);
            expect(results[0]!.content).toBe("元旦快樂");
        });

        it("searchNotes 應依標籤過濾", () => {
            const results = manager.searchNotes("event");
            expect(results.length).toBe(1);
            expect(results[0]!.content).toBe("清明節");
        });

        it("searchNotes 空白關鍵字回傳全部", () => {
            const results = manager.searchNotes("");
            expect(results.length).toBe(3);
        });

        it("getNoteCount 應回傳正確數量", () => {
            expect(manager.getNoteCount()).toBe(3);
        });
    });

    // ─── Export ──────────────────────────────────────────

    describe("Export", () => {
        it("無筆記時 exportAsText 回傳預設訊息", () => {
            expect(manager.exportAsText()).toBe("暫無紀錄");
        });

        it("有筆記時 exportAsText 包含日期與內容", () => {
            manager.saveNote(2026, 2, 4, "test note");
            manager.saveTags(2026, 2, 4, ["work"]);
            const text = manager.exportAsText();
            expect(text).toContain("2026年3月4日");
            expect(text).toContain("test note");
            expect(text).toContain("[work]");
        });

        it("釘選筆記 exportAsText 應顯示 📌", () => {
            manager.saveNote(2026, 0, 1, "pinned");
            manager.togglePin(2026, 0, 1);
            const text = manager.exportAsText();
            expect(text).toContain("📌");
        });
    });

    // ─── Legacy Compatibility ───────────────────────────

    describe("Legacy Compatibility（向後相容）", () => {
        it("純文字格式應被解析為 content", () => {
            // Simulate legacy: localStorage has plain text
            localStorage.setItem("lunar_note_2025-06-15", "舊格式的筆記");
            const data = manager.getNoteData(2025, 5, 15);
            expect(data.content).toBe("舊格式的筆記");
            expect(data.tags).toEqual([]);
            expect(data.pinned).toBe(false);
        });

        it("新 JSON 格式應被正確解析", () => {
            const json = JSON.stringify({
                content: "新格式",
                tags: ["important"],
                pinned: true,
            });
            localStorage.setItem("lunar_note_2025-06-15", json);
            const data = manager.getNoteData(2025, 5, 15);
            expect(data.content).toBe("新格式");
            expect(data.tags).toEqual(["important"]);
            expect(data.pinned).toBe(true);
        });

        it("不完整 JSON 應安全降級", () => {
            localStorage.setItem("lunar_note_2025-06-15", JSON.stringify({ content: "partial" }));
            const data = manager.getNoteData(2025, 5, 15);
            expect(data.content).toBe("partial");
            expect(data.tags).toEqual([]);
            expect(data.pinned).toBe(false);
        });
    });

    // ─── PRESET_TAGS ────────────────────────────────────

    describe("PRESET_TAGS", () => {
        it("應有 6 個預設標籤", () => {
            expect(PRESET_TAGS.length).toBe(6);
        });

        it("每個標籤須有 id, label, color", () => {
            PRESET_TAGS.forEach((tag) => {
                expect(tag.id).toBeTruthy();
                expect(tag.label).toBeTruthy();
                expect(tag.color).toMatch(/^#[0-9a-f]{6}$/i);
            });
        });
    });
});
