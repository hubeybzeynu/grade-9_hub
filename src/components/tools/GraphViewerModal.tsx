// Modal that shows one or more plots from an AI message.
// If the message has multiple plots (e.g. a function graph + a triangle),
// a tab switcher lets the user pick which one to view.
import { X, BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import PlotRenderer from './PlotRenderer';

interface Props {
  plot: any;
  onClose: () => void;
}

const labelFor = (p: any, i: number): string => {
  if (!p || typeof p !== 'object') return `View ${i + 1}`;
  switch (p.type) {
    case 'quadratic': return 'Quadratic';
    case 'function':  return 'Function';
    case 'triangle':  return 'Triangle';
    case 'shape':     return p.shape ? `Shape · ${p.shape}` : 'Shape';
    case 'elements':  return 'Elements';
    default:          return p.type ? String(p.type) : `View ${i + 1}`;
  }
};

const GraphViewerModal = ({ plot, onClose }: Props) => {
  // Normalise to an array so we can support multi-plot answers without
  // breaking single-plot ones.
  const plots = useMemo<any[]>(() => {
    if (Array.isArray(plot)) return plot.filter(Boolean);
    if (plot && typeof plot === 'object' && Array.isArray((plot as any).plots)) {
      return (plot as any).plots.filter(Boolean);
    }
    return plot ? [plot] : [];
  }, [plot]);

  const [active, setActive] = useState(0);
  const current = plots[active];

  return (
    <div
      className="fixed inset-0 z-[120] bg-background/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header — close button on the RIGHT */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-sm font-semibold">Graph viewer</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-destructive/10 active:bg-destructive/20"
            aria-label="Close graph viewer"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>

        {/* Selector when there are multiple plots */}
        {plots.length > 1 && (
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-border/60 bg-muted/40">
            {plots.map((p, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
                  i === active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border'
                }`}
              >
                {labelFor(p, i)}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto p-3">
          {current ? (
            <PlotRenderer plot={current} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              No graph data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphViewerModal;
