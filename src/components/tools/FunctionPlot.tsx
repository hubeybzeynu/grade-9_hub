import { useMemo } from 'react';
import { compile } from 'mathjs';

interface Props {
  expr: string;
  xmin: number;
  xmax: number;
}

const niceStep = (range: number) => {
  const rough = range / 8;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const step = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return step * pow;
};

const FunctionPlot = ({ expr, xmin, xmax }: Props) => {
  const result = useMemo(() => {
    const W = 340, H = 220, PAD = 28;
    let error: string | null = null;
    let pts: Array<[number, number]> = [];
    let ymin = Infinity, ymax = -Infinity;
    try {
      if (!isFinite(xmin) || !isFinite(xmax) || xmax <= xmin) throw new Error('Invalid x range');
      const fn = compile(expr);
      const N = 220;
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

    const xStep = niceStep(xmax - xmin);
    const yStep = isFinite(ymax - ymin) ? niceStep(ymax - ymin) : 1;
    const xTicks: number[] = [];
    for (let x = Math.ceil(xmin / xStep) * xStep; x <= xmax; x += xStep) xTicks.push(Number(x.toFixed(6)));
    const yTicks: number[] = [];
    if (isFinite(ymin) && isFinite(ymax)) {
      for (let y = Math.ceil(ymin / yStep) * yStep; y <= ymax; y += yStep) yTicks.push(Number(y.toFixed(6)));
    }
    return { path, error, ymin, ymax, sx, sy, W, H, PAD, axisX, axisY, xTicks, yTicks };
  }, [expr, xmin, xmax]);

  if (result.error) {
    return <div className="bg-muted rounded-xl p-3 text-xs text-destructive">Cannot plot: {result.error}</div>;
  }
  const { path, ymin, ymax, sx, sy, W, H, PAD, axisX, axisY, xTicks, yTicks } = result;
  const labelY = axisX ?? H - PAD;
  const labelX = axisY ?? PAD;

  return (
    <div className="bg-muted rounded-xl p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {xTicks.map((x) => (
          <line key={`gx${x}`} x1={sx(x)} y1={PAD} x2={sx(x)} y2={H - PAD}
            stroke="hsl(var(--muted-foreground))" strokeOpacity="0.18" strokeWidth="0.5" />
        ))}
        {yTicks.map((y) => (
          <line key={`gy${y}`} x1={PAD} y1={sy(y)} x2={W - PAD} y2={sy(y)}
            stroke="hsl(var(--muted-foreground))" strokeOpacity="0.18" strokeWidth="0.5" />
        ))}
        {axisY !== null && <line x1={axisY} y1={PAD} x2={axisY} y2={H - PAD} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />}
        {axisX !== null && <line x1={PAD} y1={axisX} x2={W - PAD} y2={axisX} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />}
        {xTicks.filter((x) => x !== 0).map((x) => (
          <text key={`tx${x}`} x={sx(x)} y={labelY + 10} fontSize="8" textAnchor="middle" fill="hsl(var(--muted-foreground))">{x}</text>
        ))}
        {yTicks.filter((y) => y !== 0).map((y) => (
          <text key={`ty${y}`} x={labelX - 4} y={sy(y) + 3} fontSize="8" textAnchor="end" fill="hsl(var(--muted-foreground))">{y}</text>
        ))}
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.6" />
        <text x={W - PAD + 4} y={(axisX ?? H - PAD) - 2} fontSize="9" fill="hsl(var(--muted-foreground))">x</text>
        <text x={(axisY ?? PAD) + 4} y={PAD - 4} fontSize="9" fill="hsl(var(--muted-foreground))">y</text>
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        y ∈ [{ymin.toFixed(2)}, {ymax.toFixed(2)}]
      </p>
    </div>
  );
};

export default FunctionPlot;
