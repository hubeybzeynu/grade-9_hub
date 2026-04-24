import { useState, useMemo } from 'react';
import { matrix, det, inv, multiply, add, subtract, transpose } from 'mathjs';

type Op = 'det' | 'inv' | 'add' | 'sub' | 'mul' | 'transpose';

const parseMatrix = (s: string): number[][] => {
  // rows separated by ; or newline, cols by , or space
  const rows = s.split(/[;\n]/).map((r) => r.trim()).filter(Boolean);
  return rows.map((r) => r.split(/[\s,]+/).filter(Boolean).map(Number));
};

const MatrixTool = () => {
  const [op, setOp] = useState<Op>('det');
  const [a, setA] = useState('1 2; 3 4');
  const [b, setB] = useState('5 6; 7 8');

  const result = useMemo(() => {
    try {
      const A = matrix(parseMatrix(a));
      if (op === 'det') return String(det(A));
      if (op === 'inv') return JSON.stringify(inv(A).toArray());
      if (op === 'transpose') return JSON.stringify(transpose(A).toArray());
      const B = matrix(parseMatrix(b));
      if (op === 'add') return JSON.stringify(add(A, B).toArray());
      if (op === 'sub') return JSON.stringify(subtract(A, B).toArray());
      if (op === 'mul') return JSON.stringify(multiply(A, B).toArray());
      return '';
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  }, [a, b, op]);

  const needsB = op === 'add' || op === 'sub' || op === 'mul';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Rows separated by ; — values by space or comma.</p>
      <div className="flex flex-wrap gap-1">
        {([
          ['det', 'det'],
          ['inv', 'A⁻¹'],
          ['transpose', 'Aᵀ'],
          ['add', 'A+B'],
          ['sub', 'A−B'],
          ['mul', 'A·B'],
        ] as [Op, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setOp(k)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${op === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>
      <label className="flex flex-col text-xs gap-1">
        <span className="text-muted-foreground">Matrix A</span>
        <textarea value={a} onChange={(e) => setA(e.target.value)} rows={3}
          className="px-3 py-2 rounded-lg bg-muted text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
      </label>
      {needsB && (
        <label className="flex flex-col text-xs gap-1">
          <span className="text-muted-foreground">Matrix B</span>
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={3}
            className="px-3 py-2 rounded-lg bg-muted text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
        </label>
      )}
      <div className="bg-muted rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-1">Result</p>
        <p className="text-sm font-mono break-all">{result}</p>
      </div>
    </div>
  );
};

export default MatrixTool;
