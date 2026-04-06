import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, UserCheck, LogOut } from 'lucide-react';
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
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="text-gray-600 mt-1">{returningUser.full_name}</p>
            <p className="text-sm text-gray-400">{returningUser.phone}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleContinueAs} className="w-full">
              Continue as {returningUser.full_name.split(' ')[0]}
            </Button>
            <button
              onClick={handleSwitchAccount}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut size={14} />
              Not you? Switch account
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // New login view
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{t.welcome}</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your details to start ordering</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label={t.enter_name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
          />
          <Input
            label={isAdminLogin ? t.enter_password : t.enter_phone}
            type={isAdminLogin ? "password" : "tel"}
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
            <div>
              <Input
                label="Admin PIN"
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false); }}
                required
                maxLength={4}
                placeholder="Enter 4-digit PIN"
              />
              {pinError && <p className="text-xs text-red-500 mt-1">Incorrect PIN. Try again.</p>}
              <p className="text-xs text-gray-400 mt-1">Default PIN: 1234</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : t.start_ordering}
          </Button>
        </form>
      </Card>
    </div>
  );
};
