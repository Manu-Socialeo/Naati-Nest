import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'warning' | 'success';
  className?: string;
  children?: React.ReactNode;
}

export const Badge = ({ className, variant = 'pending', children, ...props }: BadgeProps) => {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
  };

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
