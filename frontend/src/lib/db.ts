// We use NEXT_PUBLIC_ so Next.js knows it's safe to expose these to the browser!
const DB_NAME = process.env.NEXT_PUBLIC_LOCAL_DB_NAME || "GroceryERPLocalDB";
const DB_VERSION = parseInt(process.env.NEXT_PUBLIC_LOCAL_DB_VERSION || "1", 10);

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject("IndexedDB is not available on the server side.");
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            // Create a local table for the product catalog
            if (!db.objectStoreNames.contains("products")) {
                db.createObjectStore("products", { keyPath: "id" });
            }
            // Create a local queue for offline checkout transactions
            if (!db.objectStoreNames.contains("sync_queue")) {
                db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event: any) => resolve(event.target.result);
        request.onerror = (event: any) => reject(event.target.error);
    });
};

export const saveProductsLocal = async (products: any[]) => {
    try {
        const db = await initDB();
        const tx = db.transaction("products", "readwrite");
        const store = tx.objectStore("products");
        
        // Clear old cached products and replace with fresh data
        store.clear();
        products.forEach(p => store.put(p));
        
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
        });
    } catch (e) {
        console.error("Local DB Save Error:", e);
    }
};

export const getProductsLocal = async (): Promise<any[]> => {
    try {
        const db = await initDB();
        const tx = db.transaction("products", "readonly");
        const store = tx.objectStore("products");
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Local DB Load Error:", e);
        return [];
    }
};

export const addToSyncQueue = async (payload: any) => {
    try {
        const db = await initDB();
        const tx = db.transaction("sync_queue", "readwrite");
        const store = tx.objectStore("sync_queue");
        
        store.put({ payload, timestamp: new Date().toISOString() });
        
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
        });
    } catch (e) {
        console.error("Local DB Sync Queue Error:", e);
    }
};

export const getSyncQueue = async (): Promise<any[]> => {
    try {
        const db = await initDB();
        const tx = db.transaction("sync_queue", "readonly");
        const store = tx.objectStore("sync_queue");
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Local DB Sync Queue Error:", e);
        return [];
    }
};

export const clearSyncQueueItem = async (id: number) => {
    try {
        const db = await initDB();
        const tx = db.transaction("sync_queue", "readwrite");
        const store = tx.objectStore("sync_queue");
        store.delete(id);
        
        return new Promise((resolve) => {
            tx.oncomplete = () => resolve(true);
        });
    } catch (e) {
        console.error("Local DB Sync Clear Error:", e);
    }
};