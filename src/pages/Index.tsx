import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '@/components/SplashScreen';
import LoginGate from '@/components/LoginGate';
import WelcomeOnboarding from '@/components/WelcomeOnboarding';
import Navbar from '@/components/Navbar';
import HomePage from '@/components/HomePage';
import TextbooksPage from '@/components/TextbooksPage';
import StudentsPage from '@/components/StudentsPage';
import ResultsPage from '@/components/ResultsPage';
import ExamResultPage from '@/components/ExamResultPage';
import ReportCardPage from '@/components/ReportCardPage';
import InfoPage from '@/components/InfoPage';

const Index = () => {
  const [splashDone, setSplashDone] = useState(() => sessionStorage.getItem('splash_shown') === 'true');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('portal_onboarded') === 'true');
  const [currentPage, setCurrentPage] = useState('home');
  const [pageHistory, setPageHistory] = useState<string[]>(['home']);

  // Auth: subscribe BEFORE getSession to avoid missing the initial event
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      setAuthReady(true);

      // Notify Telegram once per login event (not for token refresh)
      if (event === 'SIGNED_IN' && next) {
        const notifiedKey = `notified_${next.id}`;
        if (!sessionStorage.getItem(notifiedKey)) {
          sessionStorage.setItem(notifiedKey, '1');
          // Defer to avoid blocking auth callback
          setTimeout(() => {
            const meta = next.user_metadata || {};
            supabase.functions
              .invoke('notify-telegram', {
                body: {
                  type: 'login',
                  user: {
                    id: next.id,
                    email: next.email,
                    name: (meta.full_name as string) || (meta.name as string) || next.email,
                    avatar: meta.avatar_url as string | undefined,
                  },
                },
              })
              .catch(() => {/* silent */});
          }, 0);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const navigateTo = useCallback((page: string) => {
    setPageHistory(prev => [...prev, page]);
    setCurrentPage(page);
  }, []);

  // Android back button handling
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (pageHistory.length > 1) {
        const newHistory = [...pageHistory];
        newHistory.pop();
        setPageHistory(newHistory);
        setCurrentPage(newHistory[newHistory.length - 1]);
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pageHistory]);

  useEffect(() => {
    if (pageHistory.length > 1) {
      window.history.pushState(null, '', window.location.href);
    }
  }, [currentPage]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setSplashDone(true);
  };

  const handleOnboardComplete = () => {
    localStorage.setItem('portal_onboarded', 'true');
    setOnboarded(true);
  };

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!authReady) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginGate />;
  }

  if (!onboarded) {
    return (
      <AnimatePresence>
        <WelcomeOnboarding onComplete={handleOnboardComplete} />
      </AnimatePresence>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'textbooks': return <TextbooksPage />;
      case 'students': return <StudentsPage onNavigate={navigateTo} />;
      case 'results': return <ResultsPage />;
      case 'mid': return <ExamResultPage type="mid" />;
      case 'final': return <ExamResultPage type="final" />;
      case 'report': return <ReportCardPage />;
      case 'info': return <InfoPage onBack={() => navigateTo('home')} user={user} />;
      default: return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />
      <div key={currentPage}>
        {renderPage()}
      </div>
    </div>
  );
};

export default Index;
