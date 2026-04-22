import { useMemo } from 'react';
import { compile } from 'mathjs';

interface Props {
  expr: string;
  xmin: number;
  xmax: number;
}

const FunctionPlot = ({ expr, xmin, xmax }: Props) => {
  const { path, error, ymin, ymax, sx, sy, W, H, axisX, axisY } = useMemo(() => {
    const W = 320, H = 200, PAD = 20;
    let error: string | null = null;
    let pts: Array<[number, number]> = [];
    let ymin = Infinity, ymax = -Infinity;
    try {
      if (!isFinite(xmin) || !isFinite(xmax) || xmax <= xmin) throw new Error('Invalid x range');
      const fn = compile(expr);
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const x = xmin + (i * (xmax - xmin)) / N;
        const y = Number(fn.evaluate({ x }));
        if (isFinite(y)) {
          pts.push([x, y]);
          if (y < ymin) ymin = y;
          if (y > ymax) ymax = y;
        }
      }
      if (!isFinite(ymin) || !isFinite(ymax)) throw new Error('No finite values');
      const pad = (ymax - ymin) * 0.15 || 1;
      ymin -= pad; ymax += pad;
    } catch (e) {
      error = (e as Error).message;
    }
    const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * (W - 2 * PAD);
    const sy = (y: number) => H - PAD - ((y - ymin) / (ymax - ymin)) * (H - 2 * PAD);
    const axisY = xmin <= 0 && xmax >= 0 ? sx(0) : null;
    const axisX = ymin <= 0 && ymax >= 0 ? sy(0) : null;
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`).join(' ');
    return { path, error, ymin, ymax, sx, sy, W, H, axisX, axisY };
  }, [expr, xmin, xmax]);

  if (error) {
    return <div className="bg-muted rounded-xl p-3 text-xs text-destructive">Cannot plot: {error}</div>;
  }

  return (
    <div className="bg-muted rounded-xl p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {axisY !== null && <line x1={axisY} y1={0} x2={axisY} y2={H} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />}
        {axisX !== null && <line x1={0} y1={axisX} x2={W} y2={axisX} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />}
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <text x={W - 16} y={(axisX ?? H - 4) - 2} fontSize="8" fill="hsl(var(--muted-foreground))">x</text>
        <text x={(axisY ?? 2) + 2} y={14} fontSize="8" fill="hsl(var(--muted-foreground))">y</text>
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        y ∈ [{ymin.toFixed(2)}, {ymax.toFixed(2)}]
      </p>
    </div>
  );
};

export default FunctionPlot;
