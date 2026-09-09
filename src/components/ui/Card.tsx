import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'subtle';
}

export const Card = ({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) => {
  const variants = {
    default: 'bg-surface border border-surface-border shadow-[var(--shadow-soft)]',
    elevated: 'bg-surface border border-surface-border/80 shadow-[var(--shadow-elevated)]',
    glass: 'glass-card shadow-[var(--shadow-soft)]',
    subtle: 'bg-surface-subtle border border-surface-border/60',
  };

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] p-6 transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

