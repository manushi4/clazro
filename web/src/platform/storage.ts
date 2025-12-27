const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage setItem failed');
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('localStorage removeItem failed');
    }
  },

  async getAllKeys(): Promise<string[]> {
    return Object.keys(localStorage);
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map(key => [key, localStorage.getItem(key)]);
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    keyValuePairs.forEach(([key, value]) => localStorage.setItem(key, value));
  },

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => localStorage.removeItem(key));
  },

  async clear(): Promise<void> {
    localStorage.clear();
  },
};

export default storage;
