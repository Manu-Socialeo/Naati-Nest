import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: ReturnType<typeof createClient>;

if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'naati-nest-web',
      },
    },
  });
} else {
  const noopChannel = {
    on: () => noopChannel,
    subscribe: () => ({ unsubscribe: () => {} }),
  };
  _supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      order: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    }),
    channel: () => noopChannel,
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    storage: { from: () => ({ upload: () => Promise.resolve({ error: new Error('Supabase not configured') }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  } as any;
}

export const supabase = _supabase as any;
