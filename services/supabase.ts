import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log('Supabase Config Check:', {
  hasUrl: !!supabaseUrl,
  urlStart: supabaseUrl?.slice(0, 10),
  hasKey: !!supabaseAnonKey,
  keyStart: supabaseAnonKey?.slice(0, 5)
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Supabase URL must start with https://');
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_project_url_here') && 
  !supabaseUrl.includes('placeholder')
);

export const supabaseConfig = {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  rawUrl: supabaseUrl,
  rawKey: supabaseAnonKey
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
