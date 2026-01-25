import { Flame, Clock, Star, Trophy, Calendar, TrendingUp } from 'lucide-react';
import type { Researcher, Review } from '../types';
import { AchievementShowcase } from './AchievementBadge';
import { ReviewCard } from './ReviewCard';
import { ProgressRing } from './ProgressRing';
import { formatMinutes, formatSmartDate } from '../utils/helpers';

interface ResearcherProfileProps {
  researcher: Researcher;
  reviews: Review[];
  onBack: () => void;
}

export function ResearcherProfile({
  researcher,
  reviews,
  onBack,
}: ResearcherProfileProps) {
  const researcherReviews = reviews.filter(
    (r) => r.assigneeId === researcher.id
  );
  const completedReviews = researcherReviews.filter(
    (r) => r.status === 'reviewed'
  );
  const inProgressReviews = researcherReviews.filter(
    (r) => r.status === 'in_review'
  );

  // Calculate stats
  const avgQuality =
    completedReviews.length > 0
      ? completedReviews.reduce((sum, r) => sum + (r.qualityScore || 0), 0) /
        completedReviews.length
      : 0;

  // Weekly goal progress (mock: 15 reviews/week target)
  const weeklyGoal = 15;
  const weeklyProgress = Math.min(
    Math.round((completedReviews.length / weeklyGoal) * 100),
    100
  );

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
            style={{ backgroundColor: researcher.color }}
          >
            {researcher.initials}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {researcher.name}
            </h1>
            <p className="text-slate-500">{researcher.email}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatSmartDate(researcher.joinedAt)}
              </span>
            </div>
          </div>

          {/* Weekly Progress Ring */}
          <div className="text-center">
            <ProgressRing
              progress={weeklyProgress}
              size={100}
              strokeWidth={8}
              color={researcher.color}
            >
              <div>
                <p className="text-xl font-bold text-slate-900">
                  {completedReviews.length}
                </p>
                <p className="text-xs text-slate-500">/{weeklyGoal}</p>
              </div>
            </ProgressRing>
            <p className="mt-2 text-sm text-slate-500">Weekly Goal</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {researcher.currentStreak}
              </p>
              <p className="text-xs text-slate-500">Day Streak</p>
            </div>
          </div>
          {researcher.currentStreak >= 7 && (
            <p className="mt-2 text-xs text-amber-600 font-medium">
              🔥 On fire!
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {researcher.totalReviews}
              </p>
              <p className="text-xs text-slate-500">Total Reviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {avgQuality.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">Avg Quality</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatMinutes(researcher.avgTimePerReview)}
              </p>
              <p className="text-xs text-slate-500">Avg Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <AchievementShowcase achievements={researcher.achievements} />

      {/* Current Assignments */}
      {inProgressReviews.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            In Progress ({inProgressReviews.length})
          </h3>
          <div className="space-y-4">
            {inProgressReviews.map((review) => (
              <ReviewCard key={review.id} review={review} compact />
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">
          Recently Completed
        </h3>
        {completedReviews.length > 0 ? (
          <div className="space-y-4">
            {completedReviews.slice(0, 5).map((review) => (
              <ReviewCard key={review.id} review={review} compact />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No completed reviews yet</p>
        )}
      </div>
    </div>
  );
}
