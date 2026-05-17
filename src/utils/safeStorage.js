/**
 * safeStorage.js
 * A try/catch-wrapped storage engine that falls back to in-memory state
 * in private browsing or security-restricted environments.
 */

const memoryStore = {};
const sessionMemoryStore = {};

const isLocalStorageSupported = (() => {
  try {
    const key = "__test_storage_support__";
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
})();

const isSessionStorageSupported = (() => {
  try {
    const key = "__test_session_storage_support__";
    window.sessionStorage.setItem(key, key);
    window.sessionStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
})();

export const safeStorage = {
  getItem(key) {
    try {
      if (isLocalStorageSupported) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("safeStorage.getItem failed for key:", key, e);
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : null;
  },

  setItem(key, value) {
    try {
      if (isLocalStorageSupported) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn("safeStorage.setItem failed for key:", key, e);
    }
    memoryStore[key] = String(value);
  },

  removeItem(key) {
    try {
      if (isLocalStorageSupported) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn("safeStorage.removeItem failed for key:", key, e);
    }
    delete memoryStore[key];
  },

  clear() {
    try {
      if (isLocalStorageSupported) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn("safeStorage.clear failed", e);
    }
    for (const key in memoryStore) {
      delete memoryStore[key];
    }
  },

  key(index) {
    try {
      if (isLocalStorageSupported) {
        return window.localStorage.key(index);
      }
    } catch (e) {
      console.warn("safeStorage.key failed for index:", index, e);
    }
    return Object.keys(memoryStore)[index] || null;
  },

  get length() {
    try {
      if (isLocalStorageSupported) {
        return window.localStorage.length;
      }
    } catch (e) {
      console.warn("safeStorage.length access failed", e);
    }
    return Object.keys(memoryStore).length;
  }
};

export const safeSessionStorage = {
  getItem(key) {
    try {
      if (isSessionStorageSupported) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn("safeSessionStorage.getItem failed for key:", key, e);
    }
    return sessionMemoryStore[key] !== undefined ? sessionMemoryStore[key] : null;
  },

  setItem(key, value) {
    try {
      if (isSessionStorageSupported) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn("safeSessionStorage.setItem failed for key:", key, e);
    }
    sessionMemoryStore[key] = String(value);
  },

  removeItem(key) {
    try {
      if (isSessionStorageSupported) {
        window.sessionStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn("safeSessionStorage.removeItem failed for key:", key, e);
    }
    delete sessionMemoryStore[key];
  },

  clear() {
    try {
      if (isSessionStorageSupported) {
        window.sessionStorage.clear();
        return;
      }
    } catch (e) {
      console.warn("safeSessionStorage.clear failed", e);
    }
    for (const key in sessionMemoryStore) {
      delete sessionMemoryStore[key];
    }
  },

  key(index) {
    try {
      if (isSessionStorageSupported) {
        return window.sessionStorage.key(index);
      }
    } catch (e) {
      console.warn("safeSessionStorage.key failed for index:", index, e);
    }
    return Object.keys(sessionMemoryStore)[index] || null;
  },

  get length() {
    try {
      if (isSessionStorageSupported) {
        return window.sessionStorage.length;
      }
    } catch (e) {
      console.warn("safeSessionStorage.length access failed", e);
    }
    return Object.keys(sessionMemoryStore).length;
  }
};
