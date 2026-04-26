// Chat history for AI Q+A — stored locally so students can re-read past chats.
// Messages are grouped into "chats" (topics). Each chat keeps a running
// conversation. The active chat id is tracked so new messages append to it.

const MSG_KEY = 'g9hub:ai-cache:v1';      // legacy flat list (kept for migration)
const CHAT_KEY = 'g9hub:ai-chats:v1';
const ACTIVE_KEY = 'g9hub:ai-chat-active:v1';
const MAX_CHATS = 50;
const MAX_MSGS_PER_CHAT = 100;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  steps?: string[];
  plot?: unknown;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;          // derived from first user question / topic
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

// Legacy flat-list shape — used only for one-time migration.
interface LegacyEntry {
  id: string;
  question: string;
  answer: string;
  steps?: string[];
  plot?: unknown;
  createdAt: number;
}

const safeReadChats = (): ChatThread[] => {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as ChatThread[];
    }
    // One-time migration from old flat cache.
    const legacy = localStorage.getItem(MSG_KEY);
    if (legacy) {
      const list: LegacyEntry[] = JSON.parse(legacy);
      if (Array.isArray(list) && list.length) {
        const migrated: ChatThread[] = list.map((e) => ({
          id: `migr-${e.id}`,
          title: shortenTitle(e.question),
          createdAt: e.createdAt,
          updatedAt: e.createdAt,
          messages: [
            { id: `${e.id}-q`, role: 'user', text: e.question, createdAt: e.createdAt },
            { id: `${e.id}-a`, role: 'assistant', text: e.answer, steps: e.steps, plot: e.plot, createdAt: e.createdAt + 1 },
          ],
        }));
        localStorage.setItem(CHAT_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return [];
  } catch {
    return [];
  }
};

const safeWriteChats = (chats: ChatThread[]) => {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
  } catch { /* quota */ }
};

const shortenTitle = (s: string) => {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length > 60 ? t.slice(0, 57) + '…' : t || 'New chat';
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const aiChat = {
  list(): ChatThread[] {
    return safeReadChats().sort((a, b) => b.updatedAt - a.updatedAt);
  },
  get(id: string): ChatThread | undefined {
    return safeReadChats().find((c) => c.id === id);
  },
  getActiveId(): string | null {
    try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
  },
  setActiveId(id: string | null) {
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* noop */ }
  },
  create(firstQuestion?: string): ChatThread {
    const now = Date.now();
    const chat: ChatThread = {
      id: newId(),
      title: firstQuestion ? shortenTitle(firstQuestion) : 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    const next = [chat, ...safeReadChats()];
    safeWriteChats(next);
    aiChat.setActiveId(chat.id);
    return chat;
  },
  /** Append a Q+A pair to a chat (creating one if needed). Returns the chat id. */
  appendQA(input: {
    chatId?: string | null;
    question: string;
    answer: string;
    steps?: string[];
    plot?: unknown;
  }): string {
    const list = safeReadChats();
    let chat = input.chatId ? list.find((c) => c.id === input.chatId) : undefined;
    if (!chat) {
      chat = {
        id: newId(),
        title: shortenTitle(input.question),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      list.unshift(chat);
    }
    const now = Date.now();
    chat.messages.push(
      { id: newId(), role: 'user', text: input.question, createdAt: now },
      { id: newId(), role: 'assistant', text: input.answer, steps: input.steps, plot: input.plot, createdAt: now + 1 },
    );
    chat.messages = chat.messages.slice(-MAX_MSGS_PER_CHAT);
    chat.updatedAt = now + 1;
    if (chat.title === 'New chat' || !chat.title) chat.title = shortenTitle(input.question);
    safeWriteChats(list);
    aiChat.setActiveId(chat.id);
    return chat.id;
  },
  rename(id: string, title: string) {
    const list = safeReadChats();
    const c = list.find((x) => x.id === id);
    if (c) { c.title = shortenTitle(title); safeWriteChats(list); }
  },
  remove(id: string) {
    safeWriteChats(safeReadChats().filter((c) => c.id !== id));
    if (aiChat.getActiveId() === id) aiChat.setActiveId(null);
  },
  clear() {
    try { localStorage.removeItem(CHAT_KEY); localStorage.removeItem(ACTIVE_KEY); } catch { /* noop */ }
  },
};

// --- Backwards-compatible shim ----------------------------------------------
// Existing callers used `aiCache.save({ question, answer, steps, plot })`.
// Forward those calls into the new chat-thread store so nothing breaks.
export interface CachedAnswer {
  id: string;
  question: string;
  answer: string;
  steps?: string[];
  plot?: unknown;
  createdAt: number;
}

export const aiCache = {
  save(entry: Omit<CachedAnswer, 'id' | 'createdAt'>) {
    aiChat.appendQA({
      chatId: aiChat.getActiveId(),
      question: entry.question,
      answer: entry.answer,
      steps: entry.steps,
      plot: entry.plot,
    });
  },
  list(): CachedAnswer[] {
    // Flatten chat messages to legacy Q+A pairs (newest first).
    const out: CachedAnswer[] = [];
    for (const chat of aiChat.list()) {
      for (let i = 0; i < chat.messages.length - 1; i++) {
        const q = chat.messages[i];
        const a = chat.messages[i + 1];
        if (q.role === 'user' && a.role === 'assistant') {
          out.push({
            id: a.id,
            question: q.text,
            answer: a.text,
            steps: a.steps,
            plot: a.plot,
            createdAt: a.createdAt,
          });
          i++;
        }
      }
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
  remove(_id: string) { /* legacy no-op; manage via aiChat */ },
  clear() { aiChat.clear(); },
};
