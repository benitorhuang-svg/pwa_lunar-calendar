/**
 * lunar-core.test.js — 單元測試
 * 執行: node assets/js/lunar-core.test.js
 */
const Lunar = require("./lunar-core.js");

let passed = 0,
    failed = 0;

function assert(label, condition) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error(`  ✗ ${label}`);
    }
}

function eq(label, actual, expected) {
    if (actual === expected) {
        passed++;
    } else {
        failed++;
        console.error(`  ✗ ${label}: got "${actual}", expected "${expected}"`);
    }
}

// === 春節日期 ===
console.log("--- 春節 ---");
eq("2025 CNY month", Lunar.fromDate(new Date(2025, 0, 29)).getMonthInChinese(), "正");
eq("2025 CNY day", Lunar.fromDate(new Date(2025, 0, 29)).getDayInChinese(), "初一");
eq("2024 CNY month", Lunar.fromDate(new Date(2024, 1, 10)).getMonthInChinese(), "正");
eq("2024 CNY day", Lunar.fromDate(new Date(2024, 1, 10)).getDayInChinese(), "初一");
eq("2023 CNY", Lunar.fromDate(new Date(2023, 0, 22)).getDayInChinese(), "初一");

// === 天干地支 ===
console.log("--- 干支 ---");
eq("2024 GanZhi", Lunar.fromDate(new Date(2024, 1, 10)).getYearInGanZhi(), "甲辰");
eq("2025 GanZhi", Lunar.fromDate(new Date(2025, 0, 29)).getYearInGanZhi(), "乙巳");
eq("2026 DayGZ", Lunar.fromDate(new Date(2026, 1, 12)).getDayInGanZhi(), "丁巳");

// === 月干支 ===
console.log("--- 月干支 ---");
const mGZ = Lunar.fromDate(new Date(2026, 1, 12)).getMonthInGanZhi();
assert("月干支 is 2 chars", mGZ.length === 2);

// === 生肖 ===
console.log("--- 生肖 ---");
eq("2024 zodiac", Lunar.fromDate(new Date(2024, 1, 10)).getYearShengXiao(), "龍");
eq("2025 zodiac", Lunar.fromDate(new Date(2025, 0, 29)).getYearShengXiao(), "蛇");

// === 節氣 ===
console.log("--- 節氣 ---");
eq("2026 Lichun", Lunar.fromDate(new Date(2026, 1, 4)).getJieQi(), "立春");
eq("non-term", Lunar.fromDate(new Date(2026, 1, 12)).getJieQi(), null);

// === 節氣區間 ===
console.log("--- 節氣區間 ---");
const tp = Lunar.fromDate(new Date(2026, 1, 12)).getSolarTermPeriod();
eq("term period current", tp.current, "立春");
assert("daysToNext > 0", tp.daysToNext > 0);
assert("next exists", tp.next.length > 0);

// === 建除 & 吉凶 ===
console.log("--- 建除 & 吉凶 ---");
const jc = Lunar.fromDate(new Date(2026, 1, 12)).getJianChu();
assert("jianchu is string", typeof jc === "string" && jc.length === 1);
const luck = Lunar.fromDate(new Date(2026, 1, 12)).getDayLuck();
assert("luck is valid", ["大吉", "吉", "中", "凶", "大凶"].includes(luck));

// === 宜忌 ===
console.log("--- 宜忌 ---");
const yi = Lunar.fromDate(new Date(2026, 1, 12)).getDayYi();
const ji = Lunar.fromDate(new Date(2026, 1, 12)).getDayJi();
assert("yi is array", Array.isArray(yi) && yi.length >= 5);
assert("ji is array", Array.isArray(ji) && ji.length >= 5);

// === 節日 ===
console.log("--- 節日 ---");
eq("春節", Lunar.fromDate(new Date(2025, 0, 29)).getFestival(), "春節");
eq("中秋 2025", Lunar.fromDate(new Date(2025, 9, 6)).getFestival(), "中秋節");
eq("元旦", Lunar.fromDate(new Date(2026, 0, 1)).getSolarFestival(), "元旦");
// 除夕 2025: Jan 28
eq("除夕 2025", Lunar.fromDate(new Date(2025, 0, 28)).getFestival(), "除夕");

// === 星座 ===
console.log("--- 星座 ---");
eq("Feb 12 constellation", Lunar.fromDate(new Date(2026, 1, 12)).getConstellation(), "水瓶座");
eq("Aug 1 constellation", Lunar.fromDate(new Date(2026, 7, 1)).getConstellation(), "獅子座");

// === 快取 ===
console.log("--- 快取 ---");
const a = Lunar.fromDate(new Date(2026, 1, 12));
const b = Lunar.fromDate(new Date(2026, 1, 12));
assert("instance cache", a === b);

// === 範圍驗證 ===
console.log("--- 範圍驗證 ---");
let rangeError = false;
try {
    Lunar.fromDate(new Date(1899, 0, 1));
} catch (e) {
    rangeError = e instanceof RangeError;
}
assert("1899 throws RangeError", rangeError);

// === 結果 ===
console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
