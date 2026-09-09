import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow active:scale-[0.98] border border-transparent',
    secondary: 'bg-primary-light text-primary hover:bg-primary-muted border border-primary-border active:scale-[0.98]',
    outlined: 'border border-surface-border text-text-primary hover:border-primary hover:text-primary hover:bg-primary-light/50 active:scale-[0.98]',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle active:scale-[0.98] border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base font-bold rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-sans tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
      {children}
    </button>
  );
};

