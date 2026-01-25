import {
  Clock,
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Ban,
} from 'lucide-react';
import type { Review, Researcher } from '../types';
import {
  REVIEW_TYPE_LABELS,
  REVIEW_CATEGORY_LABELS,
  PRIORITY_COLORS,
  STATUS_CONFIG,
} from '../types';
import { formatRelativeTime, formatMinutes } from '../utils/helpers';

interface ReviewCardProps {
  review: Review;
  researcher?: Researcher;
  onAssign?: (reviewId: string) => void;
  onStatusChange?: (reviewId: string, status: Review['status']) => void;
  compact?: boolean;
}

const StatusIcon = ({ status }: { status: Review['status'] }) => {
  switch (status) {
    case 'needs_review':
      return <AlertCircle className="w-4 h-4" />;
    case 'in_review':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'reviewed':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'blocked':
      return <Ban className="w-4 h-4" />;
  }
};

export function ReviewCard({
  review,
  researcher,
  onAssign,
  onStatusChange,
  compact = false,
}: ReviewCardProps) {
  const priorityColors = PRIORITY_COLORS[review.priority];
  const statusConfig = STATUS_CONFIG[review.status];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
        <div
          className={`w-2 h-2 rounded-full ${
            review.priority === 'critical'
              ? 'bg-red-500 animate-pulse'
              : review.priority === 'high'
              ? 'bg-orange-500'
              : review.priority === 'medium'
              ? 'bg-yellow-500'
              : 'bg-slate-400'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {review.title}
          </p>
          <p className="text-xs text-slate-500">
            {REVIEW_TYPE_LABELS[review.type]}
          </p>
        </div>
        {researcher && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: researcher.color }}
            title={researcher.name}
          >
            {researcher.initials}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 card-hover animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors.bg} ${priorityColors.text}`}
            >
              {review.priority.charAt(0).toUpperCase() + review.priority.slice(1)}
            </span>
            <span className="text-xs text-slate-400">
              {REVIEW_CATEGORY_LABELS[review.category]}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 truncate">
            {review.title}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {REVIEW_TYPE_LABELS[review.type]}
          </p>
        </div>

        {/* Status badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
        >
          <StatusIcon status={review.status} />
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>
      </div>

      {/* Description */}
      {review.description && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2">
          {review.description}
        </p>
      )}

      {/* Blocked reason */}
      {review.status === 'blocked' && review.blockedReason && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-700">
            <strong>Blocked:</strong> {review.blockedReason}
          </p>
        </div>
      )}

      {/* Meta info */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        {review.jurisdiction && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{review.jurisdiction}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>~{formatMinutes(review.estimatedMinutes)}</span>
        </div>
        <div className="text-slate-400">
          Updated {formatRelativeTime(review.updatedAt)}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        {researcher ? (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{ backgroundColor: researcher.color }}
            >
              {researcher.initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {researcher.name}
              </p>
              <p className="text-xs text-slate-500">Assigned</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-4 h-4" />
            <span className="text-sm">Unassigned</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!researcher && onAssign && (
            <button
              onClick={() => onAssign(review.id)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Assign
            </button>
          )}
          {review.status === 'needs_review' && onStatusChange && (
            <button
              onClick={() => onStatusChange(review.id, 'in_review')}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Start Review
            </button>
          )}
          {review.status === 'in_review' && onStatusChange && (
            <button
              onClick={() => onStatusChange(review.id, 'reviewed')}
              className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Quality score for completed */}
      {review.status === 'reviewed' && review.qualityScore && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  star <= Math.round(review.qualityScore!)
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm font-medium text-slate-600">
            {review.qualityScore.toFixed(1)} quality score
          </span>
          {review.actualMinutes && (
            <span className="text-sm text-slate-400">
              • Completed in {formatMinutes(review.actualMinutes)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
