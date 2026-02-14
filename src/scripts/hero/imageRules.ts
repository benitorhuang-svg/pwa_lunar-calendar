export class ImageRules {
    /**
     * The list of supported image extensions in order of preference.
     */
    public static readonly SUPPORTED_EXTENSIONS = [".png", ".webp", ".jpg"];

    /**
     * Maximum number of images to try probing for when manifest is not available.
     */
    public static readonly MAX_PROBE_COUNT = 20;

    /**
     * Maximum number of images to select per season for the global playlist.
     */
    public static readonly MAX_IMAGES_PER_SEASON = 10;

    /**
     * Maximum number of variant images to look for (e.g., DragonBoat1...DragonBoat5).
     */
    public static readonly MAX_VARIANT_COUNT = 5;

    /**
   * The ordered list of seasons.
   */
    public static readonly SEASONS = ["spring", "summer", "autumn", "winter"];

    /**
     * Whether to randomize the selection of images within each season.
     * If true, images are shuffled at load time to provide variety.
     */
    public static readonly ENABLE_RANDOM_SHUFFLE = true;

    /**
     * Whether to maintain the seasonal order (Spring -> Summer -> Autumn -> Winter) in the global playlist.
     */
    public static readonly ENABLE_SEASONAL_SORT = true;

    /**
       * Determines the season based on a given date.
       * Month is 0-indexed (Jan=0, Dec=11).
       *
       * Current Logic:
       *   Spring: Feb (1), Mar (2), Apr (3)
       *   Summer: May (4), Jun (5), Jul (6)
       *   Autumn: Aug (7), Sep (8), Oct (9)
       *   Winter: Nov (10), Dec (11), Jan (0)
       *
       * @param date The date to check.
       * @returns The season name ("spring", "summer", "autumn", "winter").
       */
    public static getSeason(date: Date): string {
        const m = date.getMonth(); // 0-11
        if (m >= 1 && m <= 3) return "spring";
        if (m >= 4 && m <= 6) return "summer";
        if (m >= 7 && m <= 9) return "autumn";
        return "winter";
    }
}
