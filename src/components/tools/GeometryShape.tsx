// Renders common 2D shapes (square, circle, rectangle, triangle, hexagon, etc.)
// with sides/measurements labelled. Used by the AI tool when a "shape" plot is returned.

interface ShapeProps {
  shape:
    | 'square' | 'rectangle' | 'circle' | 'triangle'
    | 'right-triangle' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon'
    | 'parallelogram' | 'trapezoid' | 'rhombus'
    | 'square-in-circle' | 'circle-in-square' | 'triangle-in-circle';
  side?: number;        // generic side / radius / base
  width?: number;
  height?: number;
  radius?: number;
  caption?: string;
  label?: string;       // e.g. area / perimeter result to show under
}

const W = 320, H = 220, CX = W / 2, CY = H / 2;
const stroke = 'hsl(var(--primary))';
const fill = 'hsl(var(--primary) / 0.12)';
const accent = 'hsl(var(--destructive))';
const text = 'hsl(var(--foreground))';

const regularPolygon = (n: number, r: number, cx = CX, cy = CY, rotate = -Math.PI / 2) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rotate + (i * 2 * Math.PI) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};

const polyPath = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';

const GeometryShape = ({ shape, side = 6, width, height, radius, caption, label }: ShapeProps) => {
  const w = width ?? side;
  const h = height ?? side;
  const r = radius ?? side;

  let svg: JSX.Element;

  switch (shape) {
    case 'square': {
      const s = 140;
      svg = (
        <>
          <rect x={CX - s / 2} y={CY - s / 2} width={s} height={s} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY - s / 2 - 6} fontSize="11" textAnchor="middle" fill={text}>side = {side}</text>
          <text x={CX + s / 2 + 8} y={CY + 4} fontSize="11" fill={text}>{side}</text>
        </>
      );
      break;
    }
    case 'rectangle': {
      const sw = 180, sh = 110;
      svg = (
        <>
          <rect x={CX - sw / 2} y={CY - sh / 2} width={sw} height={sh} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY - sh / 2 - 6} fontSize="11" textAnchor="middle" fill={text}>w = {w}</text>
          <text x={CX + sw / 2 + 8} y={CY + 4} fontSize="11" fill={text}>h = {h}</text>
        </>
      );
      break;
    }
    case 'circle': {
      svg = (
        <>
          <circle cx={CX} cy={CY} r={80} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1={CX} y1={CY} x2={CX + 80} y2={CY} stroke={accent} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x={CX + 40} y={CY - 6} fontSize="11" textAnchor="middle" fill={accent}>r = {r}</text>
          <circle cx={CX} cy={CY} r="2" fill={accent} />
        </>
      );
      break;
    }
    case 'triangle': {
      const pts = regularPolygon(3, 90);
      svg = (
        <>
          <path d={polyPath(pts)} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY + 95} fontSize="11" textAnchor="middle" fill={text}>side = {side}</text>
        </>
      );
      break;
    }
    case 'right-triangle': {
      const x0 = CX - 80, y0 = CY + 60;
      const x1 = CX + 80, y1 = y0;
      const x2 = x0, y2 = CY - 60;
      svg = (
        <>
          <path d={`M${x0},${y0} L${x1},${y1} L${x2},${y2} Z`} fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x={x0} y={y0 - 12} width="12" height="12" fill="none" stroke={stroke} strokeWidth="1" />
          <text x={(x0 + x1) / 2} y={y0 + 16} fontSize="11" textAnchor="middle" fill={text}>base = {w}</text>
          <text x={x0 - 8} y={(y0 + y2) / 2} fontSize="11" textAnchor="end" fill={text}>height = {h}</text>
        </>
      );
      break;
    }
    case 'pentagon':
    case 'hexagon':
    case 'heptagon':
    case 'octagon': {
      const n = { pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 }[shape];
      const pts = regularPolygon(n, 85);
      svg = (
        <>
          <path d={polyPath(pts)} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY + 105} fontSize="11" textAnchor="middle" fill={text}>side ≈ {side}</text>
        </>
      );
      break;
    }
    case 'parallelogram': {
      const sw = 160, sh = 90, skew = 30;
      svg = (
        <>
          <path d={`M${CX - sw / 2 + skew},${CY - sh / 2} L${CX + sw / 2 + skew},${CY - sh / 2} L${CX + sw / 2 - skew},${CY + sh / 2} L${CX - sw / 2 - skew},${CY + sh / 2} Z`} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY + sh / 2 + 16} fontSize="11" textAnchor="middle" fill={text}>base = {w}, height = {h}</text>
        </>
      );
      break;
    }
    case 'trapezoid': {
      svg = (
        <>
          <path d={`M${CX - 50},${CY - 50} L${CX + 50},${CY - 50} L${CX + 90},${CY + 50} L${CX - 90},${CY + 50} Z`} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY + 70} fontSize="11" textAnchor="middle" fill={text}>parallel sides = {w}, {h}</text>
        </>
      );
      break;
    }
    case 'rhombus': {
      svg = (
        <>
          <path d={`M${CX},${CY - 80} L${CX + 60},${CY} L${CX},${CY + 80} L${CX - 60},${CY} Z`} fill={fill} stroke={stroke} strokeWidth="2" />
          <text x={CX} y={CY + 100} fontSize="11" textAnchor="middle" fill={text}>side = {side}</text>
        </>
      );
      break;
    }
    case 'square-in-circle': {
      const R = 90;
      const s = R * Math.sqrt(2);
      svg = (
        <>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={stroke} strokeWidth="2" />
          <rect x={CX - s / 2} y={CY - s / 2} width={s} height={s} fill={fill} stroke={accent} strokeWidth="2" />
          <line x1={CX} y1={CY} x2={CX + R} y2={CY} stroke={accent} strokeDasharray="3 3" />
          <text x={CX + R / 2} y={CY - 6} fontSize="11" textAnchor="middle" fill={accent}>r = {r}</text>
          <text x={CX} y={CY + R + 16} fontSize="11" textAnchor="middle" fill={text}>square inside circle</text>
        </>
      );
      break;
    }
    case 'circle-in-square': {
      const s = 160;
      svg = (
        <>
          <rect x={CX - s / 2} y={CY - s / 2} width={s} height={s} fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx={CX} cy={CY} r={s / 2} fill="none" stroke={accent} strokeWidth="2" />
          <text x={CX} y={CY + s / 2 + 16} fontSize="11" textAnchor="middle" fill={text}>circle inside square (side {side})</text>
        </>
      );
      break;
    }
    case 'triangle-in-circle': {
      const R = 90;
      const pts = regularPolygon(3, R);
      svg = (
        <>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={stroke} strokeWidth="2" />
          <path d={polyPath(pts)} fill={fill} stroke={accent} strokeWidth="2" />
          <text x={CX} y={CY + R + 16} fontSize="11" textAnchor="middle" fill={text}>triangle inside circle</text>
        </>
      );
      break;
    }
    default:
      svg = <text x={CX} y={CY} textAnchor="middle" fill={text}>Unknown shape</text>;
  }

  return (
    <div className="bg-muted rounded-xl p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {svg}
      </svg>
      {(caption || label) && (
        <p className="text-[11px] text-muted-foreground text-center mt-1">
          {caption}{caption && label ? ' · ' : ''}{label}
        </p>
      )}
    </div>
  );
};

export default GeometryShape;
