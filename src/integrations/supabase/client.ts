// Primary database (Database 1) — Students, Report Cards, Ratings.
// Hardcoded so the installed mobile app works without any env vars.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jqvpvahfhzothpqltbgm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdnB2YWhmaHpvdGhwcWx0YmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjUxMTYsImV4cCI6MjA4OTk0MTExNn0.Y2pLkWfuaWoggUIzV4YRs3bTEzkDcYaemWyjUvKdVk4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
