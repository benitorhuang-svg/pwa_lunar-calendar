export interface Poem {
    content: string;
    author: string;
    dynasty: string; // "唐", "宋" etc.
    season?: "spring" | "summer" | "autumn" | "winter";
    term?: string; // 針對特定節氣 (e.g., "雨水")
}
