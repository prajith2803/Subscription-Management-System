import React from 'react';
import { cn } from '../../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

