import { Trophy, Flame, Star, Zap, Crown } from 'lucide-react';
import type { Researcher } from '../types';
import { formatMinutes } from '../utils/helpers';

interface LeaderboardProps {
  researchers: Researcher[];
  metric: 'reviews' | 'streak' | 'quality' | 'speed';
  title: string;
}

const MetricIcon = ({ metric }: { metric: LeaderboardProps['metric'] }) => {
  switch (metric) {
    case 'reviews':
      return <Trophy className="w-5 h-5" />;
    case 'streak':
      return <Flame className="w-5 h-5" />;
    case 'quality':
      return <Star className="w-5 h-5" />;
    case 'speed':
      return <Zap className="w-5 h-5" />;
  }
};

const getMetricValue = (researcher: Researcher, metric: LeaderboardProps['metric']) => {
  switch (metric) {
    case 'reviews':
      return { value: researcher.totalReviews, label: 'reviews' };
    case 'streak':
      return { value: researcher.currentStreak, label: 'day streak' };
    case 'quality':
      return { value: '4.8', label: 'avg score' }; // Mock - would calculate from reviews
    case 'speed':
      return { value: formatMinutes(researcher.avgTimePerReview), label: 'avg time' };
  }
};

const sortResearchers = (researchers: Researcher[], metric: LeaderboardProps['metric']) => {
  return [...researchers].sort((a, b) => {
    switch (metric) {
      case 'reviews':
        return b.totalReviews - a.totalReviews;
      case 'streak':
        return b.currentStreak - a.currentStreak;
      case 'quality':
        return 0; // Would sort by actual quality score
      case 'speed':
        return a.avgTimePerReview - b.avgTimePerReview; // Lower is better
      default:
        return 0;
    }
  });
};

const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
const rankBgColors = ['bg-amber-50', 'bg-slate-50', 'bg-amber-50/50'];

export function Leaderboard({ researchers, metric, title }: LeaderboardProps) {
  const sorted = sortResearchers(researchers, metric);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-white">
          <MetricIcon metric={metric} />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="divide-y divide-slate-100">
        {sorted.slice(0, 5).map((researcher, index) => {
          const metricData = getMetricValue(researcher, metric);
          const isTop3 = index < 3;

          return (
            <div
              key={researcher.id}
              className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${
                isTop3 ? rankBgColors[index] : ''
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">
                {index === 0 ? (
                  <Crown className="w-6 h-6 text-amber-500" />
                ) : (
                  <span
                    className={`text-lg font-bold ${
                      isTop3 ? rankColors[index] : 'text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-md"
                style={{ backgroundColor: researcher.color }}
              >
                {researcher.initials}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {researcher.name}
                </p>
                {metric === 'streak' && researcher.currentStreak > 7 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> On fire!
                  </p>
                )}
              </div>

              {/* Metric value */}
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  {metricData.value}
                </p>
                <p className="text-xs text-slate-500">{metricData.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini version for dashboard
export function LeaderboardMini({
  researchers,
  metric,
  title,
}: LeaderboardProps) {
  const sorted = sortResearchers(researchers, metric);
  const top3 = sorted.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MetricIcon metric={metric} />
        <h4 className="text-sm font-medium text-slate-600">{title}</h4>
      </div>

      <div className="space-y-2">
        {top3.map((researcher, index) => {
          const metricData = getMetricValue(researcher, metric);
          return (
            <div key={researcher.id} className="flex items-center gap-2">
              <span className={`text-sm font-bold w-4 ${rankColors[index] || 'text-slate-400'}`}>
                {index + 1}
              </span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: researcher.color }}
              >
                {researcher.initials}
              </div>
              <span className="flex-1 text-sm text-slate-700 truncate">
                {researcher.name.split(' ')[0]}
              </span>
              <span className="text-sm font-medium text-slate-900">
                {metricData.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
