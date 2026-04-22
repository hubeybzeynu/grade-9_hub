import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import ToolsModal from './ToolsModal';

// Top-right floating button present on every page (except splash/onboarding).
const ToolsFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-[80] w-11 h-11 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shadow-lg"
        aria-label="Open tools"
      >
        <FlaskConical className="w-5 h-5 text-primary-foreground" />
      </motion.button>

      <AnimatePresence>
        {open && <ToolsModal open={open} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default ToolsFab;
