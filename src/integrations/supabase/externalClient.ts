import { createClient } from '@supabase/supabase-js';

const EXTERNAL_URL = 'https://vcmyxcfdecpmcfpkdony.supabase.co';
const EXTERNAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbXl4Y2ZkZWNwbWNmcGtkb255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjk1NDgsImV4cCI6MjA4OTk0NTU0OH0.n7oK07eaQl9RpFbKqCUMVODnyxzUFrjdN1yJsM6yQLE';

export const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_ANON_KEY);
