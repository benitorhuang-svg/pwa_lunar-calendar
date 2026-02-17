/**
 * Holiday Service
 * 負責取得與管理政府辦公日曆 (Responsible for fetching and managing government office calendar)
 */

export interface HolidayInfo {
    date: string;       // YYYYMMDD
    isHoliday: boolean;
    category?: string;
    description?: string;
}

export class HolidayService {
    private static instance: HolidayService;
    private holidayMap: Map<string, HolidayInfo> = new Map();
    private loadedYears: Set<number> = new Set();

    private constructor() { }

    public static getInstance(): HolidayService {
        if (!HolidayService.instance) {
            HolidayService.instance = new HolidayService();
        }
        return HolidayService.instance;
    }

    /**
     * 獲取指定年份的休假資料 (Fetch holiday data for a specific year)
     */
    public async fetchYearData(year: number): Promise<void> {
        if (this.loadedYears.has(year)) return;

        // 嘗試從 LocalStorage 讀取快取 (Try to load from LocalStorage cache)
        const cacheKey = `holidays_${year}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const data = JSON.parse(cached) as HolidayInfo[];
                this.processData(data);
                this.loadedYears.add(year);
                return;
            } catch (e) {
                console.warn(`Failed to parse cached holidays for ${year}`);
            }
        }

        // 從 GitHub 抓取資料 (Fetch from GitHub)
        try {
            // 使用 ruyut/TaiwanCalendar 提供之穩定 JSON 來源
            const url = `https://raw.githubusercontent.com/ruyut/TaiwanCalendar/master/data/${year}.json`;
            const response = await fetch(url);

            if (response.status === 404) {
                // Future years might not be available yet, this is expected
                console.log(`[HolidayService] Holiday data for ${year} is not yet available (404).`);
                this.loadedYears.add(year); // Mark as attempt to avoid repeated fetches
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json() as HolidayInfo[];
            this.processData(data);
            this.loadedYears.add(year);

            // 存入快取 (Save to cache)
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to fetch holidays for ${year}:`, error);
        }
    }

    private processData(data: HolidayInfo[]): void {
        data.forEach(item => {
            this.holidayMap.set(item.date, item);
        });
    }

    /**
     * 檢查指定日期是否為假期 (Check if a date is a holiday)
     */
    public getHolidayInfo(year: number, month: number, day: number): HolidayInfo | null {
        // month is 0-indexed in JS, but API/Data usually uses 1-indexed or YYYYMMDD
        const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
        return this.holidayMap.get(dateStr) || null;
    }

    public isHoliday(year: number, month: number, day: number): boolean {
        const info = this.getHolidayInfo(year, month, day);
        if (info) return info.isHoliday;

        // 預設週末為假日 (Default weekends as holidays if data not found)
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
}
