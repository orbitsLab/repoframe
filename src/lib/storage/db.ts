const databaseName = 'repoframe';
const databaseVersion = 1;

type StoreName = 'repos' | 'project';

let databasePromise: Promise<IDBDatabase | undefined> | undefined;

/** Opens the shared database or returns undefined when IndexedDB is unavailable. */
function openDatabase(): Promise<IDBDatabase | undefined> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(databaseName, databaseVersion);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains('repos')) {
          database.createObjectStore('repos');
        }

        if (!database.objectStoreNames.contains('project')) {
          database.createObjectStore('project');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
      request.onblocked = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });

  return databasePromise;
}

/**
 * Reads a value without failing the application when IndexedDB is unavailable.
 *
 * @param storeName - Object store containing the value.
 * @param key - IndexedDB key identifying the value.
 * @returns The stored value, or undefined when it cannot be read.
 */
async function readStore<T>(
  storeName: StoreName,
  key: IDBValidKey,
): Promise<T | undefined> {
  try {
    const database = await openDatabase();
    if (!database) {
      return undefined;
    }

    return await new Promise((resolve) => {
      const transaction = database.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => resolve(undefined);
      transaction.onabort = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

/**
 * Writes a value without failing the application when IndexedDB is unavailable.
 *
 * @param storeName - Object store that receives the value.
 * @param key - IndexedDB key identifying the value.
 * @param value - Value to persist.
 */
async function writeStore<T>(
  storeName: StoreName,
  key: IDBValidKey,
  value: T,
): Promise<void> {
  try {
    const database = await openDatabase();
    if (!database) {
      return;
    }

    await new Promise<void>((resolve) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    });
  } catch {}
}

/**
 * Deletes a value without failing the application when IndexedDB is unavailable.
 *
 * @param storeName - Object store containing the value.
 * @param key - IndexedDB key identifying the value.
 */
async function deleteStore(
  storeName: StoreName,
  key: IDBValidKey,
): Promise<void> {
  try {
    const database = await openDatabase();
    if (!database) {
      return;
    }

    await new Promise<void>((resolve) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    });
  } catch {}
}

export { deleteStore, readStore, writeStore };
