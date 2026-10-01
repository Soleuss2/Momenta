export type CapturedMediaRecord = {
  id: string;
  user_id: string;
  storage_path: string;
  media_kind: "photo" | "video";
  file_name: string;
  mime_type: string;
  file_size: number;
  captured_at: string;
  uploaded_at: string;
};

export type OfflineMediaItem = CapturedMediaRecord & {
  offlineBlob: Blob | null;
};

export type OfflineSnapshot = {
  userId: string;
  syncedAt: string;
  items: OfflineMediaItem[];
};

export const MAX_OFFLINE_BYTES = 250 * 1024 * 1024;

const DATABASE_NAME = "momenta-offline-media";
const DATABASE_VERSION = 1;
const SNAPSHOTS_STORE = "snapshots";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(SNAPSHOTS_STORE, { keyPath: "userId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline storage."));
    request.onblocked = () => reject(new Error("Offline storage is blocked by another tab."));
  });
}

export async function getOfflineSnapshot(userId: string): Promise<OfflineSnapshot | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(SNAPSHOTS_STORE, "readonly").objectStore(SNAPSHOTS_STORE).get(userId);
    request.onsuccess = () => resolve((request.result as OfflineSnapshot | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Unable to read offline memories."));
    database.close();
  });
}

export async function saveOfflineSnapshot(snapshot: OfflineSnapshot): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOTS_STORE, "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).put(snapshot);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Unable to save offline memories."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Offline storage is full or unavailable."));
    };
  });
}

export async function deleteOfflineSnapshot(userId: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOTS_STORE, "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).delete(userId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Unable to clear offline memories."));
    };
  });
}

export async function removeOfflineMediaItem(userId: string, storagePath: string): Promise<void> {
  const snapshot = await getOfflineSnapshot(userId);
  if (!snapshot) return;
  await saveOfflineSnapshot({
    ...snapshot,
    items: snapshot.items.filter((item) => item.storage_path !== storagePath),
  });
}

export async function clearOfflineSnapshots(): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOTS_STORE, "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).clear();
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Unable to clear offline memories."));
    };
  });
}
