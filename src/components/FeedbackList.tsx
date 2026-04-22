import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, User as UserIcon, Mail, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RatingRow {
  id: string;
  rating: number;
  message: string | null;
  user_name: string | null;
  user_email: string | null;
  user_id: string | null;
  created_at: string;
}

const FeedbackList = () => {
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error: err } = await supabase
      .from('ratings')
      .select('id, rating, message, user_name, user_email, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
    } else {
      setRows((data || []) as RatingRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('ratings-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const uniqueUsers = new Set(rows.map((r) => r.user_id).filter(Boolean)).size;
  const avg =
    rows.length > 0 ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-2xl p-3 border border-border text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-lg font-bold">{avg}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Average</p>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-lg font-bold">{rows.length}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Reviews</p>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <UserIcon className="w-3.5 h-3.5" />
            <span className="text-lg font-bold">{uniqueUsers}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Users</p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive text-center">{error}</p>}

      {rows.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ratings appear here in real time as users submit them.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-card rounded-2xl p-3 border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">
                        {r.user_name || r.user_email || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3 h-3 ${
                              n <= r.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.user_email && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                        <Mail className="w-2.5 h-2.5" />
                        <span className="truncate">{r.user_email}</span>
                      </div>
                    )}
                    {r.message && (
                      <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                        {r.message}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
