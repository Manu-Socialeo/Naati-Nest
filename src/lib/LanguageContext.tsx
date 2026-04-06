import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './translations/en';
import { kn } from './translations/kn';

type Language = 'en' | 'kn';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en;
}>({
  language: 'en',
  setLanguage: () => {},
  t: en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      return (saved === 'en' || saved === 'kn') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_language', language);
    } catch { /* storage full or disabled */ }
  }, [language]);

  const t = language === 'en' ? en : kn;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
