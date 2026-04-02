import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Profile } from './types';

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
    setUser(profile);
    localStorage.setItem('current_user', JSON.stringify(profile));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
  };

  useEffect(() => {
    const checkUser = async () => {
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
      } catch (error) {
        console.error('Supabase auth error:', error);
      }

      // Fallback to local storage
      const localUser = localStorage.getItem('current_user');
      if (localUser) {
        setUser(JSON.parse(localUser));
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
