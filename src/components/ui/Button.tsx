import React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outlined' | 'ghost';
};

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    outlined: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-text-secondary hover:bg-surface',
  };

  return (
    <button
      className={cn(
        'px-6 py-3 rounded-[var(--radius-button)] font-semibold transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
