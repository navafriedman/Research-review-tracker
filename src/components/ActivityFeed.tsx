import {
  CheckCircle2,
  UserPlus,
  Trophy,
  Flag,
  Sparkles,
} from 'lucide-react';
import type { Activity, Researcher } from '../types';
import { ACHIEVEMENTS_LIBRARY } from '../data/mockData';
import { formatRelativeTime } from '../utils/helpers';

interface ActivityFeedProps {
  activities: Activity[];
  researchers: Researcher[];
}

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  switch (type) {
    case 'completed':
      return (
        <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    case 'assigned':
      return (
        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    case 'achievement':
      return (
        <div className="p-2 rounded-full bg-amber-100 text-amber-600">
          <Trophy className="w-4 h-4" />
        </div>
      );
    case 'milestone':
      return (
        <div className="p-2 rounded-full bg-purple-100 text-purple-600">
          <Flag className="w-4 h-4" />
        </div>
      );
  }
};

export function ActivityFeed({ activities, researchers }: ActivityFeedProps) {
  const getResearcher = (id?: string) =>
    researchers.find((r) => r.id === id);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const researcher = getResearcher(activity.researcherId);

          return (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-slate-50 transition-colors animate-slide-up"
            >
              <div className="flex items-start gap-3">
                <ActivityIcon type={activity.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    {researcher && (
                      <span className="font-medium">{researcher.name}</span>
                    )}{' '}
                    {activity.message}
                  </p>

                  {activity.type === 'achievement' && activity.achievementType && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-full border border-amber-200">
                      <span className="text-lg">
                        {ACHIEVEMENTS_LIBRARY[activity.achievementType]?.icon}
                      </span>
                      <span className="text-sm font-medium text-amber-700">
                        {ACHIEVEMENTS_LIBRARY[activity.achievementType]?.name}
                      </span>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-slate-400">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>

                {researcher && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: researcher.color }}
                  >
                    {researcher.initials}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}
