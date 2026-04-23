import { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';
import QuadraticPlot from './QuadraticPlot';
import FunctionPlot from './FunctionPlot';
import RightTrianglePlot from './RightTrianglePlot';

interface AiResponse {
  answer?: string;
  steps?: string[];
  plot?:
    | { type: 'quadratic'; a: number; b: number; c: number; roots: number[] }
    | { type: 'function'; expr: string; xmin: number; xmax: number }
    | { type: 'triangle'; angleA: number; opposite?: string; adjacent?: string; hypotenuse?: string; caption?: string }
    | null;
  error?: string;
}

const AiAssistantTool = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiResponse | null>(null);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const { data, error } = await cloudSupabase.functions.invoke('ai-solve', {
        body: { question },
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
    'In a right triangle, angle A = 30°, hypotenuse = 20. Find the opposite side.',
    'Plot f(x) = sin(x) + x/3',
    'What is the molar mass of Ca(OH)2?',
    'Full electron configuration of iron',
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold">Ask AI — math, trig, physics, chemistry</span>
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask anything. Quadratic equations, trig triangles, and graphs are drawn for you."
        className="w-full px-3 py-2 rounded-xl bg-muted text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
      />

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
        disabled={loading || !question.trim()}
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
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Answer</p>
            <p className="text-sm font-semibold">{response.answer}</p>
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
        </div>
      )}
    </div>
  );
};

export default AiAssistantTool;
