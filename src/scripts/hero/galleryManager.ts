/**
 * Hero Gallery Manager
 * 負責管理藝廊選單、電台管理與圖片上傳邏輯
 * Manages gallery submenu, radio stations, and image upload logic
 */
import { uiToggleManager } from "../app/uiToggleManager";
export class HeroGalleryManager {
    private btnGalleryAdd: HTMLElement | null = null;
    private btnGalleryAddFolder: HTMLElement | null = null;
    private btnGalleryClear: HTMLElement | null = null;
    private btnGalleryFitToggle: HTMLElement | null = null;
    private btnGalleryMenu: HTMLElement | null = null;
    private btnMusicUrl: HTMLElement | null = null;
    private folderInput: HTMLInputElement | null = null;
    private galleryEmptyNotice: HTMLElement | null = null;
    private galleryInput: HTMLInputElement | null = null;
    private gallerySubmenu: HTMLElement | null = null;
    private submenuItems: NodeListOf<HTMLElement> | null = null;
    private textGalleryFit: HTMLElement | null = null;

    public bindControls(callbacks: {
        onClear: () => void;
        onFileSelect: (files: FileList) => void;
        onFitToggle: (isContain: boolean) => void;
        onModeChange: (mode: "custom" | "default" | "hybrid") => void;
        onMusicUrlInput: (name: string, url: string) => void;
        onPlay?: (url: string) => void;
        onStationDelete?: (id: string, name: string) => void;
    }): void {
        // Register Gallery with UIToggleManager
        const panelToday = document.getElementById("panelToday");
        const hideTodayCard = () => {
            if (panelToday) {
                panelToday.style.opacity = "0";
                panelToday.style.pointerEvents = "none";
            }
        };
        const restoreTodayCard = () => {
            if (panelToday) {
                panelToday.style.opacity = "";
                panelToday.style.pointerEvents = "";
            }
        };

        uiToggleManager.register({
            close: () => {
                this.gallerySubmenu?.classList.remove("show");
                restoreTodayCard();
            },
            id: "gallery",
            open: () => {
                // Ensure we leave calendar mode (hide grid) when opening a panel
                window.dispatchEvent(new CustomEvent("transition-mode", { detail: { to: "artwork" } }));

                hideTodayCard();
                this.gallerySubmenu?.classList.add("show");
            },
        });

        // Toggle Submenu (Original button - keep showing both as a base if no view is set)
        this.btnGalleryMenu?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.gallerySubmenu?.classList.remove("view-image", "view-music");
            const isOpen = this.gallerySubmenu?.classList.contains("show") ?? false;
            uiToggleManager.toggle("gallery", isOpen);
        });

        // Clear Media
        this.btnGalleryClear?.addEventListener("click", () => {
            if (confirm("確定要清空所有自選圖片與自定義音樂嗎？")) {
                callbacks.onClear();
            }
            uiToggleManager.toggle("gallery", true);
        });

        // Toggle Fit Mode
        this.btnGalleryFitToggle?.addEventListener("click", () => {
            const isContain = !document.body.classList.contains("bg-fit-contain");
            callbacks.onFitToggle(isContain);

            if (this.textGalleryFit) {
                this.textGalleryFit.textContent = isContain ? "填滿畫面" : "顯示完整圖片";
            }
            uiToggleManager.toggle("gallery", true);
        });

        // Close submenu when clicking outside
        const closeSubmenu = (e: MouseEvent) => {
            if (
                this.gallerySubmenu?.classList.contains("show") &&
                !this.gallerySubmenu.contains(e.target as Node) &&
                e.target !== this.btnGalleryMenu
            ) {
                uiToggleManager.toggle("gallery", true);
            }
        };
        document.addEventListener("click", closeSubmenu);

        // Upload Buttons
        this.btnGalleryAdd?.addEventListener("click", () => {
            this.galleryInput?.click();
            uiToggleManager.toggle("gallery", true);
        });

        this.btnGalleryAddFolder?.addEventListener("click", () => {
            this.folderInput?.click();
            uiToggleManager.toggle("gallery", true);
        });

        // Custom Music URL
        this.btnMusicUrl?.addEventListener("click", () => {
            const customUrl = prompt("請輸入您的電台直接網址 (Direct Streaming URL):");
            if (customUrl) {
                const customName = prompt("請輸入電台名稱:", "自訂電台");
                const finalName = customName || "自訂電台";
                callbacks.onMusicUrlInput(finalName, customUrl);

                const radioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
                radioItems.forEach((ri) => ri.classList.remove("active"));
            }
            uiToggleManager.toggle("gallery", true);
        });

        // Online Radio Delete (Static)
        const deleteButtons = document.querySelectorAll(".radio-del-small");
        deleteButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("確定要移除此電台嗎？")) {
                    const row = btn.closest(".radio-row");
                    if (row) row.remove();
                }
            });
        });

        // Online Radio Presets
        const radioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
        radioItems.forEach((item) => {
            item.addEventListener("click", () => {
                const allRadioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
                allRadioItems.forEach((ri) => ri.classList.remove("active"));
                item.classList.add("active");

                const url = (item as HTMLElement).dataset.url;
                if (url) {
                    if (callbacks.onPlay) callbacks.onPlay(url);
                    uiToggleManager.toggle("gallery", true);
                }
            });
        });

        // File Inputs
        this.galleryInput?.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                callbacks.onFileSelect(files);
                document.body.removeAttribute("data-gallery-empty");
            }
        });

        this.folderInput?.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                callbacks.onFileSelect(files);
                document.body.removeAttribute("data-gallery-empty");
            }
        });

        // Mode Switching
        this.submenuItems?.forEach((item) => {
            item.addEventListener("click", () => {
                const mode = item.dataset.mode as "custom" | "default" | "hybrid";
                if (mode) {
                    callbacks.onModeChange(mode);
                    this.submenuItems?.forEach((i) => i.classList.remove("active"));
                    item.classList.add("active");

                    // Hide notice if switching away from custom or if custom has images (logic handled by image manager response, but safe to hide first)
                    // Actually, if we switch to custom and it's empty, the event will fire again.
                    // If we switch to default/hybrid, we should hide it.
                    if (mode !== "custom") {
                        document.body.removeAttribute("data-gallery-empty");
                    }

                    uiToggleManager.toggle("gallery", true);
                }
            });
        });

        // Listen for empty custom list event
        window.addEventListener("custom-list-empty", () => {
            if (this.galleryEmptyNotice) {
                document.body.setAttribute("data-gallery-empty", "true");
                // Auto open submenu if closed so user sees the valid options
                if (!this.gallerySubmenu?.classList.contains("show")) {
                    uiToggleManager.toggle("gallery", false);
                }
                // Ensure custom button is active visually
                const customBtn = document.querySelector('.mode-btn[data-mode="custom"]');
                if (customBtn) {
                    this.submenuItems?.forEach((i) => i.classList.remove("active"));
                    customBtn.classList.add("active");
                }
            }
        });

        // Listen for music restored event
        window.addEventListener("music-restored", ((e: CustomEvent) => {
            const url = e.detail.url;
            if (!url) return;

            const allRadioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
            allRadioItems.forEach((ri) => ri.classList.remove("active"));

            const match = Array.from(allRadioItems).find(
                (item) => (item as HTMLElement).dataset.url === url,
            );
            if (match) {
                match.classList.add("active");
            }
        }) as EventListener);

        // Initial check for static items
        const lastUrl = localStorage.getItem("zen_music_last_url");
        if (lastUrl) {
            const allRadioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
            allRadioItems.forEach((ri) => {
                if ((ri as HTMLElement).dataset.url === lastUrl) {
                    ri.classList.add("active");
                } else {
                    ri.classList.remove("active");
                }
            });
        }
    }

    public init(): void {
        this.btnGalleryMenu = document.getElementById("btnGalleryMenu");
        this.gallerySubmenu = document.getElementById("gallerySubmenu");
        this.btnGalleryAdd = document.getElementById("btnGalleryAdd");
        this.btnGalleryAddFolder = document.getElementById("btnGalleryAddFolder");
        this.btnMusicUrl = document.getElementById("btnMusicUrl");
        this.btnGalleryClear = document.getElementById("btnGalleryClear");
        this.btnGalleryFitToggle = document.getElementById("btnGalleryFitToggle");
        this.textGalleryFit = document.getElementById("textGalleryFit");
        this.galleryEmptyNotice = document.getElementById("galleryEmptyNotice");
        this.galleryInput = document.getElementById("galleryInput") as HTMLInputElement;
        this.folderInput = document.getElementById("folderInput") as HTMLInputElement;
        this.submenuItems = document.querySelectorAll(".mode-btn[data-mode]");
    }

    public renderCustomStations(
        stations: { id: string; name: string; url: string }[],
        onDelete: (id: string, name: string) => void,
        onSelect: (name: string, url: string) => void,
    ): void {
        const musicBtn = document.getElementById("btnMusicUrl");
        if (!musicBtn) return;

        const container = musicBtn.closest(".radio-row")?.parentElement || musicBtn.parentElement;
        if (!container) return;

        const existingCustoms = container.querySelectorAll(".radio-row.custom-station-row");
        existingCustoms.forEach((row) => row.remove());

        const insertBeforeTarget = musicBtn.closest(".radio-row");

        stations.forEach((station) => {
            const row = document.createElement("div");
            row.className = "radio-row custom-station-row";

            const btn = document.createElement("button");
            btn.className = "radio-item-mini";
            btn.dataset.url = station.url;
            btn.textContent = station.name;

            btn.addEventListener("click", () => {
                const allRadioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
                allRadioItems.forEach((ri) => ri.classList.remove("active"));
                btn.classList.add("active");

                onSelect(station.name, station.url);
                uiToggleManager.toggle("gallery", true);
            });

            // Check if this station was the last played
            const lastUrl = localStorage.getItem("zen_music_last_url");
            if (lastUrl && lastUrl === station.url) {
                // Deactivate others
                const allRadioItems = document.querySelectorAll(".radio-item, .radio-item-mini");
                allRadioItems.forEach((ri) => ri.classList.remove("active"));
                btn.classList.add("active");
            }

            const delBtn = document.createElement("button");
            delBtn.className = "radio-del-small";
            delBtn.textContent = "✕";
            delBtn.ariaLabel = "刪除此電台";

            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                onDelete(station.id, station.name);
            });

            row.appendChild(btn);
            row.appendChild(delBtn);

            if (insertBeforeTarget) {
                container.insertBefore(row, insertBeforeTarget);
            } else {
                container.appendChild(row);
            }
        });
    }

    public setVisibility(_visible: boolean): void {
        // No longer using style.display, handled by body class in global.css
    }
}
