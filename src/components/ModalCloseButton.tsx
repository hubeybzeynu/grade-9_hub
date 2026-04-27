// Standard modal close button — always pinned top-right with destructive
// styling so it can never be confused with the floating Tools button (which
// is now below modals on z-index).
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onClick: () => void;
  className?: string;
  /** Use light-on-dark variant when sitting on a dark/photo background. */
  variant?: 'default' | 'overlay';
  ariaLabel?: string;
}

const ModalCloseButton = ({ onClick, className = '', variant = 'default', ariaLabel = 'Close' }: Props) => {
  const colors =
    variant === 'overlay'
      ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
      : 'bg-destructive/10 hover:bg-destructive/20 text-destructive';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`absolute top-3 right-3 z-[60] p-2 rounded-xl ${colors} transition-colors ${className}`}
    >
      <X className="w-5 h-5" />
    </motion.button>
  );
};

export default ModalCloseButton;
