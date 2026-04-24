import { useMemo } from 'react';

interface Props {
  a: number;
  b: number;
  c: number;
  roots: number[];
}

// Tick spacing chosen so we get ~6-10 ticks across the range.
const niceStep = (range: number) => {
  const rough = range / 8;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const step = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return step * pow;
};

// SVG plot of y = ax² + bx + c with axes, grid, tick labels, and root markers.
const QuadraticPlot = ({ a, b, c, roots }: Props) => {
  const { pts, xmin, xmax, ymin, ymax, vx, vy } = useMemo(() => {
    const vxLocal = -b / (2 * a);
    const vyLocal = a * vxLocal * vxLocal + b * vxLocal + c;
    let xminL = Math.min(vxLocal - 5, ...roots) - 1;
    let xmaxL = Math.max(vxLocal + 5, ...roots) + 1;
    if (!isFinite(xminL) || !isFinite(xmaxL) || xmaxL - xminL < 2) {
      xminL = -10; xmaxL = 10;
    }
    const ptsL: Array<[number, number]> = [];
    const N = 160;
    let yminL = Infinity, ymaxL = -Infinity;
    for (let i = 0; i <= N; i++) {
      const x = xminL + (i * (xmaxL - xminL)) / N;
      const y = a * x * x + b * x + c;
      ptsL.push([x, y]);
      if (y < yminL) yminL = y;
      if (y > ymaxL) ymaxL = y;
    }
    const pad = (ymaxL - yminL) * 0.15 || 2;
    yminL -= pad; ymaxL += pad;
    return { pts: ptsL, xmin: xminL, xmax: xmaxL, ymin: yminL, ymax: ymaxL, vx: vxLocal, vy: vyLocal };
  }, [a, b, c, roots]);

  const W = 340, H = 220, PAD = 28;
  const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - ymin) / (ymax - ymin)) * (H - 2 * PAD);

  const xStep = niceStep(xmax - xmin);
  const yStep = niceStep(ymax - ymin);
  const xTicks: number[] = [];
  for (let x = Math.ceil(xmin / xStep) * xStep; x <= xmax; x += xStep) xTicks.push(Number(x.toFixed(6)));
  const yTicks: number[] = [];
  for (let y = Math.ceil(ymin / yStep) * yStep; y <= ymax; y += yStep) yTicks.push(Number(y.toFixed(6)));

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`).join(' ');
  const axisY = xmin <= 0 && xmax >= 0 ? sx(0) : null;
  const axisX = ymin <= 0 && ymax >= 0 ? sy(0) : null;
  const labelY = axisX ?? H - PAD;
  const labelX = axisY ?? PAD;

  return (
    <div className="bg-muted rounded-xl p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* grid */}
        {xTicks.map((x) => (
          <line key={`gx${x}`} x1={sx(x)} y1={PAD} x2={sx(x)} y2={H - PAD}
            stroke="hsl(var(--muted-foreground))" strokeOpacity="0.18" strokeWidth="0.5" />
        ))}
        {yTicks.map((y) => (
          <line key={`gy${y}`} x1={PAD} y1={sy(y)} x2={W - PAD} y2={sy(y)}
            stroke="hsl(var(--muted-foreground))" strokeOpacity="0.18" strokeWidth="0.5" />
        ))}
        {/* axes */}
        {axisY !== null && <line x1={axisY} y1={PAD} x2={axisY} y2={H - PAD} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />}
        {axisX !== null && <line x1={PAD} y1={axisX} x2={W - PAD} y2={axisX} stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" />}
        {/* x tick labels */}
        {xTicks.filter((x) => x !== 0).map((x) => (
          <text key={`tx${x}`} x={sx(x)} y={labelY + 10} fontSize="8" textAnchor="middle" fill="hsl(var(--muted-foreground))">{x}</text>
        ))}
        {/* y tick labels */}
        {yTicks.filter((y) => y !== 0).map((y) => (
          <text key={`ty${y}`} x={labelX - 4} y={sy(y) + 3} fontSize="8" textAnchor="end" fill="hsl(var(--muted-foreground))">{y}</text>
        ))}
        {/* axis names */}
        <text x={W - PAD + 4} y={(axisX ?? H - PAD) - 2} fontSize="9" fill="hsl(var(--muted-foreground))">x</text>
        <text x={(axisY ?? PAD) + 4} y={PAD - 4} fontSize="9" fill="hsl(var(--muted-foreground))">y</text>
        {/* curve */}
        <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.6" />
        {/* vertex */}
        <circle cx={sx(vx)} cy={sy(vy)} r="3" fill="hsl(var(--primary))" />
        <text x={sx(vx) + 5} y={sy(vy) - 5} fontSize="8" fill="hsl(var(--foreground))">
          ({vx.toFixed(2)}, {vy.toFixed(2)})
        </text>
        {/* roots */}
        {roots.map((r, i) => (
          <g key={i}>
            <circle cx={sx(r)} cy={axisX ?? sy(0)} r="3" fill="hsl(var(--destructive))" />
            <text x={sx(r) + 4} y={(axisX ?? sy(0)) + 10} fontSize="8" fill="hsl(var(--destructive))">
              x={r.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default QuadraticPlot;
