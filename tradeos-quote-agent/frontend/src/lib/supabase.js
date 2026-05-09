import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const isConfigured = supabaseUrl && supabaseKey && supabaseUrl.length > 5 && supabaseKey.length > 5;

if (!isConfigured) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_KEY not set — auth will not work');
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bluecrewai-auth',
        storage: window.localStorage,
      },
    })
  : null;

export const isSupabaseConfigured = isConfigured;
