import type { DocumentId } from "@vbn/shared";

/**
 * IndexedDB store for attached files. Files never leave the browser.
 * One attachment per checklist item; attaching again replaces it.
 */
export interface StoredFile {
  docId: DocumentId;
  name: string;
  type: "application/pdf" | "image/png" | "image/jpeg";
  size: number;
  addedAt: string;
  blob: Blob;
  /** Built-in fake demo document. Only these may be sent to "Explain this document". */
  sample?: { title: string; text: string };
}

const DB_NAME = "benefits-navigator";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "docId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

export const listFiles = () => tx<StoredFile[]>("readonly", (s) => s.getAll() as IDBRequest<StoredFile[]>);
export const putFile = (f: StoredFile) => tx("readwrite", (s) => s.put(f)).then(() => undefined);
export const deleteFile = (docId: DocumentId) => tx("readwrite", (s) => s.delete(docId)).then(() => undefined);

export function deleteAllFiles(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // Will complete once open connections close.
  });
}
