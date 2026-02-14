/// <reference path="../.astro/types.d.ts" />

declare let Lunar: any;
declare let GALLERY_MANIFEST: Record<string, string[]>;

interface Window {
    APP_BASE_URL: string;
    GALLERY_MANIFEST: Record<string, string[]>;
}
