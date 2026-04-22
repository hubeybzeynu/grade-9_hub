import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface RatingFormProps {
  user: User | null;
}

const RatingForm = ({ user }: RatingFormProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (rating === 0) {
      setError('Please pick a star rating');
      return;
    }
    if (!user) {
      setError('You must be signed in to submit a rating.');
      return;
    }
    setSending(true);

    const userName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      'Anonymous';

    // Save to DB
    const { error: dbErr } = await supabase.from('ratings').insert({
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: userName,
      rating,
      message: message.trim() || null,
    });

    if (dbErr) {
      setError(dbErr.message);
      setSending(false);
      return;
    }

    // Notify Telegram
    try {
      await supabase.functions.invoke('notify-telegram', {
        body: {
          type: 'rating',
          rating,
          message: message.trim() || undefined,
          user: {
            id: user.id,
            email: user.email,
            name: userName,
          },
        },
      });
    } catch {
      /* non-blocking — DB insert already succeeded */
    }

    setSent(true);
    setRating(0);
    setMessage('');
    setSending(false);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-1">Rate this app</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Your feedback helps us improve. The developer reads every review.
      </p>

      {/* Stars */}
      <div className="flex items-center justify-center gap-2 my-4">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || rating) >= n;
          return (
            <motion.button
              key={n}
              whileTap={{ scale: 0.85 }}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`${n} star`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us what you think (optional)…"
        className="w-full p-3 rounded-xl bg-muted border border-border text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={sending || rating === 0}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 active:opacity-80"
      >
        <Send className="w-4 h-4" />
        {sending ? 'Sending…' : 'Submit Rating'}
      </motion.button>

      {sent && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-emerald-500 text-center mt-3"
        >
          ✓ Thanks! Your rating was sent.
        </motion.p>
      )}
      {error && <p className="text-xs text-destructive text-center mt-3">{error}</p>}
    </div>
  );
};

export default RatingForm;
