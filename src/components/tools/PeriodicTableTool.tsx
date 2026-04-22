import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { elements, getGridPosition, categoryColor, Element } from '@/data/periodicTable';
import { cloudSupabase } from '@/integrations/supabase/cloudClient';

const PeriodicTableTool = () => {
  const [selected, setSelected] = useState<Element | null>(null);
  const [query, setQuery] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return elements;
    const q = query.toLowerCase();
    return elements.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.symbol.toLowerCase() === q ||
        String(e.number) === q,
    );
  }, [query]);

  const matchedSet = useMemo(() => new Set(filtered.map((e) => e.number)), [filtered]);

  const askAi = async () => {
    if (!selected || !aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const { data, error } = await cloudSupabase.functions.invoke('ai-solve', {
        body: { question: `About the element ${selected.name} (${selected.symbol}, Z=${selected.number}): ${aiQuestion}` },
      });
      if (error) throw error;
      const d = data as { answer?: string; error?: string };
      setAiAnswer(d.answer || d.error || 'No response.');
    } catch (e) {
      setAiAnswer(`Error: ${(e as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <input
        placeholder="Search element by name, symbol, or number…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-muted text-sm outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Full 18×9 grid (rows 1-7 main + 8-9 lanthanide/actinide) */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-[2px] min-w-[540px]"
          style={{
            gridTemplateColumns: 'repeat(18, minmax(28px, 1fr))',
            gridTemplateRows: 'repeat(9, minmax(28px, 1fr))',
          }}
        >
          {elements.map((el) => {
            const pos = getGridPosition(el);
            if (!pos) return null;
            const dim = query && !matchedSet.has(el.number);
            return (
              <button
                key={el.number}
                onClick={() => setSelected(el)}
                style={{ gridColumn: pos.col, gridRow: pos.row }}
                className={`${categoryColor(el.category)} rounded-[4px] flex flex-col items-center justify-center text-white active:scale-95 transition-all leading-none p-0.5 ${
                  dim ? 'opacity-20' : ''
                }`}
              >
                <span className="text-[7px] opacity-80">{el.number}</span>
                <span className="text-[11px] font-bold">{el.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {[
          'Alkali metal', 'Alkaline earth metal', 'Transition metal', 'Post-transition metal',
          'Metalloid', 'Reactive nonmetal', 'Noble gas', 'Halogen', 'Lanthanide', 'Actinide',
        ].map((c) => (
          <span key={c} className={`px-1.5 py-0.5 rounded text-white ${categoryColor(c)}`}>{c}</span>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-background/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setSelected(null); setAiOpen(false); setAiAnswer(''); setAiQuestion(''); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${categoryColor(selected.category)} rounded-xl px-4 py-3 text-white`}>
                  <p className="text-xs opacity-80">{selected.number}</p>
                  <p className="text-3xl font-bold leading-none">{selected.symbol}</p>
                  <p className="text-xs mt-1">{selected.name}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <dl className="space-y-1.5 text-sm">
                {[
                  ['Atomic number', selected.number],
                  ['Atomic mass', `${selected.mass} u`],
                  ['Category', selected.category],
                  ['Group / Period', `${selected.group ?? '—'} / ${selected.period}`],
                  ['Block', selected.block.toUpperCase()],
                  ['Electron configuration', selected.electronConfig],
                  ['Electronegativity', selected.electronegativity ?? '—'],
                  ['Phase at room temp', selected.phase],
                  selected.discoveredBy ? ['Discovered by', selected.discoveredBy] : null,
                ].filter(Boolean).map((row) => {
                  const [k, v] = row as [string, string | number];
                  return (
                    <div key={k} className="flex justify-between gap-3 border-b border-border/50 pb-1">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="text-xs font-medium text-right">{v}</dd>
                    </div>
                  );
                })}
              </dl>

              <p className="text-xs text-muted-foreground mt-3">{selected.summary}</p>

              <button
                onClick={() => setAiOpen(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-primary to-cyan-600 text-primary-foreground text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Ask AI about {selected.symbol}
              </button>

              {aiOpen && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder={`e.g. "How is ${selected.name} used in real life?"`}
                    className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-1 focus:ring-primary min-h-[64px]"
                  />
                  <button
                    onClick={askAi}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {aiLoading ? 'Thinking…' : 'Ask'}
                  </button>
                  {aiAnswer && (
                    <div className="bg-muted rounded-lg p-3 text-xs whitespace-pre-wrap">{aiAnswer}</div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PeriodicTableTool;
