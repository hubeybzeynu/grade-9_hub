import { useMemo } from 'react';

interface Props {
  a: number;
  b: number;
  c: number;
  roots: number[];
}

// Sign chart for ax² + bx + c using the product property:
// factor as a(x − r₁)(x − r₂) and show the sign of each factor across intervals.
const SignChart = ({ a, b, c, roots }: Props) => {
  const data = useMemo(() => {
    if (roots.length !== 2) return null;
    const sorted = [...roots].sort((x, y) => x - y);
    const [r1, r2] = sorted;
    const intervals = [
      { label: `x < ${r1.toFixed(2)}`, test: r1 - 1 },
      { label: `x = ${r1.toFixed(2)}`, test: r1, isRoot: true },
      { label: `${r1.toFixed(2)} < x < ${r2.toFixed(2)}`, test: (r1 + r2) / 2 },
      { label: `x = ${r2.toFixed(2)}`, test: r2, isRoot: true },
      { label: `x > ${r2.toFixed(2)}`, test: r2 + 1 },
    ];

    const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '0');

    const rows = [
      {
        factor: 'a',
        cells: intervals.map(() => sign(a)),
      },
      {
        factor: `(x − ${r1.toFixed(2)})`,
        cells: intervals.map((iv) => (iv.isRoot && iv.test === r1 ? '0' : sign(iv.test - r1))),
      },
      {
        factor: `(x − ${r2.toFixed(2)})`,
        cells: intervals.map((iv) => (iv.isRoot && iv.test === r2 ? '0' : sign(iv.test - r2))),
      },
      {
        factor: 'f(x)',
        cells: intervals.map((iv) => {
          if (iv.isRoot) return '0';
          const v = a * (iv.test - r1) * (iv.test - r2);
          return sign(v);
        }),
        bold: true,
      },
    ];

    return { intervals, rows, r1, r2 };
  }, [a, b, c, roots]);

  if (!data) {
    return (
      <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground">
        Sign chart needs two distinct real roots.
      </div>
    );
  }

  const cellColor = (s: string) =>
    s === '+' ? 'text-emerald-600 dark:text-emerald-400' :
    s === '−' ? 'text-rose-600 dark:text-rose-400' :
    'text-muted-foreground';

  return (
    <div className="bg-muted rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold">Sign chart (product property)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 pr-2 font-medium text-muted-foreground">Factor</th>
              {data.intervals.map((iv, i) => (
                <th key={i} className="px-1 py-1 font-medium text-muted-foreground whitespace-nowrap">{iv.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.factor} className="border-b border-border/40">
                <td className={`py-1.5 pr-2 font-mono ${row.bold ? 'font-bold' : ''}`}>{row.factor}</td>
                {row.cells.map((s, i) => (
                  <td key={i} className={`text-center font-mono font-bold ${cellColor(s)}`}>{s}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        f(x) &gt; 0 where signs multiply to +. f(x) &lt; 0 where signs multiply to −. Roots: x = {data.r1.toFixed(2)}, {data.r2.toFixed(2)}.
      </p>
    </div>
  );
};

export default SignChart;
