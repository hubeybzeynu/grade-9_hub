import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Award, X, Download, ChevronLeft, ChevronRight, BookOpen, FileCheck, Filter, Lock, UserCheck } from 'lucide-react';
import { externalSupabase } from '@/integrations/supabase/externalClient';
import { supabase } from '@/integrations/supabase/client';

interface ExamResult {
  student_id: string;
  result_image_url: string;
  answer_image_url: string | null;
  student_name: string | null;
  subject: string | null;
  grade_group: string | null;
  student_password: string | null;
}

interface ExamResultPageProps {
  type: 'mid' | 'final';
}

const ExamResultPage = ({ type }: ExamResultPageProps) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingResult, setPendingResult] = useState<ExamResult | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [gradeGroups, setGradeGroups] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGradeGroup, setSelectedGradeGroup] = useState<string>('all');
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [navLocked, setNavLocked] = useState(false);
  const [navPassword, setNavPassword] = useState('');
  const [navPasswordError, setNavPasswordError] = useState('');
  // Student verification
  const [verifiedStudent, setVerifiedStudent] = useState<{ id: number; name: string; english_name: string; image_url: string | null } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const title = type === 'mid' ? 'Mid Exam' : 'Final Exam';
  const gradient = type === 'mid' ? 'from-violet-500 to-purple-600' : 'from-rose-500 to-red-600';
  const Icon = type === 'mid' ? BookOpen : FileCheck;
  const tableName = type === 'mid' ? 'mid_results' : 'final_results';

  const getResultKey = (r: ExamResult) => `${r.student_id}|${r.subject || ''}`;

  const processData = useCallback((data: ExamResult[]) => {
    setResults(data);
    const uniqueSubjects = [...new Set(data.map(r => r.subject).filter(Boolean))] as string[];
    const uniqueGrades = [...new Set(data.map(r => r.grade_group).filter(Boolean))] as string[];
    setSubjects(uniqueSubjects);
    setGradeGroups(uniqueGrades);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const { data } = await externalSupabase
        .from(tableName)
        .select('student_id, result_image_url, answer_image_url, student_name, subject, grade_group, student_password')
        .order('student_id');
      
      if (data) processData(data);
      setLoading(false);
    };
    fetchResults();

    // Realtime subscription for live updates
    const channel = externalSupabase
      .channel(`${tableName}_realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        async () => {
          // Re-fetch all results on any change
          const { data } = await externalSupabase
            .from(tableName)
            .select('student_id, result_image_url, answer_image_url, student_name, subject, grade_group, student_password')
            .order('student_id');
          if (data) processData(data);
        }
      )
      .subscribe();

    return () => {
      externalSupabase.removeChannel(channel);
    };
  }, [tableName, processData]);

  // Filter results when subject or grade_group changes
  useEffect(() => {
    let filtered = results;
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(r => r.subject === selectedSubject);
    }
    if (selectedGradeGroup !== 'all') {
      filtered = filtered.filter(r => r.grade_group === selectedGradeGroup);
    }
    setFilteredResults(filtered);
  }, [selectedSubject, selectedGradeGroup, results]);

  const studentIds = filteredResults.map(r => r.student_id);

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
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleVerify = async () => {
    setError('');
    setVerifiedStudent(null);
    if (!studentId.trim()) {
      setError('Please enter your student number');
      return;
    }
    const idNum = parseInt(studentId.trim());
    if (isNaN(idNum)) {
      setError('Please enter a valid number');
      return;
    }
    setVerifying(true);
    const { data } = await supabase
      .from('students')
      .select('id, name, english_name, image_url')
      .eq('id', idNum)
      .single();
    setVerifying(false);
    if (data) {
      setVerifiedStudent(data);
      // Auto-search for results immediately after verification
      const studentResults = filteredResults.filter(r => r.student_id === String(data.id));
      if (studentResults.length > 0) {
        const found = studentResults[0];
        const key = getResultKey(found);
        if (found.student_password && !unlockedKeys.has(key)) {
          setPendingResult(found);
          setShowPasswordPrompt(true);
          setPassword('');
        } else {
          setCurrentResult(found);
          setShowResult(true);
          setShowAnswer(false);
          setNavLocked(false);
        }
      } else {
        setError('No results found for this student. Results may not be uploaded yet.');
      }
    } else {
      setError('Student not found. Check your number.');
    }
  };

  const handleSearch = () => {
    setError('');
    if (!verifiedStudent) {
      // Auto-verify first
      handleVerify();
      return;
    }
    const studentResults = filteredResults.filter(r => r.student_id === String(verifiedStudent.id));
    if (studentResults.length > 0) {
      const found = studentResults[0];
      const key = getResultKey(found);
      if (found.student_password && !unlockedKeys.has(key)) {
        setPendingResult(found);
        setShowPasswordPrompt(true);
        setPassword('');
      } else {
        setCurrentResult(found);
        setShowResult(true);
        setShowAnswer(false);
        setNavLocked(false);
      }
    } else {
      setError('No results found for this student. Results may not be uploaded yet.');
    }
  };

  const handlePasswordSubmit = () => {
    if (!pendingResult) return;
    if (password === pendingResult.student_password) {
      const key = getResultKey(pendingResult);
      setUnlockedKeys(prev => new Set(prev).add(key));
      setCurrentResult(pendingResult);
      setShowResult(true);
      setShowAnswer(false);
      setShowPasswordPrompt(false);
      setPendingResult(null);
      setPassword('');
      setError('');
      setNavLocked(false);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleNavPasswordSubmit = () => {
    if (!currentResult) return;
    if (navPassword === currentResult.student_password) {
      const key = getResultKey(currentResult);
      setUnlockedKeys(prev => new Set(prev).add(key));
      setNavLocked(false);
      setNavPassword('');
      setNavPasswordError('');
    } else {
      setNavPasswordError('Incorrect password');
    }
  };

  const navigateResult = (direction: 'prev' | 'next') => {
    if (!currentResult) return;
    const idx = filteredResults.findIndex(r => r.student_id === currentResult.student_id && r.subject === currentResult.subject);
    let newIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (newIdx < 0) newIdx = filteredResults.length - 1;
    if (newIdx >= filteredResults.length) newIdx = 0;
    
    const nextResult = filteredResults[newIdx];
    const key = getResultKey(nextResult);
    
    setCurrentResult(nextResult);
    setStudentId(nextResult.student_id);
    setShowAnswer(false);
    
    // Check if this result is password-protected and not yet unlocked
    if (nextResult.student_password && !unlockedKeys.has(key)) {
      setNavLocked(true);
      setNavPassword('');
      setNavPasswordError('');
    } else {
      setNavLocked(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
            <h1 className="text-xl font-bold text-foreground">{title} Results</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Enter your student number to view results</p>
          </div>

          <motion.div variants={itemVariants} className="bg-card rounded-2xl p-5 mb-4 border border-border shadow-sm">
            {loading ? (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-muted-foreground">Loading results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <Icon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No {title.toLowerCase()} results available yet.</p>
                <p className="text-muted-foreground text-sm mt-2">Results will appear here once they are uploaded.</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                {(subjects.length > 0 || gradeGroups.length > 0) && (
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Filter className="w-4 h-4" />
                      <span>Filter Results</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {subjects.length > 0 && (
                        <div className="flex-1 min-w-[140px]">
                          <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                          <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          >
                            <option value="all">All Subjects</option>
                            {subjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {gradeGroups.length > 0 && (
                        <div className="flex-1 min-w-[140px]">
                          <label className="text-xs text-muted-foreground mb-1 block">Grade Group</label>
                          <select
                            value={selectedGradeGroup}
                            onChange={(e) => setSelectedGradeGroup(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          >
                            <option value="all">All Grades</option>
                            {gradeGroups.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="Enter your student number (e.g., 5)"
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); setVerifiedStudent(null); setShowResult(false); setCurrentResult(null); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && (verifiedStudent ? handleSearch() : handleVerify())}
                    className={`input-glass pl-12 ${error ? 'border-destructive focus:ring-destructive/50' : ''}`}
                  />
                </div>

                {/* Verified student info */}
                {verifiedStudent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    {verifiedStudent.image_url && (
                      <img src={verifiedStudent.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{verifiedStudent.english_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{verifiedStudent.name}</p>
                    </div>
                  </motion.div>
                )}

                {error && !showPasswordPrompt && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm mb-4"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="flex gap-3">
                  {!verifiedStudent ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVerify}
                      disabled={verifying}
                      className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                    >
                      {verifying ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Verify Student
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSearch}
                      className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                    >
                      <Search className="w-4 h-4" />
                      View Result
                    </motion.button>
                  )}
                </div>

                {studentIds.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-3 text-center">
                      {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
                      {selectedSubject !== 'all' && ` for ${selectedSubject}`}
                      {selectedGradeGroup !== 'all' && ` (Grade ${selectedGradeGroup})`}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {studentIds.slice(0, 6).map((id) => (
                        <motion.button
                          key={id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setStudentId(id)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors"
                        >
                          {id}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Password Modal (only for initial search, not arrow nav) */}
      <AnimatePresence>
        {showPasswordPrompt && pendingResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPasswordPrompt(false); setPendingResult(null); setError(''); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full text-center"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4`}>
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Password Required</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Student: <span className="font-mono text-foreground">{pendingResult.student_id}</span>
                {pendingResult.student_name && ` — ${pendingResult.student_name}`}
              </p>
              <p className="text-sm text-muted-foreground mb-4">Enter your password to view the result</p>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="input-glass mb-3 text-center"
              />
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm mb-3">
                  {error}
                </motion.p>
              )}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordSubmit}
                  className="btn-gradient flex-1"
                >
                  Unlock Result
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowPasswordPrompt(false); setPendingResult(null); setError(''); }}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && currentResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowResult(false); setShowAnswer(false); setNavLocked(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); navigateResult('prev'); }}
              className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); navigateResult('next'); }}
              className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowResult(false); setShowAnswer(false); setNavLocked(false); }}
                className="absolute -top-12 right-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>

              <div className="glass-card p-4 overflow-hidden">
                <div className="text-center mb-2 space-y-1">
                  <div>
                    <span className="text-sm text-muted-foreground font-mono">ID: {currentResult.student_id}</span>
                    {currentResult.student_name && !navLocked && (
                      <>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{currentResult.student_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {currentResult.subject && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {currentResult.subject}
                      </span>
                    )}
                    {currentResult.grade_group && (
                      <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium">
                        Grade {currentResult.grade_group}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {filteredResults.findIndex(r => r.student_id === currentResult.student_id && r.subject === currentResult.subject) + 1} of {filteredResults.length}
                    </span>
                  </div>
                </div>

                {/* If locked via navigation, show inline password instead of image */}
                {navLocked ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 px-6"
                  >
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6`}>
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Result Locked</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Enter password for student <span className="font-mono text-foreground">{currentResult.student_id}</span>
                    </p>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={navPassword}
                      onChange={(e) => { setNavPassword(e.target.value); setNavPasswordError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleNavPasswordSubmit()}
                      className="input-glass mb-3 text-center max-w-xs w-full"
                      autoFocus
                    />
                    {navPasswordError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm mb-3">
                        {navPasswordError}
                      </motion.p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNavPasswordSubmit}
                      className="btn-gradient px-8 py-3 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Unlock
                    </motion.button>
                  </motion.div>
                ) : (
                  <>
                    <img
                      src={showAnswer && currentResult.answer_image_url ? currentResult.answer_image_url : currentResult.result_image_url}
                      alt={showAnswer ? 'Answer Key' : `${title} Result`}
                      className="w-full rounded-xl"
                    />

                    <div className="mt-4 flex gap-3 flex-wrap">
                      <motion.button
                        onClick={() => handleDownload(currentResult.result_image_url, `${type}_result_${currentResult.student_id}_${currentResult.subject || ''}.jpg`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-gradient flex-1 flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </motion.button>

                      {currentResult.answer_image_url && (
                        <motion.button
                          onClick={() => setShowAnswer(!showAnswer)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            showAnswer
                              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                          {showAnswer ? 'Show Result' : 'Show Answer'}
                        </motion.button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExamResultPage;
