import {
    MIN_YEAR,
    MAX_YEAR,
    TIAN_GAN,
    DI_ZHI,
    SHENG_XIAO,
    MONTH_NAMES,
    DAY_NAMES,
} from "./lunarConstants";
import { gregorianToLunar, monthDays } from "./lunar/math";

interface GanZhi {
    gan: number;
    text: string;
    zhi: number;
}

function dayGanZhi(date: Date): GanZhi {
    const d = date.getDate(),
        m = date.getMonth() + 1,
        y = date.getFullYear();
    const a = Math.floor((14 - m) / 12);
    const jm = m + 12 * a - 3,
        jy = y + 4800 - a;
    const jdn =
        d +
        Math.floor((153 * jm + 2) / 5) +
        365 * jy +
        Math.floor(jy / 4) -
        Math.floor(jy / 100) +
        Math.floor(jy / 400) -
        32045;
    const ganIdx = (jdn + 9) % 10,
        zhiIdx = (jdn + 1) % 12;
    return { gan: ganIdx, text: (TIAN_GAN[ganIdx] || "") + (DI_ZHI[zhiIdx] || ""), zhi: zhiIdx };
}

/**
 * 月干支
 * 月建：正月=寅(2)。月天干由年天干推算（五虎遁月）。
 */
function monthGanZhi(lunarYear: number, lunarMonth: number): string {
    const yearGan = (lunarYear - 4) % 10;
    // 五虎遁月：甲己之年丙寅首，乙庚之年戊寅首...
    const startGan = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yearGan] || 0;
    const ganIdx = (startGan + lunarMonth - 1) % 10;
    const zhiIdx = (lunarMonth + 1) % 12;
    return (TIAN_GAN[ganIdx] || "") + (DI_ZHI[zhiIdx] || "");
}

/* ====================================================
   5. 天干地支
   ==================================================== */
function yearGanZhi(ly: number): string {
    return (TIAN_GAN[(ly - 4) % 10] || "") + (DI_ZHI[(ly - 4) % 12] || "");
}

/* ====================================================
   6. 二十四節氣 (年度快取)
   ==================================================== */
const SOLAR_TERMS = Object.freeze([
    "小寒",
    "大寒",
    "立春",
    "雨水",
    "驚蟄",
    "春分",
    "清明",
    "穀雨",
    "立夏",
    "小滿",
    "芒種",
    "夏至",
    "小暑",
    "大暑",
    "立秋",
    "處暑",
    "白露",
    "秋分",
    "寒露",
    "霜降",
    "立冬",
    "小雪",
    "大雪",
    "冬至",
]);

const TERM_C20 = Object.freeze([
    6.11, 20.84, 4.15, 19.04, 6.11, 20.84, 5.59, 20.88, 6.318, 21.86, 6.5, 22.2, 7.928, 23.65, 8.35,
    23.95, 8.44, 23.822, 9.098, 24.218, 8.218, 23.08, 7.9, 22.6,
]);
const TERM_C21 = Object.freeze([
    5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 7.108, 22.83,
    7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94,
]);

interface TermCache {
    termList: TermData[];
    termMap: Map<string, string>;
}

interface TermData {
    day: number;
    index: number;
    month: number;
    name: string;
    year?: number;
}

// { year → { termMap: Map<"MM-DD", name>, termList: [{month, day, name}] } }
const _termCache = new Map<number, TermCache>();

function buildTermCache(year: number): TermCache {
    if (_termCache.has(year)) return _termCache.get(year)!;
    const termMap = new Map<string, string>();
    const termList: TermData[] = [];
    const century = year < 2000 ? 20 : 21;
    const C = century === 20 ? TERM_C20 : TERM_C21;
    const Y = year % 100;

    for (let n = 0; n < 24; n++) {
        let jd = Math.floor(Y * 0.2422 + (C[n] || 0)) - Math.floor(Y / 4);
        if (century === 20) {
            if (n === 0 && year === 1982) jd++;
            if (n === 2 && year === 1911) jd++;
        } else {
            if (n === 0 && year === 2019) jd--;
            if (n === 1 && year === 2082) jd++;
            if (n === 2 && year === 2084) jd++;
        }
        const month = Math.floor(n / 2) + 1;
        const key = String(month).padStart(2, "0") + "-" + String(jd).padStart(2, "0");
        const termName = SOLAR_TERMS[n];
        if (!termName) continue;
        termMap.set(key, termName);
        termList.push({ day: jd, index: n, month, name: termName });
    }

    const cache = { termList, termMap };
    _termCache.set(year, cache);
    return cache;
}

function getSolarTerm(date: Date): null | string {
    const d = date.getDate(),
        m = date.getMonth() + 1,
        y = date.getFullYear();
    const key = String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const val = buildTermCache(y).termMap.get(key);
    return val !== undefined ? val : null;
}

import { PENTADS } from "./pentads";

/**
 * 取得日期所處的節氣區間
 * @returns {{ current: string, next: string, daysToNext: number, termIndex: number, daysSince: number }}
 */
function getSolarTermPeriod(date: Date): {
    current: string;
    daysToNext: number;
    next: string;
    termIndex: number;
    daysSince: number;
} {
    const y = date.getFullYear();
    const { termList } = buildTermCache(y);
    const prevList = buildTermCache(y - 1).termList;
    const nextList = buildTermCache(y + 1).termList;

    // 合併前年最後 + 當年 + 次年第一個
    const all = [
        ...prevList.slice(-2).map((t) => ({ ...t, year: y - 1 })),
        ...termList.map((t) => ({ ...t, year: y })),
        ...nextList.slice(0, 2).map((t) => ({ ...t, year: y + 1 })),
    ];

    let currentTerm = all[0];
    if (!currentTerm) return { current: "", daysToNext: 0, next: "", termIndex: 0, daysSince: 0 };

    for (let i = 0; i < all.length; i++) {
        const t = all[i];
        if (!t || !t.year) continue;
        const tDate = new Date(t.year, t.month - 1, t.day);
        if (tDate <= date) {
            currentTerm = t;
        } else {
            const daysToNext = Math.ceil((tDate.getTime() - date.getTime()) / 86400000);
            const daysSince = Math.floor(
                (date.getTime() -
                    new Date(currentTerm.year!, currentTerm.month - 1, currentTerm.day).getTime()) /
                86400000,
            );
            return {
                current: currentTerm.name,
                daysToNext,
                next: t.name,
                termIndex: currentTerm.index,
                daysSince,
            };
        }
    }
    // Should not happen if all covers range, but fallback
    return {
        current: currentTerm.name,
        daysToNext: 0,
        next: "",
        termIndex: currentTerm.index,
        daysSince: 0,
    };
}

/* ====================================================
   7. 建除十二客 & 宜忌 & 吉凶 (欽定協紀辨方書)
   ==================================================== */
const JIANCHU = Object.freeze([
    "建",
    "除",
    "滿",
    "平",
    "定",
    "執",
    "破",
    "危",
    "成",
    "收",
    "開",
    "閉",
]);

// 吉凶等級（欽定協紀辨方書）: 大吉/吉/中/小凶/凶/大凶
const JIANCHU_LUCK = Object.freeze([
    "中", // 建: 中平
    "吉", // 除: 吉
    "小凶", // 滿: 小凶（滿損之象）
    "凶", // 平: 凶
    "吉", // 定: 吉
    "小凶", // 執: 小凶（執固不通）
    "大凶", // 破: 大凶
    "凶", // 危: 凶（危而不安）
    "大吉", // 成: 大吉
    "吉", // 收: 吉
    "大吉", // 開: 大吉
    "凶", // 閉: 凶（閉塞不通）
]);

function getJianChuIndex(lm: number, dayZhi: number): number {
    return (dayZhi - monthZhiIndex(lm) + 12) % 12;
}
function monthZhiIndex(lm: number): number {
    return (lm + 1) % 12;
}

/* ====================================================
   7.1 二十八宿值日 (欽定協紀辨方書)
   ==================================================== */
const TWENTY_EIGHT_MANSIONS = Object.freeze([
    "角",
    "亢",
    "氐",
    "房",
    "心",
    "尾",
    "箕", // 東方蒼龍七宿
    "斗",
    "牛",
    "女",
    "虛",
    "危",
    "室",
    "壁", // 北方玄武七宿
    "奎",
    "婁",
    "胃",
    "昴",
    "畢",
    "觜",
    "參", // 西方白虎七宿
    "井",
    "鬼",
    "柳",
    "星",
    "張",
    "翼",
    "軫", // 南方朱雀七宿
]);

const MANSION_ANIMALS = Object.freeze([
    "木蛟",
    "金龍",
    "土貉",
    "日兔",
    "月狐",
    "火虎",
    "水豹",
    "木獬",
    "金牛",
    "土蝠",
    "日鼠",
    "月燕",
    "火豬",
    "水貐",
    "木狼",
    "金狗",
    "土雉",
    "日雞",
    "月烏",
    "火猴",
    "水猿",
    "木犴",
    "金羊",
    "土獐",
    "日馬",
    "月鹿",
    "火蛇",
    "水蚓",
]);

// 二十八宿吉凶 (欽定協紀辨方書)
const MANSION_LUCK = Object.freeze([
    "吉",
    "凶",
    "凶",
    "吉",
    "凶",
    "吉",
    "吉",
    "吉",
    "凶",
    "凶",
    "凶",
    "凶",
    "吉",
    "吉",
    "吉",
    "吉",
    "吉",
    "凶",
    "吉",
    "凶",
    "吉",
    "吉",
    "凶",
    "凶",
    "吉",
    "吉",
    "凶",
    "吉",
]);

/**
 * 計算某日的二十八宿值日
 * 以 1900-01-01 (虛日鼠) 為基準推算
 */
function getMansionIndex(date: Date): number {
    const base = new Date(1900, 0, 1); // 1900-01-01 = 虛(10)
    const offset = Math.floor((date.getTime() - base.getTime()) / 86400000);
    return ((offset % 28) + 10 + 28) % 28; // 基準日為虛(index=10)
}

/* ====================================================
   7.2 宜忌表 (依欽定協紀辨方書建除十二客)
   ==================================================== */
const YI_TABLE: Record<number, string[]> = Object.freeze({
    0: ["出行", "上任", "會友", "上書", "入學"], // 建
    1: ["沐浴", "求醫", "掃舍", "解除", "壞垣", "治病", "服藥"], // 除
    2: ["祈福", "求嗣", "開光", "嫁娶", "納采", "立券", "進人口"], // 滿
    3: ["修飾垣牆", "裁衣", "整手足甲", "作灶", "塗泥", "修飾"], // 平
    4: ["嫁娶", "訂盟", "安床", "開市", "納財", "求嗣", "祭祀", "入學"], // 定
    5: ["祭祀", "捕捉", "畜牧", "結網", "取魚", "伐木"], // 執
    6: ["求醫", "破屋", "壞垣", "治病", "服藥"], // 破
    7: ["祭祀", "祈福", "行船", "安床", "拆卸", "畋獵"], // 危
    8: ["開市", "納財", "立券", "交易", "安床", "入宅", "嫁娶", "求嗣"], // 成
    9: ["納財", "收債", "進人口", "入宅", "納畜", "造倉", "作灶"], // 收
    10: ["開市", "動土", "安葬", "祭祀", "開光", "修造", "嫁娶", "入宅", "出行"], // 開
    11: ["修倉庫", "填塞穴隙", "築堤防", "塗泥"], // 閉
});

const JI_TABLE: Record<number, string[]> = Object.freeze({
    0: ["動土", "開倉", "嫁娶", "移徙"], // 建
    1: ["嫁娶", "遠行", "赴任", "開市", "動土"], // 除
    2: ["造葬", "動土", "服藥", "栽種"], // 滿
    3: ["祈福", "求嗣", "上梁", "嫁娶", "開市", "安葬"], // 平
    4: ["訴訟", "出行", "動土", "破土", "安葬"], // 定
    5: ["開市", "納財", "出行", "嫁娶", "移徙", "入宅"], // 執
    6: ["嫁娶", "簽約", "交易", "開市", "安床", "入宅", "動土"], // 破
    7: ["登高", "行船", "出行", "安葬", "修造"], // 危
    8: ["訴訟", "安葬", "入殮", "破土"], // 成
    9: ["開市", "動土", "安葬", "出行"], // 收
    10: ["安葬", "收債", "納畜", "服藥"], // 開
    11: ["開市", "出行", "嫁娶", "求財", "動土", "安葬", "破土"], // 閉
});

/* ====================================================
   8. 農曆節日
   ==================================================== */
const LUNAR_FESTIVALS: Record<string, string> = Object.freeze({
    "1-1": "春節",
    "1-15": "元宵節",
    "2-2": "龍抬頭",
    "5-5": "端午節",
    "7-7": "七夕",
    "7-15": "中元節",
    "8-15": "中秋節",
    "9-9": "重陽節",
    "12-8": "臘八節",
    "12-23": "小年",
});

// 公曆節日
const SOLAR_FESTIVALS: Record<string, string> = Object.freeze({
    "1-1": "元旦",
    "2-14": "情人節",
    "3-8": "婦女節",
    "4-4": "兒童節",
    "5-1": "勞動節",
    "10-10": "國慶日",
    "12-25": "聖誕節",
});

/* ====================================================
   9. 西洋星座
   ==================================================== */
interface Constellation {
    en: string;
    end: readonly [number, number];
    name: string;
}

/**
 * 取得農曆節日（含除夕偵測）
 */
function getLunarFestival(lunarYear: number, lunarMonth: number, lunarDay: number): null | string {
    const key = lunarMonth + "-" + lunarDay;
    if (LUNAR_FESTIVALS[key]) return LUNAR_FESTIVALS[key];

    // 除夕：臘月最後一天
    if (lunarMonth === 12) {
        const lastDay = monthDays(lunarYear, 12);
        if (lunarDay === lastDay) return "除夕";
    }
    return null;
}

function getSolarFestival(date: Date): null | string {
    const key = date.getMonth() + 1 + "-" + date.getDate();
    return SOLAR_FESTIVALS[key] || null;
}

const CONSTELLATIONS: readonly Constellation[] = Object.freeze([
    { en: "Capricorn", end: [1, 19], name: "摩羯座" },
    { en: "Aquarius", end: [2, 18], name: "水瓶座" },
    { en: "Pisces", end: [3, 20], name: "雙魚座" },
    { en: "Aries", end: [4, 19], name: "白羊座" },
    { en: "Taurus", end: [5, 20], name: "金牛座" },
    { en: "Gemini", end: [6, 21], name: "雙子座" },
    { en: "Cancer", end: [7, 22], name: "巨蟹座" },
    { en: "Leo", end: [8, 22], name: "獅子座" },
    { en: "Virgo", end: [9, 22], name: "處女座" },
    { en: "Libra", end: [10, 23], name: "天秤座" },
    { en: "Scorpio", end: [11, 22], name: "天蠍座" },
    { en: "Sagittarius", end: [12, 21], name: "射手座" },
    { en: "Capricorn", end: [12, 31], name: "摩羯座" },
]);

function getConstellation(date: Date): string {
    const d = date.getDate(),
        m = date.getMonth() + 1;
    for (const c of CONSTELLATIONS) {
        if (m < c.end[0] || (m === c.end[0] && d <= c.end[1])) {
            return c.name;
        }
    }
    return "摩羯座";
}

/* ====================================================
   10. Lunar 實例快取
   ==================================================== */
const _instanceCache = new Map<number, Lunar>();
const CACHE_MAX = 400; // 最多快取 ~10 個月的資料

/* ====================================================
   11. Lunar 類別 — 公開 API
   ==================================================== */
export class Lunar {
    private _date: Date;
    private _dayGZ: GanZhi | null;
    // @ts-expect-error - _isLeap is assigned but currently unused in public API
    private _isLeap: boolean;
    private _lunarDay: number;
    private _lunarMonth: number;
    private _lunarYear: number;

    /**
     * @private 請使用 Lunar.fromDate()
     */
    constructor(date: Date) {
        this._date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const y = this._date.getFullYear();
        if (y < MIN_YEAR || y > MAX_YEAR) {
            throw new RangeError(`Lunar: 日期超出支援範圍 (${MIN_YEAR}–${MAX_YEAR})，收到 ${y} 年`);
        }

        const lunar = gregorianToLunar(this._date);
        this._lunarYear = lunar.year;
        this._lunarMonth = lunar.month;
        this._lunarDay = lunar.day;
        this._isLeap = lunar.isLeap;
        this._dayGZ = null;
    }

    /**
     * 從公曆日期建立 Lunar 實例（含快取）
     * @param {Date} date 公曆日期
     * @returns {Lunar}
     * @example
     * const lunar = Lunar.fromDate(new Date(2025, 0, 29));
     * lunar.getMonthInChinese(); // '正'
     * lunar.getDayInChinese();   // '初一'
     */
    static fromDate(date: Date): Lunar {
        const key = getCacheKey(date);
        if (_instanceCache.has(key)) return _instanceCache.get(key)!;
        const inst = new Lunar(date);
        if (_instanceCache.size >= CACHE_MAX) _instanceCache.clear();
        _instanceCache.set(key, inst);
        return inst;
    }

    /**
     * 綜合吉凶判斷（欽定協紀辨方書）
     * 結合建除十二客與二十八宿值日綜合判定
     * @returns {string}
     */
    getComprehensiveLuck(): string {
        const jianchuLuck = this.getDayLuck();
        const mansion = this.getMansion();

        // 綜合判定：以建除為主，二十八宿為輔
        if (jianchuLuck === "大吉" && mansion.luck === "吉") return "大吉";
        if (jianchuLuck === "大凶") return "大凶";
        if (jianchuLuck === "大吉") return "吉";
        if (jianchuLuck === "吉" && mansion.luck === "吉") return "吉";
        if (jianchuLuck === "吉" && mansion.luck === "凶") return "中";
        if (jianchuLuck === "凶" && mansion.luck === "凶") return "凶";
        if (jianchuLuck === "中") return mansion.luck === "吉" ? "吉" : "中";
        if (jianchuLuck === "小凶") return mansion.luck === "吉" ? "中" : "凶";
        return jianchuLuck;
    }

    /**
     * 西洋星座
     * @returns {string}
     * @example Lunar.fromDate(new Date(2026, 1, 12)).getConstellation() // '水瓶座'
     */
    getConstellation(): string {
        return getConstellation(this._date);
    }

    /**
     * 農曆日期（繁體）
     * @returns {string}
     * @example Lunar.fromDate(new Date(2025, 0, 29)).getDayInChinese() // '初一'
     */
    getDayInChinese(): string {
        return DAY_NAMES[this._lunarDay - 1] || "";
    }

    /**
     * 日干支
     * @returns {string}
     * @example Lunar.fromDate(new Date(2026, 1, 12)).getDayInGanZhi() // '丁巳'
     */
    getDayInGanZhi(): string {
        return this._getDayGZ().text;
    }

    /**
     * 忌事陣列（繁體）
     * @returns {string[]}
     */
    getDayJi(): string[] {
        return JI_TABLE[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)] || [];
    }

    /**
     * 吉凶等級：大吉/吉/中/凶/大凶
     * @returns {string}
     * @example Lunar.fromDate(new Date(2026, 1, 12)).getDayLuck() // '吉'
     */
    getDayLuck(): string {
        return JIANCHU_LUCK[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)] || "吉";
    }

    /**
     * 宜事陣列（繁體）
     * @returns {string[]}
     */
    getDayYi(): string[] {
        return YI_TABLE[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)] || [];
    }

    /**
     * 農曆節日（含除夕偵測），無節日則回傳 null
     * @returns {string|null}
     * @example Lunar.fromDate(new Date(2025, 0, 29)).getFestival() // '春節'
     */
    getFestival(): null | string {
        return getLunarFestival(this._lunarYear, this._lunarMonth, this._lunarDay);
    }

    /**
     * 建除十二客日主
     * @returns {string}
     * @example Lunar.fromDate(new Date(2026, 1, 12)).getJianChu() // '定'
     */
    getJianChu(): string {
        return JIANCHU[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)] || "";
    }

    /**
     * 節氣名稱（當日無節氣則回傳 null）
     * @returns {string|null}
     * @example Lunar.fromDate(new Date(2026, 1, 4)).getJieQi() // '立春'
     */
    getJieQi(): null | string {
        return getSolarTerm(this._date);
    }

    /**
     * 取得詳細節氣區間（含七十二候計算用數據）
     */
    getSolarTermPeriod() {
        return getSolarTermPeriod(this._date);
    }

    /**
     * 取得當日物候 (七十二候)
     * @returns {{ name: string, meaning: string, index: number }} index: 1=初候, 2=次候, 3=末候
     */
    getPentad(): { name: string; meaning: string; index: number } {
        const { termIndex, daysSince } = getSolarTermPeriod(this._date);
        // 每候 5 天。最後一候可能大於 5 天。
        let pentadIndex = Math.floor(daysSince / 5);
        if (pentadIndex > 2) pentadIndex = 2; // 確保不超出 3 候

        const termPentads = PENTADS[termIndex];
        // Fallback safety
        if (!termPentads) {
            return { name: "", meaning: "", index: 1 };
        }

        const data = termPentads[pentadIndex];
        return {
            name: data?.name || "",
            meaning: data?.meaning || "",
            index: pentadIndex + 1,
        };
    }

    /**
     * 取得月相資訊
     * @returns {{ name: string, phase: number, value: number }} value: 0.0-1.0
     */
    getMoonPhase(): { name: string; phase: number; value: number } {
        const d = this._lunarDay;
        // 簡單月相名稱映射
        let name = "殘月";
        if (d === 1) name = "朔";
        else if (d === 15) name = "滿月";
        else if (d === 30) name = "晦";
        else if (d >= 2 && d <= 6) name = "峨眉月";
        else if (d >= 7 && d <= 8) name = "上弦月";
        else if (d >= 9 && d <= 14) name = "盈凸月";
        else if (d >= 16 && d <= 22) name = "虧凸月";
        else if (d >= 23 && d <= 24) name = "下弦月";

        // Approximated phase value (0 = New, 0.5 = Full, 1 = Next New)
        // 29.53 days per cycle
        const value = (d - 1) / 29.53;

        return { name, phase: d, value };
    }

    /**
     * 農曆日數字
     * @returns {number}
     */
    getLunarDay(): number {
        return this._lunarDay;
    }

    /**
     * 農曆月數字
     * @returns {number}
     */
    getLunarMonth(): number {
        return this._lunarMonth;
    }

    /**
     * 農曆年數字
     * @returns {number}
     */
    getLunarYear(): number {
        return this._lunarYear;
    }

    /**
     * 二十八宿值日（欽定協紀辨方書）
     * @returns {{ name: string, animal: string, luck: string }}
     */
    getMansion(): { animal: string; luck: string; name: string } {
        const idx = getMansionIndex(this._date);
        return {
            animal: MANSION_ANIMALS[idx] || "",
            luck: MANSION_LUCK[idx] || "",
            name: TWENTY_EIGHT_MANSIONS[idx] || "",
        };
    }

    /**
     * 二十八宿名稱
     * @returns {string}
     */
    getMansionName(): string {
        return TWENTY_EIGHT_MANSIONS[getMansionIndex(this._date)] || "";
    }

    /**
     * 農曆月份（繁體）
     * @returns {string}
     * @example Lunar.fromDate(new Date(2025, 0, 29)).getMonthInChinese() // '正'
     */
    getMonthInChinese(): string {
        return MONTH_NAMES[this._lunarMonth - 1] || "";
    }

    /**
     * 月干支
     * @returns {string}
     * @example Lunar.fromDate(new Date(2026, 1, 12)).getMonthInGanZhi() // '己丑'
     */
    getMonthInGanZhi(): string {
        return monthGanZhi(this._lunarYear, this._lunarMonth) || "";
    }

    /**
     * 公曆節日，無則回傳 null
     * @returns {string|null}
     */
    getSolarFestival(): null | string {
        return getSolarFestival(this._date);
    }

    /**
     * 天干地支年份
     * @returns {string}
     * @example Lunar.fromDate(new Date(2024, 1, 10)).getYearInGanZhi() // '甲辰'
     */
    getYearInGanZhi(): string {
        return yearGanZhi(this._lunarYear) || "";
    }

    /**
     * 生肖（繁體）
     * @returns {string}
     * @example Lunar.fromDate(new Date(2024, 1, 10)).getYearShengXiao() // '龍'
     */
    getYearShengXiao(): string {
        return SHENG_XIAO[(this._lunarYear - 4) % 12] || "";
    }

    /** @private */
    private _getDayGZ(): GanZhi {
        if (!this._dayGZ) this._dayGZ = dayGanZhi(this._date);
        return this._dayGZ;
    }
}

function getCacheKey(date: Date): number {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}
