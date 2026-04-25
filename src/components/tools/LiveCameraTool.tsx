// Live camera + voice mode — Gemini-Live style.
// - Opens the device camera (rear by default).
// - Lets the student speak a question (Web Speech API) or type one.
// - On "Ask", captures a frame from the live video and sends both the
//   image + question to the existing ai-solve edge function.
// - Speaks the answer aloud (Web Speech Synthesis).
// - Saves the Q+A to the offline cache for re-reading without internet.
import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Loader2, Volume2, VolumeX, RefreshCw, Send, Download, X, WifiOff } from 'lucide-react';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';
import { aiCache } from '@/lib/aiCache';

type SR = any;

const LiveCameraTool = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SR | null>(null);

  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[] | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  // Online/offline indicator.
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // Cleanup on unmount.
  useEffect(() => () => {
    stopCamera();
    stopSpeaking();
    recognitionRef.current?.stop?.();
  }, []);

  // Auto-speak answer.
  useEffect(() => {
    if (autoSpeak && answer) speak(answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraOn(true);
    } catch (e) {
      const msg = (e as Error).message || 'Camera permission denied';
      setCameraError(msg);
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const flipCamera = async () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    if (cameraOn) {
      stopCamera();
      // Wait one frame then restart.
      setTimeout(() => {
        // restart with new facing — startCamera reads `facing` from state, so we
        // bypass closure by inlining minimal start logic here.
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: { ideal: next } }, audio: false })
          .then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => undefined);
            }
            setCameraOn(true);
          })
          .catch((e) => setCameraError((e as Error).message));
      }, 100);
    }
  };

  // ---------- Voice ----------
  const startListening = () => {
    const SRClass: SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      alert('Voice input is not supported in this browser. Please type your question.');
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
      if (final) setQuestion((p) => (p ? p + ' ' : '') + final.trim());
      setInterim(live);
    };
    rec.onend = () => { setRecording(false); setInterim(''); };
    rec.onerror = () => { setRecording(false); setInterim(''); };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };
  const stopListening = () => { recognitionRef.current?.stop?.(); setRecording(false); };

  // ---------- TTS ----------
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };
  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  // ---------- Snapshot + Ask ----------
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

  const ask = async () => {
    if (!cameraOn) { alert('Please start the camera first.'); return; }
    if (!online) { alert('You are offline. Live answers need internet. Use the Offline tab to read past answers.'); return; }
    const frame = captureFrame();
    if (!frame) { alert('Could not capture an image from the camera.'); return; }
    setSnapshot(frame);
    setLoading(true); setAnswer(null); setSteps(undefined); stopSpeaking();
    try {
      const q = question.trim() || 'Look at this image and explain or solve what you see. Show steps.';
      const { data, error } = await cloudSupabase.functions.invoke('ai-solve', {
        body: { question: q, imageBase64: frame },
      });
      if (error) throw error;
      const ans = (data?.answer as string) || 'No answer';
      setAnswer(ans);
      setSteps(data?.steps);
      aiCache.save({ question: q, answer: ans, steps: data?.steps, plot: data?.plot });
    } catch (e) {
      const msg = (e as Error).message || 'Could not reach the AI service.';
      setAnswer(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadSnapshot = () => {
    if (!snapshot) return;
    const a = document.createElement('a');
    a.href = snapshot;
    a.download = `ai-snapshot-${Date.now()}.jpg`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <span className="font-semibold">Live camera + voice</span>
        </div>
        <div className="flex items-center gap-2">
          {!online && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" />Offline
            </span>
          )}
          <button
            onClick={() => setAutoSpeak((v) => !v)}
            className={`p-1.5 rounded-lg ${autoSpeak ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            title="Auto-read answers"
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border border-border">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2">
            <Camera className="w-10 h-10 opacity-60" />
            <p className="text-xs text-center px-4">
              {cameraError ? cameraError : 'Tap "Start camera" to begin.'}
            </p>
          </div>
        )}
        {cameraOn && (
          <button
            onClick={flipCamera}
            className="absolute top-2 right-2 bg-black/50 backdrop-blur p-2 rounded-full text-white"
            title="Flip camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!cameraOn ? (
          <button
            onClick={startCamera}
            className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            <Camera className="w-4 h-4" /> Start camera
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex items-center justify-center gap-2 py-2 rounded-xl bg-muted text-sm font-medium"
            >
              <X className="w-4 h-4" /> Stop
            </button>
            <button
              onClick={recording ? stopListening : startListening}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${
                recording ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted'
              }`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {recording ? 'Stop voice' : 'Speak'}
            </button>
          </>
        )}
      </div>

      <textarea
        value={question + (interim ? ` ${interim}` : '')}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='Optional: type or speak — e.g. "Solve this equation", "What element is this?"'
        className="w-full px-3 py-2 rounded-xl bg-muted text-sm outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
      />

      <button
        onClick={ask}
        disabled={loading || !cameraOn}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Looking…' : 'Capture & Ask AI'}
      </button>

      {snapshot && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">Last capture</p>
          <div className="relative">
            <img src={snapshot} alt="Snapshot" className="w-full rounded-lg border border-border" />
            <button
              onClick={downloadSnapshot}
              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full"
              title="Save to gallery / downloads"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {answer && (
        <div className="space-y-2">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 relative">
            <p className="text-xs text-muted-foreground mb-1">Answer</p>
            <p className="text-sm font-semibold pr-7">{answer}</p>
            <button
              onClick={() => (speaking ? stopSpeaking() : speak(answer))}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80"
              title={speaking ? 'Stop' : 'Read aloud'}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          {steps && steps.length > 0 && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Steps</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                {steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveCameraTool;
