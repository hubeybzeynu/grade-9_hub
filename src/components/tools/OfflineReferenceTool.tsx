// Offline reference book — formulas, examples for math/physics/chemistry/trig/geometry.
// Works fully offline: all content is bundled in src/data/offlineReference.ts.
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, WifiOff } from 'lucide-react';
import { REFERENCE, CATEGORY_META, type ReferenceCategory, type ReferenceEntry } from '@/data/offlineReference';

const ALL = 'all' as const;
type Filter = typeof ALL | ReferenceCategory;

const OfflineReferenceTool = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(ALL);
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REFERENCE.filter((e) => {
      if (filter !== ALL && e.category !== filter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.formula?.toLowerCase().includes(q) ||
        e.keywords.some((k) => k.includes(q))
      );
    });
  }, [query, filter]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-semibold">Offline reference</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
          <WifiOff className="w-3 h-3" />
          Works offline
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search formulas, e.g. quadratic, sin, mole, ohm…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Chip active={filter === ALL} onClick={() => setFilter(ALL)} label="All" emoji="📚" />
        {(Object.keys(CATEGORY_META) as ReferenceCategory[]).map((c) => (
          <Chip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={CATEGORY_META[c].label}
            emoji={CATEGORY_META[c].emoji}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">{filtered.length} entries</p>

      <div className="space-y-2">
        {filtered.map((entry) => (
          <Entry key={entry.id} entry={entry} open={open === entry.id} onToggle={() => setOpen(open === entry.id ? null : entry.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">No results.</p>
        )}
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, label, emoji }: { active: boolean; onClick: () => void; label: string; emoji: string }) => (
  <button
    onClick={onClick}
    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
    }`}
  >
    <span>{emoji}</span>
    <span>{label}</span>
  </button>
);

const Entry = ({ entry, open, onToggle }: { entry: ReferenceEntry; open: boolean; onToggle: () => void }) => {
  const meta = CATEGORY_META[entry.category];
  return (
    <motion.div
      layout
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <button onClick={onToggle} className="w-full text-left p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block bg-gradient-to-r ${meta.color} text-white text-[9px] px-1.5 py-0.5 rounded-full`}>
                {meta.emoji} {meta.label}
              </span>
            </div>
            <p className="font-semibold text-sm mt-1">{entry.title}</p>
            {entry.formula && (
              <p className="font-mono text-[12px] text-primary mt-1 break-words">{entry.formula}</p>
            )}
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 space-y-2 border-t border-border"
          >
            <p className="text-xs text-muted-foreground pt-2">{entry.description}</p>
            {entry.example && (
              <div className="bg-muted rounded-lg p-2 space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground">Example</p>
                <p className="text-xs font-medium">{entry.example.problem}</p>
                <ol className="list-decimal list-inside text-xs space-y-0.5">
                  {entry.example.solution.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OfflineReferenceTool;
