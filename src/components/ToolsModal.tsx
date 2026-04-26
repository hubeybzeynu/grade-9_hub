import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator as CalcIcon, Atom, Sparkles, X, Camera, MessageSquare } from 'lucide-react';
import CalculatorTool from './tools/CalculatorTool';
import PeriodicTableTool from './tools/PeriodicTableTool';
import AiAssistantTool from './tools/AiAssistantTool';
import LiveCameraTool from './tools/LiveCameraTool';
import AiHistoryTool from './tools/AiHistoryTool';

type Tab = 'calc' | 'table' | 'ai' | 'live' | 'history';

interface ToolsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

const ToolsModal = ({ open, onClose, initialTab = 'calc' }: ToolsModalProps) => {
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabs = useMemo(
    () => [
      { id: 'calc' as Tab, label: 'Calc', icon: CalcIcon },
      { id: 'table' as Tab, label: 'Elements', icon: Atom },
      { id: 'ai' as Tab, label: 'AI Chat', icon: Sparkles },
      { id: 'live' as Tab, label: 'Live', icon: Camera },
      { id: 'history' as Tab, label: 'History', icon: MessageSquare },
    ],
    [],
  );

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-stretch md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full md:max-w-2xl md:rounded-2xl border border-border flex flex-col max-h-screen md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0 gap-2">
          <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto flex-1 min-w-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg bg-destructive/10 active:bg-destructive/20"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'calc' && <CalculatorTool />}
          {tab === 'table' && <PeriodicTableTool />}
          {tab === 'ai' && <AiAssistantTool />}
          {tab === 'live' && <LiveCameraTool />}
          {tab === 'history' && <AiHistoryTool />}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ToolsModal;
