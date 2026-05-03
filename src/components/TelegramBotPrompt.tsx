import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ExternalLink } from 'lucide-react';
import { getBotUsername, botDeepLink, notifyTelegram, getDeviceLinkId } from '@/lib/telegramBot';

const SHOWN_KEY = 'tg_bot_prompt_shown_v1';

/**
 * Shown once after the user finishes onboarding. Offers to open the
 * project's Telegram bot so they can receive news and send feedback.
 * Also pings the admin (silently) that a new visitor arrived.
 */
const TelegramBotPrompt = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('responsstshubbot');

  useEffect(() => {
    if (localStorage.getItem(SHOWN_KEY) === 'true') return;
    let active = true;
    (async () => {
      const u = await getBotUsername();
      if (!active) return;
      setUsername(u);
      setOpen(true);
      // Best-effort visitor ping; ignore failures.
      notifyTelegram({ kind: 'visitor', name: 'New device opened the app' });
    })();
    return () => {
      active = false;
    };
  }, []);

  const close = () => {
    localStorage.setItem(SHOWN_KEY, 'true');
    setOpen(false);
  };

  const openBot = () => {
    const linkId = getDeviceLinkId();
    const url = botDeepLink(username, linkId);
    // Tell the admin which device started the link flow so the bot
    // can match the next /start payload back to this visitor.
    notifyTelegram({
      kind: 'visitor',
      name: `Link requested — payload: ${linkId}`,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 text-center shadow-xl"
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-lg font-bold text-foreground">Join our Telegram bot</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Get news, updates, and quick replies from the developer.
              You can also send feedback directly through the bot.
            </p>

            <button
              onClick={openBot}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold active:opacity-80"
            >
              <ExternalLink className="w-4 h-4" />
              Open @{username}
            </button>
            <button
              onClick={close}
              className="mt-2 w-full text-xs text-muted-foreground py-2"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TelegramBotPrompt;
