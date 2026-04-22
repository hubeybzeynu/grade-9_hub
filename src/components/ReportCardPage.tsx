import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Download, ChevronLeft, ChevronRight, Printer, Lock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { students } from '@/data/students';

const SUBJECTS = [
  'Amharic', 'English', 'Mathematics', 'General Science', 'Social Studies',
  'Citizenship Education', 'Performing & Visual Arts', 'Information Technology',
  'Health & Physical Education', 'Career & Technical Education'
];

const CONDUCT_ITEMS = [
  'Cooperates Willingly', 'Refrains from disturbing others',
  'Respects Authorities & Elders', 'Handles School & Personal Property Carefully',
  'Listens Attentively', 'Attendance & Punctuality'
];

const QUARTERS = ['1st', '2nd', '3rd', '4th'];

interface ReportCardData {
  id: string;
  student_id: string;
  student_name: string | null;
  sex: string | null;
  age: number | null;
  kebele: string | null;
  house_no: string | null;
  teacher_name: string | null;
  school_year: string | null;
  grade: string | null;
  subjects: Record<string, Record<string, number | null>>;
  conduct: Record<string, Record<string, string | null>>;
  days_present: Record<string, number | null>;
  days_absent: Record<string, number | null>;
  times_tardy: Record<string, number | null>;
  total_academic_days: Record<string, number | null>;
  rank: Record<string, number | null>;
  remarks: string | null;
  promoted_to: string | null;
  detained_in_grade: string | null;
  card_password: string | null;
  total_students: number | null;
}

const ReportCardPage = () => {
  const [studentId, setStudentId] = useState('');
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [allCards, setAllCards] = useState<ReportCardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [cardLocked, setCardLocked] = useState(true);
  const [cardPwdInput, setCardPwdInput] = useState('');
  const [cardPwdError, setCardPwdError] = useState('');
  const [unlockedCardIds, setUnlockedCardIds] = useState<Set<string>>(new Set());
  // Student verification (like ExamResultPage)
  const [verifiedStudent, setVerifiedStudent] = useState<{ id: number; name: string; english_name: string; image_url: string | null } | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('report-cards-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_cards' }, () => {
        if (reportCard) {
          fetchCard(reportCard.student_id);
        }
        fetchAllCards();
      })
      .subscribe();

    fetchAllCards();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAllCards = async () => {
    const { data } = await supabase
      .from('report_cards')
      .select('*')
      .order('student_name', { ascending: true });
    if (data) setAllCards(data as unknown as ReportCardData[]);
  };

  const fetchCard = async (id: string) => {
    setLoading(true);
    setError('');
    setSearched(true);

    // Try to find by directory ID first
    const dirStudent = students.find(s => s.id.toString() === id);
    const searchName = dirStudent?.englishName || dirStudent?.name;

    let query = supabase.from('report_cards').select('*');
    
    if (searchName) {
      query = query.or(`student_id.eq.${id},student_name.ilike.%${searchName}%`);
    } else {
      query = query.eq('student_id', id);
    }

    const { data, error: err } = await query.maybeSingle();
    setLoading(false);

    if (err || !data) {
      setError('No report card found for this student.');
      setReportCard(null);
      return;
    }

    const card = data as unknown as ReportCardData;
    setReportCard(card);
    // Check if this card needs password and isn't already unlocked
    if (card.card_password && !unlockedCardIds.has(card.id)) {
      setCardLocked(true);
      setCardPwdInput('');
      setCardPwdError('');
    } else {
      setCardLocked(false);
    }
    const idx = allCards.findIndex(c => c.id === card.id);
    if (idx >= 0) setCurrentIndex(idx);
  };

  const handleVerify = async () => {
    setError('');
    setVerifiedStudent(null);
    setReportCard(null);
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
    } else {
      setError('Student not found. Check your number.');
    }
  };

  const handleSearch = () => {
    if (!verifiedStudent) {
      handleVerify();
      return;
    }
    fetchCard(String(verifiedStudent.id));
  };

  const navigateCard = (dir: number) => {
    if (allCards.length === 0) return;
    const newIdx = (currentIndex + dir + allCards.length) % allCards.length;
    setCurrentIndex(newIdx);
    const newCard = allCards[newIdx];
    setReportCard(newCard);
    // Check password for navigated card
    if (newCard.card_password && !unlockedCardIds.has(newCard.id)) {
      setCardLocked(true);
      setCardPwdInput('');
      setCardPwdError('');
    } else {
      setCardLocked(false);
    }
  };

  const handleCardUnlock = () => {
    if (!reportCard) return;
    if (cardPwdInput === reportCard.card_password) {
      setCardLocked(false);
      setCardPwdError('');
      setUnlockedCardIds(prev => new Set(prev).add(reportCard.id));
    } else {
      setCardPwdError('Incorrect password');
    }
  };

  const getSubjectAvg = (marks: Record<string, number | null>) => {
    const vals = QUARTERS.map(q => marks[q]).filter(v => v != null) as number[];
    if (vals.length === 0) return null;
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  };

  const getFailedSubjects = () => {
    if (!reportCard?.subjects) return 0;
    let count = 0;
    SUBJECTS.forEach(sub => {
      const marks = reportCard.subjects[sub];
      if (marks) {
        const avg = getSubjectAvg(marks);
        if (avg != null && avg < 60) count++;
      }
    });
    return count;
  };

  const getTotalScore = (quarter: string) => {
    if (!reportCard?.subjects) return null;
    let total = 0;
    let count = 0;
    SUBJECTS.forEach(sub => {
      const val = reportCard.subjects[sub]?.[quarter];
      if (val != null) { total += val; count++; }
    });
    return count > 0 ? total : null;
  };

  const getTotalAverage = () => {
    const totals = QUARTERS.map(q => getTotalScore(q)).filter(v => v != null) as number[];
    if (totals.length === 0) return null;
    return parseFloat((totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1));
  };

  const handlePrint = () => {
    window.print();
  };

  const failedCount = reportCard ? getFailedSubjects() : 0;
  const gradeNum = reportCard?.grade ? parseInt(reportCard.grade.replace(/\D/g, '')) : 9;
  const statusText = failedCount >= 2
    ? `Detained in Grade ${gradeNum}`
    : `Promoted to ${reportCard?.promoted_to ? reportCard.promoted_to.replace(/^grade\s*/i, 'Grade ') : `Grade ${gradeNum + 1}`}`;

  return (
    <div className="pt-16 pb-20 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="py-4 mb-2">
          <h1 className="text-xl font-bold text-foreground">Report Card</h1>
          <p className="text-muted-foreground text-xs mt-0.5">View your student report card</p>
        </div>

        {/* Search */}
        {!reportCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto mb-8">
            <div className="glass-card p-5">
              <label className="block text-sm font-medium mb-2">Enter Student Directory ID (1-98)</label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setVerifiedStudent(null);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. 5"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-background/50 border border-border focus:border-primary focus:outline-none"
                />
              </div>

              {verifiedStudent && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
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

              {error && <p className="text-destructive text-xs mb-2">{error}</p>}
              {loading && <p className="text-muted-foreground text-xs mb-2">Loading report card...</p>}

              {!verifiedStudent ? (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl"
                >
                  {verifying ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  Verify Student
                </button>
              ) : (
                <button
                  onClick={handleSearch}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl"
                >
                  <Search className="w-4 h-4" />
                  View Report Card
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Report Card Display */}
        <AnimatePresence mode="wait">
          {reportCard && (
            <motion.div
              key={reportCard.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="print-area"
            >
              {/* Navigation Arrows */}
              {allCards.length > 1 && (
                <div className="flex items-center justify-between mb-4 no-print">
                  <button onClick={() => navigateCard(-1)} className="btn-ghost p-3 rounded-xl">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {allCards.length}
                  </span>
                  <button onClick={() => navigateCard(1)} className="btn-ghost p-3 rounded-xl">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              {/* Password Gate */}
              {cardLocked && reportCard.card_password ? (
                <div className="glass-card p-6 md:p-8 border border-primary/20">
                  <div className="text-center py-8 space-y-4">
                    <Lock className="w-12 h-12 mx-auto text-amber-400" />
                    <h3 className="text-xl font-bold">Report Card Protected</h3>
                    <p className="text-muted-foreground text-sm">This report card is password protected. Enter the password to view.</p>
                    <div className="flex gap-2 max-w-xs mx-auto">
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={cardPwdInput}
                        onChange={(e) => setCardPwdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCardUnlock()}
                        className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border focus:border-primary focus:outline-none"
                      />
                      <button onClick={handleCardUnlock} className="btn-primary px-6 py-3 rounded-xl">Unlock</button>
                    </div>
                    {cardPwdError && <p className="text-red-400 text-sm">{cardPwdError}</p>}
                  </div>
                </div>
              ) : (
              /* Card */
              <div className="glass-card p-6 md:p-8 border border-primary/20">
                {/* Header */}
                <div className="text-center mb-6 border-b border-border pb-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <img src="https://i.postimg.cc/sfKMzbMn/photo-2025-06-12-19-39-13.jpg" alt="Logo" className="w-12 h-12 rounded-full" />
                    <div>
                      <h2 className="text-xl font-bold">ቅዱስ ቴሬዛ ት/ቤት</h2>
                      <p className="text-sm text-muted-foreground">St.Theresa School - Dire Dawa</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mt-2">STUDENTS REPORT CARD</h3>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <strong>{reportCard.student_name || '-'}</strong></div>
                  <div><span className="text-muted-foreground">Sex:</span> <strong>{reportCard.sex || '-'}</strong></div>
                  <div><span className="text-muted-foreground">Age:</span> <strong>{reportCard.age || '-'}</strong></div>
                  <div><span className="text-muted-foreground">Kebele:</span> <strong>{reportCard.kebele || '-'}</strong></div>
                  <div><span className="text-muted-foreground">H.No:</span> <strong>{reportCard.house_no || '-'}</strong></div>
                  <div><span className="text-muted-foreground">Teacher:</span> <strong>{reportCard.teacher_name || '-'}</strong></div>
                  <div><span className="text-muted-foreground">School Year:</span> <strong>{reportCard.school_year || '-'}</strong></div>
                  <div><span className="text-muted-foreground">Grade:</span> <strong>{reportCard.grade || '-'}</strong></div>
                </div>

                {/* Subjects Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="border border-border px-3 py-2 text-left">SUBJECT</th>
                        {QUARTERS.map(q => (
                          <th key={q} className="border border-border px-3 py-2 text-center">{q}</th>
                        ))}
                        <th className="border border-border px-3 py-2 text-center">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SUBJECTS.map(sub => {
                        const marks = reportCard.subjects?.[sub] || {};
                        const avg = getSubjectAvg(marks);
                        const isFailing = avg != null && avg < 60;
                        return (
                          <tr key={sub} className={isFailing ? 'text-red-500' : ''}>
                            <td className="border border-border px-3 py-2 font-medium">{sub}</td>
                            {QUARTERS.map(q => (
                              <td key={q} className={`border border-border px-3 py-2 text-center ${marks[q] != null && marks[q]! < 60 ? 'text-red-500 font-bold' : ''}`}>
                                {marks[q] ?? '-'}
                              </td>
                            ))}
                            <td className={`border border-border px-3 py-2 text-center font-bold ${isFailing ? 'text-red-500' : ''}`}>
                              {avg ?? '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Total Score Row */}
                      <tr className="bg-primary/5 font-bold">
                        <td className="border border-border px-3 py-2">Total Score in Figure</td>
                        {QUARTERS.map(q => (
                          <td key={q} className="border border-border px-3 py-2 text-center">
                            {getTotalScore(q) ?? '-'}
                          </td>
                        ))}
                        <td className="border border-border px-3 py-2 text-center">{getTotalAverage() ?? '-'}</td>
                      </tr>
                      {/* Average Row */}
                      <tr className="bg-primary/5 font-bold">
                        <td className="border border-border px-3 py-2">Average</td>
                        {QUARTERS.map(q => {
                          const total = getTotalScore(q);
                          const avg = total != null ? parseFloat((total / SUBJECTS.length).toFixed(1)) : null;
                          return (
                            <td key={q} className="border border-border px-3 py-2 text-center">{avg ?? '-'}</td>
                          );
                        })}
                        <td className="border border-border px-3 py-2 text-center">
                          {getTotalAverage() != null ? parseFloat((getTotalAverage()! / SUBJECTS.length).toFixed(1)) : '-'}
                        </td>
                      </tr>
                      {/* Rank Row */}
                      <tr className="bg-primary/10 font-bold">
                        <td className="border border-border px-3 py-2">Rank</td>
                        {QUARTERS.map(q => (
                          <td key={q} className="border border-border px-3 py-2 text-center">
                            {reportCard.rank?.[q] ?? '-'}
                          </td>
                        ))}
                        <td className="border border-border px-3 py-2 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Conduct & Habits */}
                <div className="overflow-x-auto mb-6">
                  <h4 className="font-bold mb-2">CONDUCT & HABITS</h4>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="border border-border px-3 py-2 text-left">Conduct & Attitude</th>
                        {QUARTERS.map(q => (
                          <th key={q} className="border border-border px-3 py-2 text-center">{q}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CONDUCT_ITEMS.map(item => {
                        const vals = reportCard.conduct?.[item] || {};
                        return (
                          <tr key={item}>
                            <td className="border border-border px-3 py-2">{item}</td>
                            {QUARTERS.map(q => (
                              <td key={q} className="border border-border px-3 py-2 text-center">
                                {vals[q] ?? '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Attendance */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="border border-border px-3 py-2 text-left">Attendance</th>
                        {QUARTERS.map(q => (
                          <th key={q} className="border border-border px-3 py-2 text-center">{q}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border px-3 py-2">Total Academic Days</td>
                        {QUARTERS.map(q => (
                          <td key={q} className="border border-border px-3 py-2 text-center">
                            {reportCard.total_academic_days?.[q] ?? '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-border px-3 py-2">Days Present</td>
                        {QUARTERS.map(q => (
                          <td key={q} className="border border-border px-3 py-2 text-center">
                            {reportCard.days_present?.[q] ?? '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-border px-3 py-2">Days Absent</td>
                        {QUARTERS.map(q => (
                          <td key={q} className="border border-border px-3 py-2 text-center">
                            {reportCard.days_absent?.[q] ?? '-'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-border px-3 py-2">Times Tardy</td>
                        {QUARTERS.map(q => (
                          <td key={q} className="border border-border px-3 py-2 text-center">
                            {reportCard.times_tardy?.[q] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Status */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-border">
                  <div className={`text-lg font-bold ${failedCount >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                    {statusText}
                  </div>
                  {reportCard.remarks && (
                    <div className="text-sm text-muted-foreground">Remarks: {reportCard.remarks}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 no-print">
                  <button onClick={handlePrint} className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => { setReportCard(null); setStudentId(''); setSearched(false); setVerifiedStudent(null); }}
                    className="btn-ghost px-4 py-2 rounded-xl"
                  >
                    Search Another
                  </button>
                </div>
              </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportCardPage;
