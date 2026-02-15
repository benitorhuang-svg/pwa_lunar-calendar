/**
 * Hero Gallery Manager
 * 負責管理藝廊選單、電台管理與圖片上傳邏輯
 * Manages gallery submenu, radio stations, and image upload logic
 */
export class HeroGalleryManager {
    private btnGalleryAdd: HTMLElement | null = null;
    private btnGalleryAddFolder: HTMLElement | null = null;
    private btnGalleryClear: HTMLElement | null = null;
    private btnGalleryFitToggle: HTMLElement | null = null;
    private btnGalleryMenu: HTMLElement | null = null;
    private btnMusicUrl: HTMLElement | null = null;
    private folderInput: HTMLInputElement | null = null;
    private galleryControlWrapper: HTMLElement | null = null;
    private galleryInput: HTMLInputElement | null = null;
    private gallerySubmenu: HTMLElement | null = null;
    private submenuItems: NodeListOf<HTMLElement> | null = null;
    private textGalleryFit: HTMLElement | null = null;
    private galleryEmptyNotice: HTMLElement | null = null;

    public bindControls(callbacks: {
        onClear: () => void;
        onFileSelect: (files: FileList) => void;
        onFitToggle: (isContain: boolean) => void;
        onModeChange: (mode: "custom" | "default" | "hybrid") => void;
        onMusicUrlInput: (name: string, url: string) => void;
        onPlay?: (url: string) => void;
        onStationDelete?: (id: string, name: string) => void;
    }): void {
        // Toggle Submenu
        this.btnGalleryMenu?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.gallerySubmenu?.classList.toggle("show");
        });

        // Clear Media
        this.btnGalleryClear?.addEventListener("click", () => {
            if (confirm("確定要清空所有自選圖片與自定義音樂嗎？")) {
                callbacks.onClear();
            }
            this.gallerySubmenu?.classList.remove("show");
        });

        // Toggle Fit Mode
        this.btnGalleryFitToggle?.addEventListener("click", () => {
            const isContain = !document.body.classList.contains("bg-fit-contain");
            callbacks.onFitToggle(isContain);

            if (this.textGalleryFit) {
                this.textGalleryFit.textContent = isContain ? "填滿畫面" : "顯示完整圖片";
            }
            this.gallerySubmenu?.classList.remove("show");
        });

        // Close submenu when clicking outside
        const closeSubmenu = (e: MouseEvent) => {
            if (
                this.gallerySubmenu?.classList.contains("show") &&
                !this.gallerySubmenu.contains(e.target as Node) &&
                e.target !== this.btnGalleryMenu
            ) {
                this.gallerySubmenu.classList.remove("show");
            }
        };
        document.addEventListener("click", closeSubmenu);

        // Upload Buttons
        this.btnGalleryAdd?.addEventListener("click", () => {
            this.galleryInput?.click();
            this.gallerySubmenu?.classList.remove("show");
        });

        this.btnGalleryAddFolder?.addEventListener("click", () => {
            this.folderInput?.click();
            this.gallerySubmenu?.classList.remove("show");
        });

        // Custom Music URL
        this.btnMusicUrl?.addEventListener("click", () => {
            const customUrl = prompt("請輸入您的電台直接網址 (Direct Streaming URL):");
            if (customUrl) {
                const customName = prompt("請輸入電台名稱:", "自訂電台");
                const finalName = customName || "自訂電台";
                callbacks.onMusicUrlInput(finalName, customUrl);

                const radioItems = document.querySelectorAll(".radio-item");
                radioItems.forEach((ri) => ri.classList.remove("active"));
            }
            this.gallerySubmenu?.classList.remove("show");
        });

        // Online Radio Delete (Static)
        const deleteButtons = document.querySelectorAll(".radio-delete-btn");
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
        const radioItems = document.querySelectorAll(".radio-item");
        radioItems.forEach((item) => {
            item.addEventListener("click", () => {
                const allRadioItems = document.querySelectorAll(".radio-item");
                allRadioItems.forEach((ri) => ri.classList.remove("active"));
                item.classList.add("active");

                const url = (item as HTMLElement).dataset.url;
                if (url) {
                    if (callbacks.onPlay) callbacks.onPlay(url);
                    this.gallerySubmenu?.classList.remove("show");
                }
            });
        });

        // File Inputs
        this.galleryInput?.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                callbacks.onFileSelect(files);
                if (this.galleryEmptyNotice) this.galleryEmptyNotice.style.display = "none";
            }
        });

        this.folderInput?.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                callbacks.onFileSelect(files);
                if (this.galleryEmptyNotice) this.galleryEmptyNotice.style.display = "none";
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
                    if (mode !== "custom" && this.galleryEmptyNotice) {
                        this.galleryEmptyNotice.style.display = "none";
                    }

                    this.gallerySubmenu?.classList.remove("show");
                }
            });
        });

        // Listen for empty custom list event
        window.addEventListener("custom-list-empty", () => {
            if (this.galleryEmptyNotice) {
                this.galleryEmptyNotice.style.display = "flex";
                // Auto open submenu if closed so user sees the valid options
                if (!this.gallerySubmenu?.classList.contains("show")) {
                    this.gallerySubmenu?.classList.add("show");
                }
                // Ensure custom button is active visually
                const customBtn = document.querySelector('.submenu-item[data-mode="custom"]');
                if (customBtn) {
                    this.submenuItems?.forEach(i => i.classList.remove("active"));
                    customBtn.classList.add("active");
                }
            }
        });
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
        this.submenuItems = document.querySelectorAll(".submenu-item[data-mode]");
        this.galleryControlWrapper = document.getElementById("galleryControlWrapper");
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
            btn.className = "radio-item";
            btn.dataset.url = station.url;
            btn.textContent = `▶ ${station.name}`;

            btn.addEventListener("click", () => {
                const allRadioItems = document.querySelectorAll(".radio-item");
                allRadioItems.forEach((ri) => ri.classList.remove("active"));
                btn.classList.add("active");

                onSelect(station.name, station.url);
                this.gallerySubmenu?.classList.remove("show");
            });

            const delBtn = document.createElement("button");
            delBtn.className = "radio-delete-btn";
            delBtn.textContent = "✕";
            delBtn.ariaLabel = "刪除此電台";

            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`確定要移除「${station.name}」嗎？`)) {
                    onDelete(station.id, station.name);
                }
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

    public setVisibility(visible: boolean): void {
        const display = visible ? "flex" : "none";
        if (this.galleryControlWrapper) this.galleryControlWrapper.style.display = display;
    }
}
