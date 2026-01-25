import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'amber' | 'orange' | 'purple' | 'pink';
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
  pink: 'from-pink-500 to-pink-600',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 animate-count-up">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-400">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
