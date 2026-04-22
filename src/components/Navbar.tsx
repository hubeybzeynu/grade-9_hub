import { motion } from 'framer-motion';
import { Home, BookOpen, Users, Award, MoreHorizontal, ClipboardList, FileCheck, FileText, Info } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const mainTabs = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'textbooks', label: 'Books', icon: BookOpen },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'more', label: 'More', icon: MoreHorizontal },
];

const moreItems = [
  { key: 'mid', label: 'Mid Exam', icon: ClipboardList },
  { key: 'final', label: 'Final Exam', icon: FileCheck },
  { key: 'report', label: 'Report Card', icon: FileText },
  { key: 'results', label: 'Ministry Results', icon: Award },
];

const Navbar = ({ currentPage, onNavigate }: NavbarProps) => {
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = moreItems.some(item => item.key === currentPage);

  const handleTabClick = (key: string) => {
    if (key === 'more') {
      setShowMore(!showMore);
    } else {
      setShowMore(false);
      onNavigate(key);
    }
  };

  return (
    <>
      {/* Top App Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
          <span className="text-base font-semibold text-foreground">Grade 9 Portal</span>
        </div>
        <button
          onClick={() => onNavigate('info')}
          className={`p-2 rounded-full transition-colors ${
            currentPage === 'info' ? 'bg-primary/15 text-primary' : 'text-muted-foreground active:bg-muted'
          }`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* More Menu Overlay */}
      {showMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu Sheet */}
      {showMore && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-2 shadow-xl"
        >
          {moreItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setShowMore(false);
                onNavigate(item.key);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                currentPage === item.key
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground active:bg-muted'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
          {mainTabs.map((tab) => {
            const isActive = tab.key === 'more' ? isMoreActive || showMore : currentPage === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className="flex flex-col items-center justify-center flex-1 relative py-1 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-1 w-8 h-[3px] rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={`w-5 h-5 mb-0.5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
