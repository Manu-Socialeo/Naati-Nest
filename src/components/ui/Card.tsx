import React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
