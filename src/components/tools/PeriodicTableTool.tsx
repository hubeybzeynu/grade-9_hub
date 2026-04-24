import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { elements, getGridPosition, categoryColor, Element } from '@/data/periodicTable';
import {
  fullElectronConfiguration,
  shellDistribution,
  effectiveNuclearCharge,
  ATOMIC_RADIUS_PM,
  IONIZATION_ENERGY_KJ,
  ELECTRON_AFFINITY_KJ,
} from '@/lib/elementChemistry';
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
      const d = data as { answer?: string; error?: string; steps?: string[] };
      setAiAnswer(d.answer ? d.answer + (d.steps?.length ? '\n\nSteps:\n' + d.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '') : (d.error || 'No response.'));
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

      <div className="overflow-x-auto">
        <div
          className="grid gap-[2px] min-w-[540px]"
          style={{
            gridTemplateColumns: 'repeat(18, minmax(28px, 1fr))',
            gridTemplateRows: 'repeat(9, minmax(28px, 1fr))',
          }}
        >
          {elements.map((el, idx) => {
            const pos = getGridPosition(el);
            if (!pos) return null;
            const dim = query && !matchedSet.has(el.number);
            return (
              <motion.button
                key={el.number}
                onClick={() => setSelected(el)}
                style={{ gridColumn: pos.col, gridRow: pos.row }}
                initial={{ opacity: 0, scale: 0.4, rotate: -10 }}
                animate={{ opacity: dim ? 0.2 : 1, scale: 1, rotate: 0 }}
                transition={{ delay: Math.min(idx * 0.008, 0.9), type: 'spring', stiffness: 220, damping: 18 }}
                whileHover={{ scale: 1.18, zIndex: 10 }}
                whileTap={{ scale: 0.92 }}
                className={`${categoryColor(el.category)} rounded-[4px] flex flex-col items-center justify-center text-white leading-none p-0.5`}
              >
                <span className="text-[7px] opacity-80">{el.number}</span>
                <span className="text-[11px] font-bold">{el.symbol}</span>
              </motion.button>
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

              {(() => {
                const fullCfg = fullElectronConfiguration(selected.number);
                const shells = shellDistribution(selected.number);
                const zeff = effectiveNuclearCharge(selected.number);
                const radius = ATOMIC_RADIUS_PM[selected.number];
                const ie = IONIZATION_ENERGY_KJ[selected.number];
                const ea = ELECTRON_AFFINITY_KJ[selected.number];

                const rows: Array<[string, string | number | null | undefined]> = [
                  ['Atomic number (Z)', selected.number],
                  ['Atomic mass', `${selected.mass} u (g/mol)`],
                  ['Category', selected.category],
                  ['Group / Period', `${selected.group ?? '—'} / ${selected.period}`],
                  ['Block', selected.block.toUpperCase()],
                  ['Phase at room temp', selected.phase],
                  ['Electron configuration (short)', selected.electronConfig],
                  ['Electron configuration (full)', fullCfg],
                  ['Shell distribution', shells.join(' ')],
                  ['Effective nuclear charge (Zeff)', zeff],
                  ['Atomic radius', radius ? `${radius} pm` : '—'],
                  ['1st ionization energy', ie ? `${ie} kJ/mol` : '—'],
                  ['Electron affinity', ea ? `${ea} kJ/mol` : '—'],
                  ['Electronegativity (Pauling)', selected.electronegativity ?? '—'],
                  selected.discoveredBy ? ['Discovered by', selected.discoveredBy] : null,
                ].filter(Boolean) as Array<[string, string | number]>;

                return (
                  <dl className="space-y-1.5 text-sm">
                    {rows.map(([k, v]) => (
                      <div key={k as string} className="flex justify-between gap-3 border-b border-border/50 pb-1">
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="text-xs font-medium text-right break-all">{v as string | number}</dd>
                      </div>
                    ))}
                  </dl>
                );
              })()}

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
