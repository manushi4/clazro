// IndexedDB-based file system for web
const DB_NAME = 'manushi_filesystem';
const STORE_NAME = 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
  });

  return dbPromise;
};

export const DocumentDirectoryPath = '/documents';
export const CachesDirectoryPath = '/caches';

export const writeFile = async (path: string, content: string, encoding?: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(content, path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const readFile = async (path: string): Promise<string> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(path);
    request.onsuccess = () => resolve(request.result || '');
    request.onerror = () => reject(request.error);
  });
};

export const exists = async (path: string): Promise<boolean> => {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(path);
    request.onsuccess = () => resolve(request.result !== undefined);
    request.onerror = () => resolve(false);
  });
};

export const unlink = async (path: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const mkdir = async (path: string): Promise<void> => {
  // No-op for web (directories are virtual)
};

export const stat = async (path: string): Promise<{ size: number; isFile: () => boolean }> => {
  const content = await readFile(path);
  return {
    size: content?.length || 0,
    isFile: () => true,
  };
};

export default {
  DocumentDirectoryPath,
  CachesDirectoryPath,
  writeFile,
  readFile,
  exists,
  unlink,
  mkdir,
  stat,
};
