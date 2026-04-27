import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import ToolsModal from './ToolsModal';

// Draggable floating Tools button. Position is persisted in localStorage so
// the button stays where the user dropped it across page navigations.
const POS_KEY = 'g9hub:fab-pos:v1';
const FAB_SIZE = 44;
const EDGE = 8;

const ToolsFab = () => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  // Initial position = top-right corner. Read saved position if any.
  useEffect(() => {
    const w = window.innerWidth;
    const defaultPos = { x: w - FAB_SIZE - 12, y: 12 };
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved?.x === 'number' && typeof saved?.y === 'number') {
          setPos(clampPos(saved));
          return;
        }
      }
    } catch { /* noop */ }
    setPos(defaultPos);
  }, []);

  // Re-clamp on viewport resize so the button never disappears off-screen.
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clampPos(p) : p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function clampPos(p: { x: number; y: number }) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.min(Math.max(EDGE, p.x), w - FAB_SIZE - EDGE),
      y: Math.min(Math.max(EDGE, p.y), h - FAB_SIZE - EDGE),
    };
  }

  if (!pos) return null;

  return (
    <>
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          left: EDGE,
          top: EDGE,
          right: window.innerWidth - FAB_SIZE - EDGE,
          bottom: window.innerHeight - FAB_SIZE - EDGE,
        }}
        onDragStart={() => { draggedRef.current = true; }}
        onDragEnd={(_e, info) => {
          const next = clampPos({
            x: pos.x + info.offset.x,
            y: pos.y + info.offset.y,
          });
          setPos(next);
          try { localStorage.setItem(POS_KEY, JSON.stringify(next)); } catch { /* noop */ }
          // Re-enable click after drag finishes.
          setTimeout(() => { draggedRef.current = false; }, 80);
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { if (!draggedRef.current) setOpen(true); }}
        style={{ left: pos.x, top: pos.y, width: FAB_SIZE, height: FAB_SIZE, touchAction: 'none' }}
        className="fixed z-[80] rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
        aria-label="Open tools (drag to move)"
      >
        <FlaskConical className="w-5 h-5 text-primary-foreground pointer-events-none" />
      </motion.button>

      <AnimatePresence>
        {open && <ToolsModal open={open} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default ToolsFab;
