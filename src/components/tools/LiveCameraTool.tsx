// Live Chat — Gemini-Live style.
// Flow:
//   1. User taps "Start". Camera opens (rear by default) and the mic starts
//      continuously listening with a beautiful aurora visualisation.
//   2. When the user finishes a sentence, we capture the current frame and
//      send transcript + frame to ai-solve.
//   3. The reply is spoken aloud (TTS). It is NOT shown on the live stage —
//      instead the Q+A is appended to the shared chat thread so it appears
//      under the "AI Chat" tab.
import { useEffect, useRef, useState } from 'react';
import {
  Camera, Mic, MicOff, Loader2, Volume2, VolumeX, RefreshCw, X, Sparkles, MessageSquare,
} from 'lucide-react';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';
import { aiChat } from '@/lib/aiCache';

type SR = any;

const LiveCameraTool = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SR | null>(null);
  const inflightRef = useRef(false);
  const chatIdRef = useRef<string | null>(null);
  const liveOnRef = useRef(false);

  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [liveOn, setLiveOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [interim, setInterim] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { liveOnRef.current = liveOn; }, [liveOn]);

  // Use the active chat thread (shared with AI Chat). Create one if needed.
  useEffect(() => {
    if (liveOn && !chatIdRef.current) {
      chatIdRef.current = aiChat.getActiveId() ?? aiChat.create('Live chat').id;
    }
  }, [liveOn]);

  useEffect(() => () => stopAll(), []);

  // --- Camera ---------------------------------------------------------------
  const openCamera = async (face: 'environment' | 'user') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => undefined);
    }
  };
  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // --- Voice (continuous) ---------------------------------------------------
  const startListening = () => {
    const SRClass: SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      setError('Voice input is not supported on this browser. Try Chrome on Android.');
      return;
    }
    const rec: SR = new SRClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      let live = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const finalText = t.trim();
          if (finalText) handleFinalQuery(finalText);
        } else {
          live += t;
        }
      }
      setInterim(live);
    };
    rec.onerror = () => { /* keep silent */ };
    rec.onend = () => {
      if (liveOnRef.current) { try { rec.start(); } catch { /* already started */ } }
      setInterim('');
    };
    try { rec.start(); } catch { /* noop */ }
    recognitionRef.current = rec;
  };
  const stopListening = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec?.stop?.(); } catch { /* noop */ }
    setInterim('');
  };

  // --- TTS ------------------------------------------------------------------
  const speak = (text: string) => {
    if (mutedRef.current || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };
  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  // --- Frame capture --------------------------------------------------------
  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // --- Ask AI (auto-triggered when the user finishes a sentence) -----------
  const handleFinalQuery = async (question: string) => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    stopSpeaking();
    setThinking(true);
    const frame = captureFrame();
    try {
      const { data, error } = await cloudSupabase.functions.invoke('ai-solve', {
        body: { question, imageBase64: frame ?? undefined },
      });
      if (error) throw error;
      const answer = (data?.answer as string) || 'Sorry, I could not find an answer.';
      const id = aiChat.appendQA({
        chatId: chatIdRef.current,
        question, answer,
        steps: data?.steps, plot: data?.plot,
      });
      chatIdRef.current = id;
      // Toast: "Sent to AI Chat"
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      // Speak the answer.
      speak(answer);
    } catch (e) {
      const msg = (e as Error).message || 'Could not reach AI.';
      speak(`Sorry: ${msg}`);
    } finally {
      setThinking(false);
      inflightRef.current = false;
    }
  };

  // --- Master start/stop ----------------------------------------------------
  const startLive = async () => {
    setError(null);
    try {
      await openCamera(facing);
      setLiveOn(true);
      setTimeout(() => startListening(), 200);
    } catch (e) {
      setError((e as Error).message || 'Could not start camera/mic. Please grant permissions.');
      setLiveOn(false);
    }
  };
  const stopAll = () => {
    setLiveOn(false);
    liveOnRef.current = false;
    stopListening();
    stopSpeaking();
    closeCamera();
  };
  const flipCamera = async () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    if (liveOn) {
      closeCamera();
      try { await openCamera(next); } catch (e) { setError((e as Error).message); }
    }
  };

  // Visual state for the aurora glow.
  const auroraState = thinking ? 'thinking' : speaking ? 'speaking' : recognitionRef.current ? 'listening' : 'idle';

  return (
    <div className="p-3">
      {/* Stage */}
      <div
        className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[3/4] sm:aspect-[4/3]"
        style={{ background: '#05060a' }}
      >
        {/* Live camera */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            liveOn ? 'opacity-95' : 'opacity-0'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Aurora glow — colour shifts with state */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background:
              auroraState === 'thinking'
                ? 'radial-gradient(120% 80% at 50% 100%, hsl(45 100% 55% / 0.45) 0%, hsl(20 95% 50% / 0.35) 35%, hsl(0 0% 4% / 0.7) 70%)'
                : auroraState === 'speaking'
                ? 'radial-gradient(120% 80% at 50% 100%, hsl(160 90% 45% / 0.5) 0%, hsl(195 90% 45% / 0.35) 35%, hsl(0 0% 4% / 0.7) 70%)'
                : auroraState === 'listening'
                ? 'radial-gradient(120% 80% at 50% 100%, hsl(220 90% 50% / 0.5) 0%, hsl(265 90% 40% / 0.4) 35%, hsl(0 0% 4% / 0.7) 70%)'
                : 'radial-gradient(120% 80% at 50% 100%, hsl(220 30% 30% / 0.4) 0%, hsl(0 0% 4% / 0.85) 70%)',
          }}
        />
        {/* Vignette for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

        {/* Top status bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white/90 text-[11px]">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">Live AI</span>
            {liveOn && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          {liveOn && (
            <button
              onClick={flipCamera}
              className="bg-black/40 backdrop-blur p-1.5 rounded-full border border-white/10"
              title="Flip camera"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>

        {/* Idle state */}
        {!liveOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white text-center px-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-violet-500 to-fuchsia-500 blur-2xl opacity-60" />
              <div className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Camera className="w-8 h-8" />
              </div>
            </div>
            <p className="text-sm font-semibold mt-2">Point, ask, listen</p>
            <p className="text-[11px] text-white/70 max-w-[260px]">
              Just talk. I&apos;ll watch what you show me, answer with my voice,
              and save the chat to your AI Chat.
            </p>
            {error && (
              <p className="text-[11px] text-red-300 bg-red-500/10 px-2 py-1 rounded-md">{error}</p>
            )}
          </div>
        )}

        {/* Live transcript / status pill */}
        {liveOn && (
          <div className="absolute inset-x-3 bottom-24 flex justify-center pointer-events-none">
            <div className="px-3.5 py-2 rounded-full bg-black/55 backdrop-blur text-white text-[12px] flex items-center gap-2 max-w-full border border-white/10 shadow-lg">
              {thinking ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</>
              ) : speaking ? (
                <><Volume2 className="w-3.5 h-3.5" /> Speaking…</>
              ) : interim ? (
                <span className="truncate max-w-[260px]">{interim}</span>
              ) : (
                <><Mic className="w-3.5 h-3.5 text-emerald-400" /> Listening…</>
              )}
            </div>
          </div>
        )}

        {/* "Sent to AI Chat" toast */}
        {savedToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-[11px] flex items-center gap-1.5 shadow-lg animate-fade-in">
            <MessageSquare className="w-3 h-3" /> Saved to AI Chat
          </div>
        )}

        {/* Bottom control dock */}
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
          {!liveOn ? (
            <button
              onClick={startLive}
              className="px-5 py-3 rounded-full bg-white text-black text-sm font-semibold shadow-2xl flex items-center gap-2 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" /> Start Live
            </button>
          ) : (
            <>
              <button
                onClick={() => setMuted((m) => !m)}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur border border-white/15 transition ${
                  muted ? 'bg-white/10 text-white/70' : 'bg-white/20 text-white'
                }`}
                title={muted ? 'Unmute voice' : 'Mute voice'}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={stopAll}
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl active:scale-95 transition border-2 border-white/20"
                title="End"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  if (recognitionRef.current) stopListening();
                  else startListening();
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur border border-white/15 transition ${
                  recognitionRef.current ? 'bg-emerald-500/90 text-white' : 'bg-white/10 text-white/70'
                }`}
                title={recognitionRef.current ? 'Pause mic' : 'Resume mic'}
              >
                {recognitionRef.current ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Just talk — your conversation is automatically saved to <b>AI Chat</b>.
      </p>
    </div>
  );
};

export default LiveCameraTool;
