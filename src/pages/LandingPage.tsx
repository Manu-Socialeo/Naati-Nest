import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Sparkles, UtensilsCrossed, ShieldCheck, Flame } from 'lucide-react';

export const LandingPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        if (data && data.length > 0) setBanners(data);
      } catch {}
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans">
      {/* Cinematic Background Image With High-End Culinary Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2000&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 backdrop-blur-[1.5px]" />
      </div>

      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center relative z-10 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/90 flex items-center justify-center shadow-glow-green border border-primary-border/40">
            <UtensilsCrossed size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
              Naati<span className="text-emerald-400">Nest</span>
            </h1>
            <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase mt-0.5">
              Authentic Cuisine
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-primary text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              language === 'kn'
                ? 'bg-primary text-white shadow-xs'
                : 'text-white/70 hover:text-white'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10 text-white max-w-2xl mx-auto w-full text-center">
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="w-full mb-8 relative">
            <div className="glass-dark rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all">
              {banners[currentBanner].image_url && (
                <img
                  src={banners[currentBanner].image_url}
                  alt={banners[currentBanner].title}
                  className="w-full h-44 object-cover"
                />
              )}
              <div className="p-5 text-left bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-amber-400" />
                  <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                    Featured Special
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{banners[currentBanner].title}</h3>
                {banners[currentBanner].subtitle && (
                  <p className="text-sm text-white/80 mt-1 font-medium">
                    {banners[currentBanner].subtitle}
                  </p>
                )}
                {banners[currentBanner].link_url && (
                  <button
                    type="button"
                    onClick={() => navigate(banners[currentBanner].link_url)}
                    className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Order Now →
                  </button>
                )}
              </div>
            </div>
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/80 transition-colors cursor-pointer text-white"
                  title="Previous banner"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/80 transition-colors cursor-pointer text-white"
                  title="Next banner"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="flex justify-center gap-1.5 mt-3">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentBanner(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === currentBanner ? 'bg-primary w-6' : 'bg-white/40 w-2'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide uppercase mb-4 text-emerald-300">
            <Flame size={14} className="text-amber-400" />
            Wood-Fired • Heritage Spices
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight">
            {t.welcome}
          </h2>
          <p className="text-base sm:text-lg text-white/85 font-medium max-w-lg mx-auto leading-relaxed">
            Relish authentic rustic biryanis, slow-cooked gravies, and fiery starters prepared with
            heritage Karnataka spices.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-8">
          <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-bold tracking-wide uppercase text-white/90">
            🥩 100% Non-Veg
          </span>
          <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-bold tracking-wide uppercase text-white/90">
            📱 Scan & Order at Table
          </span>
          <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-bold tracking-wide uppercase text-white/90">
            ⚡ Quick Kitchen Dispatch
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
          <Button
            size="lg"
            onClick={() => navigate('/menu')}
            className="w-full text-base py-4 shadow-xl shadow-primary/30 font-extrabold tracking-wide"
          >
            {t.start_ordering}
          </Button>
          <Button
            size="lg"
            variant="outlined"
            onClick={() => navigate('/login')}
            className="w-full text-base py-4 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:text-white"
          >
            Staff & Admin Login
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-white/50 relative z-10">
        © {new Date().getFullYear()} Naati Nest. All rights reserved.
      </footer>
    </div>
  );
};
