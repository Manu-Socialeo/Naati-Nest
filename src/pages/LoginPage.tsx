import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Phone, User, ArrowRight, ChefHat } from 'lucide-react';

export const LoginPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Save to local storage for persistence
    const isAdmin = trimmedName.toLowerCase() === 'admin' && trimmedPhone === '007';
    const userProfile = {
      id: `user-${Date.now()}`,
      user_id: `user-${Date.now()}`,
      full_name: trimmedName,
      phone: isAdmin ? '9999999999' : trimmedPhone,
      email: isAdmin ? 'Manpreeth007@gmail.com' : `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      role: isAdmin ? 'admin' : 'customer',
      created_at: new Date().toISOString()
    };
    
    login(userProfile as any);

    // Call API route (optional for now, but good for structure)
    try {
      await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, phone: isAdmin ? '9999999999' : trimmedPhone, role: isAdmin ? 'admin' : 'customer' }),
      });
    } catch (error) {
      console.error('Login API error:', error);
    }

    navigate(isAdmin ? '/admin' : '/menu');
  };

  const isAdminName = name.trim().toLowerCase() === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{t.welcome}</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label={t.enter_name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={isAdminName ? t.enter_password : t.enter_phone}
            type={isAdminName ? "password" : "tel"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            {t.start_ordering}
          </Button>
        </form>
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-2">Admin access? Use name "Admin" and password "007"</p>
        </div>
      </Card>
    </div>
  );
};
