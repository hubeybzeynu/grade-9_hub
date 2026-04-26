// Shared renderer for any "plot" payload returned by ai-solve.
// Used by both the AI Chat and the Chats history detail view.
import QuadraticPlot from './QuadraticPlot';
import FunctionPlot from './FunctionPlot';
import RightTrianglePlot from './RightTrianglePlot';
import GeometryShape from './GeometryShape';
import { elements, categoryColor } from '@/data/periodicTable';

const symbolMap = new Map(elements.map((e) => [e.symbol.toLowerCase(), e]));

interface Props { plot: any }

const PlotRenderer = ({ plot }: Props) => {
  if (!plot || typeof plot !== 'object') return null;

  if (plot.type === 'quadratic') {
    return <QuadraticPlot a={plot.a} b={plot.b} c={plot.c} roots={plot.roots || []} />;
  }
  if (plot.type === 'function') {
    return <FunctionPlot expr={plot.expr} xmin={plot.xmin} xmax={plot.xmax} />;
  }
  if (plot.type === 'triangle') {
    return (
      <RightTrianglePlot
        angleA={plot.angleA}
        opposite={plot.opposite}
        adjacent={plot.adjacent}
        hypotenuse={plot.hypotenuse}
        caption={plot.caption}
      />
    );
  }
  if (plot.type === 'shape') {
    return (
      <GeometryShape
        shape={plot.shape}
        side={plot.side}
        width={plot.width}
        height={plot.height}
        radius={plot.radius}
        caption={plot.caption}
        label={plot.label}
      />
    );
  }
  if (plot.type === 'elements' && Array.isArray(plot.symbols)) {
    return (
      <div>
        {plot.caption && (
          <p className="text-xs text-muted-foreground mb-2">{plot.caption}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {plot.symbols.map((sym: string, i: number) => {
            const el = symbolMap.get(sym.toLowerCase());
            if (!el) return null;
            return (
              <div
                key={`${sym}-${i}`}
                className={`${categoryColor(el.category)} rounded-lg px-3 py-2 text-white animate-scale-in`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="text-[9px] opacity-80">{el.number}</p>
                <p className="text-lg font-bold leading-none">{el.symbol}</p>
                <p className="text-[10px]">{el.name}</p>
                <p className="text-[9px] opacity-80">{el.mass} u</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default PlotRenderer;
