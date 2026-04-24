import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Send, Mic, MicOff, Image as ImageIcon, X, Volume2, VolumeX } from 'lucide-react';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';
import QuadraticPlot from './QuadraticPlot';
import FunctionPlot from './FunctionPlot';
import RightTrianglePlot from './RightTrianglePlot';
import GeometryShape from './GeometryShape';
import { elements, categoryColor } from '@/data/periodicTable';

type Plot =
  | { type: 'quadratic'; a: number; b: number; c: number; roots: number[] }
  | { type: 'function'; expr: string; xmin: number; xmax: number }
  | { type: 'triangle'; angleA: number; opposite?: string; adjacent?: string; hypotenuse?: string; caption?: string }
  | { type: 'shape'; shape: string; side?: number; width?: number; height?: number; radius?: number; caption?: string; label?: string }
  | { type: 'elements'; symbols: string[]; caption?: string }
  | null;

interface AiResponse {
  answer?: string;
  steps?: string[];
  plot?: Plot;
  error?: string;
}

// Web Speech API types are loose; cast to any to avoid TS issues across browsers.
type SR = any;

const AiAssistantTool = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakOnAnswer, setSpeakOnAnswer] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SR | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop any TTS when component unmounts.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Auto-speak the answer when it arrives, if enabled.
  useEffect(() => {
    if (speakOnAnswer && response?.answer && !response.error) {
      speak(response.answer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

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

  const startRecording = () => {
    const SRClass: SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      alert('Live voice recording is not supported in this browser. Please type your question.');
      return;
    }
    const rec: SR = new SRClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) setQuestion((p) => (p ? p + ' ' : '') + final.trim());
      setLiveTranscript(interim);
    };
    rec.onend = () => { setRecording(false); setLiveTranscript(''); };
    rec.onerror = () => { setRecording(false); setLiveTranscript(''); };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const onPickImage = (file: File) => {
    if (file.size > 6 * 1024 * 1024) { alert('Image too large (max 6 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const ask = async () => {
    if (!question.trim() && !imageBase64) return;
    setLoading(true);
    setResponse(null);
    stopSpeaking();
    try {
      const { data, error } = await cloudSupabase.functions.invoke('ai-solve', {
        body: { question, imageBase64 },
      });
      if (error) throw error;
      setResponse(data as AiResponse);
    } catch (e) {
      setResponse({ error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    'Solve x² - 5x + 6 = 0',
    'Area of a regular hexagon with side 6',
    'Draw a square inside a circle of radius 5',
    'In a right triangle, angle A = 30°, hypotenuse = 20. Find the opposite side.',
    'Plot f(x) = sin(x) + x/3',
    'What is the molar mass of Ca(OH)2?',
    'Show me the elements in water (H2O)',
  ];

  // Map element symbols → element record for the inline mini-table.
  const symbolMap = new Map(elements.map((e) => [e.symbol.toLowerCase(), e]));

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold">Ask AI — math, geometry, trig, chemistry</span>
        </div>
        <button
          onClick={() => setSpeakOnAnswer((v) => !v)}
          className={`p-1.5 rounded-lg ${speakOnAnswer ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          title="Read answer out loud"
        >
          {speakOnAnswer ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <textarea
        value={question + (liveTranscript ? ` ${liveTranscript}` : '')}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type, speak (mic), or upload an image of a problem."
        className="w-full px-3 py-2 rounded-xl bg-muted text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
      />

      {imageBase64 && (
        <div className="relative inline-block">
          <img src={imageBase64} alt="Uploaded" className="max-h-32 rounded-lg border border-border" />
          <button
            onClick={() => setImageBase64(null)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${
            recording ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted text-foreground'
          }`}
        >
          {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {recording ? 'Stop' : 'Voice'}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-xs font-medium"
        >
          <ImageIcon className="w-3.5 h-3.5" /> Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuestion(ex)}
            className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground active:bg-accent"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        onClick={ask}
        disabled={loading || (!question.trim() && !imageBase64)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Solving…' : 'Ask AI'}
      </button>

      {response?.error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-xs">{response.error}</div>
      )}

      {response?.answer && (
        <div className="space-y-3">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 relative">
            <p className="text-xs text-muted-foreground mb-1">Answer</p>
            <p className="text-sm font-semibold pr-7">{response.answer}</p>
            <button
              onClick={() => (speaking ? stopSpeaking() : speak(response.answer!))}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80"
              title={speaking ? 'Stop' : 'Read aloud'}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {response.steps && response.steps.length > 0 && (
            <div className="bg-muted rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted-foreground mb-1">Steps</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                {response.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}

          {response.plot?.type === 'quadratic' && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Graph</p>
              <QuadraticPlot a={response.plot.a} b={response.plot.b} c={response.plot.c} roots={response.plot.roots || []} />
            </div>
          )}
          {response.plot?.type === 'function' && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Graph</p>
              <FunctionPlot expr={response.plot.expr} xmin={response.plot.xmin} xmax={response.plot.xmax} />
            </div>
          )}
          {response.plot?.type === 'triangle' && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Right-angled triangle</p>
              <RightTrianglePlot
                angleA={response.plot.angleA}
                opposite={response.plot.opposite}
                adjacent={response.plot.adjacent}
                hypotenuse={response.plot.hypotenuse}
                caption={response.plot.caption}
              />
            </div>
          )}
          {response.plot?.type === 'shape' && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Shape</p>
              <GeometryShape
                shape={response.plot.shape as any}
                side={response.plot.side}
                width={response.plot.width}
                height={response.plot.height}
                radius={response.plot.radius}
                caption={response.plot.caption}
                label={response.plot.label}
              />
            </div>
          )}
          {response.plot?.type === 'elements' && response.plot.symbols.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{response.plot.caption || 'Elements involved'}</p>
              <div className="flex flex-wrap gap-2">
                {response.plot.symbols.map((sym, i) => {
                  const el = symbolMap.get(sym.toLowerCase());
                  if (!el) return null;
                  return (
                    <div
                      key={`${sym}-${i}`}
                      className={`${categoryColor(el.category)} rounded-lg px-3 py-2 text-white animate-scale-in`}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <p className="text-[9px] opacity-80">{el.number}</p>
                      <p className="text-lg font-bold leading-none">{el.symbol}</p>
                      <p className="text-[10px]">{el.name}</p>
                      <p className="text-[9px] opacity-80">{el.mass} u</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiAssistantTool;
