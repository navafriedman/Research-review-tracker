import { useState } from 'react';
import {
  ListFilter,
  Search,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { Review, Researcher } from '../types';
import { REVIEW_TYPE_LABELS, STATUS_CONFIG } from '../types';
import { ReviewCard } from './ReviewCard';
import { sortByPriority } from '../utils/helpers';

interface AssignmentQueueProps {
  reviews: Review[];
  researchers: Researcher[];
  onAssign?: (reviewId: string, researcherId: string) => void;
  onStatusChange?: (reviewId: string, status: Review['status']) => void;
}

type FilterStatus = 'all' | Review['status'];
type FilterPriority = 'all' | Review['priority'];

export function AssignmentQueue({
  reviews,
  researchers,
  onAssign,
  onStatusChange,
}: AssignmentQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  const getResearcher = (id?: string) =>
    researchers.find((r) => r.id === id);

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchQuery === '' ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.jurisdiction?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      REVIEW_TYPE_LABELS[review.type].toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || review.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' || review.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort by priority
  const sortedReviews = sortByPriority(filteredReviews);

  // Count by status
  const statusCounts = {
    needs_review: reviews.filter((r) => r.status === 'needs_review').length,
    in_review: reviews.filter((r) => r.status === 'in_review').length,
    reviewed: reviews.filter((r) => r.status === 'reviewed').length,
    blocked: reviews.filter((r) => r.status === 'blocked').length,
  };

  const handleAssign = (reviewId: string) => {
    setShowAssignModal(reviewId);
  };

  const confirmAssign = (researcherId: string) => {
    if (showAssignModal && onAssign) {
      onAssign(showAssignModal, researcherId);
    }
    setShowAssignModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            {statusCounts.needs_review} needs review
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            {statusCounts.in_review} in progress
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            {statusCounts.reviewed} completed
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Priority filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ListFilter className="w-4 h-4" />
          <span className="text-sm font-medium">More Filters</span>
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        Showing {sortedReviews.length} of {reviews.length} reviews
      </p>

      {/* Reviews list */}
      <div className="space-y-4">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              researcher={getResearcher(review.assigneeId)}
              onAssign={handleAssign}
              onStatusChange={onStatusChange}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No reviews match your filters</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                Assign Review
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Select a team member to assign this review
              </p>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto">
              {researchers.map((researcher) => (
                <button
                  key={researcher.id}
                  onClick={() => confirmAssign(researcher.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: researcher.color }}
                  >
                    {researcher.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {researcher.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {researcher.totalReviews} reviews completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {researcher.currentStreak} day streak
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowAssignModal(null)}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
