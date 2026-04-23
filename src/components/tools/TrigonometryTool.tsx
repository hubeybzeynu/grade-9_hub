import { useMemo, useState } from 'react';

// Trigonometry helper: special-angle table + full 0°..90° sin/cos/tan table.
const SPECIAL = [
  { deg: 0, sin: '0', cos: '1', tan: '0' },
  { deg: 30, sin: '½', cos: '√3/2', tan: '1/√3' },
  { deg: 45, sin: '1/√2', cos: '1/√2', tan: '1' },
  { deg: 60, sin: '√3/2', cos: '½', tan: '√3' },
  { deg: 90, sin: '1', cos: '0', tan: 'undefined' },
];

const fmt = (n: number) => (Math.abs(n) > 1e6 ? '∞' : n.toFixed(4));

const TrigonometryTool = () => {
  const [angle, setAngle] = useState('35');

  const all = useMemo(() => {
    const rows = [];
    for (let d = 0; d <= 90; d++) {
      const r = (d * Math.PI) / 180;
      rows.push({
        deg: d,
        sin: Math.sin(r),
        cos: Math.cos(r),
        tan: d === 90 ? Infinity : Math.tan(r),
      });
    }
    return rows;
  }, []);

  const lookup = useMemo(() => {
    const d = Number(angle);
    if (!isFinite(d)) return null;
    const r = (d * Math.PI) / 180;
    return {
      deg: d,
      sin: Math.sin(r),
      cos: Math.cos(r),
      tan: Math.cos(r) === 0 ? Infinity : Math.tan(r),
    };
  }, [angle]);

  return (
    <div className="space-y-4">
      {/* Special angle table */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Special angles</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="px-2 py-1.5 text-left font-medium">∠A</th>
                {SPECIAL.map((r) => (
                  <th key={r.deg} className="px-2 py-1.5 font-bold text-primary">{r.deg}°</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-border/50">
                <td className="px-2 py-1.5 font-semibold">sin A</td>
                {SPECIAL.map((r) => <td key={r.deg} className="px-2 py-1.5 text-center">{r.sin}</td>)}
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-2 py-1.5 font-semibold">cos A</td>
                {SPECIAL.map((r) => <td key={r.deg} className="px-2 py-1.5 text-center">{r.cos}</td>)}
              </tr>
              <tr>
                <td className="px-2 py-1.5 font-semibold">tan A</td>
                {SPECIAL.map((r) => <td key={r.deg} className="px-2 py-1.5 text-center">{r.tan}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick lookup */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Lookup angle</p>
        <div className="flex gap-2 items-end">
          <label className="flex-1 flex flex-col text-xs gap-1">
            <span className="text-muted-foreground">Angle (degrees, 0–90)</span>
            <input
              type="number"
              inputMode="decimal"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              min={0}
              max={90}
              className="px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
        {lookup && (
          <div className="bg-muted rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">sin {lookup.deg}°</p>
              <p className="font-mono font-bold text-primary">{fmt(lookup.sin)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">cos {lookup.deg}°</p>
              <p className="font-mono font-bold text-primary">{fmt(lookup.cos)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">tan {lookup.deg}°</p>
              <p className="font-mono font-bold text-primary">{fmt(lookup.tan)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Full 0..90 table */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Full table 0° – 90°</p>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium">°</th>
                <th className="px-2 py-1.5 font-medium">sin</th>
                <th className="px-2 py-1.5 font-medium">cos</th>
                <th className="px-2 py-1.5 font-medium">tan</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {all.map((r) => (
                <tr key={r.deg} className="border-b border-border/40 odd:bg-muted/40">
                  <td className="px-2 py-1 font-semibold">{r.deg}</td>
                  <td className="px-2 py-1 text-center">{r.sin.toFixed(6)}</td>
                  <td className="px-2 py-1 text-center">{r.cos.toFixed(6)}</td>
                  <td className="px-2 py-1 text-center">{!isFinite(r.tan) ? '∞' : r.tan.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrigonometryTool;
