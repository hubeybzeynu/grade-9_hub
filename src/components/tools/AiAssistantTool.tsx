// AI Chat — text conversation with the tutor.
// Features: chat bubbles, voice input (mic), image attach, TTS, View Graph button.
// All Q+A pairs are appended to the active chat thread (shared with Live Chat).
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Loader2, Send, Mic, MicOff, Paperclip, X,
  Volume2, VolumeX, ImageIcon, BarChart3, MessageSquarePlus,
} from 'lucide-react';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';
import { aiChat, type ChatMessage } from '@/lib/aiCache';
import GraphViewerModal from './GraphViewerModal';

type SR = any;

const AiAssistantTool = () => {
  const [chatId, setChatId] = useState<string | null>(() => aiChat.getActiveId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [graphMsg, setGraphMsg] = useState<ChatMessage | null>(null);

  const recognitionRef = useRef<SR | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);
  const lastCountRef = useRef(0);
  const stickToBottomRef = useRef(true);

  // --- Load + keep in sync with shared chat store -------------------------
  const loadChat = (id: string | null) => {
    if (!id) { setMessages([]); return; }
    const c = aiChat.get(id);
    setMessages(c?.messages ?? []);
  };

  useEffect(() => {
    // Make sure we have an active chat id.
    let id = aiChat.getActiveId();
    if (!id) {
      const c = aiChat.create();
      id = c.id;
    }
    setChatId(id);
    loadChat(id);
    // Light polling so messages added by Live Chat appear here too.
    pollRef.current = window.setInterval(() => {
      const cur = aiChat.getActiveId();
      if (cur && cur !== chatId) {
        setChatId(cur);
        loadChat(cur);
      } else if (cur) {
        const c = aiChat.get(cur);
        if (c && c.messages.length !== messages.length) setMessages(c.messages);
      }
    }, 1500);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll only when the user is already pinned to the bottom AND a NEW
  // message arrived. Don't fight the user when they scroll up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const grew = messages.length > lastCountRef.current;
    lastCountRef.current = messages.length;
    if (grew && stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Track whether the user is at the bottom; only then auto-scroll on new msgs.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance < 80;
  };

  // Stop TTS on unmount.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Pre-warm voices.
  useEffect(() => {
    const sy = window.speechSynthesis;
    if (!sy) return;
    sy.getVoices();
    const onChange = () => sy.getVoices();
    sy.addEventListener?.('voiceschanged', onChange);
    return () => sy.removeEventListener?.('voiceschanged', onChange);
  }, []);

  const pickMaleVoice = (): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
    const pool = en.length ? en : voices;
    const malePatterns = [
      /male/i, /\bdaniel\b/i, /\bdavid\b/i, /\bfred\b/i, /\balex\b/i,
      /\bgoogle uk english male\b/i, /\bgoogle us english\b/i,
      /\baaron\b/i, /\barthur\b/i, /\brishi\b/i,
    ];
    for (const re of malePatterns) {
      const v = pool.find((v) => re.test(v.name));
      if (v) return v;
    }
    return pool[0] ?? null;
  };

  // --- Voice (single utterance → fills the draft) -------------------------
  const startRecording = () => {
    const SRClass: SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      alert('Voice input is not supported on this browser. Try Chrome on Android.');
      return;
    }
    const rec: SR = new SRClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      let final = '';
      let live = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else live += t;
      }
      if (final) setDraft((p) => (p ? p + ' ' : '') + final.trim());
      setInterim(live);
    };
    rec.onend = () => { setRecording(false); setInterim(''); };
    rec.onerror = () => { setRecording(false); setInterim(''); };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };
  const stopRecording = () => { recognitionRef.current?.stop(); setRecording(false); };

  // --- TTS (male voice) -----------------------------------------------------
  const speak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickMaleVoice();
    if (v) u.voice = v;
    u.rate = 1; u.pitch = 0.85;
    u.onstart = () => setSpeakingId(id);
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
  };
  const stopSpeak = () => { window.speechSynthesis?.cancel(); setSpeakingId(null); };

  // --- Image attach ---------------------------------------------------------
  const onPickImage = (file: File) => {
    if (file.size > 6 * 1024 * 1024) { alert('Image too large (max 6 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- New chat -------------------------------------------------------------
  const newChat = () => {
    stopSpeak();
    const c = aiChat.create();
    setChatId(c.id);
    setMessages([]);
    setDraft('');
    setImageBase64(null);
  };

  // --- Send -----------------------------------------------------------------
  const send = async () => {
    const q = draft.trim();
    if (!q && !imageBase64) return;
    setLoading(true);
    stopSpeak();

    // Optimistic user bubble.
    const tempUser: ChatMessage = {
      id: `tmp-${Date.now()}`, role: 'user', text: q || '(image)', createdAt: Date.now(),
    };
    setMessages((m) => [...m, tempUser]);
    const sentImage = imageBase64;
    setDraft(''); setImageBase64(null); setInterim('');

    try {
      const { data, error } = await cloudSupabase.functions.invoke('ai-solve', {
        body: { question: q, imageBase64: sentImage },
      });
      if (error) throw error;
      const answer = (data?.answer as string) || 'Sorry, I could not find an answer.';
      const id = aiChat.appendQA({
        chatId,
        question: q || '(image)',
        answer,
        steps: data?.steps,
        plot: data?.plot,
      });
      setChatId(id);
      loadChat(id);
    } catch (e) {
      const msg = (e as Error).message || 'Could not reach AI.';
      setMessages((m) => [...m, {
        id: `err-${Date.now()}`, role: 'assistant',
        text: `Error: ${msg}`, createdAt: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const examples = useMemo(() => [
    'Solve x² - 5x + 6 = 0',
    'Plot f(x) = sin(x) + x/3',
    'Molar mass of Ca(OH)₂',
    'Right triangle: A = 30°, hyp = 20',
  ], []);

  return (
    <div className="flex flex-col h-[80vh] md:h-[75vh] bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">AI Chat</p>
            <p className="text-[10px] text-muted-foreground">Ask anything · voice · image</p>
          </div>
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2.5 py-1.5 rounded-full border border-primary/20"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 overscroll-contain">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center text-center pt-6 pb-3 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">How can I help today?</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Type, speak, or attach an image. Your chat is saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center pt-2 max-w-xs">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDraft(ex)}
                  className="px-2.5 py-1 rounded-full bg-muted text-[11px] text-muted-foreground active:bg-accent"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isSpeak = speakingId === m.id;
          const hasPlot = !!m.plot;
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] ${isUser ? 'order-2' : ''}`}>
                <div
                  className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-br from-primary to-cyan-600 text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border/70 rounded-bl-md pr-9'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  {!isUser && (
                    <button
                      onClick={() => (isSpeak ? stopSpeak() : speak(m.id, m.text))}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/80 hover:bg-background"
                      title={isSpeak ? 'Stop' : 'Read aloud'}
                    >
                      {isSpeak ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Steps */}
                {!isUser && m.steps && m.steps.length > 0 && (
                  <div className="mt-2 ml-1 bg-muted/60 rounded-xl p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Steps</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      {m.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}

                {/* Open graph in modal */}
                {!isUser && hasPlot && (
                  <div className="mt-2 ml-1">
                    <button
                      onClick={() => setGraphMsg(m)}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 active:scale-95"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> View graph
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/70 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 p-2.5 space-y-2 bg-background/95 backdrop-blur">
        {imageBase64 && (
          <div className="relative inline-block">
            <img src={imageBase64} alt="Attached" className="max-h-20 rounded-lg border border-border" />
            <button
              onClick={() => setImageBase64(null)}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1.5 bg-muted rounded-2xl p-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-9 h-9 rounded-xl bg-background flex items-center justify-center text-muted-foreground active:bg-accent"
            title="Attach image"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])}
          />

          <textarea
            value={draft + (interim ? ` ${interim}` : '')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={recording ? 'Listening…' : 'Message AI…'}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm py-2 px-1 max-h-32"
          />

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              recording
                ? 'bg-destructive text-destructive-foreground animate-pulse'
                : 'bg-background text-muted-foreground active:bg-accent'
            }`}
            title={recording ? 'Stop voice' : 'Voice input'}
          >
            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={send}
            disabled={loading || (!draft.trim() && !imageBase64)}
            className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95"
            title="Send"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {graphMsg && (
        <GraphViewerModal plot={graphMsg.plot} onClose={() => setGraphMsg(null)} />
      )}
    </div>
  );
};

export default AiAssistantTool;
