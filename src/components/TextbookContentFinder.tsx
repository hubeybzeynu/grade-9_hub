import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, Dumbbell, Activity, FileQuestion } from 'lucide-react';
import { textbookContentIndex, textbookPageInfo, ContentItem } from '@/data/textbookContent';

interface TextbookContentFinderProps {
  subject: string;
  onGoToPage: (page: number) => void;
}

const typeConfig = {
  exercise: { label: 'Exercises', icon: Dumbbell, color: 'bg-blue-500' },
  activity: { label: 'Activities', icon: Activity, color: 'bg-emerald-500' },
  review: { label: 'Review', icon: FileQuestion, color: 'bg-amber-500' },
};

const TextbookContentFinder = ({ subject, onGoToPage }: TextbookContentFinderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'exercise' | 'activity' | 'review'>('all');

  const frontMatter = textbookPageInfo[subject]?.frontMatter || 0;
  // Only show items in the Arabic-numbered (book) pages — skip front matter (roman numerals i, ii, iii…)
  const items = (textbookContentIndex[subject] || []).filter((it) => it.page > frontMatter);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesType = activeFilter === 'all' || item.type === activeFilter;
      const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [items, activeFilter, query]);

  const counts = useMemo(() => ({
    all: items.length,
    exercise: items.filter(i => i.type === 'exercise').length,
    activity: items.filter(i => i.type === 'activity').length,
    review: items.filter(i => i.type === 'review').length,
  }), [items]);

  const handleSelect = (item: ContentItem) => {
    onGoToPage(item.page);
    setIsOpen(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg"
      >
        <Search className="w-5 h-5 text-primary-foreground" />
      </motion.button>

      {/* Content Finder Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border max-h-[75vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {subject} Content ({items.length} items)
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg active:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 pb-2">
                <input
                  type="text"
                  placeholder="Search exercises, activities, reviews..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Filter chips with counts */}
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                {(['all', 'exercise', 'activity', 'review'] as const).map((type) => {
                  const isActive = activeFilter === type;
                  const config = type !== 'all' ? typeConfig[type] : null;
                  const count = counts[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {type === 'all' ? `All (${count})` : `${config?.label} (${count})`}
                    </button>
                  );
                })}
              </div>

              {/* Content list */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No content found</p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((item, i) => {
                      const config = typeConfig[item.type];
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={`${item.page}-${item.type}-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.5) }}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 active:bg-muted text-left transition-colors"
                        >
                          <div className={`w-9 h-9 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">Book page {item.page - frontMatter}</p>
                          </div>
                          <span className="text-xs text-primary font-mono shrink-0">p.{item.page - frontMatter}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TextbookContentFinder;
