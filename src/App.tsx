import { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Trophy,
  Settings,
  Bell,
  Search,
  Sparkles,
  Clock,
  TrendingUp,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import {
  StatsCard,
  ProgressRing,
  Leaderboard,
  LeaderboardMini,
  ActivityFeed,
  AssignmentQueue,
  Confetti,
  ResearcherProfile,
} from './components';
import {
  researchers,
  reviews as initialReviews,
  teamStats,
  recentActivity,
  weeklyProgress,
} from './data/mockData';
import type { Review, Researcher } from './types';
import { formatMinutes, getRandomMotivationalMessage } from './utils/helpers';

type View = 'dashboard' | 'queue' | 'team' | 'leaderboard' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(
    null
  );

  // Calculate live stats
  const needsReviewCount = reviews.filter(
    (r) => r.status === 'needs_review'
  ).length;
  const blockedCount = reviews.filter((r) => r.status === 'blocked').length;

  // Handle status changes
  const handleStatusChange = (reviewId: string, status: Review['status']) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status,
              updatedAt: new Date(),
              completedAt: status === 'reviewed' ? new Date() : undefined,
            }
          : r
      )
    );

    // Trigger confetti on completion
    if (status === 'reviewed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // Handle assignment
  const handleAssign = (reviewId: string, researcherId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, assigneeId: researcherId, updatedAt: new Date() }
          : r
      )
    );
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'queue' as View, icon: ClipboardList, label: 'Review Queue' },
    { id: 'team' as View, icon: Users, label: 'Team' },
    { id: 'leaderboard' as View, icon: Trophy, label: 'Leaderboard' },
  ];

  // Render selected researcher profile
  if (selectedResearcher) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <ResearcherProfile
            researcher={selectedResearcher}
            reviews={reviews}
            onBack={() => setSelectedResearcher(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Confetti overlay */}
      <Confetti active={showConfetti} />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Review Tracker</h1>
              <p className="text-xs text-slate-500">Elections HiTL</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'queue' && needsReviewCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                        {needsReviewCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Motivational message */}
        <div className="p-4 mx-4 mb-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 font-medium">
            {getRandomMotivationalMessage()}
          </p>
        </div>

        {/* User */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
              NF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                Nava Friedman
              </p>
              <p className="text-xs text-slate-500">Team Lead</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {currentView === 'dashboard' && 'Dashboard'}
                {currentView === 'queue' && 'Review Queue'}
                {currentView === 'team' && 'Team Members'}
                {currentView === 'leaderboard' && 'Leaderboard'}
              </h2>
              <p className="text-sm text-slate-500">
                {currentView === 'dashboard' &&
                  'Track progress and team performance'}
                {currentView === 'queue' && 'Manage and assign reviews'}
                {currentView === 'team' && 'View team members and their stats'}
                {currentView === 'leaderboard' && "See who's leading the pack"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 w-64 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Completed Reviews"
                  value={teamStats.totalReviewsCompleted}
                  subtitle={`of ${teamStats.goalTarget} goal`}
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  trend={{ value: 12, isPositive: true }}
                  color="green"
                />
                <StatsCard
                  title="Pending Reviews"
                  value={needsReviewCount}
                  subtitle={`${blockedCount} blocked`}
                  icon={<ClipboardList className="w-6 h-6" />}
                  color="amber"
                />
                <StatsCard
                  title="Avg Time per Review"
                  value={formatMinutes(teamStats.avgTimePerReview)}
                  subtitle="Target: 2h"
                  icon={<Clock className="w-6 h-6" />}
                  trend={{ value: 8, isPositive: true }}
                  color="blue"
                />
                <StatsCard
                  title="Quality Score"
                  value={teamStats.avgQualityScore.toFixed(2)}
                  subtitle="out of 5.0"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="purple"
                />
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - Progress & Chart */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Goal Progress */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Cycle Goal Progress
                        </h3>
                        <p className="text-sm text-slate-500">
                          {teamStats.totalReviewsCompleted} of{' '}
                          {teamStats.goalTarget} reviews
                        </p>
                      </div>
                      <ProgressRing
                        progress={teamStats.currentGoalProgress}
                        size={80}
                        strokeWidth={6}
                        color="#3b82f6"
                      />
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium text-slate-900">
                          {teamStats.currentGoalProgress}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full progress-bar"
                          style={{ width: `${teamStats.currentGoalProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weekly Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-6">
                      This Week's Progress
                    </h3>
                    <div className="flex items-end justify-between gap-2 h-48">
                      {weeklyProgress.map((day) => {
                        const height = (day.completed / 25) * 100;
                        const targetHeight = (day.target / 25) * 100;
                        const isOverTarget = day.completed >= day.target;

                        return (
                          <div
                            key={day.day}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div className="relative w-full h-40 flex items-end justify-center">
                              {/* Target line */}
                              <div
                                className="absolute w-full border-t-2 border-dashed border-slate-200"
                                style={{ bottom: `${targetHeight}%` }}
                              />
                              {/* Bar */}
                              <div
                                className={`w-8 rounded-t-lg transition-all duration-500 ${
                                  isOverTarget
                                    ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                                    : 'bg-gradient-to-t from-blue-500 to-blue-400'
                                }`}
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                              {day.day}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {day.completed}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-slate-500">Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 border-t-2 border-dashed border-slate-300" />
                        <span className="text-slate-500">Target</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column - Activity & Leaders */}
                <div className="space-y-6">
                  {/* Quick Leaders */}
                  <div className="grid grid-cols-2 gap-4">
                    <LeaderboardMini
                      researchers={researchers}
                      metric="streak"
                      title="Top Streaks"
                    />
                    <LeaderboardMini
                      researchers={researchers}
                      metric="speed"
                      title="Fastest"
                    />
                  </div>

                  {/* Activity Feed */}
                  <ActivityFeed
                    activities={recentActivity}
                    researchers={researchers}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Queue View */}
          {currentView === 'queue' && (
            <AssignmentQueue
              reviews={reviews}
              researchers={researchers}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Team View */}
          {currentView === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchers.map((researcher) => {
                const researcherReviews = reviews.filter(
                  (r) => r.assigneeId === researcher.id
                );
                const inProgress = researcherReviews.filter(
                  (r) => r.status === 'in_review'
                ).length;

                return (
                  <button
                    key={researcher.id}
                    onClick={() => setSelectedResearcher(researcher)}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left card-hover"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md"
                        style={{ backgroundColor: researcher.color }}
                      >
                        {researcher.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {researcher.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {researcher.totalReviews} reviews
                        </p>
                      </div>
                      {researcher.currentStreak >= 7 && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Flame className="w-5 h-5" />
                          <span className="text-sm font-bold">
                            {researcher.currentStreak}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {researcher.currentStreak}
                        </p>
                        <p className="text-xs text-slate-500">Streak</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {formatMinutes(researcher.avgTimePerReview)}
                        </p>
                        <p className="text-xs text-slate-500">Avg Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {inProgress}
                        </p>
                        <p className="text-xs text-slate-500">Active</p>
                      </div>
                    </div>

                    {/* Achievement preview */}
                    {researcher.achievements.length > 0 && (
                      <div className="mt-4 flex gap-1">
                        {researcher.achievements.slice(0, 4).map((a) => (
                          <span key={a.id} className="text-lg" title={a.name}>
                            {a.icon}
                          </span>
                        ))}
                        {researcher.achievements.length > 4 && (
                          <span className="text-sm text-slate-400">
                            +{researcher.achievements.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leaderboard View */}
          {currentView === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Leaderboard
                researchers={researchers}
                metric="reviews"
                title="Most Reviews"
              />
              <Leaderboard
                researchers={researchers}
                metric="streak"
                title="Longest Streaks"
              />
              <Leaderboard
                researchers={researchers}
                metric="quality"
                title="Highest Quality"
              />
              <Leaderboard
                researchers={researchers}
                metric="speed"
                title="Fastest Reviewers"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
