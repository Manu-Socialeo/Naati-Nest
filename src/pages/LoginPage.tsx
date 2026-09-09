import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { UserCheck, LogOut, User, Phone, KeyRound, Sparkles, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_PHONE = '8722163256';
const RESTAURANT_PHONE = '6362491879';
const ADMIN_PIN = '1234';

const isStaffPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s/g, '');
  return cleaned === ADMIN_PHONE || cleaned === RESTAURANT_PHONE;
};

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>{}]/g, '').trim();
};

const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^[+]?[0-9]{10,13}$/.test(cleaned);
};

export const LoginPage = () => {
  const { t } = useLanguage();
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returningUser, setReturningUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      setReturningUser(user);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = sanitizeInput(phone);

    if (!sanitizedName || sanitizedName.length < 2) {
      toast.error('Please enter a valid name (at least 2 characters)');
      return;
    }

    if (!sanitizedPhone || !isValidPhone(sanitizedPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    const isAdmin = isStaffPhone(sanitizedPhone);
    if (isAdmin && pin !== ADMIN_PIN) {
      setPinError(true);
      toast.error('Invalid PIN. Please enter the correct admin PIN.');
      return;
    }

    setSubmitting(true);

    try {
      const userProfile = {
        id: `user-${Date.now()}`,
        user_id: `user-${Date.now()}`,
        full_name: sanitizedName,
        phone: sanitizedPhone,
        email: `${sanitizedName.toLowerCase().replace(/\s+/g, '.')}@naaninest.app`,
        role: isAdmin ? 'admin' : 'customer',
        created_at: new Date().toISOString()
      };
      
      login(userProfile as any);
      navigate(isAdmin ? '/admin' : '/menu');
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueAs = () => {
    if (returningUser) {
      navigate(returningUser.role === 'admin' ? '/admin' : '/menu');
    }
  };

  const handleSwitchAccount = () => {
    logout();
    setReturningUser(null);
    setName('');
    setPhone('');
  };

  const isAdminLogin = isStaffPhone(phone);

  // Returning user view
  if (returningUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950 via-slate-900 to-stone-900">
        <Card variant="glass" className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
              <UserCheck size={36} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back!</h2>
            <p className="text-slate-600 font-semibold mt-1">{returningUser.full_name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{returningUser.phone}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleContinueAs} className="w-full shadow-lg shadow-primary/20">
              Continue as {returningUser.full_name.split(' ')[0]}
            </Button>
            <button
              onClick={handleSwitchAccount}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <LogOut size={16} />
              Not you? Switch account
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // New login view
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950 via-slate-900 to-stone-950 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <Card variant="glass" className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-4">
            <UtensilsCrossed size={13} />
            Naati Nest Cuisine
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.welcome}</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Enter your details to explore delicious food</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label={t.enter_name}
            icon={<User size={18} />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            placeholder="e.g. Anand Kumar"
          />

          <Input
            label={isAdminLogin ? t.enter_password : t.enter_phone}
            type={isAdminLogin ? "password" : "tel"}
            icon={<Phone size={18} />}
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d+\s\-()]/g, '');
              if (val.length <= 15) setPhone(val);
            }}
            required
            maxLength={15}
            placeholder="e.g. 9876543210"
          />

          {isAdminLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <Input
                label="Admin PIN"
                type="password"
                icon={<KeyRound size={18} />}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false); }}
                required
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                error={pinError ? "Incorrect PIN. Please try again." : undefined}
                helperText="Default staff PIN: 1234"
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full mt-2 shadow-lg shadow-primary/20" 
            isLoading={submitting}
          >
            {submitting ? 'Signing in...' : t.start_ordering}
          </Button>

          <p className="text-center text-[11px] text-slate-400 font-medium">
            Fast, contactless table ordering & live order tracking
          </p>
        </form>
      </Card>
    </div>
  );
};
