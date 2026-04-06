import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = ({ label, className, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-[var(--radius-button)] border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
};
