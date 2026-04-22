import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, Award, ArrowRight, Sparkles, CheckCircle, ClipboardList, FileCheck, FileText } from 'lucide-react';

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to the Portal!',
      description: 'Your one-stop destination for all academic resources and results.',
      color: 'from-primary to-cyan-600',
    },
    {
      icon: BookOpen,
      title: 'Textbooks Library',
      description: 'Access and download all your textbooks organized by subject. Preview online or download for offline reading.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Users,
      title: 'Student Directory',
      description: 'Browse through the complete student list. Search by name, filter by gender and section, and download student photos.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Award,
      title: 'Ministry Results',
      description: 'View your exam results by entering your student ID. Forgot your ID? Use your Amharic or English name to find it!',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: ClipboardList,
      title: 'Mid Exam Results',
      description: 'Check your mid-term results by entering your student ID. Results are verified by your teachers and updated in real-time.',
      color: 'from-violet-500 to-indigo-600',
    },
    {
      icon: FileCheck,
      title: 'Final Exam Results',
      description: 'View your final exam results securely. Password-protected results ensure only you can see your grades.',
      color: 'from-rose-500 to-red-600',
    },
    {
      icon: FileText,
      title: 'Report Card',
      description: 'Access your full academic report card with subject marks, averages, rank, conduct, attendance, and promotion status.',
      color: 'from-teal-500 to-cyan-600',
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary/10"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      <div className="max-w-lg w-full mx-4 relative z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center mx-auto mb-6`}
            >
              <currentStepData.icon className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-4"
            >
              <span className="gradient-text">{currentStepData.title}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mb-8 leading-relaxed"
            >
              {currentStepData.description}
            </motion.p>

            <div className="flex gap-3">
              {!isLastStep && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkip}
                  className="btn-ghost flex-1"
                >
                  Skip
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="btn-gradient flex-1 flex items-center justify-center gap-2"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feature preview icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-6 mt-8"
        >
          {steps.slice(1).map((step, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center opacity-${
                currentStep > index ? '100' : '30'
              } transition-opacity`}
              style={{ opacity: currentStep > index ? 1 : 0.3 }}
            >
              <step.icon className="w-6 h-6 text-white" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeOnboarding;
