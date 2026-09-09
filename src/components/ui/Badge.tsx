import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'warning' | 'success' | 'bestseller' | 'special' | 'veg' | 'non-veg';
  className?: string;
  children?: React.ReactNode;
}

export const Badge = ({ className, variant = 'pending', children, ...props }: BadgeProps) => {
  const variants = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    preparing: 'bg-orange-50 text-orange-700 border border-orange-200/80',
    ready: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    served: 'bg-slate-100 text-slate-600 border border-slate-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    bestseller: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-xs',
    special: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs',
    veg: 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold',
    'non-veg': 'bg-rose-50 text-rose-700 border border-rose-300 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

