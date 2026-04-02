import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/LanguageContext';

export const LandingPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2000&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      <header className="p-6 flex justify-between items-center relative z-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Naati<span className="text-primary">Nest</span>
        </h1>
        
        {/* Language Toggle */}
        <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              language === 'en' ? 'bg-primary text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('kn')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              language === 'kn' ? 'bg-primary text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-white">
        <div className="text-center mb-10 max-w-lg">
          <h2 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight">
            {t.welcome}
          </h2>
          <p className="text-lg text-white/80 font-medium">
            Experience the authentic taste of traditional non-veg cuisine.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-semibold tracking-wide uppercase">
            🥩 100% Non-Veg
          </span>
          <button 
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-semibold tracking-wide uppercase hover:bg-white/20 transition-colors cursor-pointer"
          >
            🍽️ Dine-In Only
          </button>
        </div>

        <div className="flex justify-center w-full max-w-xs">
          <Button 
            onClick={() => navigate('/login')}
            className="w-full text-lg py-6 shadow-xl shadow-primary/20"
          >
            {t.start_ordering}
          </Button>
        </div>
      </main>
    </div>
  );
};
