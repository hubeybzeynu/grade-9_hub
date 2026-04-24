import { useState, useMemo } from 'react';
import { evaluate } from 'mathjs';
import { Delete } from 'lucide-react';
import QuadraticPlot from './QuadraticPlot';
import FunctionPlot from './FunctionPlot';
import SignChart from './SignChart';
import TrigonometryTool from './TrigonometryTool';
import MatrixTool from './MatrixTool';
import StatsTool from './StatsTool';
import UnitConverterTool from './UnitConverterTool';
import { molarMass, parseFormula } from '@/lib/chemistry';

type Mode = 'sci' | 'quad' | 'graph' | 'chem' | 'trig' | 'matrix' | 'stats' | 'units';

const CalculatorTool = () => {
  const [mode, setMode] = useState<Mode>('sci');
  // Scientific
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  // Quadratic
  const [a, setA] = useState('1');
  const [b, setB] = useState('-5');
  const [c, setC] = useState('6');
  // Graph
  const [fx, setFx] = useState('x^2');
  const [xmin, setXmin] = useState('-10');
  const [xmax, setXmax] = useState('10');
  // Chemistry
  const [formula, setFormula] = useState('H2O');

  const quad = useMemo(() => {
    const A = Number(a), B = Number(b), C = Number(c);
    if (!isFinite(A) || A === 0) return { valid: false, A, B, C };
    const disc = B * B - 4 * A * C;
    const roots: number[] = [];
    if (disc > 0) {
      const r1 = (-B + Math.sqrt(disc)) / (2 * A);
      const r2 = (-B - Math.sqrt(disc)) / (2 * A);
      roots.push(r1, r2);
    } else if (disc === 0) {
      roots.push(-B / (2 * A));
    }
    const vx = -B / (2 * A);
    const vy = A * vx * vx + B * vx + C;
    return { valid: true, A, B, C, disc, roots, vx, vy };
  }, [a, b, c]);

  const chem = useMemo(() => {
    try {
      const mm = molarMass(formula);
      const parts = parseFormula(formula);
      return { valid: true, mass: mm, parts };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }, [formula]);

  const safeEval = (s: string) => {
    try {
      // Auto-balance unclosed parens (helps with sqrt(, sin(, etc.)
      const opens = (s.match(/\(/g) || []).length;
      const closes = (s.match(/\)/g) || []).length;
      const balanced = s + ')'.repeat(Math.max(0, opens - closes));
      const r = evaluate(balanced);
      setResult(typeof r === 'number' ? Number(r.toPrecision(12)).toString() : String(r));
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setResult('');
    }
  };

  const append = (t: string) => setExpr((p) => p + t);
  const clear = () => { setExpr(''); setResult(''); setError(''); };
  const backspace = () => setExpr((p) => p.slice(0, -1));

  // Display labels (left) vs underlying math.js values (right). Functions auto-include `(`.
  const keys: Array<{ label: React.ReactNode; value?: string; action?: () => void; variant?: 'op' | 'fn' | 'eq' | 'num' }> = [
    { label: 'AC', action: clear, variant: 'op' },
    { label: '( )', value: '()', variant: 'op' },
    { label: '%', value: '%', variant: 'op' },
    { label: '÷', value: '/', variant: 'op' },
    { label: 'sin', value: 'sin(', variant: 'fn' },
    { label: 'cos', value: 'cos(', variant: 'fn' },
    { label: 'tan', value: 'tan(', variant: 'fn' },
    { label: '×', value: '*', variant: 'op' },
    { label: 'ln', value: 'log(', variant: 'fn' },
    { label: 'log', value: 'log10(', variant: 'fn' },
    // Radical key — inserts √( automatically (closing ) is auto-balanced on =).
    { label: <span className="font-mono">√</span>, action: () => append('sqrt('), variant: 'fn' },
    { label: '−', value: '-', variant: 'op' },
    { label: 'π', value: 'pi' },
    { label: 'e', value: 'e' },
    { label: '^', value: '^', variant: 'op' },
    { label: '+', value: '+', variant: 'op' },
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' },
    { label: '!', value: '!', variant: 'op' },
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: 'x', value: 'x' },
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '⌫', action: backspace, variant: 'op' },
    { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '+/-', action: () => setExpr((p) => p.startsWith('-') ? p.slice(1) : '-' + p) },
    { label: '=', action: () => safeEval(expr), variant: 'eq' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Mode pills — horizontal scroll for the extra Trig tab */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 text-xs overflow-x-auto">
        {([
          ['sci', 'Sci'],
          ['quad', 'Quadratic'],
          ['graph', 'Graph'],
          ['trig', 'Trig'],
          ['matrix', 'Matrix'],
          ['stats', 'Stats'],
          ['units', 'Units'],
          ['chem', 'Chem'],
        ] as [Mode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'sci' && (
        <div className="space-y-3">
          <div className="bg-muted rounded-xl p-3 min-h-[88px] flex flex-col justify-end">
            <p className="text-xs text-muted-foreground break-all">{expr || '\u00A0'}</p>
            <p className="text-2xl font-mono font-bold break-all">
              {error ? <span className="text-destructive text-sm">{error}</span> : result || '0'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {keys.map((k, i) => (
              <button
                key={i}
                onClick={() => {
                  if (k.action) k.action();
                  else if (k.value) {
                    if (k.value === '()') {
                      const opens = (expr.match(/\(/g) || []).length;
                      const closes = (expr.match(/\)/g) || []).length;
                      append(opens > closes ? ')' : '(');
                    } else append(k.value);
                  }
                }}
                className={`py-3 rounded-lg text-sm font-semibold active:opacity-70 ${
                  k.variant === 'eq'
                    ? 'bg-primary text-primary-foreground'
                    : k.variant === 'op'
                    ? 'bg-accent text-accent-foreground'
                    : k.variant === 'fn'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {k.label === '⌫' ? <Delete className="w-4 h-4 mx-auto" /> : k.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Tip: press √ then your number — closing parenthesis is added automatically.
          </p>
        </div>
      )}

      {mode === 'quad' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Solve ax² + bx + c = 0</p>

          {/* Live formula preview */}
          <div className="bg-muted rounded-xl p-3 text-center font-mono text-sm">
            <span>{a || '?'}x² {Number(b) >= 0 ? '+' : '−'} {Math.abs(Number(b)) || '?'}x {Number(c) >= 0 ? '+' : '−'} {Math.abs(Number(c)) || '?'} = 0</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'a', val: a, set: setA },
              { label: 'b', val: b, set: setB },
              { label: 'c', val: c, set: setC },
            ].map((f) => (
              <label key={f.label} className="flex flex-col text-xs gap-1">
                <span className="text-muted-foreground">{f.label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            ))}
          </div>

          {quad.valid && (
            <>
              {/* Step-by-step using quadratic formula */}
              <div className="bg-muted rounded-xl p-3 space-y-1 text-xs">
                <p className="font-semibold text-foreground">Quadratic formula</p>
                <p className="font-mono">x = (−b ± √(b² − 4ac)) / 2a</p>
                <p>Δ = b² − 4ac = {quad.B}² − 4·{quad.A}·{quad.C} = <b>{quad.disc?.toFixed(4)}</b></p>
                {quad.disc! > 0 ? (
                  <>
                    <p>Two distinct real roots:</p>
                    <p>x₁ = <b>{quad.roots[0].toFixed(4)}</b></p>
                    <p>x₂ = <b>{quad.roots[1].toFixed(4)}</b></p>
                  </>
                ) : quad.disc === 0 ? (
                  <p>One repeated real root: x = <b>{quad.roots[0].toFixed(4)}</b></p>
                ) : (
                  <p className="text-muted-foreground">No real roots (Δ &lt; 0).</p>
                )}
                <p>Vertex: ({quad.vx!.toFixed(2)}, {quad.vy!.toFixed(2)})</p>
              </div>

              {/* Sign chart (product property) */}
              <SignChart a={quad.A} b={quad.B} c={quad.C} roots={quad.roots} />

              <QuadraticPlot a={quad.A} b={quad.B} c={quad.C} roots={quad.roots} />
            </>
          )}
          {!quad.valid && <p className="text-xs text-destructive">a must be non-zero.</p>}
        </div>
      )}

      {mode === 'graph' && (
        <div className="space-y-3">
          <label className="flex flex-col text-xs gap-1">
            <span className="text-muted-foreground">f(x) =</span>
            <input
              value={fx}
              onChange={(e) => setFx(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. sin(x), x^3 - 2x"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col text-xs gap-1">
              <span className="text-muted-foreground">x min</span>
              <input type="number" inputMode="numeric" value={xmin} onChange={(e) => setXmin(e.target.value)}
                className="px-3 py-2 rounded-lg bg-muted text-sm outline-none" />
            </label>
            <label className="flex flex-col text-xs gap-1">
              <span className="text-muted-foreground">x max</span>
              <input type="number" inputMode="numeric" value={xmax} onChange={(e) => setXmax(e.target.value)}
                className="px-3 py-2 rounded-lg bg-muted text-sm outline-none" />
            </label>
          </div>
          <FunctionPlot expr={fx} xmin={Number(xmin)} xmax={Number(xmax)} />
        </div>
      )}

      {mode === 'trig' && <TrigonometryTool />}
      {mode === 'matrix' && <MatrixTool />}
      {mode === 'stats' && <StatsTool />}
      {mode === 'units' && <UnitConverterTool />}

      {mode === 'chem' && (
        <div className="space-y-3">
          <label className="flex flex-col text-xs gap-1">
            <span className="text-muted-foreground">Chemical formula</span>
            <input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="px-3 py-2 rounded-lg bg-muted text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. H2O, C6H12O6, Ca(OH)2"
            />
          </label>
          {chem.valid ? (
            <div className="bg-muted rounded-xl p-3 space-y-2">
              <p className="text-sm">
                Molar mass: <b className="text-primary">{chem.mass!.toFixed(3)} g/mol</b>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chem.parts!.map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-background text-xs font-mono">
                    {p.symbol}<sub>{p.count}</sub> → {(p.atomicMass * p.count).toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-destructive">{chem.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CalculatorTool;
