import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Profile } from './types';

const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const AuthContext = createContext<{
  user: Profile | null;
  loading: boolean;
  login: (profile: Profile) => void;
  logout: () => void;
}>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (profile: Profile) => {
    const sessionData = {
      user: profile,
      loginTime: Date.now(),
    };
    try {
      localStorage.setItem('naatinest_session', JSON.stringify(sessionData));
    } catch { /* storage full or disabled */ }
    setUser(profile);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('naatinest_session');
    } catch { /* storage full or disabled */ }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          if (profile) {
            setUser(profile);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Supabase not configured, fall through to local session
      }

      // Check local session
      const sessionStr = localStorage.getItem('naatinest_session');
      if (sessionStr) {
        try {
          const sessionData = JSON.parse(sessionStr);
          const age = Date.now() - sessionData.loginTime;
          
          if (age < SESSION_EXPIRY_MS && sessionData.user) {
            setUser(sessionData.user);
          } else {
            // Session expired
            localStorage.removeItem('naatinest_session');
          }
        } catch {
          localStorage.removeItem('naatinest_session');
        }
      }
      
      setLoading(false);
    };
    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
