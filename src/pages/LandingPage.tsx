import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const LandingPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('sort_order');
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image With Overlay */}
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
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="w-full max-w-lg mb-8 relative">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20">
              {banners[currentBanner].image_url && (
                <img src={banners[currentBanner].image_url} alt={banners[currentBanner].title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-lg font-bold">{banners[currentBanner].title}</h3>
                {banners[currentBanner].subtitle && <p className="text-sm text-white/70 mt-1">{banners[currentBanner].subtitle}</p>}
                {banners[currentBanner].link_url && (
                  <button onClick={() => navigate(banners[currentBanner].link_url)} className="mt-2 text-sm font-bold text-primary hover:underline">
                    Order Now →
                  </button>
                )}
              </div>
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full hover:bg-black/70">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full hover:bg-black/70">
                  <ChevronRight size={20} />
                </button>
                <div className="flex justify-center gap-1 mt-3">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setCurrentBanner(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'bg-primary w-6' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

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
          <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-semibold tracking-wide uppercase">
            🍽️ Dine-In Only
          </span>
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
