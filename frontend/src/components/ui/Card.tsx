import React from 'react';
import { cn } from '../../utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  description,
  headerAction,
  ...props
}) => {
  return (
    <div
      className={cn('bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden', className)}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

