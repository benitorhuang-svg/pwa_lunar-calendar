/**
 * Core Feedback System
 * 負責全域的觸覺回饋 (Haptics) 與提示訊息 (Toasts)
 */

export function hapticFeedback(style: "heavy" | "light" | "medium" = "light"): void {
    if (!("vibrate" in navigator)) return;

    const patterns = {
        heavy: [40, 30, 40],
        light: [10],
        medium: [20],
    };

    navigator.vibrate(patterns[style]);
}

let toastContainer: HTMLElement | null = null;

export function initToastContainer(container: HTMLElement | null): void {
    toastContainer = container;
}

export function showToast(
    message: string,
    type: "error" | "info" = "info",
    action?: { callback: () => void; label: string },
): void {
    if (!toastContainer) {
        toastContainer = document.getElementById("toastContainer");
        if (!toastContainer) return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;

    const content = document.createElement("span");
    content.innerHTML = `<span class="toast-icon">${type === "error" ? "⚠️" : "✨"}</span> ${message}`;
    toast.appendChild(content);

    if (action) {
        const btn = document.createElement("button");
        btn.className = "toast-action";
        btn.textContent = action.label;
        btn.onclick = (e) => {
            e.stopPropagation();
            action.callback();
            toast.classList.add("hiding");
            setTimeout(() => toast.remove(), 400);
            hapticFeedback("light");
        };
        toast.appendChild(btn);
    }

    toastContainer.appendChild(toast);

    setTimeout(
        () => {
            if (toast.parentElement) {
                toast.classList.add("hiding");
                toast.addEventListener("animationend", () => {
                    toast.remove();
                });
            }
        },
        action ? 6000 : 3000,
    );
}
