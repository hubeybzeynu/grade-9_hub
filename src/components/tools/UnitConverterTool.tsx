import { useState, useMemo } from 'react';
import { unit } from 'mathjs';

type Category = 'length' | 'mass' | 'time' | 'temperature' | 'volume' | 'speed' | 'energy';

const UNITS: Record<Category, string[]> = {
  length: ['mm', 'cm', 'm', 'km', 'inch', 'ft', 'yd', 'mile'],
  mass: ['mg', 'g', 'kg', 'tonne', 'oz', 'lb'],
  time: ['s', 'min', 'h', 'day', 'week'],
  temperature: ['degC', 'degF', 'K'],
  volume: ['ml', 'l', 'm3', 'gal', 'cup'],
  speed: ['m/s', 'km/h', 'mph', 'knot'],
  energy: ['J', 'kJ', 'cal', 'kcal', 'Wh', 'kWh'],
};

const UnitConverterTool = () => {
  const [cat, setCat] = useState<Category>('length');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('cm');
  const [val, setVal] = useState('1');

  const result = useMemo(() => {
    try {
      const n = Number(val);
      if (!isFinite(n)) return '';
      const u = unit(n, from).to(to);
      return `${u.toNumber().toPrecision(8)} ${to}`;
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  }, [val, from, to]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(UNITS) as Category[]).map((c) => (
          <button key={c} onClick={() => { setCat(c); setFrom(UNITS[c][0]); setTo(UNITS[c][1] ?? UNITS[c][0]); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 items-end">
        <label className="flex flex-col text-xs gap-1 col-span-1">
          <span className="text-muted-foreground">Value</span>
          <input value={val} onChange={(e) => setVal(e.target.value)} type="number" inputMode="decimal"
            className="px-3 py-2 rounded-lg bg-muted text-sm outline-none" />
        </label>
        <label className="flex flex-col text-xs gap-1">
          <span className="text-muted-foreground">From</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-2 py-2 rounded-lg bg-muted text-sm outline-none">
            {UNITS[cat].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs gap-1">
          <span className="text-muted-foreground">To</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}
            className="px-2 py-2 rounded-lg bg-muted text-sm outline-none">
            {UNITS[cat].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <div className="bg-muted rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-1">Result</p>
        <p className="text-lg font-mono font-bold">{result}</p>
      </div>
    </div>
  );
};

export default UnitConverterTool;
