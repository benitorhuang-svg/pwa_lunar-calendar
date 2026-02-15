/**
 * Gallery Storage Manager
 * 負責使用 IndexedDB 儲存使用者自訂圖片 (Handles storing custom images using IndexedDB)
 */

export interface CustomAudio {
    blob?: Blob;
    id: string;
    name: string;
    timestamp: number;
    type: "file" | "link";
    url?: string;
}

export interface CustomImage {
    blob: Blob;
    id: string;
    name: string;
    timestamp: number;
}

export class GalleryStorage {
    private audioStoreName = "customAudio";
    private db: IDBDatabase | null = null;
    private dbName = "LunarCalendarGallery";
    private storeName = "customImages";

    constructor() {}

    public async clearAll(): Promise<void> {
        if (!this.db) await this.init();
        const tx = this.db!.transaction([this.storeName, this.audioStoreName], "readwrite");
        tx.objectStore(this.storeName).clear();
        tx.objectStore(this.audioStoreName).clear();
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve();
        });
    }

    public async deleteAudio(id: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(this.audioStoreName, "readwrite");
            const store = tx.objectStore(this.audioStoreName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete audio");
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

    public async getAllAudio(): Promise<CustomAudio[]> {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const tx = this.db!.transaction(this.audioStoreName, "readonly");
            const store = tx.objectStore(this.audioStoreName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
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

    public async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2); // Upgrade to v2

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
                if (!db.objectStoreNames.contains(this.audioStoreName)) {
                    db.createObjectStore(this.audioStoreName, { keyPath: "id" });
                }
            };
        });
    }

    public async saveAudioFiles(files: File[] | FileList): Promise<void> {
        if (!this.db) await this.init();
        const tx = this.db!.transaction(this.audioStoreName, "readwrite");
        const store = tx.objectStore(this.audioStoreName);

        for (const file of Array.from(files)) {
            const id = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const audioData: CustomAudio = {
                blob: file,
                id,
                name: file.name,
                timestamp: Date.now(),
                type: "file",
            };
            store.add(audioData);
        }
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve();
        });
    }

    public async saveAudioLink(name: string, url: string): Promise<void> {
        if (!this.db) await this.init();
        const tx = this.db!.transaction(this.audioStoreName, "readwrite");
        const store = tx.objectStore(this.audioStoreName);

        const id = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const audioData: CustomAudio = {
            id,
            name,
            timestamp: Date.now(),
            type: "link",
            url,
        };
        store.add(audioData);
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve();
        });
    }

    public async saveImages(files: File[] | FileList): Promise<void> {
        if (!this.db) await this.init();

        const tx = this.db!.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);

        for (const file of Array.from(files)) {
            const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const imageData: CustomImage = {
                blob: file,
                id,
                name: file.name,
                timestamp: Date.now(),
            };
            store.add(imageData);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject("Failed to save images");
        });
    }
}

export const galleryStorage = new GalleryStorage();
