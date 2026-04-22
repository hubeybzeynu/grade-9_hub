import { useMemo } from 'react';

interface Props {
  a: number;
  b: number;
  c: number;
  roots: number[];
}

// SVG plot of y = ax² + bx + c with axes and root markers.
const QuadraticPlot = ({ a, b, c, roots }: Props) => {
  const { path, pts, xmin, xmax, ymin, ymax, vx, vy } = useMemo(() => {
    const vxLocal = -b / (2 * a);
    const vyLocal = a * vxLocal * vxLocal + b * vxLocal + c;
    let xminL = Math.min(vxLocal - 5, ...roots) - 1;
    let xmaxL = Math.max(vxLocal + 5, ...roots) + 1;
    if (!isFinite(xminL) || !isFinite(xmaxL) || xmaxL - xminL < 2) {
      xminL = -10; xmaxL = 10;
    }
    const ptsL: Array<[number, number]> = [];
    const N = 120;
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
    return { pts: ptsL, xmin: xminL, xmax: xmaxL, ymin: yminL, ymax: ymaxL, vx: vxLocal, vy: vyLocal, path: '' };
  }, [a, b, c, roots]);

  const W = 320, H = 200, PAD = 20;
  const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - ymin) / (ymax - ymin)) * (H - 2 * PAD);

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`).join(' ');
  const axisY = xmin <= 0 && xmax >= 0 ? sx(0) : null;
  const axisX = ymin <= 0 && ymax >= 0 ? sy(0) : null;

  return (
    <div className="bg-muted rounded-xl p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* axes */}
        {axisY !== null && <line x1={axisY} y1={0} x2={axisY} y2={H} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />}
        {axisX !== null && <line x1={0} y1={axisX} x2={W} y2={axisX} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />}
        {/* grid labels */}
        <text x={W - PAD + 2} y={axisX ?? H - 2} fontSize="8" fill="hsl(var(--muted-foreground))">x</text>
        <text x={(axisY ?? 2) + 2} y={PAD - 4} fontSize="8" fill="hsl(var(--muted-foreground))">y</text>
        {/* curve */}
        <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
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
