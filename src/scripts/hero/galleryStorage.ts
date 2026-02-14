/**
 * Gallery Storage Manager
 * 負責使用 IndexedDB 儲存使用者自訂圖片 (Handles storing custom images using IndexedDB)
 */

export interface CustomImage {
    id: string;
    blob: Blob;
    name: string;
    timestamp: number;
}

export class GalleryStorage {
    private dbName = "LunarCalendarGallery";
    private storeName = "customImages";
    private db: IDBDatabase | null = null;

    constructor() { }

    public async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject("Failed to open IndexedDB");
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "id" });
                }
            };
        });
    }

    public async saveImages(files: FileList | File[]): Promise<void> {
        if (!this.db) await this.init();

        const tx = this.db!.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);

        for (const file of Array.from(files)) {
            const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const imageData: CustomImage = {
                id,
                blob: file,
                name: file.name,
                timestamp: Date.now()
            };
            store.add(imageData);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject("Failed to save images");
        });
    }

    public async getAllImages(): Promise<CustomImage[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to fetch images");
        });
    }

    public async deleteImage(id: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, "readwrite");
            const store = tx.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete image");
        });
    }

    public async clearAll(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.storeName, "readwrite");
            const store = tx.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to clear gallery");
        });
    }
}

export const galleryStorage = new GalleryStorage();
