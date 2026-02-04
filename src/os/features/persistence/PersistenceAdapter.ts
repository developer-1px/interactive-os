export interface PersistenceAdapter {
  save(key: string, data: any): void;
  load(key: string): any;
}

export const LocalStorageAdapter: PersistenceAdapter = {
  save: (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Persistence Save Failed", e);
    }
  },
  load: (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Persistence Load Failed", e);
        return null;
    }
  }
};