/**
 * Typed Event Utilities
 * 強型別事件工具函式，避免手動 `as EventListener` cast
 */

/**
 * Listen for a typed CustomEvent.
 * 監聽強型別 CustomEvent，無需手動 cast。
 *
 * @example
 * onTypedEvent<{ year: number; month: number }>("date-selected", (detail) => {
 *     console.log(detail.year, detail.month);
 * });
 */
export function onTypedEvent<T>(
    name: string,
    handler: (detail: T) => void,
    options?: AddEventListenerOptions
): void {
    window.addEventListener(
        name,
        ((e: CustomEvent<T>) => handler(e.detail)) as EventListener,
        options
    );
}

/**
 * Dispatch a typed CustomEvent.
 * 發送強型別 CustomEvent。
 *
 * @example
 * dispatchTypedEvent<{ to: AppMode }>("transition-mode", { to: "artwork" });
 */
export function dispatchTypedEvent<T>(name: string, detail: T): void {
    window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}
