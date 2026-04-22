import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Info, ChevronRight, User as UserIcon,
  BookOpen, Award, ClipboardList, FileCheck, FileText,
  Send, ArrowLeft, ExternalLink, MessageSquare, Star, LogOut,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import RatingForm from './RatingForm';
import FeedbackList from './FeedbackList';

interface InfoPageProps {
  onBack: () => void;
  user: User | null;
}

const InfoPage = ({ onBack, user }: InfoPageProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Notify on first render that someone visited Info (only once per session)
  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem('info_visit_notified')) return;
    sessionStorage.setItem('info_visit_notified', '1');
    // Silent — no need to wait
    supabase.functions
      .invoke('notify-telegram', {
        body: {
          type: 'login',
          user: {
            id: user.id,
            email: user.email,
            name:
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              user.email,
          },
        },
      })
      .catch(() => {/* silent */});
  }, [user]);

  // (Help section removed — replaced by Feedback wall)

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    // Reset session flags so next login re-notifies
    sessionStorage.removeItem('info_visit_notified');
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith('notified_'))
      .forEach((k) => sessionStorage.removeItem(k));
    window.location.reload();
  };

  const menuItems = [
    { key: 'about', label: 'About the App', icon: Info, color: 'bg-blue-500' },
    { key: 'feedback', label: 'Feedback & Users', icon: MessageSquare, color: 'bg-emerald-500' },
    { key: 'rate', label: 'Rate this App', icon: Star, color: 'bg-amber-500' },
    { key: 'contact', label: 'Contact', icon: UserIcon, color: 'bg-rose-500' },
    { key: 'account', label: 'Account', icon: LogOut, color: 'bg-slate-500' },
  ];

  if (activeSection) {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="min-h-screen pt-16 pb-20 px-4"
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-4 active:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Info
          </button>

          {activeSection === 'about' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold text-foreground mb-3">About Grade 9 Portal</h2>
              <div className="space-y-3">
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">📱 What is this app?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Grade 9 Portal is a comprehensive student hub designed for Grade 9 students at St. Theresa School.
                    It provides easy access to all academic resources in one place, optimized for mobile use.
                  </p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">📚 Features</h3>
                  <div className="space-y-2">
                    {[
                      { icon: BookOpen, text: 'Digital Textbooks – All 12 subject textbooks with built-in PDF viewer and content finder' },
                      { icon: UserIcon, text: 'Student Directory – Browse all 98 students with search and filter' },
                      { icon: ClipboardList, text: 'Mid Exam Results – View mid-term examination results' },
                      { icon: FileCheck, text: 'Final Exam Results – Access final examination results' },
                      { icon: FileText, text: 'Report Card – View your academic report card' },
                      { icon: Award, text: 'Ministry Results – Check official ministry examination results' },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <feature.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{feature.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">👨‍💻 Developer</h3>
                  <p className="text-xs text-muted-foreground">Created by Hubeyb Zeynu</p>
                  <p className="text-xs text-muted-foreground mt-1">Built with ❤️ for students</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">📌 Version</h3>
                  <p className="text-xs text-muted-foreground">Version 2.0.0</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'feedback' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold text-foreground mb-1">Feedback & Users</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Live ratings and reviews from people using the app.
              </p>
              <FeedbackList />
            </motion.div>
          )}

          {activeSection === 'rate' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold text-foreground mb-3">Rate this App</h2>
              <RatingForm user={user} />
            </motion.div>
          )}

          {activeSection === 'contact' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold text-foreground mb-3">Contact</h2>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Hubeyb Zeynu</h3>
                    <p className="text-xs text-muted-foreground">Developer & Admin</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <a
                    href="https://t.me/grade9studentstschannel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-muted active:bg-accent transition-colors"
                  >
                    <Send className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-foreground flex-1">Telegram Channel</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                  <a
                    href="https://t.me/grade9studentsts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-muted active:bg-accent transition-colors"
                  >
                    <Send className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-foreground flex-1">Telegram Group</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                  <a
                    href="mailto:hubeybzeynu@gmail.com"
                    className="flex items-center gap-2 p-3 rounded-xl bg-muted active:bg-accent transition-colors"
                  >
                    <Send className="w-4 h-4 text-rose-500" />
                    <span className="text-xs text-foreground flex-1">Email Developer</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'account' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg font-bold text-foreground mb-3">Account</h2>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url as string}
                      alt="avatar"
                      className="w-14 h-14 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                      <UserIcon className="w-7 h-7 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {(user?.user_metadata?.full_name as string) || user?.email || 'User'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium active:bg-destructive/20 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-16 pb-20 px-4"
    >
      <div className="max-w-lg mx-auto">
        <div className="py-4 mb-2">
          <h1 className="text-xl font-bold text-foreground">Info</h1>
          <p className="text-muted-foreground text-xs mt-0.5">About, help, rate & contact</p>
        </div>

        <div className="space-y-1.5">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(item.key)}
              className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border active:bg-muted transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default InfoPage;
