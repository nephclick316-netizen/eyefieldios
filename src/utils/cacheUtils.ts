export const cacheUtils = {
    async set(key: string, value: any) {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, JSON.stringify(value));
    },

    async get<T>(key: string): Promise<T | null> {
        if (typeof window === 'undefined') return null;
        const value = window.localStorage.getItem(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch (e) {
            console.error(`Failed to parse cache for key ${key}`, e);
            return null;
        }
    },

    async remove(key: string) {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
    },

    async removeByPredicate(keyPrefix: string, filterFn: (item: any) => boolean) {
        if (typeof window === 'undefined') return;
        try {
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && key.startsWith(keyPrefix)) {
                    const value = window.localStorage.getItem(key);
                    if (value) {
                        const parsed = JSON.parse(value);
                        if (Array.isArray(parsed)) {
                            const filtered = parsed.filter(filterFn);
                            window.localStorage.setItem(key, JSON.stringify(filtered));
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Cache filtering failed', e);
        }
    },

    async clear() {
        if (typeof window === 'undefined') return;
        window.localStorage.clear();
    }
};
