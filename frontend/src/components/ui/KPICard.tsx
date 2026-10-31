import React from 'react';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}) => {
  const iconVariants = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', iconVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

