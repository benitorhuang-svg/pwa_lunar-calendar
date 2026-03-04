/**
 * Vitest Global Setup
 * 全域測試設定（Mock 環境初始化）
 */

// happy-dom provides localStorage automatically,
// but we clear it before each test for isolation.
import { beforeEach } from "vitest";

beforeEach(() => {
    localStorage.clear();
    document.body.className = "";
    document.body.removeAttribute("data-active-panel");
});
