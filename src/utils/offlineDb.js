const DB_NAME = 'aluna-offline';
const DB_VERSION = 1;
const ORDER_STORE = 'pending-orders';
const CACHE_STORE = 'catalog-cache';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB no esta disponible'));
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ORDER_STORE)) db.createObjectStore(ORDER_STORE, { keyPath: 'clientOrderId' });
      if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB está bloqueada por otra pestaña'));
  });
}

async function withStore(storeName, mode, operation) {
  const db = await openDatabase();
  db.onversionchange = () => db.close();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error('Falló la transacción de IndexedDB'));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error('Se canceló la transacción de IndexedDB'));
    };
  });
}

export const pendingOrders = {
  put: (order) => withStore(ORDER_STORE, 'readwrite', (store) => store.put(order)),
  remove: (id) => withStore(ORDER_STORE, 'readwrite', (store) => store.delete(id)),
  list: () => withStore(ORDER_STORE, 'readonly', (store) => store.getAll()),
};

export const catalogCache = {
  put: (key, value) => withStore(CACHE_STORE, 'readwrite', (store) => store.put({ key, value, cachedAt: Date.now() })),
  get: (key) => withStore(CACHE_STORE, 'readonly', (store) => store.get(key)),
};
