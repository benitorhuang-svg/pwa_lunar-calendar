/**
 * Hero Touch Handler
 * 負責處理觸控滑動手勢
 * Handles touch and swipe gestures
 */
export class HeroTouchHandler {

    private touchStartX = 0; // 觸控起始 X 座標 (Touch start X coordinate)
    private touchStartY = 0; // 觸控起始 Y 座標 (Touch start Y coordinate)

    constructor(
        private onSwipeLeft: () => void, // 向左滑動回呼 (Callback for left swipe)
        private onSwipeRight: () => void, // 向右滑動回呼 (Callback for right swipe)
        private onInteraction: () => void, // 互動事件回呼 (Callback for general interaction)
    ) { }

    public init(): void {
        window.addEventListener(
            "touchstart",
            (e: TouchEvent) => {
                const touch = e.changedTouches[0];
                if (touch) {
                    this.touchStartX = touch.clientX;
                    this.touchStartY = touch.clientY;
                }
            },
            { passive: true, capture: true },
        );

        window.addEventListener(
            "touchend",
            (e: TouchEvent) => {
                const touch = e.changedTouches[0];
                if (!touch) return;

                const touchEndX = touch.clientX;
                const touchEndY = touch.clientY;

                const diffX = touchEndX - this.touchStartX;
                const diffY = touchEndY - this.touchStartY;
                const absX = Math.abs(diffX);
                const absY = Math.abs(diffY);

                // 優化滑動判定邏輯 (Optimized Swipe Detection)
                // 1. 距離門檻降低至 30px (Lower threshold to 30px)
                // 2. 只要橫向移動大於縱向移動即可 (Accept if X > Y movement)
                if (absX > 30 && absX > absY) {
                    // 使用者互動時重置閒置計時
                    // Reset idle time on user interaction
                    this.onInteraction();

                    // 向左滑動 (下一頁)
                    // Swipe Left (Next)
                    if (diffX < 0) {
                        this.onSwipeLeft();
                    }
                    // 向右滑動 (上一頁)
                    // Swipe Right (Prev)
                    else {
                        this.onSwipeRight();
                    }
                }
            },
            { passive: true, capture: true },
        );
    }
}
