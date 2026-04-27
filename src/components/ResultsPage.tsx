import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Award, ImageIcon, X, HelpCircle, Download, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { resultImages, downloadLinks, nameToIdMap } from '@/data/ministryResults';
import { students } from '@/data/students';

const ResultsPage = () => {
  const [studentId, setStudentId] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showForgetId, setShowForgetId] = useState(false);
  const [forgetNameInput, setForgetNameInput] = useState('');
  const [forgetFeedback, setForgetFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [forgetMatches, setForgetMatches] = useState<{ name: string; id: string; imageUrl?: string }[]>([]);
  const [error, setError] = useState('');
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goPrev = () => {
    const idx = studentIds.indexOf(studentId);
    setStudentId(studentIds[idx > 0 ? idx - 1 : studentIds.length - 1]);
  };
  const goNext = () => {
    const idx = studentIds.indexOf(studentId);
    setStudentId(studentIds[idx < studentIds.length - 1 ? idx + 1 : 0]);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const studentIds = Object.keys(resultImages);

  // Download function for result images
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handleSearch = () => {
    setError('');
    if (!studentId.trim()) {
      setError('Please enter your student ID');
      return;
    }
    if (resultImages[studentId]) {
      setShowResult(true);
    } else {
      setError('Student ID not found. Please check your ID or contact support.');
    }
  };

  // Find student photo from directory by matching name
  const findStudentPhoto = (name: string): string | undefined => {
    const normalized = name.normalize().toLowerCase();
    const found = students.find(s => 
      s.name.normalize().toLowerCase() === normalized || 
      s.englishName.normalize().toLowerCase() === normalized
    );
    return found?.imageUrl;
  };

  const handleForgetSubmit = () => {
    const nameInput = forgetNameInput.trim();
    setForgetMatches([]);
    
    if (!nameInput) {
      setForgetFeedback({ message: 'Please type your name', type: 'error' });
      return;
    }

    const normalizedInput = nameInput.normalize().toLowerCase();

    // Try exact match first
    for (const storedName in nameToIdMap) {
      const normalizedStoredName = storedName.normalize().toLowerCase();
      if (normalizedStoredName === normalizedInput) {
        const foundId = nameToIdMap[storedName];
        setForgetFeedback({ message: 'Result found — opening...', type: 'success' });
        setTimeout(() => {
          setShowForgetId(false);
          setForgetNameInput('');
          setForgetFeedback(null);
          setForgetMatches([]);
          setStudentId(foundId);
          setShowResult(true);
        }, 500);
        return;
      }
    }

    // Also search by English name in students array
    const englishExact = students.find(s => s.englishName.normalize().toLowerCase() === normalizedInput);
    if (englishExact) {
      // Find the ministry ID from nameToIdMap using Amharic name
      const amharicName = englishExact.name;
      if (nameToIdMap[amharicName]) {
        const foundId = nameToIdMap[amharicName];
        setForgetFeedback({ message: `Found: ${englishExact.englishName} — opening...`, type: 'success' });
        setTimeout(() => {
          setShowForgetId(false);
          setForgetNameInput('');
          setForgetFeedback(null);
          setForgetMatches([]);
          setStudentId(foundId);
          setShowResult(true);
        }, 500);
        return;
      }
    }

    // Look for partial matches in both Amharic (nameToIdMap) and English (students)
    const matchMap = new Map<string, { name: string; id: string; imageUrl?: string }>();
    
    for (const storedName in nameToIdMap) {
      const normalizedStoredName = storedName.normalize().toLowerCase();
      if (normalizedStoredName.includes(normalizedInput)) {
        matchMap.set(nameToIdMap[storedName], { 
          name: storedName, 
          id: nameToIdMap[storedName], 
          imageUrl: findStudentPhoto(storedName) 
        });
      }
    }

    // Also match English names from students
    for (const s of students) {
      if (s.englishName.normalize().toLowerCase().includes(normalizedInput)) {
        const amharicName = s.name;
        if (nameToIdMap[amharicName] && !matchMap.has(nameToIdMap[amharicName])) {
          matchMap.set(nameToIdMap[amharicName], {
            name: `${s.englishName} (${amharicName})`,
            id: nameToIdMap[amharicName],
            imageUrl: s.imageUrl,
          });
        }
      }
    }

    const partialMatches = Array.from(matchMap.values());

    if (partialMatches.length === 1) {
      const found = partialMatches[0];
      setForgetFeedback({ message: `Found: "${found.name}" — opening...`, type: 'success' });
      setTimeout(() => {
        setShowForgetId(false);
        setForgetNameInput('');
        setForgetFeedback(null);
        setForgetMatches([]);
        setStudentId(found.id);
        setShowResult(true);
      }, 1500);
      return;
    } else if (partialMatches.length > 1) {
      const limited = partialMatches.slice(0, 3);
      setForgetMatches(limited);
      setForgetFeedback({ 
        message: 'Multiple students found. Which one is you?', 
        type: 'error' 
      });
      return;
    }

    setForgetFeedback({ 
      message: 'Not found. Make sure you typed your name correctly in Amharic or English.', 
      type: 'error' 
    });
  };

  const handleSelectMatch = (match: { name: string; id: string }) => {
    setForgetFeedback({ message: `Opening result for "${match.name}"...`, type: 'success' });
    setTimeout(() => {
      setShowForgetId(false);
      setForgetNameInput('');
      setForgetFeedback(null);
      setForgetMatches([]);
      setStudentId(match.id);
      setShowResult(true);
    }, 500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen pt-16 pb-20 px-4"
      >
        <div className="max-w-2xl mx-auto">
          <div className="py-4 mb-2">
            <h1 className="text-xl font-bold text-foreground">Ministry Results</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Enter your student ID to view results</p>
          </div>

          {/* Search Box */}
          <motion.div
            variants={itemVariants}
            className="bg-card rounded-2xl p-5 mb-4 border border-border shadow-sm"
          >
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter your Student ID (e.g., 219353)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={`input-glass pl-12 ${error ? 'border-destructive focus:ring-destructive/50' : ''}`}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm mb-4"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                className="btn-gradient flex-1"
              >
                <Search className="w-5 h-5 inline mr-2" />
                Search Result
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowGallery(true)}
                className="btn-ghost"
                title="View All Results"
              >
                <ImageIcon className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Forgot ID Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForgetId(true)}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Forgot your ID? Find by name
            </motion.button>
          </motion.div>

          {/* Help Section */}
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowHelp(true)}
              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Can't find your result?
            </motion.button>
          </motion.div>

          {/* Sample IDs */}
          <motion.div
            variants={itemVariants}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground mb-3">Try these sample IDs:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {studentIds.slice(0, 4).map((id) => (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStudentId(id)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-mono transition-colors"
                >
                  {id}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Result Modal - Full screen with proper image sizing */}
      <AnimatePresence>
        {showResult && resultImages[studentId] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
              <span className="text-sm text-white/70 font-mono">ID: {studentId}</span>
              <span className="text-xs text-white/50">
                {studentIds.indexOf(studentId) + 1} / {studentIds.length}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowResult(false)}
                className="p-2 rounded-full bg-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* Image area - full width with swipe */}
            <div
              className="flex-1 flex items-center justify-center overflow-auto p-2 relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y' }}
            >
              {/* Navigation arrows - small, outside the image */}
              <button
                onClick={goPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>

              <motion.img
                key={studentId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                src={resultImages[studentId]}
                alt="Ministry Result"
                className="max-w-full max-h-full object-contain rounded-lg select-none"
                draggable={false}
              />
            </div>

            {/* Bottom bar */}
            <div className="px-4 py-3 bg-black/80 shrink-0">
              <motion.button
                onClick={() => {
                  const url = downloadLinks[studentId] || resultImages[studentId];
                  handleDownload(url, `result_${studentId}.jpg`);
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Allow download to save this image
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Modal - Grid View */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold gradient-text">All Results Gallery</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowGallery(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {studentIds.map((id, index) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowGallery(false);
                      setStudentId(id);
                      setShowResult(true);
                    }}
                    className="relative cursor-pointer group rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all"
                  >
                    <img
                      src={resultImages[id]}
                      alt={`Result ${id}`}
                      className="w-full h-32 object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-white font-mono text-sm font-semibold">{id}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowGallery(false)}
                  className="btn-ghost px-8"
                >
                  Exit Gallery
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot ID Modal */}
      <AnimatePresence>
        {showForgetId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowForgetId(false);
              setForgetNameInput('');
              setForgetFeedback(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold gradient-text mb-2">Forgot your ID?</h3>
                <p className="text-muted-foreground text-sm">
                  Type your name in Amharic or English to find your result.
                </p>
              </div>

              <input
                type="text"
                placeholder="ስምዎን ያስገቡ (Type your name)"
                value={forgetNameInput}
                onChange={(e) => setForgetNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleForgetSubmit()}
                className="input-glass mb-4 text-center"
                autoFocus
              />

              <AnimatePresence>
                {forgetFeedback && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-sm mb-4 text-center ${
                      forgetFeedback.type === 'success' ? 'text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {forgetFeedback.message}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Photo selection when multiple matches */}
              {forgetMatches.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {forgetMatches.map((match) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectMatch(match)}
                      className="cursor-pointer group rounded-xl overflow-hidden border-2 border-white/10 hover:border-primary/50 transition-all"
                    >
                      {match.imageUrl ? (
                        <img
                          src={match.imageUrl}
                          alt={match.name}
                          className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-2 text-center bg-white/5">
                        <p className="text-xs font-medium truncate">{match.name.split('(')[0].trim()}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {match.id}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleForgetSubmit}
                  className="btn-gradient flex-1"
                >
                  Find Result
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowForgetId(false);
                    setForgetNameInput('');
                    setForgetFeedback(null);
                    setForgetMatches([]);
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full text-center"
            >
              <HelpCircle className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Help & Support</h3>
              <p className="text-muted-foreground mb-6">
                If you can't find your result, please contact us for assistance.
              </p>
              <div className="flex gap-3">
                <motion.a
                  href="https://t.me/NOPEOPLECANGUESSME"
                  target="_blank"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-gradient flex-1"
                >
                  Contact Support
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowHelp(false)}
                  className="btn-ghost"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResultsPage;
