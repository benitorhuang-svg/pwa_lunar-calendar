/**
 * Application Configuration
 * 應用程式全域設定
 */

// Get Base URL (Adjust for trailing slash if needed)
// 確保 BASE_URL 以斜線結尾
let base = import.meta.env.BASE_URL;

if (base && !base.endsWith("/")) {
    base += "/";
}

export const APP_BASE_URL = base;
