import { useState, useRef } from 'react';
import { Upload, Plus, Trash2, Save, FileSpreadsheet, X } from 'lucide-react';
import type { Review } from '../types';

interface AdminPanelProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id'>) => void;
  onImportCSV: (reviews: Omit<Review, 'id'>[]) => void;
  onDeleteReview: (id: string) => void;
  onUpdateReview: (id: string, updates: Partial<Review>) => void;
}

export function AdminPanel({
  reviews,
  onAddReview,
  onImportCSV,
  onDeleteReview,
  onUpdateReview,
}: AdminPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Omit<Review, 'id'>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for manual entry
  const [formData, setFormData] = useState({
    title: '',
    reviewer: '',
    status: 'reviewed' as Review['status'],
    date: new Date().toISOString().split('T')[0],
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string): Omit<Review, 'id'>[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });

      // Parse date from various possible column names
      const dateStr = row.date || row.completed || row.completed_at || row.completeddate;
      const parsedDate = dateStr ? new Date(dateStr) : new Date();

      return {
        title: row.title || row.review || row.name || 'Untitled Review',
        description: row.description || '',
        type: (row.type as Review['type']) || 'deep_research_race',
        category: (row.category as Review['category']) || 'full_review',
        status: (row.status as Review['status']) || 'reviewed',
        priority: (row.priority as Review['priority']) || 'medium',
        assigneeId: row.assignee || row.reviewer || row.assigneeid || undefined,
        createdAt: parsedDate,
        updatedAt: parsedDate,
        completedAt: parsedDate,
        estimatedMinutes: 60,
        actualMinutes: 60,
        jurisdiction: row.jurisdiction || row.location || undefined,
        race: row.race || undefined,
      };
    });
  };

  const handleImportConfirm = () => {
    if (csvPreview) {
      onImportCSV(csvPreview);
      setCsvPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualAdd = () => {
    const reviewDate = new Date(formData.date);
    onAddReview({
      title: formData.title,
      type: 'deep_research_race',
      category: 'full_review',
      status: formData.status,
      priority: 'medium',
      assigneeId: formData.reviewer || undefined,
      createdAt: reviewDate,
      updatedAt: reviewDate,
      completedAt: formData.status === 'reviewed' ? reviewDate : undefined,
      estimatedMinutes: 60,
      actualMinutes: 60,
    });
    setFormData({
      title: '',
      reviewer: '',
      status: 'reviewed',
      date: new Date().toISOString().split('T')[0],
    });
    setShowAddForm(false);
  };

  const handleMarkComplete = (id: string) => {
    onUpdateReview(id, {
      status: 'reviewed',
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-500" />
          Import from CSV
        </h3>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <Upload className="w-10 h-10 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700">Drop CSV file here or click to upload</p>
              <p className="text-sm text-slate-500 mt-1">
                Expected columns: title, reviewer, date, status
              </p>
            </div>
          </label>
        </div>

        {/* CSV Preview */}
        {csvPreview && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-blue-800">
                Preview: {csvPreview.length} reviews to import
              </p>
              <button
                onClick={() => setCsvPreview(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
              {csvPreview.slice(0, 5).map((r, i) => (
                <div key={i} className="text-blue-700">
                  {r.title} - {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'No date'}
                </div>
              ))}
              {csvPreview.length > 5 && (
                <div className="text-blue-500">...and {csvPreview.length - 5} more</div>
              )}
            </div>
            <button
              onClick={handleImportConfirm}
              className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import {csvPreview.length} Reviews
            </button>
          </div>
        )}
      </div>

      {/* Manual Entry Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Manual Entry
          </h3>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add Review
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
                  Reviewer
                </label>
                <input
                  type="text"
                  value={formData.reviewer}
                  onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
                  placeholder="Reviewer name"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

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
                  <option value="needs_review">Pending</option>
                </select>
              </div>
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

      {/* Recent Reviews Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Reviews</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.slice(0, 10).map((review) => (
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
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {review.status !== 'reviewed' && (
                        <button
                          onClick={() => handleMarkComplete(review.id)}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteReview(review.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
