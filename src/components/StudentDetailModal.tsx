import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Send, Instagram, ClipboardList, FileCheck, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import { Student } from '@/data/students';
import { externalSupabase } from '@/integrations/supabase/externalClient';
import { supabase } from '@/integrations/supabase/client';

type TabType = 'info' | 'mid' | 'final' | 'report';

interface ExamResult {
  student_id: string;
  result_image_url: string;
  answer_image_url: string | null;
  student_name: string | null;
  subject: string | null;
  grade_group: string | null;
  student_password: string | null;
}

interface ReportCardData {
  student_id: string;
  student_name: string | null;
  sex: string | null;
  age: number | null;
  grade: string | null;
  subjects: Record<string, Record<string, number | null>>;
  conduct: Record<string, Record<string, string | null>>;
  promoted_to: string | null;
  detained_in_grade: string | null;
  rank: Record<string, number | null>;
  card_password: string | null;
  total_students: number | null;
}

const SUBJECTS = [
  'Amharic', 'English', 'Mathematics', 'General Science', 'Social Studies',
  'Citizenship Education', 'Performing & Visual Arts', 'Information Technology',
  'Health & Physical Education', 'Career & Technical Education'
];

interface Props {
  student: Student;
  onClose: () => void;
}

const StudentDetailModal = ({ student, onClose }: Props) => {
  const [tab, setTab] = useState<TabType>('info');
  const [midResults, setMidResults] = useState<ExamResult[]>([]);
  const [finalResults, setFinalResults] = useState<ExamResult[]>([]);
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState<Set<string>>(new Set());
  const [reportCardLocked, setReportCardLocked] = useState(true);
  const [reportCardPwdInput, setReportCardPwdInput] = useState('');
  const [reportCardPwdError, setReportCardPwdError] = useState('');

  const getKey = (r: ExamResult, type: string) => `${type}|${r.student_id}|${r.subject || ''}`;

  useEffect(() => {
    if (tab === 'mid' || tab === 'final') {
      fetchExamResults(tab);
    } else if (tab === 'report') {
      fetchReportCard();
    }
  }, [tab]);

  const fetchExamResults = async (type: 'mid' | 'final') => {
    setLoading(true);
    const tableName = type === 'mid' ? 'mid_results' : 'final_results';
    const { data } = await externalSupabase
      .from(tableName)
      .select('student_id, result_image_url, answer_image_url, student_name, subject, grade_group, student_password')
      .eq('student_id', String(student.id));
    if (data) {
      if (type === 'mid') setMidResults(data);
      else setFinalResults(data);
    }
    setLoading(false);
  };

  const fetchReportCard = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('report_cards')
      .select('*')
      .eq('student_id', String(student.id))
      .single();
    if (data) {
      const rc = data as unknown as ReportCardData;
      setReportCard(rc);
      // If no password set, auto-unlock
      if (!rc.card_password) setReportCardLocked(false);
      else setReportCardLocked(true);
    }
    setLoading(false);
  };

  const handleReportCardUnlock = () => {
    if (reportCardPwdInput === reportCard?.card_password) {
      setReportCardLocked(false);
      setReportCardPwdError('');
    } else {
      setReportCardPwdError('Incorrect password');
    }
  };

  const handleUnlock = (key: string, result: ExamResult) => {
    const pwd = passwordInputs[key] || '';
    if (pwd === result.student_password) {
      setUnlockedKeys(prev => new Set(prev).add(key));
      setPasswordErrors(prev => ({ ...prev, [key]: '' }));
    } else {
      setPasswordErrors(prev => ({ ...prev, [key]: 'Incorrect password' }));
    }
  };

  const toggleAnswer = (key: string) => {
    setShowAnswers(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

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

  const renderExamResults = (results: ExamResult[], type: 'mid' | 'final') => {
    if (loading) return <p className="text-center text-muted-foreground py-4">Loading...</p>;
    if (results.length === 0) return <p className="text-center text-muted-foreground py-4">No results uploaded yet</p>;

    return (
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {results.map((r, i) => {
          const key = getKey(r, type);
          const isLocked = r.student_password && !unlockedKeys.has(key);
          const answerVisible = showAnswers.has(key);

          return (
            <div key={i} className="glass-card p-3 space-y-2">
              {r.subject && (
                <p className="text-sm font-medium text-primary">{r.subject} {r.grade_group ? `• ${r.grade_group}` : ''}</p>
              )}
              {isLocked ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <Lock className="w-4 h-4" />
                    <span>This result is password protected</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={passwordInputs[key] || ''}
                      onChange={(e) => setPasswordInputs(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlock(key, r)}
                      className="input-glass flex-1 text-sm py-1.5 px-3"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUnlock(key, r)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                      Unlock
                    </motion.button>
                  </div>
                  {passwordErrors[key] && <p className="text-red-400 text-xs">{passwordErrors[key]}</p>}
                </div>
              ) : (
                <>
                  <img src={r.result_image_url} alt="Result" className="w-full rounded-lg" />
                  {r.answer_image_url && (
                    <div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleAnswer(key)}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        {answerVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {answerVisible ? 'Hide Answer' : 'Show Answer'}
                      </motion.button>
                      <AnimatePresence>
                        {answerVisible && (
                          <motion.img
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            src={r.answer_image_url}
                            alt="Answer"
                            className="w-full rounded-lg mt-2"
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderReportCard = () => {
    if (loading) return <p className="text-center text-muted-foreground py-4">Loading...</p>;
    if (!reportCard) return <p className="text-center text-muted-foreground py-4">No report card available</p>;

    if (reportCardLocked && reportCard.card_password) {
      return (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-amber-400 text-sm justify-center">
            <Lock className="w-4 h-4" />
            <span>Report card is password protected</span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter password"
              value={reportCardPwdInput}
              onChange={(e) => setReportCardPwdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReportCardUnlock()}
              className="input-glass flex-1 text-sm py-1.5 px-3"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReportCardUnlock}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Unlock
            </motion.button>
          </div>
          {reportCardPwdError && <p className="text-red-400 text-xs text-center">{reportCardPwdError}</p>}
        </div>
      );
    }

    const subjects = reportCard.subjects || {};
    const allAvgs: number[] = [];
    
    return (
      <div className="max-h-[50vh] overflow-y-auto pr-1">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 px-2">Subject</th>
                <th className="text-center py-1.5 px-1">1st</th>
                <th className="text-center py-1.5 px-1">2nd</th>
                <th className="text-center py-1.5 px-1">3rd</th>
                <th className="text-center py-1.5 px-1">4th</th>
                <th className="text-center py-1.5 px-1 font-bold">Avg</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map(subj => {
                const marks = subjects[subj] || {};
                const vals = ['1st', '2nd', '3rd', '4th'].map(q => marks[q] as number | null).filter(v => v != null) as number[];
                const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                if (avg != null) allAvgs.push(avg);
                return (
                  <tr key={subj} className="border-b border-white/5">
                    <td className="py-1.5 px-2 truncate max-w-[100px]">{subj}</td>
                    {['1st', '2nd', '3rd', '4th'].map(q => {
                      const v = marks[q] as number | null;
                      return (
                        <td key={q} className={`text-center py-1.5 px-1 ${v != null && v < 60 ? 'text-red-400' : ''}`}>
                          {v ?? '-'}
                        </td>
                      );
                    })}
                    <td className={`text-center py-1.5 px-1 font-bold ${avg != null && avg < 60 ? 'text-red-400' : 'text-green-400'}`}>
                      {avg != null ? avg.toFixed(1) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary: Total Average, Rank */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="glass-card p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Total Average</p>
            <p className={`font-bold text-lg ${allAvgs.length > 0 && (allAvgs.reduce((a,b) => a+b, 0) / allAvgs.length) < 60 ? 'text-red-400' : 'text-green-400'}`}>
              {allAvgs.length > 0 ? (allAvgs.reduce((a,b) => a+b, 0) / allAvgs.length).toFixed(1) : '-'}
            </p>
          </div>
          <div className="glass-card p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Rank</p>
            <p className="font-bold text-lg text-primary">
              {reportCard.rank && typeof reportCard.rank === 'object' 
                ? Object.values(reportCard.rank).filter(v => v != null)[0] || '-'
                : '-'}
              {reportCard.total_students ? <span className="text-xs text-muted-foreground font-normal"> / {reportCard.total_students}</span> : ''}
            </p>
          </div>
        </div>

        {(reportCard.promoted_to || reportCard.detained_in_grade) && (
          <div className={`mt-3 p-2 rounded-lg text-center text-sm font-bold ${reportCard.promoted_to ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {reportCard.promoted_to ? `Promoted to ${reportCard.promoted_to.replace(/^grade\s*/i, 'Grade ')}` : `Detained in ${reportCard.detained_in_grade?.replace(/^grade\s*/i, 'Grade ')}`}
          </div>
        )}
      </div>
    );
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Info', icon: null },
    { key: 'mid', label: 'Mid', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { key: 'final', label: 'Final', icon: <FileCheck className="w-3.5 h-3.5" /> },
    { key: 'report', label: 'Card', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-5 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Student header - always visible */}
        <div className="text-center mb-3">
          <div className="relative inline-block mb-2">
            <img
              src={student.imageUrl}
              alt={student.englishName}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-primary/30"
            />
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold ${
              student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
            }`}>
              {student.gender}
            </div>
          </div>
          <h2 className="text-xl font-bold">{student.name}</h2>
          <p className="text-primary text-sm font-medium">{student.englishName}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-white/10'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'info' && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="glass-card p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-bold">{student.age}</p>
                  </div>
                  <div className="glass-card p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Section</p>
                    <p className="font-bold">{student.section}</p>
                  </div>
                  <div className="glass-card p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p className="font-bold">#{student.id}</p>
                  </div>
                </div>

                {(student.telegram || student.instagram) && (
                  <div className="flex gap-3 justify-center mb-4">
                    {student.telegram && (
                      <motion.a
                        href={student.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 rounded-xl bg-[#0088cc]/20 hover:bg-[#0088cc]/30 border border-[#0088cc]/30 transition-colors"
                      >
                        <Send className="w-5 h-5 text-[#0088cc]" />
                      </motion.a>
                    )}
                    {student.instagram && (
                      <motion.a
                        href={student.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 rounded-xl bg-gradient-to-br from-[#f09433]/20 via-[#e6683c]/20 to-[#bc1888]/20 hover:from-[#f09433]/30 hover:via-[#e6683c]/30 hover:to-[#bc1888]/30 border border-[#e6683c]/30 transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-[#e6683c]" />
                      </motion.a>
                    )}
                  </div>
                )}

                <motion.button
                  onClick={() => handleDownload(student.imageUrl, `${student.englishName.replace(/\s+/g, '_')}_profile.jpg`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-gradient w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Allow download to save photo
                </motion.button>
              </div>
            )}

            {tab === 'mid' && renderExamResults(midResults, 'mid')}
            {tab === 'final' && renderExamResults(finalResults, 'final')}
            {tab === 'report' && renderReportCard()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default StudentDetailModal;
