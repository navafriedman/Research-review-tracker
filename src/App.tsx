import { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Settings,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Cloud,
} from 'lucide-react';
import { StatsCard, ProgressRing, AdminPanel, SettingsPanel } from './components';
import type { Review, User } from './types';
import { format, subDays, startOfDay } from 'date-fns';

type View = 'dashboard' | 'admin' | 'settings';

// Default admin user
const adminUser: User = {
  id: 'admin-1',
  name: 'Nava Friedman',
  initials: 'NF',
  email: 'nava@change.org',
  role: 'admin',
  color: '#8b5cf6',
};

// Storage keys
const STORAGE_KEYS = {
  reviews: 'review-tracker-reviews',
  teammates: 'review-tracker-teammates',
  jsonbinApiKey: 'review-tracker-jsonbin-api-key',
  jsonbinBinId: 'review-tracker-jsonbin-bin-id',
};

// Load data from localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects for reviews
      if (key === STORAGE_KEYS.reviews) {
        return parsed.map((r: Review) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
          dueDate: r.dueDate ? new Date(r.dueDate) : undefined,
        })) as T;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading from storage:', e);
  }
  return defaultValue;
};

// Save data to localStorage
const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
};

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reviews, setReviews] = useState<Review[]>(() => loadFromStorage(STORAGE_KEYS.reviews, []));
  const [teammates, setTeammates] = useState<User[]>(() => loadFromStorage(STORAGE_KEYS.teammates, []));

  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);

  // Save to localStorage when data changes (only if not in read-only mode)
  useEffect(() => {
    if (!isReadOnlyMode) {
      saveToStorage(STORAGE_KEYS.reviews, reviews);
    }
  }, [reviews, isReadOnlyMode]);

  useEffect(() => {
    if (!isReadOnlyMode) {
      saveToStorage(STORAGE_KEYS.teammates, teammates);
    }
  }, [teammates, isReadOnlyMode]);

  // Auto-sync to JSONBin when data changes (debounced)
  useEffect(() => {
    if (isReadOnlyMode) return; // Don't sync in read-only mode

    const apiKey = localStorage.getItem(STORAGE_KEYS.jsonbinApiKey);
    const binId = localStorage.getItem(STORAGE_KEYS.jsonbinBinId);

    if (!apiKey || !binId) return; // Not configured yet

    // Debounce: wait 2 seconds after last change before syncing
    const timeoutId = setTimeout(async () => {
      try {
        const data = {
          publishedAt: new Date().toISOString(),
          reviews: reviews.map((r) => ({
            title: r.title,
            status: r.status,
            completedAt: r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : null,
            assigneeId: r.assigneeId || null,
            jurisdiction: r.jurisdiction || '',
          })),
          teammates: teammates.map((t) => ({
            name: t.name,
            email: t.email,
            color: t.color,
          })),
        };

        await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
            'X-Bin-Private': 'false',
          },
          body: JSON.stringify(data),
        });

        console.log('Auto-synced to cloud');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [reviews, teammates, isReadOnlyMode]);

  // Load from JSONBin if ?bin= parameter is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const binId = params.get('bin');
    if (binId) {
      setIsCloudLoading(true);
      setIsReadOnlyMode(true);
      fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {
          'X-Bin-Meta': 'false',
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const loadedReviews = (data.reviews || []).map((r: Record<string, string | null>, i: number) => ({
            id: `cloud-${i}`,
            title: r.title || '',
            status: r.status || 'pending',
            completedAt: r.completedAt ? new Date(r.completedAt + 'T00:00:00') : undefined,
            assigneeId: r.assigneeId || undefined,
            jurisdiction: r.jurisdiction || '',
          }));
          const loadedTeammates = (data.teammates || []).map((t: Record<string, string>, i: number) => ({
            id: `teammate-${i}`,
            name: t.name || '',
            email: t.email || '',
            color: t.color || 'blue',
            role: 'viewer' as const,
          }));
          setReviews(loadedReviews);
          setTeammates(loadedTeammates);
          setCloudError(null);
        })
        .catch((err) => {
          setCloudError('Failed to load shared data: ' + err.message);
        })
        .finally(() => {
          setIsCloudLoading(false);
        });
    }
  }, []);

  // Helper to generate user from name
  const createUserFromName = (name: string): User => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      id: `teammate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      initials,
      email: '',
      role: 'teammate',
      color,
    };
  };

  // Handle teammate management
  const handleAddTeammate = (teammate: Omit<User, 'id'>) => {
    // Check if teammate with same name already exists
    const exists = teammates.some(
      (t) => t.name.toLowerCase() === teammate.name.toLowerCase()
    );
    if (exists) return;

    const newTeammate: User = {
      ...teammate,
      id: `teammate-${Date.now()}`,
    };
    setTeammates((prev) => [...prev, newTeammate]);
  };

  const handleUpdateTeammate = (id: string, updates: Partial<User>) => {
    setTeammates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          // Regenerate initials if name changed
          if (updates.name) {
            updated.initials = updates.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleRemoveTeammate = (id: string) => {
    setTeammates((prev) => prev.filter((t) => t.id !== id));
  };

  // Calculate stats
  const completedReviews = reviews.filter((r) => r.status === 'reviewed');
  const totalGoal = 352;
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

  // Helper to normalize names for matching (handles OCR variations)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[''`´'ʼ]/g, '')      // Remove all apostrophe variants
      .replace(/[""„"«»]/g, '')      // Remove quote variants
      .replace(/[\u2018\u2019\u201B\u2032\u2035]/g, '') // Unicode apostrophes
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .replace(/[^\w\s]/g, '')       // Remove any remaining special chars
      .trim();
  };

  // Find best matching teammate name for a given assigneeId
  const findMatchingTeammate = (assigneeId: string): string | null => {
    const normalizedAssignee = normalizeName(assigneeId);

    // Check admin first
    if (normalizeName(adminUser.name) === normalizedAssignee) {
      return adminUser.name;
    }

    // Check teammates - exact normalized match
    for (const t of teammates) {
      if (normalizeName(t.name) === normalizedAssignee) {
        return t.name;
      }
    }

    // Try partial match (first and last name separately)
    const assigneeParts = normalizedAssignee.split(' ').filter(Boolean);
    if (assigneeParts.length >= 2) {
      const firstName = assigneeParts[0];
      const lastName = assigneeParts[assigneeParts.length - 1];

      for (const t of teammates) {
        const teammateParts = normalizeName(t.name).split(' ').filter(Boolean);
        if (teammateParts.length >= 2) {
          const tmFirstName = teammateParts[0];
          const tmLastName = teammateParts[teammateParts.length - 1];

          // Match if first and last names match (handles middle name differences)
          if (firstName === tmFirstName && lastName === tmLastName) {
            return t.name;
          }
        }
      }
    }

    // Try contains match for partial OCR results (e.g., "Christina O" matches "Christina O'Reilly")
    for (const t of teammates) {
      const normalizedTeammate = normalizeName(t.name);
      // Check if one contains the other (for partial matches)
      if (normalizedTeammate.includes(normalizedAssignee) ||
          normalizedAssignee.includes(normalizedTeammate)) {
        return t.name;
      }
      // Check if first name + start of last name matches
      if (normalizedAssignee.length >= 5 && normalizedTeammate.startsWith(normalizedAssignee)) {
        return t.name;
      }
    }

    return null;
  };

  // Progress by individual - using teammates and assigneeId names
  const individualProgress = useMemo(() => {
    const byPerson: Record<string, { id: string; name: string; count: number; color: string }> = {};

    // Add teammates (keyed by normalized name)
    teammates.forEach((t) => {
      byPerson[normalizeName(t.name)] = { id: t.id, name: t.name, count: 0, color: t.color };
    });

    // Add admin user
    byPerson[normalizeName(adminUser.name)] = { id: adminUser.id, name: adminUser.name, count: 0, color: adminUser.color };

    // Count completed reviews per person (using flexible matching)
    completedReviews.forEach((r) => {
      if (r.assigneeId) {
        const matchedName = findMatchingTeammate(r.assigneeId);
        if (matchedName) {
          const key = normalizeName(matchedName);
          if (byPerson[key]) {
            byPerson[key].count++;
          }
        }
      }
    });

    return Object.values(byPerson)
      .filter((p) => p.count > 0 || teammates.some((t) => t.name === p.name) || p.name === adminUser.name)
      .sort((a, b) => b.count - a.count);
  }, [completedReviews, teammates]);

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
    // Auto-add any new reviewers to the team
    const existingNames = new Set([
      adminUser.name.toLowerCase(),
      ...teammates.map((t) => t.name.toLowerCase()),
    ]);

    const newTeammates: User[] = [];
    importedReviews.forEach((r) => {
      if (r.assigneeId) {
        const nameLower = r.assigneeId.toLowerCase();
        if (!existingNames.has(nameLower)) {
          existingNames.add(nameLower);
          newTeammates.push(createUserFromName(r.assigneeId));
        }
      }
    });

    if (newTeammates.length > 0) {
      setTeammates((prev) => [...prev, ...newTeammates]);
    }

    // Import the reviews
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

  // Navigation items
  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'admin' as View, icon: Settings, label: 'Admin' },
    { id: 'settings' as View, icon: Cloud, label: 'Sync & Export' },
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
              <h1 className="font-bold text-slate-900">Elections Review Tracker</h1>
              <p className="text-xs text-slate-500">HiTL</p>
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

        {/* Admin User Display */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: adminUser.color }}
            >
              {adminUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {adminUser.name}
              </p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        {/* Cloud Loading Overlay */}
        {isCloudLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <Cloud className="w-12 h-12 text-indigo-500 animate-pulse mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700">Loading shared data...</p>
            </div>
          </div>
        )}

        {/* Cloud Error */}
        {cloudError && (
          <div className="bg-red-50 border-b border-red-200 px-8 py-3">
            <p className="text-sm text-red-700">{cloudError}</p>
          </div>
        )}

        {/* Read-only Mode Banner */}
        {isReadOnlyMode && !isCloudLoading && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-8 py-3 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <p className="text-sm text-indigo-700">
              <strong>Viewing shared data</strong> — This is a read-only view. Changes won't be saved.
            </p>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="px-8 py-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {currentView === 'dashboard'
                ? 'Q1 Candidate Review Tracker'
                : currentView === 'admin'
                ? 'Admin Panel'
                : 'Sync & Export'}
              {isReadOnlyMode && (
                <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  SHARED VIEW
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500">
              {currentView === 'dashboard'
                ? 'Track review progress across the team'
                : currentView === 'admin'
                ? 'Manage team and review data'
                : 'Export data and sync with cloud'}
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
                  title="Completed"
                  value={completedReviews.length}
                  subtitle={`of ${totalGoal} goal`}
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  color="green"
                />
                <StatsCard
                  title="Remaining"
                  value={totalGoal - completedReviews.length}
                  subtitle="reviews to go"
                  icon={<Clock className="w-6 h-6" />}
                  color="orange"
                />
                <StatsCard
                  title="Team Members"
                  value={teammates.length + 1}
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
                  {(() => {
                    const maxDailyCount = Math.max(...dailyProgress.map(d => d.count), 1);
                    return (
                      <div className="flex items-end justify-between gap-2 h-48">
                        {dailyProgress.map((day) => {
                          const height = day.count > 0 ? Math.max((day.count / maxDailyCount) * 100, 5) : 2;
                          return (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                              <div className="relative w-full h-36 flex items-end justify-center">
                                {/* Tooltip on hover */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {day.count} review{day.count !== 1 ? 's' : ''}
                                </div>
                                <div
                                  className="w-10 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 cursor-pointer hover:from-blue-600 hover:to-blue-500"
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-400">{day.label}</span>
                              <span className="text-xs text-slate-500">{day.date}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Individual Progress */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Progress by Individual
                </h3>
                <div className="space-y-3">
                  {individualProgress.map((person) => (
                    <div
                      key={person.name}
                      className="flex items-center gap-4 p-3 rounded-lg bg-slate-50"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-900 truncate">{person.name}</span>
                          <span className="text-sm font-bold text-slate-900">{person.count}</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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
              teammates={teammates}
              onAddReview={handleAddReview}
              onImportCSV={handleImportCSV}
              onDeleteReview={handleDeleteReview}
              onUpdateReview={handleUpdateReview}
              onAddTeammate={handleAddTeammate}
              onUpdateTeammate={handleUpdateTeammate}
              onRemoveTeammate={handleRemoveTeammate}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPanel
              reviews={reviews}
              teammates={teammates}
              onImportData={(data) => {
                // Import reviews with new IDs
                const newReviews = data.reviews.map((r, i) => ({
                  ...r,
                  id: crypto.randomUUID ? crypto.randomUUID() : `import-${Date.now()}-${i}`,
                }));
                setReviews(newReviews);

                // Import teammates with new IDs
                const newTeammates = data.teammates.map((t, i) => ({
                  ...t,
                  id: crypto.randomUUID ? crypto.randomUUID() : `teammate-${Date.now()}-${i}`,
                }));
                setTeammates(newTeammates);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
