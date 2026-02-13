/**
 * lunar-core.js — 自建農曆日曆引擎
 * 提供公曆→農曆轉換、天干地支、二十四節氣、
 * 生肖、建除十二客、宜忌、農曆節日、星座等功能。
 *
 * 資料範圍：1900–2100 年
 * 授權：MIT
 */
; (function (root) {
    'use strict';

    /* ====================================================
       1. 農曆年資料表 (1900–2100)
       ==================================================== */
    const LUNAR_INFO = Object.freeze([
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
        0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
        0x0d520
    ]);

    /* ====================================================
       2. 基準日 & 輔助函數 (含 yearDays 快取)
       ==================================================== */
    const BASE_DATE = new Date(1900, 0, 31);
    const MIN_YEAR = 1900;
    const MAX_YEAR = 2100;

    // yearDays 快取
    const _yearDaysCache = new Map();

    function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
    function leapDays(y) { return leapMonth(y) === 0 ? 0 : (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29; }
    function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }

    function yearDays(y) {
        if (_yearDaysCache.has(y)) return _yearDaysCache.get(y);
        let sum = 348;
        const info = LUNAR_INFO[y - 1900];
        for (let i = 0x8000; i > 0x8; i >>= 1) { if (info & i) sum++; }
        sum += leapDays(y);
        _yearDaysCache.set(y, sum);
        return sum;
    }

    /* ====================================================
       3. 公曆 → 農曆轉換
       ==================================================== */
    function gregorianToLunar(date) {
        let offset = Math.floor((date.getTime() - BASE_DATE.getTime()) / 86400000);
        let lunarYear = 1900, daysInYear;

        for (let i = 1900; i < 2101 && offset > 0; i++) {
            daysInYear = yearDays(i);
            offset -= daysInYear;
            lunarYear++;
        }
        if (offset < 0) { offset += daysInYear; lunarYear--; }

        const leap = leapMonth(lunarYear);
        let isLeap = false, lunarMonth = 1, daysInMonth;

        for (let i = 1; i < 13 && offset > 0; i++) {
            if (leap > 0 && i === leap + 1 && !isLeap) {
                --i; isLeap = true;
                daysInMonth = leapDays(lunarYear);
            } else {
                daysInMonth = monthDays(lunarYear, i);
            }
            if (isLeap && i === leap + 1) isLeap = false;
            offset -= daysInMonth;
            if (!isLeap) lunarMonth++;
        }

        if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
            if (isLeap) isLeap = false; else { isLeap = true; --lunarMonth; }
        }
        if (offset < 0) { offset += daysInMonth; --lunarMonth; }

        return { year: lunarYear, month: lunarMonth, day: offset + 1, isLeap };
    }

    /* ====================================================
       4. 中文名稱 (繁體)
       ==================================================== */
    const TIAN_GAN = Object.freeze(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
    const DI_ZHI = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
    const SHENG_XIAO = Object.freeze(['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬']);
    const MONTH_NAMES = Object.freeze(['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '臘']);
    const DAY_NAMES = Object.freeze([
        '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ]);

    /* ====================================================
       5. 天干地支
       ==================================================== */
    function yearGanZhi(ly) {
        return TIAN_GAN[(ly - 4) % 10] + DI_ZHI[(ly - 4) % 12];
    }

    /**
     * 月干支
     * 月建：正月=寅(2)。月天干由年天干推算（五虎遁月）。
     */
    function monthGanZhi(lunarYear, lunarMonth) {
        const yearGan = (lunarYear - 4) % 10;
        // 五虎遁月：甲己之年丙寅首，乙庚之年戊寅首...
        const startGan = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yearGan];
        const ganIdx = (startGan + lunarMonth - 1) % 10;
        const zhiIdx = (lunarMonth + 1) % 12;
        return TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx];
    }

    function dayGanZhi(date) {
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
        const a = Math.floor((14 - m) / 12);
        const jy = y + 4800 - a, jm = m + 12 * a - 3;
        const jdn = d + Math.floor((153 * jm + 2) / 5) + 365 * jy
            + Math.floor(jy / 4) - Math.floor(jy / 100) + Math.floor(jy / 400) - 32045;
        const ganIdx = (jdn + 9) % 10, zhiIdx = (jdn + 1) % 12;
        return { gan: ganIdx, zhi: zhiIdx, text: TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx] };
    }

    /* ====================================================
       6. 二十四節氣 (年度快取)
       ==================================================== */
    const SOLAR_TERMS = Object.freeze([
        '小寒', '大寒', '立春', '雨水', '驚蟄', '春分',
        '清明', '穀雨', '立夏', '小滿', '芒種', '夏至',
        '小暑', '大暑', '立秋', '處暑', '白露', '秋分',
        '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
    ]);

    const TERM_C20 = Object.freeze([
        6.11, 20.84, 4.15, 19.04, 6.11, 20.84, 5.59, 20.88, 6.318, 21.86, 6.5, 22.2,
        7.928, 23.65, 8.35, 23.95, 8.44, 23.822, 9.098, 24.218, 8.218, 23.08, 7.9, 22.6
    ]);
    const TERM_C21 = Object.freeze([
        5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37,
        7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94
    ]);

    // { year → { termMap: Map<"MM-DD", name>, termList: [{month, day, name}] } }
    const _termCache = new Map();

    function buildTermCache(year) {
        if (_termCache.has(year)) return _termCache.get(year);
        const termMap = new Map();
        const termList = [];
        const century = year < 2000 ? 20 : 21;
        const C = century === 20 ? TERM_C20 : TERM_C21;
        const Y = year % 100;

        for (let n = 0; n < 24; n++) {
            let jd = Math.floor(Y * 0.2422 + C[n]) - Math.floor(Y / 4);
            if (century === 20) {
                if (n === 0 && year === 1982) jd++;
                if (n === 2 && year === 1911) jd++;
            } else {
                if (n === 0 && year === 2019) jd--;
                if (n === 1 && year === 2082) jd++;
                if (n === 2 && year === 2084) jd++;
            }
            const month = Math.floor(n / 2) + 1;
            const key = String(month).padStart(2, '0') + '-' + String(jd).padStart(2, '0');
            termMap.set(key, SOLAR_TERMS[n]);
            termList.push({ month, day: jd, name: SOLAR_TERMS[n], index: n });
        }

        const cache = { termMap, termList };
        _termCache.set(year, cache);
        return cache;
    }

    function getSolarTerm(date) {
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
        const key = String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        return buildTermCache(y).termMap.get(key) || null;
    }

    /**
     * 取得日期所處的節氣區間
     * @returns {{ current: string, next: string, daysToNext: number }}
     */
    function getSolarTermPeriod(date) {
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
        const { termList } = buildTermCache(y);
        const prevList = buildTermCache(y - 1).termList;
        const nextList = buildTermCache(y + 1).termList;

        // 合併前年最後 + 當年 + 次年第一個
        const all = [
            ...prevList.slice(-2).map(t => ({ ...t, year: y - 1 })),
            ...termList.map(t => ({ ...t, year: y })),
            ...nextList.slice(0, 2).map(t => ({ ...t, year: y + 1 }))
        ];

        let currentTerm = all[0];
        for (let i = 0; i < all.length; i++) {
            const t = all[i];
            const tDate = new Date(t.year, t.month - 1, t.day);
            if (tDate <= date) {
                currentTerm = t;
            } else {
                const daysToNext = Math.ceil((tDate - date) / 86400000);
                return { current: currentTerm.name, next: t.name, daysToNext };
            }
        }
        return { current: currentTerm.name, next: '', daysToNext: 0 };
    }

    /* ====================================================
       7. 建除十二客 & 宜忌 & 吉凶
       ==================================================== */
    const JIANCHU = Object.freeze(['建', '除', '滿', '平', '定', '執', '破', '危', '成', '收', '開', '閉']);

    // 吉凶等級: 大吉/吉/中/凶/大凶
    const JIANCHU_LUCK = Object.freeze(['中', '吉', '吉', '凶', '吉', '凶', '大凶', '凶', '大吉', '吉', '大吉', '凶']);

    function monthZhiIndex(lm) { return (lm + 1) % 12; }
    function getJianChuIndex(lm, dayZhi) { return (dayZhi - monthZhiIndex(lm) + 12) % 12; }

    const YI_TABLE = Object.freeze({
        0: ['出行', '上任', '會友', '入學', '動土', '開市'],
        1: ['沐浴', '求醫', '掃舍', '解除', '壞垣', '治病', '服藥'],
        2: ['祈福', '求嗣', '開光', '嫁娶', '納采', '立券'],
        3: ['修飾', '裁衣', '整手足', '作灶', '塗泥'],
        4: ['嫁娶', '訂盟', '安床', '開市', '納財', '求嗣', '祭祀', '入學'],
        5: ['祭祀', '捕捉', '畜牧', '結網', '取魚', '伐木'],
        6: ['求醫', '破屋', '壞垣', '治病', '服藥'],
        7: ['祭祀', '祈福', '行船', '安床', '拆卸', '畋獵'],
        8: ['開市', '納財', '立券', '交易', '安床', '入宅', '嫁娶', '求嗣'],
        9: ['納財', '收債', '進人口', '入宅', '納畜', '造倉', '作灶'],
        10: ['開市', '動土', '安葬', '祭祀', '開光', '修造', '嫁娶', '入宅'],
        11: ['祭祀', '修倉', '填塞', '築堤', '塗泥']
    });

    const JI_TABLE = Object.freeze({
        0: ['動土', '開倉', '嫁娶', '移徙', '出行', '求醫'],
        1: ['嫁娶', '遠行', '赴任', '開市', '動土', '納財'],
        2: ['造葬', '動土', '服藥', '諸事不取', '安葬'],
        3: ['祈福', '求嗣', '上梁', '嫁娶', '開市'],
        4: ['訴訟', '出行', '動土', '破土', '安葬', '開倉'],
        5: ['開市', '納財', '出行', '嫁娶', '移徙', '入宅'],
        6: ['嫁娶', '簽約', '交易', '開市', '安床', '入宅'],
        7: ['登高', '行船', '出行', '嫁娶', '安葬', '修造'],
        8: ['訴訟', '安葬', '入殮', '百事忌', '破土'],
        9: ['開市', '動土', '嫁娶', '安葬', '納財', '出行'],
        10: ['安葬', '收債', '納畜', '服藥', '求醫'],
        11: ['開市', '出行', '嫁娶', '求財', '動土', '破土']
    });

    /* ====================================================
       8. 農曆節日
       ==================================================== */
    const LUNAR_FESTIVALS = Object.freeze({
        '1-1': '春節',
        '1-15': '元宵節',
        '2-2': '龍抬頭',
        '5-5': '端午節',
        '7-7': '七夕',
        '7-15': '中元節',
        '8-15': '中秋節',
        '9-9': '重陽節',
        '12-8': '臘八節',
        '12-23': '小年'
    });

    // 公曆節日
    const SOLAR_FESTIVALS = Object.freeze({
        '1-1': '元旦',
        '2-14': '情人節',
        '3-8': '婦女節',
        '4-4': '兒童節',
        '5-1': '勞動節',
        '10-10': '國慶日',
        '12-25': '聖誕節'
    });

    /**
     * 取得農曆節日（含除夕偵測）
     */
    function getLunarFestival(lunarYear, lunarMonth, lunarDay) {
        const key = lunarMonth + '-' + lunarDay;
        if (LUNAR_FESTIVALS[key]) return LUNAR_FESTIVALS[key];

        // 除夕：臘月最後一天
        if (lunarMonth === 12) {
            const lastDay = monthDays(lunarYear, 12);
            if (lunarDay === lastDay) return '除夕';
        }
        return null;
    }

    function getSolarFestival(date) {
        const key = (date.getMonth() + 1) + '-' + date.getDate();
        return SOLAR_FESTIVALS[key] || null;
    }

    /* ====================================================
       9. 西洋星座
       ==================================================== */
    const CONSTELLATIONS = Object.freeze([
        { name: '摩羯座', en: 'Capricorn', end: [1, 19] },
        { name: '水瓶座', en: 'Aquarius', end: [2, 18] },
        { name: '雙魚座', en: 'Pisces', end: [3, 20] },
        { name: '白羊座', en: 'Aries', end: [4, 19] },
        { name: '金牛座', en: 'Taurus', end: [5, 20] },
        { name: '雙子座', en: 'Gemini', end: [6, 21] },
        { name: '巨蟹座', en: 'Cancer', end: [7, 22] },
        { name: '獅子座', en: 'Leo', end: [8, 22] },
        { name: '處女座', en: 'Virgo', end: [9, 22] },
        { name: '天秤座', en: 'Libra', end: [10, 23] },
        { name: '天蠍座', en: 'Scorpio', end: [11, 22] },
        { name: '射手座', en: 'Sagittarius', end: [12, 21] },
        { name: '摩羯座', en: 'Capricorn', end: [12, 31] }
    ]);

    function getConstellation(date) {
        const m = date.getMonth() + 1, d = date.getDate();
        for (const c of CONSTELLATIONS) {
            if (m < c.end[0] || (m === c.end[0] && d <= c.end[1])) {
                return c.name;
            }
        }
        return '摩羯座';
    }

    /* ====================================================
       10. Lunar 實例快取
       ==================================================== */
    const _instanceCache = new Map();
    const CACHE_MAX = 400; // 最多快取 ~10 個月的資料

    function getCacheKey(date) {
        return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    }

    /* ====================================================
       11. Lunar 類別 — 公開 API
       ==================================================== */
    class Lunar {
        /**
         * @private 請使用 Lunar.fromDate()
         */
        constructor(date) {
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
        static fromDate(date) {
            const key = getCacheKey(date);
            if (_instanceCache.has(key)) return _instanceCache.get(key);
            const inst = new Lunar(date);
            if (_instanceCache.size >= CACHE_MAX) _instanceCache.clear();
            _instanceCache.set(key, inst);
            return inst;
        }

        /**
         * 農曆月份（繁體）
         * @returns {string}
         * @example Lunar.fromDate(new Date(2025, 0, 29)).getMonthInChinese() // '正'
         */
        getMonthInChinese() { return MONTH_NAMES[this._lunarMonth - 1]; }

        /**
         * 農曆日期（繁體）
         * @returns {string}
         * @example Lunar.fromDate(new Date(2025, 0, 29)).getDayInChinese() // '初一'
         */
        getDayInChinese() { return DAY_NAMES[this._lunarDay - 1]; }

        /**
         * 天干地支年份
         * @returns {string}
         * @example Lunar.fromDate(new Date(2024, 1, 10)).getYearInGanZhi() // '甲辰'
         */
        getYearInGanZhi() { return yearGanZhi(this._lunarYear); }

        /**
         * 月干支
         * @returns {string}
         * @example Lunar.fromDate(new Date(2026, 1, 12)).getMonthInGanZhi() // '己丑'
         */
        getMonthInGanZhi() { return monthGanZhi(this._lunarYear, this._lunarMonth); }

        /**
         * 日干支
         * @returns {string}
         * @example Lunar.fromDate(new Date(2026, 1, 12)).getDayInGanZhi() // '丁巳'
         */
        getDayInGanZhi() { return this._getDayGZ().text; }

        /**
         * 生肖（繁體）
         * @returns {string}
         * @example Lunar.fromDate(new Date(2024, 1, 10)).getYearShengXiao() // '龍'
         */
        getYearShengXiao() { return SHENG_XIAO[(this._lunarYear - 4) % 12]; }

        /**
         * 節氣名稱（當日無節氣則回傳 null）
         * @returns {string|null}
         * @example Lunar.fromDate(new Date(2026, 1, 4)).getJieQi() // '立春'
         */
        getJieQi() { return getSolarTerm(this._date); }

        /**
         * 節氣區間（目前所處的節氣及距下一個節氣的天數）
         * @returns {{ current: string, next: string, daysToNext: number }}
         * @example Lunar.fromDate(new Date(2026, 1, 12)).getSolarTermPeriod()
         * // { current: '立春', next: '雨水', daysToNext: 7 }
         */
        getSolarTermPeriod() { return getSolarTermPeriod(this._date); }

        /**
         * 建除十二客日主
         * @returns {string}
         * @example Lunar.fromDate(new Date(2026, 1, 12)).getJianChu() // '定'
         */
        getJianChu() {
            return JIANCHU[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)];
        }

        /**
         * 吉凶等級：大吉/吉/中/凶/大凶
         * @returns {string}
         * @example Lunar.fromDate(new Date(2026, 1, 12)).getDayLuck() // '吉'
         */
        getDayLuck() {
            return JIANCHU_LUCK[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)];
        }

        /**
         * 宜事陣列（繁體）
         * @returns {string[]}
         */
        getDayYi() {
            return YI_TABLE[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)] || [];
        }

        /**
         * 忌事陣列（繁體）
         * @returns {string[]}
         */
        getDayJi() {
            return JI_TABLE[getJianChuIndex(this._lunarMonth, this._getDayGZ().zhi)] || [];
        }

        /**
         * 農曆節日（含除夕偵測），無節日則回傳 null
         * @returns {string|null}
         * @example Lunar.fromDate(new Date(2025, 0, 29)).getFestival() // '春節'
         */
        getFestival() {
            return getLunarFestival(this._lunarYear, this._lunarMonth, this._lunarDay);
        }

        /**
         * 公曆節日，無則回傳 null
         * @returns {string|null}
         */
        getSolarFestival() { return getSolarFestival(this._date); }

        /**
         * 西洋星座
         * @returns {string}
         * @example Lunar.fromDate(new Date(2026, 1, 12)).getConstellation() // '水瓶座'
         */
        getConstellation() { return getConstellation(this._date); }

        /** @private */
        _getDayGZ() {
            if (!this._dayGZ) this._dayGZ = dayGanZhi(this._date);
            return this._dayGZ;
        }
    }

    // 全域暴露 + ES Module 支援
    root.Lunar = Lunar;
    if (typeof module !== 'undefined' && module.exports) module.exports = Lunar;

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
