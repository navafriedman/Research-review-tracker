import { useState, useEffect } from 'react';
import { Cloud, Download, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { Review, User } from '../types';

interface SettingsPanelProps {
  reviews: Review[];
  teammates: User[];
  onImportData?: (data: { reviews: Omit<Review, 'id'>[]; teammates: Omit<User, 'id'>[] }) => void;
}

const SHEETS_URL_KEY = 'review-tracker-sheets-url';

export function SettingsPanel({ reviews, teammates, onImportData }: SettingsPanelProps) {
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(SHEETS_URL_KEY);
    if (stored) setSheetsUrl(stored);
  }, []);

  const handleSaveUrl = () => {
    localStorage.setItem(SHEETS_URL_KEY, sheetsUrl);
    setSyncStatus('success');
    setSyncMessage('URL saved');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Status', 'Completion Date', 'Assigned To', 'Location'];
    const rows = reviews.map((r) => [
      r.title,
      r.status,
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : '',
      r.assigneeId || '',
      r.jurisdiction || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTeamCSV = () => {
    const headers = ['Name', 'Email', 'Color'];
    const rows = teammates.map((t) => [t.name, t.email, t.color]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncToSheets = async () => {
    if (!sheetsUrl) {
      setSyncStatus('error');
      setSyncMessage('Please enter your Google Sheets Web App URL');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      await fetch(sheetsUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires this
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          reviews: reviews.map((r) => ({
            id: r.id,
            title: r.title,
            status: r.status,
            completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : '',
            assigneeId: r.assigneeId || '',
            jurisdiction: r.jurisdiction || '',
          })),
          teammates: teammates.map((t) => ({
            id: t.id,
            name: t.name,
            email: t.email,
            color: t.color,
          })),
        }),
      });

      // With no-cors, we can't read the response, so we assume success
      setSyncStatus('success');
      setSyncMessage('Data sent to Google Sheets');
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Failed to sync. Check your URL.');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleLoadFromSheets = async () => {
    if (!sheetsUrl) {
      setSyncStatus('error');
      setSyncMessage('Please enter your Google Sheets Web App URL');
      return;
    }

    if (!onImportData) {
      setSyncStatus('error');
      setSyncMessage('Import not available');
      return;
    }

    setIsLoading(true);
    setSyncStatus('idle');

    try {
      // Use the URL with ?action=load to get data
      const loadUrl = sheetsUrl.includes('?')
        ? `${sheetsUrl}&action=load`
        : `${sheetsUrl}?action=load`;

      const response = await fetch(loadUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const importedReviews = (data.reviews || []).map((r: Record<string, string>) => ({
        title: r.title || '',
        status: r.status || 'pending',
        completedAt: r.completedAt ? new Date(r.completedAt + 'T00:00:00') : undefined,
        assigneeId: r.assigneeId || undefined,
        jurisdiction: r.jurisdiction || '',
      }));

      const importedTeammates = (data.teammates || []).map((t: Record<string, string>) => ({
        name: t.name || '',
        email: t.email || '',
        color: t.color || 'blue',
      }));

      onImportData({ reviews: importedReviews, teammates: importedTeammates });

      setSyncStatus('success');
      setSyncMessage(`Loaded ${importedReviews.length} reviews and ${importedTeammates.length} teammates`);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Failed to load data. Make sure the script is deployed correctly.');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-500" />
          Export Data
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Download your data as CSV files that can be imported into Google Sheets or Excel.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Reviews ({reviews.length})
          </button>
          <button
            onClick={handleExportTeamCSV}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Team ({teammates.length})
          </button>
        </div>
      </div>

      {/* Google Sheets Sync */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-500" />
          Google Sheets Sync
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 mb-2 font-medium">Setup Instructions:</p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Create a new Google Sheet</li>
              <li>Go to Extensions → Apps Script</li>
              <li>Paste the script code below</li>
              <li>Deploy as web app (Execute as: Me, Who has access: Anyone)</li>
              <li>Copy the web app URL and paste below</li>
            </ol>
            <details className="mt-3">
              <summary className="text-sm text-amber-800 font-medium cursor-pointer hover:text-amber-900">
                View Apps Script Code
              </summary>
              <pre className="mt-2 p-3 bg-slate-900 text-slate-100 text-xs rounded-lg overflow-x-auto whitespace-pre-wrap">
{`function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);

  // Save reviews
  let reviewSheet = sheet.getSheetByName('Reviews');
  if (!reviewSheet) reviewSheet = sheet.insertSheet('Reviews');
  reviewSheet.clear();
  reviewSheet.appendRow(['id','title','status','completedAt','assigneeId','jurisdiction']);
  data.reviews.forEach(r => {
    reviewSheet.appendRow([r.id,r.title,r.status,r.completedAt,r.assigneeId,r.jurisdiction]);
  });

  // Save teammates
  let teamSheet = sheet.getSheetByName('Teammates');
  if (!teamSheet) teamSheet = sheet.insertSheet('Teammates');
  teamSheet.clear();
  teamSheet.appendRow(['id','name','email','color']);
  data.teammates.forEach(t => {
    teamSheet.appendRow([t.id,t.name,t.email,t.color]);
  });

  return ContentService.createTextOutput(JSON.stringify({success:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();

  // Load reviews
  const reviewSheet = sheet.getSheetByName('Reviews');
  const reviews = [];
  if (reviewSheet && reviewSheet.getLastRow() > 1) {
    const data = reviewSheet.getRange(2,1,reviewSheet.getLastRow()-1,6).getValues();
    data.forEach(row => {
      reviews.push({id:row[0],title:row[1],status:row[2],completedAt:row[3],assigneeId:row[4],jurisdiction:row[5]});
    });
  }

  // Load teammates
  const teamSheet = sheet.getSheetByName('Teammates');
  const teammates = [];
  if (teamSheet && teamSheet.getLastRow() > 1) {
    const data = teamSheet.getRange(2,1,teamSheet.getLastRow()-1,4).getValues();
    data.forEach(row => {
      teammates.push({id:row[0],name:row[1],email:row[2],color:row[3]});
    });
  }

  return ContentService.createTextOutput(JSON.stringify({reviews,teammates}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
              </pre>
            </details>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Google Sheets Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {sheetsUrl && (
            <div className="flex gap-3">
              <button
                onClick={handleSyncToSheets}
                disabled={isSyncing || isLoading}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Push to Sheets
              </button>
              <button
                onClick={handleLoadFromSheets}
                disabled={isSyncing || isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Pull from Sheets
              </button>
            </div>
          )}

          {syncStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 text-sm ${
                syncStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {syncStatus === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {syncMessage}
            </div>
          )}
        </div>
      </div>

      {/* Data Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Data Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Team Members</p>
            <p className="text-2xl font-bold text-slate-900">{teammates.length}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">
              {reviews.filter((r) => r.status === 'reviewed').length}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {reviews.filter((r) => r.status === 'in_review').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
