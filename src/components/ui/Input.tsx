import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, helperText, icon, className, id, ...props }: InputProps) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 text-sm rounded-[var(--radius-button)] bg-white border border-surface-border text-text-primary placeholder:text-text-muted outline-none transition-all duration-200',
            'focus:border-primary focus:ring-2 focus:ring-primary/15',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-semibold text-red-600 mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted mt-0.5">{helperText}</p>}
    </div>
  );
};

