// Review Types based on the SOP document
export type ReviewType =
  | 'deep_research_community'
  | 'deep_research_race'
  | 'deep_research_candidate'
  | 'deep_research_measure'
  | 'endorsements'
  | 'media_validation'
  | 'voter_guide'
  | 'recommendations'
  | 'candidate_summary'
  | 'candidate_issue_summary'
  | 'measure_identity_alignment';

export type ReviewCategory = 'full_review' | 'diff_review' | 'spot_check';

export type ReviewStatus = 'needs_review' | 'in_review' | 'reviewed' | 'blocked';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Researcher {
  id: string;
  name: string;
  initials: string;
  email: string;
  avatar?: string;
  color: string; // For visual identification
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  avgTimePerReview: number; // in minutes
  achievements: Achievement[];
  joinedAt: Date;
}

export interface Review {
  id: string;
  title: string;
  description?: string;
  type: ReviewType;
  category: ReviewCategory;
  status: ReviewStatus;
  priority: Priority;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedMinutes: number;
  actualMinutes?: number;
  qualityScore?: number; // 1-5
  jurisdiction?: string; // e.g., "Charlotte, NC"
  race?: string; // e.g., "Mayor"
  version?: number; // For diff reviews
  blockedReason?: string;
  comments?: string;
}

export interface Assignment {
  id: string;
  reviewId: string;
  researcherId: string;
  assignedAt: Date;
  assignedBy: string; // "auto" or manager name
  startedAt?: Date;
  completedAt?: Date;
}

export type AchievementType =
  | 'first_review'
  | 'speed_demon'
  | 'quality_champion'
  | 'streak_week'
  | 'streak_month'
  | 'centurion'
  | 'perfectionist'
  | 'team_player'
  | 'early_bird'
  | 'night_owl'
  | 'marathon_runner';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyStats {
  date: Date;
  totalReviews: number;
  totalMinutes: number;
  avgQualityScore: number;
  reviewsByType: Record<ReviewType, number>;
  reviewsByResearcher: Record<string, number>;
}

export interface TeamStats {
  totalReviewsCompleted: number;
  totalReviewsPending: number;
  avgTimePerReview: number;
  avgQualityScore: number;
  currentGoalProgress: number; // percentage
  goalTarget: number;
  streakLeader: string;
  qualityLeader: string;
  speedLeader: string;
}

// Helper type for review type display names
export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  deep_research_community: 'Community Context',
  deep_research_race: 'Race Research',
  deep_research_candidate: 'Candidate Research',
  deep_research_measure: 'Measure Research',
  endorsements: 'Endorsements',
  media_validation: 'Media Validation',
  voter_guide: 'Voter Guide',
  recommendations: 'Recommendations',
  candidate_summary: 'Candidate Summary',
  candidate_issue_summary: 'Issue Summary',
  measure_identity_alignment: 'Measure Alignment',
};

export const REVIEW_CATEGORY_LABELS: Record<ReviewCategory, string> = {
  full_review: 'Full Review',
  diff_review: 'Diff Review',
  spot_check: 'Spot Check',
};

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  low: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
};

export const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bgColor: string }> = {
  needs_review: { label: 'Needs Review', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  in_review: { label: 'In Review', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  reviewed: { label: 'Reviewed', color: 'text-green-600', bgColor: 'bg-green-100' },
  blocked: { label: 'Blocked', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Activity feed types
export interface Activity {
  id: string;
  type: 'completed' | 'assigned' | 'achievement' | 'milestone';
  researcherId?: string;
  reviewId?: string;
  achievementType?: string;
  message: string;
  timestamp: Date;
}
