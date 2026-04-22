// Lovable Cloud client — used ONLY to invoke edge functions (AI solver).
// Separate from the primary client which points at the external students DB.
import { createClient } from '@supabase/supabase-js';

const CLOUD_URL = import.meta.env.VITE_SUPABASE_URL as string;
const CLOUD_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const cloudSupabase = createClient(CLOUD_URL, CLOUD_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
