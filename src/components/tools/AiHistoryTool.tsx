// Saved chats — each chat groups all messages on the same topic.
// Tap a chat to read its messages; long-press / delete to remove it.
import { useEffect, useState } from 'react';
import { History, Trash2, Volume2, VolumeX, ChevronLeft, MessageSquarePlus, Pencil, BarChart3 } from 'lucide-react';
import { aiChat, type ChatThread } from '@/lib/aiCache';
import PlotRenderer from './PlotRenderer';

const AiHistoryTool = () => {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [graphOpenId, setGraphOpenId] = useState<string | null>(null);

  const refresh = () => setChats(aiChat.list());
  useEffect(() => { refresh(); }, []);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeakingId(id);
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
  };
  const stopSpeak = () => { window.speechSynthesis?.cancel(); setSpeakingId(null); };

  const removeChat = (id: string) => {
    if (!confirm('Delete this chat?')) return;
    aiChat.remove(id); refresh();
    if (openId === id) setOpenId(null);
  };
  const clearAll = () => {
    if (!confirm('Delete all chats?')) return;
    aiChat.clear(); refresh(); setOpenId(null);
  };
  const newChat = () => {
    const c = aiChat.create();
    refresh();
    setOpenId(c.id);
  };
  const rename = (id: string, current: string) => {
    const t = prompt('Rename chat', current);
    if (t && t.trim()) { aiChat.rename(id, t.trim()); refresh(); }
  };

  const open = openId ? chats.find((c) => c.id === openId) : null;

  // ---------- Detail view ----------
  if (open) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { stopSpeak(); setOpenId(null); }}
            className="p-1.5 rounded-lg bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{open.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(open.updatedAt).toLocaleString()} · {open.messages.length} messages
            </p>
          </div>
          <button
            onClick={() => rename(open.id, open.title)}
            className="p-1.5 rounded-lg bg-muted"
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => removeChat(open.id)}
            className="p-1.5 rounded-lg bg-destructive/10 text-destructive"
            title="Delete chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {open.messages.map((m) => {
            const isSpeak = speakingId === m.id;
            return (
              <div
                key={m.id}
                className={`relative rounded-2xl px-3 py-2 text-sm max-w-[90%] ${
                  m.role === 'user'
                    ? 'ml-auto bg-muted'
                    : 'mr-auto bg-primary/10 border border-primary/20 pr-9'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => (isSpeak ? stopSpeak() : speak(m.id, m.text))}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80"
                    title={isSpeak ? 'Stop' : 'Read aloud'}
                  >
                    {isSpeak ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
                {m.role === 'assistant' && m.steps && m.steps.length > 0 && (
                  <div className="mt-2 bg-background/60 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Steps</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      {m.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
                {m.role === 'assistant' && m.plot && (
                  <div className="mt-2">
                    <button
                      onClick={() => setGraphOpenId(graphOpenId === m.id ? null : m.id)}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      <BarChart3 className="w-3 h-3" />
                      {graphOpenId === m.id ? 'Hide graph' : 'View graph'}
                    </button>
                    {graphOpenId === m.id && (
                      <div className="mt-2 rounded-lg border border-border/60 bg-background/80 p-2">
                        <PlotRenderer plot={m.plot} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {open.messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              This chat is empty. Open Ask AI or Live and start asking — your messages will be saved here.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------- List view ----------
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <History className="w-4 h-4 text-primary" />
          <span className="font-semibold">Chats</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={newChat}
            className="flex items-center gap-1 text-[11px] bg-primary text-primary-foreground px-2 py-1 rounded-full"
          >
            <MessageSquarePlus className="w-3 h-3" /> New
          </button>
          {chats.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[11px] text-destructive bg-destructive/10 px-2 py-1 rounded-full"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {chats.length === 0 && (
        <div className="text-center py-12">
          <History className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-xs text-muted-foreground mt-2">
            No chats yet.<br />
            Start a conversation in <b>Ask AI</b> or <b>Live</b> — every topic is saved here.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {chats.map((c) => {
          const last = c.messages[c.messages.length - 1];
          return (
            <button
              key={c.id}
              onClick={() => { aiChat.setActiveId(c.id); setOpenId(c.id); }}
              className="w-full text-left bg-card border border-border rounded-xl p-3 active:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate flex-1">{c.title}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {last && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  <span className="font-medium">{last.role === 'user' ? 'You: ' : 'AI: '}</span>
                  {last.text}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{c.messages.length} messages</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AiHistoryTool;
