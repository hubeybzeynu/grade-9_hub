// Offline cache for AI Q+A pairs.
// Stored in localStorage so students can re-read past answers without internet.

const KEY = 'g9hub:ai-cache:v1';
const MAX_ENTRIES = 100;

export interface CachedAnswer {
  id: string;
  question: string;
  answer: string;
  steps?: string[];
  plot?: unknown;
  createdAt: number;
}

const safeRead = (): CachedAnswer[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const safeWrite = (list: CachedAnswer[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ENTRIES))); } catch { /* quota */ }
};

export const aiCache = {
  list(): CachedAnswer[] {
    return safeRead().sort((a, b) => b.createdAt - a.createdAt);
  },
  save(entry: Omit<CachedAnswer, 'id' | 'createdAt'>): CachedAnswer {
    const item: CachedAnswer = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    const next = [item, ...safeRead().filter((e) => e.question !== entry.question)];
    safeWrite(next);
    return item;
  },
  remove(id: string) {
    safeWrite(safeRead().filter((e) => e.id !== id));
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
  },
};
