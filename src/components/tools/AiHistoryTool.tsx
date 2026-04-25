// Offline history of AI Q&A — students can re-read past answers without internet.
import { useEffect, useState } from 'react';
import { History, Trash2, Volume2, VolumeX, WifiOff, X } from 'lucide-react';
import { aiCache, type CachedAnswer } from '@/lib/aiCache';

const AiHistoryTool = () => {
  const [items, setItems] = useState<CachedAnswer[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const refresh = () => setItems(aiCache.list());
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

  const remove = (id: string) => { aiCache.remove(id); refresh(); };
  const clearAll = () => {
    if (confirm('Delete all saved answers?')) { aiCache.clear(); refresh(); }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <History className="w-4 h-4 text-primary" />
          <span className="font-semibold">Saved AI answers</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
            <WifiOff className="w-3 h-3" />Works offline
          </span>
          {items.length > 0 && (
            <button onClick={clearAll} className="text-[10px] text-destructive bg-destructive/10 px-2 py-1 rounded-full">
              Clear all
            </button>
          )}
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <History className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-xs text-muted-foreground mt-2">
            Answers from Ask AI and Live Camera are saved here automatically.<br />
            They stay on your phone and work without internet.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const isOpen = open === item.id;
          const isSpeak = speakingId === item.id;
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : item.id)} className="w-full text-left p-3">
                <p className="text-[10px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="text-sm font-medium line-clamp-2 mt-0.5">{item.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
              </button>

              {isOpen && (
                <div className="border-t border-border px-3 pb-3 pt-2 space-y-2">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 relative">
                    <p className="text-[10px] text-muted-foreground">Answer</p>
                    <p className="text-sm font-semibold pr-7">{item.answer}</p>
                    <button
                      onClick={() => (isSpeak ? stopSpeak() : speak(item.id, item.answer))}
                      className="absolute top-1 right-1 p-1 rounded-md bg-background/80"
                    >
                      {isSpeak ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {item.steps && item.steps.length > 0 && (
                    <div className="bg-muted rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground mb-1">Steps</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs">
                        {item.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="flex items-center gap-1 text-[11px] text-destructive bg-destructive/10 px-2 py-1 rounded-md"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiHistoryTool;
