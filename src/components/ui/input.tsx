'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-champagne"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            'flex h-10 w-full rounded-md border border-input-border bg-input px-3 py-2 text-sm text-foreground',
            'placeholder:text-foreground-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-300',
            error && 'border-danger focus:ring-danger/40',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
