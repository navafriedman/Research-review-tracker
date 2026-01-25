import type { Achievement } from '../types';
import { formatRelativeTime } from '../utils/helpers';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
}

const rarityColors = {
  common: 'from-slate-400 to-slate-500 border-slate-300',
  rare: 'from-blue-400 to-blue-600 border-blue-300',
  epic: 'from-purple-400 to-purple-600 border-purple-300',
  legendary: 'from-amber-400 to-amber-600 border-amber-300',
};

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-200',
  epic: 'shadow-purple-200',
  legendary: 'shadow-amber-200 animate-pulse',
};

const sizeClasses = {
  sm: 'w-12 h-12 text-xl',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-20 h-20 text-3xl',
};

export function AchievementBadge({
  achievement,
  size = 'md',
  showDate = false,
}: AchievementBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity]}
          border-2 shadow-lg ${rarityGlow[achievement.rarity]}
          flex items-center justify-center
          transition-transform hover:scale-110
        `}
        title={achievement.description}
      >
        <span>{achievement.icon}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-900">{achievement.name}</p>
        {showDate && (
          <p className="text-xs text-slate-500">
            {formatRelativeTime(achievement.unlockedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

// Achievement showcase for profile
interface AchievementShowcaseProps {
  achievements: Achievement[];
  maxDisplay?: number;
}

export function AchievementShowcase({
  achievements,
  maxDisplay = 6,
}: AchievementShowcaseProps) {
  const displayAchievements = achievements.slice(0, maxDisplay);
  const remaining = achievements.length - maxDisplay;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Achievements</h3>

      <div className="flex flex-wrap gap-4">
        {displayAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size="sm"
          />
        ))}

        {remaining > 0 && (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-500">
              +{remaining}
            </span>
          </div>
        )}
      </div>

      {achievements.length === 0 && (
        <p className="text-sm text-slate-500">
          No achievements yet. Keep reviewing!
        </p>
      )}
    </div>
  );
}

// New achievement notification
interface NewAchievementProps {
  achievement: Achievement;
  onClose: () => void;
}

export function NewAchievementNotification({
  achievement,
  onClose,
}: NewAchievementProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm">
        <div className="flex items-start gap-4">
          <div
            className={`
              w-16 h-16 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity]}
              border-2 shadow-lg flex items-center justify-center text-2xl
            `}
          >
            {achievement.icon}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              Achievement Unlocked!
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {achievement.name}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {achievement.description}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
