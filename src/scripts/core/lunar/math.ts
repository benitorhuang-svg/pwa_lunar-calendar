import { LUNAR_INFO, BASE_DATE } from "../lunarConstants";

export interface LunarDate {
    day: number;
    isLeap: boolean;
    month: number;
    year: number;
}

export function gregorianToLunar(date: Date): LunarDate {
    let offset = Math.floor((date.getTime() - BASE_DATE.getTime()) / 86400000);
    let daysInYear = 0,
        lunarYear = 1900;

    for (let i = 1900; i < 2101 && offset > 0; i++) {
        daysInYear = yearDays(i);
        offset -= daysInYear;
        lunarYear++;
    }
    if (offset < 0) {
        offset += daysInYear;
        lunarYear--;
    }

    const leap = leapMonth(lunarYear);
    let daysInMonth = 0,
        isLeap = false,
        lunarMonth = 1;

    for (let i = 1; i < 13 && offset > 0; i++) {
        if (leap > 0 && i === leap + 1 && !isLeap) {
            --i;
            isLeap = true;
            daysInMonth = leapDays(lunarYear);
        } else {
            daysInMonth = monthDays(lunarYear, i);
        }
        if (isLeap && i === leap + 1) isLeap = false;
        offset -= daysInMonth;
        if (!isLeap) lunarMonth++;
    }

    if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
        if (isLeap) isLeap = false;
        else {
            isLeap = true;
            --lunarMonth;
        }
    }
    if (offset < 0) {
        offset += daysInMonth;
        --lunarMonth;
    }

    return { day: offset + 1, isLeap, month: lunarMonth, year: lunarYear };
}

export function leapDays(y: number): number {
    return leapMonth(y) === 0 ? 0 : (LUNAR_INFO[y - 1900] || 0) & 0x10000 ? 30 : 29;
}

export function leapMonth(y: number): number {
    return (LUNAR_INFO[y - 1900] || 0) & 0xf;
}

export function monthDays(y: number, m: number): number {
    return (LUNAR_INFO[y - 1900] || 0) & (0x10000 >> m) ? 30 : 29;
}

// yearDays 快取
const _yearDaysCache = new Map<number, number>();

export function yearDays(y: number): number {
    if (_yearDaysCache.has(y)) return _yearDaysCache.get(y)!;
    let sum = 348;
    const info = LUNAR_INFO[y - 1900] || 0;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
        if (info & i) sum++;
    }
    sum += leapDays(y);
    _yearDaysCache.set(y, sum);
    return sum;
}
