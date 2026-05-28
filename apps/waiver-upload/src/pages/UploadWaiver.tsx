import { useState, useRef } from 'react';
import { uploadWaiver, type WaiverType, type UploadWaiverInput } from '../services/waiverService';
import { useAuth } from '../contexts/AuthContext';
import DocumentScanner from '../components/DocumentScanner';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function oneYearFrom(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${Number(y) + 1}-${m}-${d}`;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadWaiver() {
  const [waiverType, setWaiverType] = useState<WaiverType>('passenger');
  const [passengerFirstName, setPassengerFirstName] = useState('');
  const [passengerLastName, setPassengerLastName] = useState('');
  const [passengerTown, setPassengerTown] = useState('');
  const [representativeFirstName, setRepresentativeFirstName] = useState('');
  const [representativeLastName, setRepresentativeLastName] = useState('');

  const [submittedAt, setSubmittedAt] = useState(today());
  const [notes, setNotes] = useState('');
  const [photoPermission, setPhotoPermission] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfSource, setPdfSource] = useState<'upload' | 'scan'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      setPdfFile(null);
      return;
    }
    if (file && file.size > 20 * 1024 * 1024) {
      setError('PDF must be 20 MB or smaller.');
      setPdfFile(null);
      return;
    }
    setError(null);
    setPdfFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file && file.size > 20 * 1024 * 1024) {
      setError('PDF must be 20 MB or smaller.');
      return;
    }
    setError(null);
    if (file) setPdfFile(file);
  };

  const resetForm = () => {
    setWaiverType('passenger');
    setPassengerFirstName('');
    setPassengerLastName('');
    setPassengerTown('');
    setRepresentativeFirstName('');
    setRepresentativeLastName('');

    setSubmittedAt(today());
    setNotes('');
    setPhotoPermission(false);
    setPdfFile(null);
    setError(null);
    setUploadState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) { setError('Please select the signed waiver PDF.'); return; }
    if (pdfFile.size > 20 * 1024 * 1024) { setError('PDF exceeds 20 MB limit. Please reduce the scan quality or number of pages.'); return; }
    if (!passengerFirstName || !passengerLastName || !passengerTown) {
      setError('Passenger first name, last name and town are required.');
      return;
    }
    if (waiverType === 'representative' && (!representativeFirstName || !representativeLastName)) {
      setError('Representative first and last name are required for this waiver type.');
      return;
    }

    setUploadState('uploading');
    setError(null);
    try {
      const input: UploadWaiverInput = {
        waiverType,
        passengerFirstName,
        passengerLastName,
        passengerTown,
        representativeFirstName: representativeFirstName || undefined,
        representativeLastName: representativeLastName || undefined,
        submittedAt: new Date(submittedAt).toISOString(),
        expiryDate: new Date(oneYearFrom(submittedAt)).toISOString(),
        pdfFile,
        notes: notes || undefined,
        photoPermission,
      };
      const record = await uploadWaiver(input);
      setLastUploadedId(record.waiverUId);
      setUploadState('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploadState('error');
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (uploadState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Waiver uploaded</h2>
            <p className="text-gray-500 text-sm mb-1">
              Saved as <span className="font-mono text-gray-700">{lastUploadedId}</span>
            </p>
            <p className="text-gray-400 text-sm mb-8">The PDF is now stored in Firebase and the record is live in Firestore.</p>
            <button
              onClick={resetForm}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
            >
              Upload another waiver
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Upload form ────────────────────────────────────────────────────────────
  const inputClass = 'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Upload Signed Waiver</h2>
          <p className="text-sm text-gray-500 mt-1">Register a paper waiver scan into the system</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {/* Waiver type */}
          <div>
            <label className={labelClass}>Waiver Type</label>
            <div className="flex gap-3">
              {(['passenger', 'representative'] as const).map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors flex-1 ${waiverType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  <input type="radio" name="waiverType" value={t} checked={waiverType === t} onChange={() => setWaiverType(t)} className="sr-only" />
                  <span className="text-sm font-medium capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Passenger info */}
          <div>
            <label className={labelClass}>Passenger</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" placeholder="First name" value={passengerFirstName} onChange={(e) => setPassengerFirstName(e.target.value)} required className={inputClass} />
              <input type="text" placeholder="Last name" value={passengerLastName} onChange={(e) => setPassengerLastName(e.target.value)} required className={inputClass} />
            </div>
            <input type="text" placeholder="Town / City" value={passengerTown} onChange={(e) => setPassengerTown(e.target.value)} required className={inputClass} />
          </div>

          {/* Representative info */}
          {waiverType === 'representative' && (
            <div>
              <label className={labelClass}>Legal Representative</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="First name" value={representativeFirstName} onChange={(e) => setRepresentativeFirstName(e.target.value)} required className={inputClass} />
                <input type="text" placeholder="Last name" value={representativeLastName} onChange={(e) => setRepresentativeLastName(e.target.value)} required className={inputClass} />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date Signed</label>
              <input type="date" value={submittedAt} onChange={(e) => setSubmittedAt(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expiry Date</label>
              <input type="date" value={oneYearFrom(submittedAt)} readOnly className={`${inputClass} bg-gray-50 text-gray-500 cursor-default`} />
            </div>
          </div>

          {/* Photo permission */}
          <div>
            <label className={labelClass}>Media Release</label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors">
              <input
                type="checkbox"
                checked={photoPermission}
                onChange={(e) => setPhotoPermission(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">Photo / video permission granted</span>
                <span className="block text-xs text-gray-400 mt-0.5">Consent to use recordings for promotional purposes</span>
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Paper original on file at office" className={`${inputClass} resize-none`} />
          </div>

          {/* PDF source — upload or scan */}
          <div>
            <label className={labelClass}>Signed Waiver PDF</label>

            {/* Tab toggle */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-4">
              <button
                type="button"
                onClick={() => setPdfSource('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  pdfSource === 'upload'
                    ? 'bg-brand-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => { setPdfSource('scan'); setPdfFile(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  pdfSource === 'scan'
                    ? 'bg-brand-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan Document
              </button>
            </div>

            {pdfSource === 'scan' ? (
              <DocumentScanner
                onPdfReady={(f) => { setPdfFile(f); setError(null); }}
              />
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${pdfFile ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="sr-only" />
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-7 h-7 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-brand-700">{pdfFile.name}</p>
                      <p className="text-xs text-gray-500">{(pdfFile.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600">Drop PDF here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF only · max 20 MB</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploadState === 'uploading' || !pdfFile}
            className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploadState === 'uploading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Waiver
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

function AppHeader() {
  const { currentUser, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getUserInitials = () => {
    const name = currentUser?.displayName || '';
    if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    return (currentUser?.email || '').slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/apple-touch-icon.png" alt="CWAS" className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">Upload Waiver</h1>
            <p className="text-xs text-gray-400">Cycling Without Age Society</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold text-sm hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 overflow-hidden"
            aria-label="User menu"
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="User avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{getUserInitials()}</span>
            )}
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{getUserInitials()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setIsUserMenuOpen(false); signOut(); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
