import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Award, ArrowRight, Sparkles, CheckCircle,
  ClipboardList, FileCheck, FileText, FlaskConical, Calculator, Atom,
  TrendingUp, Sigma, LucideIcon, Info, Play, Pause, ZoomIn, MousePointerClick,
} from 'lucide-react';

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

interface Step {
  icon: LucideIcon;
  title: string;
  definition: string;
  description: string;
  walkthrough: string[]; // "How you use it" steps written as if guiding the user
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

// Pulse-pointer to show the user where to tap in each preview.
const TapHint = ({ x, y }: { x: number; y: number }) => (
  <motion.div
    initial={{ scale: 0.6, opacity: 0.4 }}
    animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
    transition={{ duration: 1.4, repeat: Infinity }}
    className="absolute w-4 h-4 rounded-full bg-primary/40 border border-primary"
    style={{ left: x, top: y }}
  />
);

const previewHome = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1.5 relative h-full">
      <p className="font-bold">Home</p>
      <div className="grid grid-cols-2 gap-1">
        {[
          { l: 'Books', c: 'bg-emerald-500' },
          { l: 'Students', c: 'bg-violet-500' },
          { l: 'Mid Exam', c: 'bg-indigo-500' },
          { l: 'Report', c: 'bg-teal-500' },
        ].map((it) => (
          <div key={it.l} className="bg-card border border-border rounded p-1">
            <div className={`w-3 h-3 rounded ${it.c} mb-0.5`} />
            <span>{it.l}</span>
          </div>
        ))}
      </div>
      {/* Floating tools button */}
      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
        <FlaskConical className="w-2.5 h-2.5 text-white" />
      </div>
      <TapHint x={150} y={4} />
    </div>
  </PhoneFrame>
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
      <div className="bg-primary/10 rounded px-1.5 py-1 text-primary">📍 Activity 5.2 → page 197</div>
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

const previewCalculator = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1">
      <p className="font-bold flex items-center gap-1"><Calculator className="w-2.5 h-2.5 text-primary" /> Calculator</p>
      <div className="flex gap-0.5">
        {['Sci', 'Quad', 'Graph', 'Trig', 'Chem'].map((t, i) => (
          <span key={t} className={`px-1 rounded ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{t}</span>
        ))}
      </div>
      <div className="bg-muted rounded p-1 font-mono">x² − 5x + 6 = 0</div>
      <div className="bg-card border border-border rounded p-1">
        <p>Δ = 1</p>
        <p className="font-bold text-primary">x = 2, x = 3</p>
      </div>
      <svg viewBox="0 0 60 24" className="w-full h-6">
        <path d="M2 22 Q15 2 30 12 Q45 22 58 4" stroke="hsl(var(--primary))" fill="none" strokeWidth="1.2" />
        <line x1="0" y1="20" x2="60" y2="20" stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" />
      </svg>
    </div>
  </PhoneFrame>
);

const previewTrig = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1">
      <p className="font-bold flex items-center gap-1"><Sigma className="w-2.5 h-2.5 text-primary" /> Trigonometry</p>
      <table className="w-full font-mono">
        <thead className="bg-muted">
          <tr><th>°</th><th>sin</th><th>cos</th><th>tan</th></tr>
        </thead>
        <tbody>
          <tr><td>30</td><td>½</td><td>√3/2</td><td>1/√3</td></tr>
          <tr><td>45</td><td>1/√2</td><td>1/√2</td><td>1</td></tr>
          <tr><td>60</td><td>√3/2</td><td>½</td><td>√3</td></tr>
        </tbody>
      </table>
      <svg viewBox="0 0 60 30" className="w-full h-8">
        <polygon points="5,25 45,25 45,5" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary))" strokeWidth="0.8" />
        <text x="6" y="22" fontSize="4" fill="hsl(var(--primary))">30°</text>
      </svg>
    </div>
  </PhoneFrame>
);

const previewElements = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1">
      <p className="font-bold flex items-center gap-1"><Atom className="w-2.5 h-2.5 text-primary" /> Elements</p>
      <div className="grid grid-cols-9 gap-[1px]">
        {Array.from({ length: 27 }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-[1px] ${['bg-red-500', 'bg-amber-500', 'bg-cyan-500', 'bg-violet-500', 'bg-emerald-500'][i % 5]}/70`} />
        ))}
      </div>
      <div className="bg-card border border-border rounded p-1">
        <p className="font-bold text-[10px]">Fe • Iron</p>
        <p>Z = 26 · 55.85 u</p>
        <p className="text-muted-foreground">[Ar] 3d⁶ 4s²</p>
        <p className="text-muted-foreground">2 8 14 2</p>
      </div>
    </div>
  </PhoneFrame>
);

const previewAi = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1">
      <p className="font-bold flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-primary" /> Ask AI</p>
      <div className="bg-muted rounded p-1">"Find x if sin 30° = x/20"</div>
      <div className="bg-card border border-border rounded p-1">
        <p className="font-bold text-primary">x = 10</p>
        <p>1. SOH: sin = opp/hyp</p>
        <p>2. x = 20·sin 30°</p>
      </div>
      <svg viewBox="0 0 60 28" className="w-full h-7">
        <polygon points="5,24 45,24 45,6" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary))" strokeWidth="0.8" />
      </svg>
    </div>
  </PhoneFrame>
);

const previewInfo = (
  <PhoneFrame>
    <div className="p-2 text-[8px] space-y-1 relative">
      <div className="flex items-center gap-1 bg-primary/10 rounded p-1">
        <Info className="w-2.5 h-2.5 text-primary" /> <span>Info button (top-left)</span>
      </div>
      <p className="font-bold">Info menu</p>
      {['About', 'Feedback', 'Rate', 'Contact'].map((s) => (
        <div key={s} className="bg-card border border-border rounded px-1.5 py-1">{s}</div>
      ))}
      <TapHint x={4} y={4} />
    </div>
  </PhoneFrame>
);

const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef<number | null>(null);

  const steps: Step[] = [
    {
      icon: Sparkles,
      title: 'Welcome to your Grade 9 Portal',
      definition: 'Everything you need in one app',
      description: 'Textbooks, results, report card, calculator, periodic table and an AI tutor — all on your phone.',
      walkthrough: [
        'Tap "Next" to take a quick tour.',
        'Each step shows you exactly where to tap and what you can do.',
        'You can skip any time and revisit this from Info → About.',
      ],
      color: 'from-primary to-cyan-600',
      preview: previewHome,
    },
    {
      icon: BookOpen,
      title: 'Textbooks',
      definition: 'Read PDFs and jump to any activity',
      description: 'All Grade 9 subject textbooks open offline. Find an activity and tap it — you go straight to that page.',
      walkthrough: [
        'Tap "Books" in the bottom bar.',
        'Pick a subject (e.g. Math).',
        'Use the search box to type "Activity 5.2".',
        'Tap the result — the PDF opens at page 197 instantly.',
      ],
      color: 'from-emerald-500 to-teal-600',
      preview: previewTextbooks,
    },
    {
      icon: Users,
      title: 'Student Directory',
      definition: 'Your classmates with photos',
      description: 'Browse all students, search by name, view profiles and contacts.',
      walkthrough: [
        'Tap "Students" in the bottom bar.',
        'Type a name in the search box.',
        'Tap a card to see the full profile.',
      ],
      color: 'from-violet-500 to-purple-600',
      preview: previewStudents,
    },
    {
      icon: Award,
      title: 'Ministry Results',
      definition: 'Your national exam score',
      description: 'Enter your student ID to see the official Ministry exam result. Forgot your ID? Look it up by name.',
      walkthrough: [
        'Open "More → Ministry Results".',
        'Type your student ID.',
        'See your score, rank and grade letter.',
      ],
      color: 'from-amber-500 to-orange-600',
      preview: previewResults,
    },
    {
      icon: ClipboardList,
      title: 'Mid & Final Exams',
      definition: 'School exam scores',
      description: 'Mid-term and final exam results updated by teachers. Final scores are protected.',
      walkthrough: [
        'Open "More → Mid Exam" for mid-term marks.',
        'Open "More → Final Exam" and unlock with your password.',
      ],
      color: 'from-rose-500 to-red-600',
      preview: previewResults,
    },
    {
      icon: FileText,
      title: 'Report Card',
      definition: 'Full academic report',
      description: 'See subject marks, averages, class rank, conduct, attendance and promotion status.',
      walkthrough: [
        'Open "More → Report Card".',
        'Scroll to view every subject and the final result.',
      ],
      color: 'from-teal-500 to-cyan-600',
      preview: previewReportCard,
    },
    {
      icon: FlaskConical,
      title: 'Tools — top-right floating button',
      definition: 'Calculator · Elements · AI in one tap',
      description: 'The atom button at the top-right opens your study tools from anywhere in the app.',
      walkthrough: [
        'Look for the round atom button at the very top-right.',
        'Tap it — a panel opens with three tabs: Calculator, Elements, Ask AI.',
        'It works on every page, even while reading a textbook.',
      ],
      color: 'from-primary to-cyan-600',
      preview: previewHome,
    },
    {
      icon: Calculator,
      title: 'Calculator (Sci · Quad · Graph · Trig · Chem)',
      definition: 'Five calculators in one',
      description: 'Scientific keypad, quadratic solver with sign chart, graph plotter, trigonometry tables and a chemistry molar-mass tool.',
      walkthrough: [
        'Open Tools → Calculator.',
        'Switch tab: "Quad" then enter a, b, c (e.g. 1, −5, 6).',
        'You see the formula, discriminant, roots, sign chart AND the parabola.',
        'Switch to "Trig" for the special-angle table and full 0°–90° table.',
        'Press √ — the closing parenthesis is added automatically.',
      ],
      color: 'from-cyan-500 to-blue-600',
      preview: previewCalculator,
    },
    {
      icon: Sigma,
      title: 'Trigonometry helpers',
      definition: 'Special angles + full sin/cos/tan table',
      description: 'Quickly find sin, cos, tan for 0°, 30°, 45°, 60°, 90°, or any angle from 0 to 90.',
      walkthrough: [
        'Open Calculator → Trig tab.',
        'Read the special angle table (top).',
        'Type any angle in "Lookup" — see sin, cos, tan instantly.',
        'Scroll the bottom table to find an exact value.',
      ],
      color: 'from-amber-500 to-rose-500',
      preview: previewTrig,
    },
    {
      icon: Atom,
      title: 'Periodic Table',
      definition: 'All 118 elements, tap for details',
      description: 'Tap any element to see atomic number, mass, full electron configuration, shell distribution (2 8 18 …), Zeff, atomic radius, ionization energy, electron affinity and more.',
      walkthrough: [
        'Open Tools → Elements.',
        'Tap an element (e.g. Fe).',
        'Read full info, then tap "Ask AI about Fe" for deeper questions.',
      ],
      color: 'from-rose-500 to-pink-600',
      preview: previewElements,
    },
    {
      icon: Sparkles,
      title: 'Ask AI tutor',
      definition: 'Step-by-step solutions with diagrams',
      description: 'Type any math, trig, or chemistry question. The AI shows the answer, the steps and a diagram (parabola, function graph or right-angled triangle).',
      walkthrough: [
        'Open Tools → Ask AI.',
        'Tap an example or type your question.',
        'See the final answer, numbered steps, and a diagram if relevant.',
      ],
      color: 'from-violet-500 to-fuchsia-600',
      preview: previewAi,
    },
    {
      icon: Info,
      title: 'Info button (top-LEFT)',
      definition: 'About, feedback, rating, contact',
      description: 'The Info button moved to the top-left so it isn\'t covered by the floating Tools button. Tap it for help, ratings and to contact the developer.',
      walkthrough: [
        'Look at the top-LEFT of every page.',
        'Tap the (i) icon.',
        'Choose About, Feedback, Rate, or Contact.',
      ],
      color: 'from-blue-500 to-cyan-600',
      preview: previewInfo,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => (isLastStep ? onComplete() : setCurrentStep(currentStep + 1));
  const handleSkip = () => onComplete();

  // Auto-play: advance every 4.5s when enabled. Stops on last step.
  useEffect(() => {
    if (!autoPlay) return;
    if (isLastStep) {
      setAutoPlay(false);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setZoomed(false);
      setCurrentStep((s) => s + 1);
    }, 4500);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [autoPlay, currentStep, isLastStep]);

  // Reset zoom when step changes
  useEffect(() => {
    setZoomed(false);
  }, [currentStep]);

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
        <div className="flex justify-center gap-1.5 mb-5 flex-wrap">
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

            {/* Live preview with click-to-zoom */}
            <motion.div
              className="mb-2 cursor-zoom-in select-none"
              onClick={() => setZoomed((z) => !z)}
              animate={{ scale: zoomed ? 1.55 : 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ transformOrigin: 'center top' }}
            >
              {currentStepData.preview}
            </motion.div>
            <p className="text-[11px] text-muted-foreground mb-3 flex items-center justify-center gap-1">
              {zoomed ? (
                <><MousePointerClick className="w-3 h-3" /> Tap preview again to zoom out</>
              ) : (
                <><ZoomIn className="w-3 h-3" /> Tap the preview to zoom in and see the function</>
              )}
            </p>

            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              {currentStepData.description}
            </p>

            {/* "How you use it" — concrete steps */}
            <div className="bg-muted rounded-xl p-3 text-left mb-4">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> How you use it
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-foreground">
                {currentStepData.walkthrough.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>

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
