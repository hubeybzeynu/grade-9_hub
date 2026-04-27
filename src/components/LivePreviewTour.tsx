// Live preview tour: renders the ACTUAL app components inside a phone frame
// and animates a fake finger that taps through every screen. No mock UI —
// every preview is the real component (HomePage, Navbar, ToolsModal, etc.)
// scaled down and made non-interactive while the finger walks the user
// through the app.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Pause, Play, SkipForward, X, Hand, ZoomIn,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import HomePage from '@/components/HomePage';
import StudentsPage from '@/components/StudentsPage';
import TextbooksPage from '@/components/TextbooksPage';
import ResultsPage from '@/components/ResultsPage';
import ExamResultPage from '@/components/ExamResultPage';
import ReportCardPage from '@/components/ReportCardPage';
import InfoPage from '@/components/InfoPage';
import ToolsModal from '@/components/ToolsModal';

interface LivePreviewTourProps {
  onComplete: () => void;
}

// Frame dimensions (real device-like). The whole frame is then scaled down
// with CSS transform: scale() so it looks like a phone in the welcome card.
const FRAME_W = 390;
const FRAME_H = 720;

// A single tour step: title + caption + which page renders + where the finger
// taps (in coordinates relative to the 390x720 frame).
interface TourStep {
  title: string;
  caption: string;
  /** Which preset to render inside the phone. */
  view:
    | 'home'
    | 'textbooks'
    | 'students'
    | 'results'
    | 'mid'
    | 'final'
    | 'report'
    | 'info'
    | 'tools-calc'
    | 'tools-elements'
    | 'tools-ai';
  /** Finger target relative to frame (0..FRAME_W / 0..FRAME_H). null hides the finger. */
  tap?: { x: number; y: number };
}

const STEPS: TourStep[] = [
  // -- Home + tools intro -------------------------------------------------
  {
    title: 'Welcome to Grade 9 Portal',
    caption: 'Your home screen with every section as a card. The atom button (top-right, draggable) opens Calculator, Elements, AI Chat, Live and History.',
    view: 'home',
    tap: { x: 360, y: 30 },
  },

  // -- Textbooks → English → Content finder -------------------------------
  {
    title: 'Open Textbooks',
    caption: 'Tap the Textbooks card to see every Grade 9 subject. They all open offline.',
    view: 'home',
    tap: { x: 110, y: 360 },
  },
  {
    title: 'Pick English',
    caption: 'Choose the English textbook from the subject list.',
    view: 'textbooks',
    tap: { x: 195, y: 220 },
  },
  {
    title: 'Content Finder',
    caption: 'A bottom-sheet appears: search any exercise, activity or review and jump straight to that page. Close it to go back.',
    view: 'textbooks',
    tap: { x: 360, y: 600 },
  },

  // -- Students: filters + a profile + ID card ---------------------------
  {
    title: 'Students directory',
    caption: 'Browse all your classmates with photos and search by name.',
    view: 'students',
    tap: { x: 110, y: 100 },
  },
  {
    title: 'Filter by Male / Female / All',
    caption: 'Use the gender chips to show only Male, only Female, or All students. Tap "All" again to reset.',
    view: 'students',
    tap: { x: 110, y: 215 },
  },
  {
    title: 'Filter sections 9A · 9B · 9C',
    caption: 'Then filter by section (9A, 9B, 9C) and tap "All" to return to the full list.',
    view: 'students',
    tap: { x: 220, y: 255 },
  },
  {
    title: 'Open a profile (e.g. ID 5 — Hubeyb Zeynu)',
    caption: 'Tap any student card. Tip: ID 5 is Hubeyb Zeynu — opens the full profile with photo, section and ID card.',
    view: 'students',
    tap: { x: 195, y: 380 },
  },
  {
    title: 'ID card · enter code 12345',
    caption: 'In the profile, open ID Card and type the code (e.g. 12345) to reveal the protected info. Close with the red ✕ on the right.',
    view: 'students',
    tap: { x: 195, y: 470 },
  },

  // -- Mid Exam: id 5, password 1111, then Show Answer -------------------
  {
    title: 'Mid Exam · ID 5 / pwd 1111',
    caption: 'Type your student ID (5) and password (1111). Your result image opens in full-screen.',
    view: 'mid',
    tap: { x: 195, y: 280 },
  },
  {
    title: 'Show Answer',
    caption: 'Wait a moment, then tap "Show Answer" to flip from your result sheet to the official answer key. Close with the ✕ on the right.',
    view: 'mid',
    tap: { x: 280, y: 560 },
  },

  // -- Final Exam (similar UI) -------------------------------------------
  {
    title: 'Final Exam',
    caption: 'Final results work the same way as Mid — same ID + password flow, same Show Answer toggle, same ✕ to close.',
    view: 'final',
    tap: { x: 195, y: 280 },
  },

  // -- Report Card: id 5, verify, password 12345 -------------------------
  {
    title: 'Report Card · ID 5',
    caption: 'Type ID 5 and tap Verify — your name + photo appear so you know it is yours.',
    view: 'report',
    tap: { x: 195, y: 250 },
  },
  {
    title: 'Report Card · password 12345',
    caption: 'Type the password 12345, open the report and scroll through subjects, averages, conduct, attendance and promotion. Close with the ✕ on the right.',
    view: 'report',
    tap: { x: 195, y: 360 },
  },

  // -- Ministry results --------------------------------------------------
  {
    title: 'Ministry results',
    caption: 'Enter your student ID for the official Ministry exam result image. Close with the ✕ on the right.',
    view: 'results',
    tap: { x: 195, y: 260 },
  },

  // -- Calculator suite --------------------------------------------------
  {
    title: 'Calculator · sin 30',
    caption: 'Open Tools → Calculator. Try "sin 30" — it shows 0.5 instantly. Use parentheses, π, √ and exponents.',
    view: 'tools-calc',
    tap: { x: 195, y: 320 },
  },
  {
    title: 'Quadratic solver',
    caption: 'Switch to Quadratic — enter a, b, c and get the roots, vertex and a graph.',
    view: 'tools-calc',
    tap: { x: 110, y: 110 },
  },
  {
    title: 'Trigonometry · 40°',
    caption: 'Trigonometry tab: enter an angle (e.g. 40°) and get sin, cos, tan with a right-triangle diagram.',
    view: 'tools-calc',
    tap: { x: 175, y: 110 },
  },
  {
    title: 'Statistics',
    caption: 'Statistics tab: paste numbers and instantly get mean, median, mode, range, variance and standard deviation.',
    view: 'tools-calc',
    tap: { x: 235, y: 110 },
  },
  {
    title: 'Unit converter',
    caption: 'Unit tab: convert length, mass, temperature, time, area, volume and speed.',
    view: 'tools-calc',
    tap: { x: 290, y: 110 },
  },
  {
    title: 'Chemistry · C6H12O6',
    caption: 'Chemistry tab: type a formula like C6H12O6 — molar mass, element breakdown and percent composition appear.',
    view: 'tools-calc',
    tap: { x: 340, y: 110 },
  },

  // -- Periodic Table → Uranium → Ask AI --------------------------------
  {
    title: 'Periodic Table · Uranium',
    caption: 'Open Elements. Tap Uranium (U, 92) to see its full data card: shells, configuration, Zeff, group, period.',
    view: 'tools-elements',
    tap: { x: 250, y: 480 },
  },
  {
    title: 'Ask AI · electron configuration',
    caption: 'On the element details, tap "Ask AI" and ask "electron configuration" — the AI explains it step-by-step.',
    view: 'tools-elements',
    tap: { x: 195, y: 600 },
  },

  // -- AI Chat -----------------------------------------------------------
  {
    title: 'AI Chat · type or speak',
    caption: 'Type a question, attach an image, or tap the mic to speak. Replies are read aloud in a male voice.',
    view: 'tools-ai',
    tap: { x: 195, y: 640 },
  },
  {
    title: 'AI Chat · voice input',
    caption: 'Tap the mic icon (right of the input) and ask out loud. Your words become the message and the AI answers.',
    view: 'tools-ai',
    tap: { x: 340, y: 640 },
  },

  // -- Live Chat ---------------------------------------------------------
  {
    title: 'Live · camera + voice',
    caption: 'Live tab opens the camera. Just talk — I capture the frame, send it, and reply with my voice. You can also tap the shutter to snap manually or upload an image.',
    view: 'tools-ai',
    tap: { x: 195, y: 35 },
  },

  // -- History -----------------------------------------------------------
  {
    title: 'History · saved chats',
    caption: 'Every AI Chat and Live conversation is saved here as a topic thread. Tap any thread to replay it, with TTS and graphs.',
    view: 'tools-ai',
    tap: { x: 320, y: 35 },
  },

  // -- Info menu ---------------------------------------------------------
  {
    title: 'Info menu (top-LEFT)',
    caption: 'The (i) icon at the top-left opens About, Feedback, Rate this app, and Contact. The Tools button is on the right so they never overlap.',
    view: 'info',
    tap: { x: 30, y: 30 },
  },
  {
    title: 'About this app',
    caption: 'About: a short description, your version, and credits. Close with the ✕ on the right.',
    view: 'info',
    tap: { x: 195, y: 220 },
  },
  {
    title: 'Feedback',
    caption: 'Send feedback directly to the team — it is stored in the cloud and reviewed.',
    view: 'info',
    tap: { x: 195, y: 290 },
  },
  {
    title: 'Rate this app',
    caption: 'Leave a star rating + comment. Thank you 💜',
    view: 'info',
    tap: { x: 195, y: 360 },
  },
  {
    title: 'Contact',
    caption: 'Phone, email and social links so you can reach us. That is the whole tour — tap "Get Started" to enter the app.',
    view: 'info',
    tap: { x: 195, y: 430 },
  },
];

// Render the real component inside the frame. We make the inner content
// non-interactive (pointer-events: none) so the finger animation is the only
// thing that "drives" the demo.
const LiveView = ({ step }: { step: TourStep }) => {
  // Wrap all real components in a fixed-size container so layout calculations
  // (fixed nav bars, modals) keep behaving as in the real app.
  const noop = () => undefined;
  const navigateNoop = (_p: string) => undefined;

  let inner: React.ReactNode = null;
  switch (step.view) {
    case 'home':
      inner = (
        <>
          <Navbar currentPage="home" onNavigate={navigateNoop} />
          <HomePage onNavigate={navigateNoop} />
        </>
      );
      break;
    case 'textbooks':
      inner = (
        <>
          <Navbar currentPage="textbooks" onNavigate={navigateNoop} />
          <TextbooksPage />
        </>
      );
      break;
    case 'students':
      inner = (
        <>
          <Navbar currentPage="students" onNavigate={navigateNoop} />
          <StudentsPage onNavigate={navigateNoop} />
        </>
      );
      break;
    case 'results':
      inner = (
        <>
          <Navbar currentPage="results" onNavigate={navigateNoop} />
          <ResultsPage />
        </>
      );
      break;
    case 'mid':
      inner = (
        <>
          <Navbar currentPage="mid" onNavigate={navigateNoop} />
          <ExamResultPage type="mid" />
        </>
      );
      break;
    case 'final':
      inner = (
        <>
          <Navbar currentPage="final" onNavigate={navigateNoop} />
          <ExamResultPage type="final" />
        </>
      );
      break;
    case 'report':
      inner = (
        <>
          <Navbar currentPage="report" onNavigate={navigateNoop} />
          <ReportCardPage />
        </>
      );
      break;
    case 'info':
      inner = (
        <>
          <Navbar currentPage="info" onNavigate={navigateNoop} />
          <InfoPage onBack={noop} user={null} />
        </>
      );
      break;
    case 'tools-calc':
      inner = (
        <>
          <Navbar currentPage="home" onNavigate={navigateNoop} />
          <HomePage onNavigate={navigateNoop} />
          <ToolsModal open onClose={noop} initialTab="calc" />
        </>
      );
      break;
    case 'tools-elements':
      inner = (
        <>
          <Navbar currentPage="home" onNavigate={navigateNoop} />
          <HomePage onNavigate={navigateNoop} />
          <ToolsModal open onClose={noop} initialTab="table" />
        </>
      );
      break;
    case 'tools-ai':
      inner = (
        <>
          <Navbar currentPage="home" onNavigate={navigateNoop} />
          <HomePage onNavigate={navigateNoop} />
          <ToolsModal open onClose={noop} initialTab="ai" />
        </>
      );
      break;
  }

  return (
    <div
      style={{ width: FRAME_W, height: FRAME_H }}
      // pointer-events:none so the user can't fight the demo. The inner real
      // app still uses position:fixed for nav/tools — those resolve against
      // this div thanks to `transform` on the parent (see PhoneFrame).
      className="relative bg-background overflow-hidden pointer-events-none select-none"
    >
      {inner}
    </div>
  );
};

// Phone outline that wraps the real app. The transform on the parent creates
// a new containing block, so position:fixed children of the inner app
// resolve against THIS frame instead of the viewport — exactly what we want.
const PhoneFrame = ({
  children,
  scale,
  zoomed,
}: {
  children: React.ReactNode;
  scale: number;
  zoomed: boolean;
}) => {
  const finalScale = scale * (zoomed ? 1.6 : 1);
  return (
    <div
      style={{
        width: FRAME_W * finalScale + 20,
        height: FRAME_H * finalScale + 20,
      }}
      className="mx-auto"
    >
      <div
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${finalScale})`,
          transformOrigin: 'top left',
        }}
        className="rounded-[36px] border-[6px] border-foreground/80 bg-foreground shadow-2xl overflow-hidden relative"
      >
        {/* Dynamic-island-ish top notch */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-foreground z-[200]" />
        <div className="absolute inset-0 overflow-hidden rounded-[28px]">{children}</div>
      </div>
    </div>
  );
};

// The animated finger that travels to each step's tap target.
const Finger = ({
  x,
  y,
  scale,
}: {
  x: number;
  y: number;
  scale: number;
}) => (
  <motion.div
    initial={false}
    animate={{ left: x * scale, top: y * scale }}
    transition={{ type: 'spring', stiffness: 90, damping: 16 }}
    className="absolute z-[300] pointer-events-none"
    style={{ transform: 'translate(-50%, -50%)' }}
  >
    {/* Pulsing ring — fires every step change */}
    <motion.div
      key={`${x}-${y}`}
      initial={{ scale: 0.6, opacity: 0.9 }}
      animate={{ scale: 2.4, opacity: 0 }}
      transition={{ duration: 1, repeat: Infinity }}
      className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 w-10 h-10 rounded-full border-2 border-primary"
    />
    <div className="w-9 h-9 rounded-full bg-background border-2 border-primary shadow-lg flex items-center justify-center">
      <Hand className="w-4 h-4 text-primary -rotate-12" />
    </div>
  </motion.div>
);

const LivePreviewTour = ({ onComplete }: LivePreviewTourProps) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const timer = useRef<number | null>(null);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  // Responsive scale: shrink the 390x720 frame to fit the available width.
  // We pick a scale based on viewport — small phones show a tighter preview.
  const scale = useMemo(() => {
    if (typeof window === 'undefined') return 0.62;
    const vw = window.innerWidth;
    if (vw < 380) return 0.55;
    if (vw < 480) return 0.6;
    if (vw < 768) return 0.66;
    return 0.72;
  }, []);

  const next = () => (isLast ? onComplete() : setStepIdx((s) => s + 1));
  const prev = () => setStepIdx((s) => Math.max(0, s - 1));

  // Auto-advance every 5s when autoPlay is on.
  useEffect(() => {
    if (!autoPlay) return;
    if (isLast) {
      setAutoPlay(false);
      return;
    }
    timer.current = window.setTimeout(() => setStepIdx((s) => s + 1), 7000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [autoPlay, stepIdx, isLast]);

  // Reset zoom when changing steps.
  useEffect(() => {
    setZoomed(false);
  }, [stepIdx]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background overflow-y-auto"
    >
      {/* Decorative backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-5 flex flex-col items-center">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-3">
          <h1 className="text-base font-bold">Live preview tour</h1>
          <button
            onClick={onComplete}
            aria-label="Skip tour"
            className="p-2 rounded-full bg-muted active:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="w-full flex justify-center gap-1.5 mb-3 flex-wrap">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIdx
                  ? 'w-6 bg-primary'
                  : i < stepIdx
                    ? 'w-1.5 bg-primary/60'
                    : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step title + caption */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full text-center mb-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
              Step {stepIdx + 1} / {STEPS.length}
            </p>
            <h2 className="text-lg font-bold mt-0.5">{step.title}</h2>
            <p className="text-xs text-muted-foreground mt-1 px-2">{step.caption}</p>
          </motion.div>
        </AnimatePresence>

        {/* Live phone with finger overlay. Tap to zoom in/out. */}
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          className="relative cursor-zoom-in mb-2 outline-none"
        >
          <PhoneFrame scale={scale} zoomed={zoomed}>
            <LiveView step={step} />
            {step.tap && (
              <Finger
                x={step.tap.x}
                y={step.tap.y}
                scale={scale * (zoomed ? 1.6 : 1)}
              />
            )}
          </PhoneFrame>
        </button>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-3">
          <ZoomIn className="w-3 h-3" />
          {zoomed ? 'Tap preview again to zoom out' : 'Tap preview to zoom in'}
        </p>

        {/* Controls */}
        <div className="w-full flex gap-2 mb-2">
          <button
            onClick={() => setAutoPlay((p) => !p)}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {autoPlay ? (
              <><Pause className="w-4 h-4" /> Pause</>
            ) : (
              <><Play className="w-4 h-4" /> {stepIdx === 0 ? 'Auto-play' : 'Resume'}</>
            )}
          </button>
          <button
            onClick={onComplete}
            className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 active:bg-accent"
          >
            <SkipForward className="w-4 h-4" /> Skip tour
          </button>
        </div>

        <div className="w-full flex gap-2">
          <button
            onClick={prev}
            disabled={stepIdx === 0}
            className="flex-1 py-2.5 rounded-xl bg-card border border-border text-sm font-medium disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={next}
            className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-600 text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
          >
            {isLast ? (
              <>Get Started <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Next: {STEPS[stepIdx + 1]?.title} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LivePreviewTour;
