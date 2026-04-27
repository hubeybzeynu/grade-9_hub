// Live Chat — Gemini-Live style with reliable capture + manual voice/image.
// Improvements over previous version:
//  • Auto-capture works even when speech recognition stalls (silence-timer fallback).
//  • Manual capture button (snap & ask) for when user wants explicit control.
//  • Manual image picker (gallery upload) — same Q&A flow.
//  • Voice toggle is large + obvious; deep male TTS voice when available.
//  • All Q+A still appended to the shared AI Chat thread.
import { useEffect, useRef, useState } from 'react';
import {
  Camera, Mic, MicOff, Loader2, Volume2, VolumeX, RefreshCw, X, Sparkles,
  MessageSquare, ImagePlus, Aperture,
} from 'lucide-react';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';
import { aiChat } from '@/lib/aiCache';

type SR = any;

// Pick a deeper male voice for TTS when available across platforms.
const pickMaleVoice = (): SpeechSynthesisVoice | null => {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = en.length ? en : voices;
  // Common male voice names across Chrome/Android/iOS.
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

const LiveCameraTool = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SR | null>(null);
  const inflightRef = useRef(false);
  const chatIdRef = useRef<string | null>(null);
  const liveOnRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef('');

  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [liveOn, setLiveOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [interim, setInterim] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);

  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { liveOnRef.current = liveOn; }, [liveOn]);

  // Pre-warm voices list (some browsers populate async).
  useEffect(() => {
    const sy = window.speechSynthesis;
    if (!sy) return;
    sy.getVoices();
    const onChange = () => sy.getVoices();
    sy.addEventListener?.('voiceschanged', onChange);
    return () => sy.removeEventListener?.('voiceschanged', onChange);
  }, []);

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

  // --- Voice (continuous w/ silence-timer fallback) ------------------------
  const clearSilence = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };
  const armSilence = () => {
    clearSilence();
    silenceTimerRef.current = window.setTimeout(() => {
      const text = lastTranscriptRef.current.trim();
      if (text) {
        lastTranscriptRef.current = '';
        setInterim('');
        handleFinalQuery(text);
      }
    }, 1400);
  };

  const startListening = () => {
    const SRClass: SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      setError('Voice input is not supported on this browser. Use Chrome on Android.');
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
          if (finalText) {
            clearSilence();
            lastTranscriptRef.current = '';
            setInterim('');
            handleFinalQuery(finalText);
          }
        } else {
          live += t;
        }
      }
      if (live) {
        lastTranscriptRef.current = live;
        setInterim(live);
        armSilence();
      }
    };
    rec.onerror = () => { /* keep silent — onend will restart */ };
    rec.onend = () => {
      setListening(false);
      if (liveOnRef.current && recognitionRef.current === rec) {
        try { rec.start(); setListening(true); } catch { /* already started */ }
      }
      setInterim('');
    };
    try { rec.start(); setListening(true); } catch { /* noop */ }
    recognitionRef.current = rec;
  };
  const stopListening = () => {
    clearSilence();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec?.stop?.(); } catch { /* noop */ }
    setListening(false);
    setInterim('');
  };

  // --- TTS (male voice) -----------------------------------------------------
  const speak = (text: string) => {
    if (mutedRef.current || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickMaleVoice();
    if (v) u.voice = v;
    u.rate = 1; u.pitch = 0.85; // slightly lower pitch = more masculine
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
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // --- Ask AI ---------------------------------------------------------------
  const handleFinalQuery = async (question: string, overrideImage?: string | null) => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    stopSpeaking();
    setThinking(true);
    const frame = overrideImage !== undefined ? overrideImage : captureFrame();
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
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      speak(answer);
    } catch (e) {
      const msg = (e as Error).message || 'Could not reach AI.';
      speak(`Sorry: ${msg}`);
    } finally {
      setThinking(false);
      inflightRef.current = false;
    }
  };

  // Manual: snap a frame now and ask a default question.
  const snapAndAsk = () => {
    const frame = captureFrame();
    if (!frame) { setError('No camera frame yet. Wait a moment.'); return; }
    handleFinalQuery('Look at this image and explain what you see. Solve any question shown.', frame);
  };

  // Manual: gallery upload (no camera needed).
  const onPickImage = (file: File) => {
    if (file.size > 8 * 1024 * 1024) { setError('Image too large (max 8 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      handleFinalQuery('Explain this image and solve any question in it.', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- Master start/stop ----------------------------------------------------
  const startLive = async () => {
    setError(null);
    try {
      await openCamera(facing);
      setLiveOn(true);
      setTimeout(() => startListening(), 250);
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

  const auroraState = thinking ? 'thinking' : speaking ? 'speaking' : listening ? 'listening' : 'idle';

  return (
    <div className="p-3">
      <div
        className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[3/4] sm:aspect-[4/3]"
        style={{ background: '#05060a' }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            liveOn ? 'opacity-95' : 'opacity-0'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Aurora glow */}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white/90 text-[11px]">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">Live AI</span>
            {liveOn && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
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

        {/* Idle screen */}
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
              Just talk — I&apos;ll watch what you show me, answer with my voice,
              and save the chat to your AI Chat.
            </p>
            {error && (
              <p className="text-[11px] text-red-300 bg-red-500/10 px-2 py-1 rounded-md">{error}</p>
            )}
          </div>
        )}

        {/* Status pill */}
        {liveOn && (
          <div className="absolute inset-x-3 bottom-28 flex justify-center pointer-events-none">
            <div className="px-3.5 py-2 rounded-full bg-black/60 backdrop-blur text-white text-[12px] flex items-center gap-2 max-w-full border border-white/10 shadow-lg">
              {thinking ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</>
              ) : speaking ? (
                <><Volume2 className="w-3.5 h-3.5" /> Speaking…</>
              ) : interim ? (
                <span className="truncate max-w-[260px]">{interim}</span>
              ) : listening ? (
                <><Mic className="w-3.5 h-3.5 text-emerald-400" /> Listening…</>
              ) : (
                <><MicOff className="w-3.5 h-3.5" /> Mic off</>
              )}
            </div>
          </div>
        )}

        {savedToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-[11px] flex items-center gap-1.5 shadow-lg animate-fade-in">
            <MessageSquare className="w-3 h-3" /> Saved to AI Chat
          </div>
        )}

        {/* Bottom dock */}
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2.5">
          {!liveOn ? (
            <>
              <button
                onClick={startLive}
                className="px-5 py-3 rounded-full bg-white text-black text-sm font-semibold shadow-2xl flex items-center gap-2 active:scale-95 transition"
              >
                <Camera className="w-4 h-4" /> Start Live
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white flex items-center justify-center active:scale-95 transition"
                title="Upload image"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
            </>
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
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white flex items-center justify-center active:scale-95 transition"
                title="Upload image"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <button
                onClick={snapAndAsk}
                disabled={thinking}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition border-2 border-white/40 disabled:opacity-50"
                title="Capture & ask"
              >
                <Aperture className="w-6 h-6" />
              </button>
              <button
                onClick={() => (listening ? stopListening() : startListening())}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur border border-white/15 transition ${
                  listening ? 'bg-emerald-500/90 text-white' : 'bg-white/10 text-white/70'
                }`}
                title={listening ? 'Pause mic' : 'Resume mic'}
              >
                {listening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={stopAll}
                className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl active:scale-95 transition border-2 border-white/20"
                title="End live"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])}
        />
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Talk · tap <b>shutter</b> to snap · tap <b>image</b> to upload — answers go to <b>AI Chat</b>.
      </p>
    </div>
  );
};

export default LiveCameraTool;
