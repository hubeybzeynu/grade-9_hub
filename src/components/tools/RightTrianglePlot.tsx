interface Props {
  // angle in degrees at vertex A (the labeled corner)
  angleA: number;
  // optional side length labels (strings so we can show √3, 2, etc.)
  opposite?: string;   // a, opposite to angle A
  adjacent?: string;   // b
  hypotenuse?: string; // c
  caption?: string;
}

// Right-angled triangle diagram for trigonometry questions.
// Right angle is at B (bottom-right); angle A at bottom-left.
const RightTrianglePlot = ({ angleA, opposite, adjacent, hypotenuse, caption }: Props) => {
  const W = 280, H = 200;
  const PAD = 24;
  // Choose adjacent length so triangle fits, then perpendicular = adj * tan(A).
  const adj = Math.min(W - 2 * PAD, 200);
  const ang = (Math.max(1, Math.min(89, angleA)) * Math.PI) / 180;
  let opp = adj * Math.tan(ang);
  // If perpendicular would overflow vertically, scale down.
  const maxOpp = H - 2 * PAD;
  let scaledAdj = adj;
  if (opp > maxOpp) {
    const ratio = maxOpp / opp;
    opp = maxOpp;
    scaledAdj = adj * ratio;
  }

  const A = { x: PAD, y: H - PAD };
  const B = { x: PAD + scaledAdj, y: H - PAD };
  const C = { x: B.x, y: B.y - opp };

  const hyp = Math.hypot(B.x - A.x, C.y - A.y);

  return (
    <div className="bg-muted rounded-xl p-2 space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* triangle */}
        <polygon
          points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
          fill="hsl(var(--primary) / 0.1)"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
        />
        {/* right-angle box at B */}
        <rect x={B.x - 10} y={B.y - 10} width="10" height="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />

        {/* vertex labels */}
        <text x={A.x - 12} y={A.y + 4} fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))">A</text>
        <text x={B.x + 4} y={B.y + 12} fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))">B</text>
        <text x={C.x + 4} y={C.y - 2} fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))">C</text>

        {/* angle A arc */}
        <path
          d={`M ${A.x + 22} ${A.y} A 22 22 0 0 0 ${A.x + 22 * Math.cos(ang)} ${A.y - 22 * Math.sin(ang)}`}
          fill="none" stroke="hsl(var(--primary))" strokeWidth="1"
        />
        <text x={A.x + 28} y={A.y - 8} fontSize="10" fill="hsl(var(--primary))">{angleA}°</text>

        {/* side labels */}
        {adjacent && (
          <text x={(A.x + B.x) / 2} y={B.y + 14} fontSize="10" textAnchor="middle" fill="hsl(var(--muted-foreground))">
            {adjacent} (adj)
          </text>
        )}
        {opposite && (
          <text x={B.x + 8} y={(B.y + C.y) / 2} fontSize="10" fill="hsl(var(--muted-foreground))">
            {opposite} (opp)
          </text>
        )}
        {hypotenuse && (
          <text
            x={(A.x + C.x) / 2 - 16}
            y={(A.y + C.y) / 2 - 4}
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            transform={`rotate(${-Math.atan2(opp, scaledAdj) * 180 / Math.PI}, ${(A.x + C.x) / 2 - 16}, ${(A.y + C.y) / 2 - 4})`}
          >
            {hypotenuse} (hyp)
          </text>
        )}
      </svg>
      {caption && <p className="text-[10px] text-center text-muted-foreground">{caption}</p>}
    </div>
  );
};

export default RightTrianglePlot;
