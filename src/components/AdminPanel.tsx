import { useState, useRef } from 'react';
import { Upload, Plus, Trash2, Save, FileSpreadsheet, X, Users, UserPlus, Image, Loader2, Pencil, Check } from 'lucide-react';
import Tesseract from 'tesseract.js';
import type { Review, User } from '../types';

interface AdminPanelProps {
  reviews: Review[];
  teammates: User[];
  onAddReview: (review: Omit<Review, 'id'>) => void;
  onImportCSV: (reviews: Omit<Review, 'id'>[]) => void;
  onDeleteReview: (id: string) => void;
  onUpdateReview: (id: string, updates: Partial<Review>) => void;
  onAddTeammate: (teammate: Omit<User, 'id'>) => void;
  onRemoveTeammate: (id: string) => void;
}

export function AdminPanel({
  reviews,
  teammates,
  onAddReview,
  onImportCSV,
  onDeleteReview,
  onUpdateReview,
  onAddTeammate,
  onRemoveTeammate,
}: AdminPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddTeammate, setShowAddTeammate] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Omit<Review, 'id'>[] | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Teammate form state
  const [teammateForm, setTeammateForm] = useState({
    name: '',
    email: '',
  });

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
      // Apply the selected completion date to all reviews
      const reviewDate = new Date(completionDate);
      const reviewsWithDate = csvPreview.map((r) => ({
        ...r,
        createdAt: reviewDate,
        updatedAt: reviewDate,
        completedAt: reviewDate,
        status: 'reviewed' as const,
      }));
      onImportCSV(reviewsWithDate);
      setCsvPreview(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleEditDate = (reviewId: string, currentDate: Date | undefined) => {
    setEditingReviewId(reviewId);
    setEditingDate(currentDate ? new Date(currentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const handleSaveDate = (reviewId: string) => {
    onUpdateReview(reviewId, {
      completedAt: new Date(editingDate),
      updatedAt: new Date(),
    });
    setEditingReviewId(null);
    setEditingDate('');
  };

  const handleStatusChange = (reviewId: string, newStatus: Review['status']) => {
    onUpdateReview(reviewId, {
      status: newStatus,
      completedAt: newStatus === 'reviewed' ? new Date() : undefined,
      updatedAt: new Date(),
    });
    setEditingStatusId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessingImage(true);
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const parsed = parseOCRText(result.data.text);
      setCsvPreview(parsed);
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const parseOCRText = (text: string): Omit<Review, 'id'>[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const reviews: Omit<Review, 'id'>[] = [];
    const reviewDate = new Date(completionDate);

    // Debug: log the OCR text
    console.log('OCR Text:', text);

    // Try to find table rows - look for lines containing CANDIDACY as an anchor
    for (const line of lines) {
      // Skip header-like lines
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('name') && lowerLine.includes('type')) continue;
      if (lowerLine.includes('entity type')) continue;
      if (lowerLine.includes('assigned to') && lowerLine.includes('purpose')) continue;
      if (lowerLine.includes('search')) continue;
      if (lowerLine.includes('review queue')) continue;
      if (lowerLine.includes('reviewed documents')) continue;

      // Look for lines containing CANDIDACY (the type column)
      if (line.includes('CANDIDACY') || line.includes('Candidacy')) {
        // Split by multiple spaces or tabs
        const parts = line.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean);

        if (parts.length >= 2) {
          // Find the name (text before CANDIDACY)
          let name = '';
          let type = 'CANDIDACY';
          let location = '';
          let reviewer = '';

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // Name is usually first part before CANDIDACY
            if (i === 0 && !part.includes('CANDIDACY')) {
              name = part.replace(/[^\w\s'-]/g, '').trim(); // Clean up OCR artifacts
            }

            // Type
            if (part.includes('CANDIDACY') || part.includes('Candidacy')) {
              type = 'CANDIDACY';
              // If name wasn't found, it might be merged with CANDIDACY
              if (!name && i === 0) {
                const match = part.match(/^(.+?)\s*CANDIDACY/i);
                if (match) name = match[1].trim();
              }
            }

            // Location (contains USA, state abbreviations, or common state names)
            if (part.includes('USA') || part.includes('Texas') || part.includes('Carolina') ||
                part.includes('California') || /[A-Z]{2},\s*USA/.test(part) ||
                /North\s+Carolina|South\s+Carolina/.test(part)) {
              location = part;
            }

            // Reviewer (last meaningful name - First Last pattern at end)
            // Common reviewer names from the screenshot
            if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(part) &&
                !part.includes('USA') && !part.includes('Carolina') && !part.includes('Texas') &&
                !part.includes('CANDIDACY') && !part.includes('CORE')) {
              reviewer = part;
            }
          }

          // Build title as Name + Type
          if (name) {
            const title = `${name} ${type}`;

            reviews.push({
              title,
              description: '',
              type: 'deep_research_candidate',
              category: 'full_review',
              status: 'needs_review',
              priority: 'medium',
              assigneeId: reviewer || undefined,
              createdAt: reviewDate,
              updatedAt: reviewDate,
              estimatedMinutes: 60,
              jurisdiction: location || undefined,
            });
          }
        }
      }
    }

    // If we didn't find CANDIDACY-based rows, try a more general approach
    if (reviews.length === 0) {
      // Look for any line that has name-like patterns followed by keywords
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('name') && lowerLine.includes('type')) continue;
        if (lowerLine.includes('review queue')) continue;

        // Match pattern: Name (2+ words starting with caps) followed by type keywords
        const match = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z']+)+)/g);
        if (match && match.length >= 1) {
          // First match is likely the name
          const name = match[0];
          // Last match might be reviewer (if different from name)
          const reviewer = match.length > 1 ? match[match.length - 1] : '';

          if (name && name !== reviewer) {
            reviews.push({
              title: `${name} CANDIDACY`,
              description: '',
              type: 'deep_research_candidate',
              category: 'full_review',
              status: 'needs_review',
              priority: 'medium',
              assigneeId: reviewer || undefined,
              createdAt: reviewDate,
              updatedAt: reviewDate,
              estimatedMinutes: 60,
            });
          }
        }
      }
    }

    return reviews;
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

  const handleAddTeammate = () => {
    if (!teammateForm.name || !teammateForm.email) return;

    // Generate initials from name
    const initials = teammateForm.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Generate a random color
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    onAddTeammate({
      name: teammateForm.name,
      email: teammateForm.email,
      initials,
      role: 'teammate',
      color,
    });

    setTeammateForm({ name: '', email: '' });
    setShowAddTeammate(false);
  };

  return (
    <div className="space-y-6">
      {/* Team Management Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Team Management
          </h3>
          {!showAddTeammate && (
            <button
              onClick={() => setShowAddTeammate(true)}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Teammate
            </button>
          )}
        </div>

        {showAddTeammate && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-xl mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={teammateForm.name}
                  onChange={(e) => setTeammateForm({ ...teammateForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={teammateForm.email}
                  onChange={(e) => setTeammateForm({ ...teammateForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddTeammate}
                disabled={!teammateForm.name || !teammateForm.email}
                className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Add Teammate
              </button>
              <button
                onClick={() => setShowAddTeammate(false)}
                className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Team List */}
        <div className="space-y-2">
          {teammates.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No teammates added yet. Click "Add Teammate" to invite team members.</p>
          ) : (
            teammates.map((teammate) => (
              <div
                key={teammate.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: teammate.color }}
                  >
                    {teammate.initials}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{teammate.name}</p>
                    <p className="text-sm text-slate-500">{teammate.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveTeammate(teammate.id)}
                  className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Import Reviews
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* CSV Upload */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
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
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
              <div>
                <p className="font-medium text-slate-700">Upload CSV</p>
                <p className="text-xs text-slate-500 mt-1">
                  title, reviewer, date, status
                </p>
              </div>
            </label>
          </div>

          {/* Image/Screenshot Upload */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <Image className="w-8 h-8 text-slate-400" />
              <div>
                <p className="font-medium text-slate-700">Upload Screenshot</p>
                <p className="text-xs text-slate-500 mt-1">
                  Table image with OCR
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Image Processing Progress */}
        {isProcessingImage && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-800">Processing image with OCR...</p>
                <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-purple-600">{ocrProgress}%</span>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && !isProcessingImage && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Uploaded screenshot"
              className="max-h-40 rounded-lg border border-slate-200 mx-auto"
            />
          </div>
        )}

        {/* CSV Preview */}
        {csvPreview && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-blue-800">
                Preview: {csvPreview.length} reviews to import
              </p>
              <button
                onClick={() => {
                  setCsvPreview(null);
                  setImagePreview(null);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Completion Date */}
            <div className="mb-3 flex items-center gap-3">
              <label className="text-sm font-medium text-blue-800">Completion Date:</label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 text-sm">
              {csvPreview.slice(0, 10).map((r, i) => (
                <div key={i} className="bg-white/50 p-2 rounded-lg">
                  <div className="font-medium text-blue-900">{r.title}</div>
                  <div className="text-blue-600 text-xs flex gap-3 mt-1">
                    {r.jurisdiction && <span>Location: {r.jurisdiction}</span>}
                    {r.assigneeId && <span>Assigned: {r.assigneeId}</span>}
                  </div>
                </div>
              ))}
              {csvPreview.length > 10 && (
                <div className="text-blue-500">...and {csvPreview.length - 10} more</div>
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
                    {editingStatusId === review.id ? (
                      <select
                        value={review.status}
                        onChange={(e) => handleStatusChange(review.id, e.target.value as Review['status'])}
                        onBlur={() => setEditingStatusId(null)}
                        autoFocus
                        className="px-2 py-1 text-xs rounded border border-slate-300 focus:border-blue-500 outline-none"
                      >
                        <option value="reviewed">Completed</option>
                        <option value="in_review">In Progress</option>
                        <option value="needs_review">Pending</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(review.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                          review.status === 'reviewed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : review.status === 'in_review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {review.status === 'reviewed' ? 'Completed' : review.status === 'in_review' ? 'In Progress' : 'Pending'}
                        <Pencil className="w-2.5 h-2.5 opacity-50" />
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">
                    {editingReviewId === review.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                          className="px-2 py-1 text-sm rounded border border-slate-300 focus:border-blue-500 outline-none"
                        />
                        <button
                          onClick={() => handleSaveDate(review.id)}
                          className="text-emerald-600 hover:text-emerald-700 p-1"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingReviewId(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{review.completedAt ? new Date(review.completedAt).toLocaleDateString() : '-'}</span>
                        <button
                          onClick={() => handleEditDate(review.id, review.completedAt)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
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
