const STORAGE_PREFIX = 'spelling-bee';

export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}:${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key: string, value: any) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};