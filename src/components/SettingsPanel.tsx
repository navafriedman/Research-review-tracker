import { useState, useEffect, useRef } from 'react';
import { Cloud, Download, Upload, Check, AlertCircle, Loader2, FileJson, Globe } from 'lucide-react';
import type { Review, User } from '../types';

interface SettingsPanelProps {
  reviews: Review[];
  teammates: User[];
  onImportData?: (data: { reviews: Omit<Review, 'id'>[]; teammates: Omit<User, 'id'>[] }) => void;
}

const SHEETS_URL_KEY = 'review-tracker-sheets-url';
const JSONBIN_API_KEY = 'review-tracker-jsonbin-api-key';
const JSONBIN_BIN_ID = 'review-tracker-jsonbin-bin-id';

export function SettingsPanel({ reviews, teammates, onImportData }: SettingsPanelProps) {
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSONBin state
  const [jsonbinApiKey, setJsonbinApiKey] = useState('');
  const [jsonbinBinId, setJsonbinBinId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SHEETS_URL_KEY);
    if (stored) setSheetsUrl(stored);
    const storedApiKey = localStorage.getItem(JSONBIN_API_KEY);
    if (storedApiKey) setJsonbinApiKey(storedApiKey);
    const storedBinId = localStorage.getItem(JSONBIN_BIN_ID);
    if (storedBinId) setJsonbinBinId(storedBinId);
  }, []);

  const handleSaveJsonbinConfig = () => {
    localStorage.setItem(JSONBIN_API_KEY, jsonbinApiKey);
    localStorage.setItem(JSONBIN_BIN_ID, jsonbinBinId);
    setSyncStatus('success');
    setSyncMessage('JSONBin config saved');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handlePublishToJsonbin = async () => {
    if (!jsonbinApiKey) {
      setSyncStatus('error');
      setSyncMessage('Please enter your JSONBin API key');
      return;
    }

    setIsPublishing(true);
    setSyncStatus('idle');

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

    try {
      if (jsonbinBinId) {
        // Update existing bin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinBinId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': jsonbinApiKey,
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setSyncStatus('success');
        setSyncMessage('Data published! Share this Bin ID with your team: ' + jsonbinBinId);
      } else {
        // Create new bin
        const response = await fetch('https://api.jsonbin.io/v3/b', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': jsonbinApiKey,
            'X-Bin-Name': 'review-tracker-data',
            'X-Bin-Private': 'false',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        const newBinId = result.metadata.id;
        setJsonbinBinId(newBinId);
        localStorage.setItem(JSONBIN_BIN_ID, newBinId);
        setSyncStatus('success');
        setSyncMessage('Created new bin! Share this Bin ID: ' + newBinId);
      }
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Failed to publish: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPublishing(false);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

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

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImportData) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const importedReviews = (data.reviews || []).map((r: Record<string, string | null>) => ({
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
        setSyncMessage(`Imported ${importedReviews.length} reviews and ${importedTeammates.length} teammates`);
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch {
        setSyncStatus('error');
        setSyncMessage('Failed to parse JSON file');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    event.target.value = '';
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
      // Google Apps Script uses doGet for GET requests - no action parameter needed
      const response = await fetch(sheetsUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // CORS errors show as "Failed to fetch" - provide helpful message
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        setSyncMessage('CORS error. Redeploy script with "Anyone" access and try again.');
      } else {
        setSyncMessage(`Failed to load: ${errorMsg}`);
      }
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

      {/* JSONBin Cloud Sync - Shared view for team */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-500" />
          Cloud Sync (Share with Team)
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <p className="text-sm text-indigo-800 mb-2 font-medium">Quick Setup (Free):</p>
            <ol className="text-sm text-indigo-700 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="underline">jsonbin.io</a> and create a free account</li>
              <li>Copy your API Key from the dashboard</li>
              <li>Paste it below and click "Publish"</li>
              <li>Share the Bin ID with your team - they enter it to see your data</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API Key (Admin only - keep private)
              </label>
              <input
                type="password"
                value={jsonbinApiKey}
                onChange={(e) => setJsonbinApiKey(e.target.value)}
                placeholder="$2a$10$..."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bin ID (Share this with your team)
              </label>
              <input
                type="text"
                value={jsonbinBinId}
                onChange={(e) => setJsonbinBinId(e.target.value)}
                placeholder="Enter existing Bin ID or leave empty to create new"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveJsonbinConfig}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Save Config
            </button>
            {jsonbinApiKey && (
              <button
                onClick={handlePublishToJsonbin}
                disabled={isPublishing}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Publish to Cloud
              </button>
            )}
          </div>

          {jsonbinBinId && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <strong>Share this link with your team:</strong>
              </p>
              <code className="text-xs text-emerald-700 break-all">
                {window.location.origin}?bin={jsonbinBinId}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* JSON Backup/Restore - Simple cross-session sync */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-orange-500" />
          Backup & Restore (Local)
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Export your data as a JSON file and import it in another browser or incognito mode.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Restore from Backup
          </button>
        </div>
      </div>

      {/* Google Sheets Sync */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-500" />
          Google Sheets Sync (Advanced)
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
