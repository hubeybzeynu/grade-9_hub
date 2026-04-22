import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Award, ArrowRight, Sparkles, CheckCircle,
  ClipboardList, FileCheck, FileText, FlaskConical, LucideIcon,
} from 'lucide-react';

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

interface Step {
  icon: LucideIcon;
  title: string;
  definition: string;
  description: string;
  color: string;
  preview: React.ReactNode;
}

// Phone-frame illustration that previews each feature visually.
const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-[180px] h-[320px] rounded-[28px] bg-neutral-900 border-[3px] border-neutral-700 shadow-xl overflow-hidden relative">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-neutral-700 z-10" />
    <div className="absolute inset-2 rounded-[22px] bg-background overflow-hidden flex flex-col">
      {children}
    </div>
  </div>
);

const previewTextbooks = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1.5">
      <p className="font-bold">Textbooks</p>
      {['Biology', 'Chemistry', 'Physics', 'Math'].map((s, i) => (
        <div key={s} className="flex items-center gap-1.5 bg-card rounded-md p-1.5 border border-border">
          <div className={`w-5 h-5 rounded ${['bg-emerald-500', 'bg-rose-500', 'bg-indigo-500', 'bg-amber-500'][i]} flex items-center justify-center`}>
            <BookOpen className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-semibold">{s}</span>
        </div>
      ))}
    </div>
  </PhoneFrame>
);

const previewStudents = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1.5">
      <p className="font-bold">Students</p>
      <div className="bg-muted rounded px-1.5 py-1 text-muted-foreground">🔍 Search…</div>
      {['Abebe', 'Sara', 'Dawit'].map((n, i) => (
        <div key={n} className="flex items-center gap-1.5 bg-card rounded-md p-1 border border-border">
          <div className={`w-5 h-5 rounded-full ${['bg-cyan-500', 'bg-pink-500', 'bg-violet-500'][i]}`} />
          <span>{n}</span>
        </div>
      ))}
    </div>
  </PhoneFrame>
);

const previewResults = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1.5">
      <p className="font-bold">Ministry Results</p>
      <div className="bg-muted rounded p-1.5 text-muted-foreground">Enter ID</div>
      <div className="bg-card border border-border rounded-md p-1.5">
        <p className="text-muted-foreground">Score</p>
        <p className="font-bold text-primary text-lg">87<span className="text-[8px]">/100</span></p>
      </div>
    </div>
  </PhoneFrame>
);

const previewReportCard = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1">
      <p className="font-bold">Report Card</p>
      {['Math', 'English', 'Physics'].map((s) => (
        <div key={s} className="flex justify-between bg-card rounded px-1.5 py-0.5 border border-border">
          <span>{s}</span><span className="font-bold text-primary">A</span>
        </div>
      ))}
      <div className="bg-emerald-500/10 text-emerald-600 text-[7px] rounded px-1.5 py-1">Promoted ✓</div>
    </div>
  </PhoneFrame>
);

const previewTools = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1">
      <p className="font-bold flex items-center gap-1"><FlaskConical className="w-2.5 h-2.5 text-primary" /> Tools</p>
      <div className="grid grid-cols-7 gap-[1px]">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-[1px] ${['bg-red-500', 'bg-amber-500', 'bg-cyan-500', 'bg-violet-500', 'bg-emerald-500'][i % 5]}/70`} />
        ))}
      </div>
      <div className="bg-card border border-border rounded p-1 font-mono">x² + 5x = 6</div>
    </div>
  </PhoneFrame>
);

const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      icon: Sparkles,
      title: 'Welcome to the Portal!',
      definition: 'All-in-one student portal',
      description: 'Textbooks, results, report cards and a smart calculator in one place.',
      color: 'from-primary to-cyan-600',
      preview: (
        <PhoneFrame>
          <div className="flex-1 flex flex-col items-center justify-center gap-1 text-[9px]">
            <Sparkles className="w-6 h-6 text-primary" />
            <p className="font-bold">Grade 9 Portal</p>
            <p className="text-muted-foreground text-[7px]">Tap to begin</p>
          </div>
        </PhoneFrame>
      ),
    },
    {
      icon: BookOpen,
      title: 'Textbooks Library',
      definition: 'Offline PDF reader with topic jumps',
      description: 'Open any Grade 9 textbook, search activities and exercises, tap any item to jump to that page instantly.',
      color: 'from-emerald-500 to-teal-600',
      preview: previewTextbooks,
    },
    {
      icon: Users,
      title: 'Student Directory',
      definition: 'Class roster + profiles',
      description: 'Browse classmates, search by name, filter by section and view photos and contacts.',
      color: 'from-violet-500 to-purple-600',
      preview: previewStudents,
    },
    {
      icon: Award,
      title: 'Ministry Results',
      definition: 'National exam scores',
      description: 'Enter your student ID to see your Ministry exam result. Forgot your ID? Look it up by Amharic or English name.',
      color: 'from-amber-500 to-orange-600',
      preview: previewResults,
    },
    {
      icon: ClipboardList,
      title: 'Mid Exam Results',
      definition: 'Teacher-verified mid-term scores',
      description: 'Check each subject\'s mid-term result, updated by teachers in real-time.',
      color: 'from-violet-500 to-indigo-600',
      preview: previewResults,
    },
    {
      icon: FileCheck,
      title: 'Final Exam Results',
      definition: 'Password-protected finals',
      description: 'View your final exam results. Protected so only you can see them.',
      color: 'from-rose-500 to-red-600',
      preview: previewResults,
    },
    {
      icon: FileText,
      title: 'Report Card',
      definition: 'Full academic report',
      description: 'See subject marks, averages, class rank, conduct, attendance and promotion status.',
      color: 'from-teal-500 to-cyan-600',
      preview: previewReportCard,
    },
    {
      icon: FlaskConical,
      title: 'Tools: Calculator · Elements · AI',
      definition: 'Floating button at the top-right',
      description: 'Scientific + quadratic + graph + chemistry calculator, full periodic table with element details, and an AI tutor that solves and plots.',
      color: 'from-primary to-cyan-600',
      preview: previewTools,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => (isLastStep ? onComplete() : setCurrentStep(currentStep + 1));
  const handleSkip = () => onComplete();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-y-auto py-6"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
      </div>

      <div className="max-w-lg w-full mx-4 relative z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep ? 'w-6 bg-primary'
                : index < currentStep ? 'w-1.5 bg-primary/60'
                : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-2xl p-5 text-center shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center mx-auto mb-3`}
            >
              <currentStepData.icon className="w-7 h-7 text-white" />
            </motion.div>

            <h2 className="text-xl font-bold mb-1">{currentStepData.title}</h2>
            <p className="text-xs uppercase tracking-wider text-primary mb-3 font-semibold">
              {currentStepData.definition}
            </p>

            {/* Phone-frame live preview */}
            <div className="mb-3">{currentStepData.preview}</div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {currentStepData.description}
            </p>

            <div className="flex gap-2">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium active:bg-accent"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
              >
                {isLastStep ? <><CheckCircle className="w-4 h-4" /> Get Started</>
                  : <>Next <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WelcomeOnboarding;
