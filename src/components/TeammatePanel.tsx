import { useState } from 'react';
import { Plus, Save, CheckCircle } from 'lucide-react';
import type { Review, User } from '../types';

interface TeammatePanelProps {
  reviews: Review[];
  currentUser: User;
  onAddReview: (review: Omit<Review, 'id'>) => void;
}

export function TeammatePanel({
  reviews,
  currentUser,
  onAddReview,
}: TeammatePanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for manual entry
  const [formData, setFormData] = useState({
    title: '',
    status: 'reviewed' as Review['status'],
    date: new Date().toISOString().split('T')[0],
  });

  const handleManualAdd = () => {
    const reviewDate = new Date(formData.date);
    onAddReview({
      title: formData.title,
      type: 'deep_research_race',
      category: 'full_review',
      status: formData.status,
      priority: 'medium',
      assigneeId: currentUser.id,
      createdAt: reviewDate,
      updatedAt: reviewDate,
      completedAt: formData.status === 'reviewed' ? reviewDate : undefined,
      estimatedMinutes: 60,
      actualMinutes: 60,
    });
    setFormData({
      title: '',
      status: 'reviewed',
      date: new Date().toISOString().split('T')[0],
    });
    setShowAddForm(false);
  };

  // Get current user's reviews
  const myReviews = reviews.filter((r) => r.assigneeId === currentUser.id);
  const myCompletedCount = myReviews.filter((r) => r.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          Your Progress
        </h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-600">{myCompletedCount}</p>
            <p className="text-sm text-slate-500">Reviews Completed</p>
          </div>
          <div className="h-16 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">{myReviews.filter((r) => r.status === 'in_review').length}</p>
            <p className="text-sm text-slate-500">In Progress</p>
          </div>
        </div>
      </div>

      {/* Log Completion Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Log a Completed Review
          </h3>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Log Review
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Review Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Charlotte Mayor Race Research"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Review['status'] })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="reviewed">Completed</option>
                  <option value="in_review">In Progress</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleManualAdd}
                disabled={!formData.title}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Review
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* My Recent Reviews */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">My Recent Reviews</h3>

        {myReviews.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No reviews logged yet. Click "Log Review" to add your first one!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myReviews.slice(0, 10).map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{review.title}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        review.status === 'reviewed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : review.status === 'in_review'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {review.status === 'reviewed' ? 'Completed' : review.status === 'in_review' ? 'In Progress' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {review.completedAt ? new Date(review.completedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
