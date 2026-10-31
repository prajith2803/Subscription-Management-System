import React from 'react';
import { cn, getStatusBadgeVariant } from '../../utils';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getStatusBadgeVariant(status),
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

