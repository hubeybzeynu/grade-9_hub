import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Filter } from 'lucide-react';
import { students as allStudents, Student } from '@/data/students';
import StudentDetailModal from './StudentDetailModal';

interface StudentsPageProps {
  onNavigate?: (page: string) => void;
}

const SECTIONS = ['all', '9A', '9B', '9C'] as const;

const StudentsPage = ({ onNavigate }: StudentsPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    return allStudents
      .filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.englishName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGender = genderFilter === 'all' || student.gender === genderFilter;
        const matchesSection = sectionFilter === 'all' || student.section === sectionFilter;
        return matchesSearch && matchesGender && matchesSection;
      })
      .sort((a, b) => a.englishName.localeCompare(b.englishName));
  }, [searchQuery, genderFilter, sectionFilter]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-16 pb-20 px-4"
      >
        <div className="max-w-lg mx-auto">
          <div className="py-4 mb-1">
            <h1 className="text-xl font-bold text-foreground">Students</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground text-xs">
                Total: <span className="font-semibold text-foreground">{filteredStudents.length}</span>
              </span>
              <span className="text-xs text-blue-400">
                ♂ {filteredStudents.filter(s => s.gender === 'Male').length}
              </span>
              <span className="text-xs text-pink-400">
                ♀ {filteredStudents.filter(s => s.gender === 'Female').length}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {(['all', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  genderFilter === g
                    ? g === 'Male' ? 'bg-blue-500 text-white'
                    : g === 'Female' ? 'bg-pink-500 text-white'
                    : 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {g === 'all' ? 'All' : g}
              </button>
            ))}
            <div className="w-px bg-border mx-1 shrink-0" />
            {SECTIONS.map(sec => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  sectionFilter === sec
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {sec === 'all' ? 'All' : sec}
              </button>
            ))}
          </div>

          {/* Student List */}
          <div className="space-y-1.5">
            {filteredStudents.map((student, i) => (
              <motion.button
                key={student.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStudent(student)}
                className="w-full flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border active:bg-muted transition-colors"
              >
                <img
                  src={student.imageUrl}
                  alt={student.englishName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{student.englishName}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{student.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    student.gender === 'Male' ? 'bg-blue-500/15 text-blue-400' : 'bg-pink-500/15 text-pink-400'
                  }`}>
                    {student.section}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No students found</p>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentsPage;
