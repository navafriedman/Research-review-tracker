import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StatsCard, ProgressRing, AdminPanel } from './components';
import { reviews as initialReviews, researchers } from './data/mockData';
import type { Review } from './types';
import { format, subDays, startOfDay } from 'date-fns';

type View = 'dashboard' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  // Calculate stats
  const completedReviews = reviews.filter((r) => r.status === 'reviewed');
  const totalGoal = 200;
  const progressPercent = Math.round((completedReviews.length / totalGoal) * 100);

  // Daily progress for last 7 days
  const dailyProgress = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDay = startOfDay(subDays(new Date(), i - 1));
      const count = completedReviews.filter((r) => {
        if (!r.completedAt) return false;
        const completed = new Date(r.completedAt);
        return completed >= date && completed < nextDay;
      }).length;
      days.push({
        label: format(date, 'EEE'),
        date: format(date, 'MMM d'),
        count,
      });
    }
    return days;
  }, [completedReviews]);

  // Progress by individual
  const individualProgress = useMemo(() => {
    const byPerson: Record<string, { name: string; count: number; color: string }> = {};

    // Initialize with all researchers
    researchers.forEach((r) => {
      byPerson[r.id] = { name: r.name, count: 0, color: r.color };
    });

    // Count completed reviews per person
    completedReviews.forEach((r) => {
      if (r.assigneeId && byPerson[r.assigneeId]) {
        byPerson[r.assigneeId].count++;
      }
    });

    return Object.values(byPerson).sort((a, b) => b.count - a.count);
  }, [completedReviews]);

  const maxIndividualCount = Math.max(...individualProgress.map((p) => p.count), 1);

  // Handlers for admin panel
  const handleAddReview = (review: Omit<Review, 'id'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleImportCSV = (importedReviews: Omit<Review, 'id'>[]) => {
    const newReviews = importedReviews.map((r, i) => ({
      ...r,
      id: `rev-import-${Date.now()}-${i}`,
    }));
    setReviews((prev) => [...newReviews, ...prev]);
  };

  const handleDeleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateReview = (id: string, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  // Navigation
  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'admin' as View, icon: Settings, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
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
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

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
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="px-8 py-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {currentView === 'dashboard' ? 'Dashboard' : 'Admin Panel'}
            </h2>
            <p className="text-sm text-slate-500">
              {currentView === 'dashboard'
                ? 'Track review progress across the team'
                : 'Manage review data'}
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {currentView === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Total Completed"
                  value={completedReviews.length}
                  subtitle={`of ${totalGoal} goal`}
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  color="green"
                />
                <StatsCard
                  title="In Progress"
                  value={reviews.filter((r) => r.status === 'in_review').length}
                  subtitle="currently active"
                  icon={<Clock className="w-6 h-6" />}
                  color="blue"
                />
                <StatsCard
                  title="Team Members"
                  value={researchers.length}
                  subtitle="active reviewers"
                  icon={<Users className="w-6 h-6" />}
                  color="purple"
                />
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Overall Progress */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-6">Overall Progress</h3>
                  <div className="flex items-center gap-8">
                    <ProgressRing
                      progress={progressPercent}
                      size={140}
                      strokeWidth={10}
                      color="#3b82f6"
                    >
                      <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900">{progressPercent}%</p>
                        <p className="text-xs text-slate-500">complete</p>
                      </div>
                    </ProgressRing>
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Completed</span>
                          <span className="font-medium text-slate-900">{completedReviews.length}</span>
                        </div>
                        <div className="h-2 bg-emerald-100 rounded-full">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(completedReviews.length / totalGoal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Remaining</span>
                          <span className="font-medium text-slate-900">{totalGoal - completedReviews.length}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div
                            className="h-full bg-slate-400 rounded-full transition-all"
                            style={{ width: `${((totalGoal - completedReviews.length) / totalGoal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Progress */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-6">Daily Progress (Last 7 Days)</h3>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {dailyProgress.map((day) => {
                      const height = day.count > 0 ? Math.max((day.count / 10) * 100, 10) : 4;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                          <div className="relative w-full h-40 flex items-end justify-center">
                            <div
                              className="w-10 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500">{day.label}</span>
                          <span className="text-sm font-bold text-slate-900">{day.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Individual Progress */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Progress by Individual
                </h3>
                <div className="space-y-4">
                  {individualProgress.map((person) => (
                    <div key={person.name} className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-900 truncate">{person.name}</span>
                          <span className="text-sm font-bold text-slate-900 ml-2">{person.count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(person.count / maxIndividualCount) * 100}%`,
                              backgroundColor: person.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'admin' && (
            <AdminPanel
              reviews={reviews}
              onAddReview={handleAddReview}
              onImportCSV={handleImportCSV}
              onDeleteReview={handleDeleteReview}
              onUpdateReview={handleUpdateReview}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
