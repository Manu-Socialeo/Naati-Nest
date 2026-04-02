import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client if credentials are missing to prevent app crash on startup
const createMockSupabase = () => {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  
  const chainableMock = new Proxy({}, {
    get: (target, prop) => {
      // If it's a promise method, resolve it with an error
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: null, error: new Error('Supabase credentials missing') });
      }
      if (prop === 'catch') {
        return (reject: any) => reject(new Error('Supabase credentials missing'));
      }
      if (prop === 'finally') {
        return (cb: any) => cb();
      }
      // Otherwise, return a function that returns the same proxy to allow chaining
      return () => chainableMock;
    }
  });

  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: async () => ({ data: null, error: new Error('Supabase credentials missing') }),
          signUp: async () => ({ data: null, error: new Error('Supabase credentials missing') }),
          signOut: async () => ({ error: null }),
        };
      }
      if (prop === 'channel') {
        return () => {
          const channelObj = {
            on: () => channelObj,
            subscribe: () => channelObj,
            unsubscribe: () => {},
          };
          return channelObj;
        };
      }
      return () => chainableMock;
    }
  }) as any;
};

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabase();
