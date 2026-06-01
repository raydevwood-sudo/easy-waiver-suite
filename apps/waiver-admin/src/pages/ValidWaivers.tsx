import { useState, useEffect, useMemo } from 'react';
import { subscribeToWaivers, isWaiverValid, deleteWaiver, type WaiverRecord } from '../services/waiverService';
import { useAuth } from '../contexts/AuthContext';

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntilExpiry(iso: string | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function hasPhotoPermission(mediaRelease: string | undefined): boolean {
  if (!mediaRelease) return false;
  return mediaRelease.toLowerCase().startsWith('i consent');
}

type SortCol = 'firstName' | 'lastName' | 'expiry';
type SortDir = 'asc' | 'desc';

export default function ValidWaivers() {
  const { currentUser, isAdmin, signOut } = useAuth();
  const [waivers, setWaivers] = useState<WaiverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>('lastName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<WaiverRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WaiverRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getUserInitials = () => {
    const name = (currentUser?.['name'] as string | undefined) || '';
    if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    return ((currentUser?.['email'] as string | undefined) || '').slice(0, 2).toUpperCase();
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToWaivers(
      (data) => {
        setWaivers(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message ?? 'Failed to load waivers.');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const rows = waivers.filter((w) => {
      const valid = isWaiverValid(w);
      if (!showExpired && !valid) return false;
      const fullName = `${w.passenger.firstName} ${w.passenger.lastName}`.toLowerCase();
      const repName = w.representative
        ? `${w.representative.firstName} ${w.representative.lastName}`.toLowerCase()
        : '';
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        repName.includes(q) ||
        w.passenger.town.toLowerCase().includes(q) ||
        w.waiverUId.toLowerCase().includes(q);
      return matchesSearch;
    });

    rows.sort((a, b) => {
      let av = '', bv = '';
      if (sortCol === 'firstName') { av = a.passenger.firstName; bv = b.passenger.firstName; }
      else if (sortCol === 'lastName') { av = a.passenger.lastName; bv = b.passenger.lastName; }
      else if (sortCol === 'expiry') { av = a.expiryDate ?? ''; bv = b.expiryDate ?? ''; }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return rows;
  }, [waivers, search, showExpired, sortCol, sortDir]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="CWAS" className="w-9 h-9 rounded-xl flex-shrink-0" />
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-tight">Valid Waivers</h1>
              <p className="text-xs text-gray-400">Cycling Without Age Society</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold text-sm hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 overflow-hidden"
              aria-label="User menu"
            >
              <span>{getUserInitials()}</span>
            </button>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold overflow-hidden">
                          <span>{getUserInitials()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {(currentUser?.['name'] as string | undefined) || (currentUser?.['email'] as string | undefined)?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{currentUser?.['email'] as string | undefined}</p>
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
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-0 sm:px-4 py-0 sm:py-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 px-4 sm:px-0 pt-4 sm:pt-0">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, town or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Show expired
          </label>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{error}</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-sm overflow-x-auto sm:overflow-hidden mt-4 sm:mt-0">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {([
                    { col: 'firstName' as SortCol, label: 'First Name' },
                    { col: 'lastName'  as SortCol, label: 'Last Name'  },
                    { col: 'expiry'    as SortCol, label: 'Expiry'     },
                  ]).map(({ col, label }) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <span className="text-gray-300">
                          {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⬍'}
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    YOB
                  </th>
                  {isAdmin && <th className="hidden sm:table-cell px-2 py-2.5 w-8" />}
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </th>
                  <th className="hidden sm:table-cell px-2 py-2.5 w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-16 text-center text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {search ? 'No waivers match your search' : 'No waivers on file'}
                    </td>
                  </tr>
                ) : filtered.map((w) => {
                  const valid = isWaiverValid(w);
                  const days = daysUntilExpiry(w.expiryDate);
                  const expiringSoon = valid && days !== null && days <= 30;
                  const photo = hasPhotoPermission(w.mediaRelease);

                  return (
                    <tr
                      key={w.waiverUId}
                      onClick={() => w.pdfUrl && setSelectedWaiver(w)}
                      className={`transition-colors ${!valid ? 'bg-red-50/40 text-gray-400' : expiringSoon ? 'bg-amber-50/50' : ''} ${w.pdfUrl ? 'cursor-pointer hover:bg-brand-50' : ''}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{w.passenger.firstName}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{w.passenger.lastName}</td>
                      <td className={`px-4 py-2 whitespace-nowrap tabular-nums ${!valid ? 'text-red-400 line-through' : expiringSoon ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(w.expiryDate)}
                        {expiringSoon && days !== null && <span className="ml-1 text-amber-400 text-xs">({days}d)</span>}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-2 whitespace-nowrap tabular-nums text-gray-500">
                        {w.passenger.yearOfBirth ?? '—'}
                      </td>
                      {isAdmin && (
                        <td className="hidden sm:table-cell px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setConfirmDelete(w)}
                            aria-label="Delete waiver"
                            className="text-red-400 hover:text-red-600 transition-colors rounded p-0.5 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-2 text-center">
                        <svg
                          className={`w-4 h-4 mx-auto ${photo ? 'text-brand-500' : 'text-gray-200'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </td>
                      <td className="hidden sm:table-cell px-2 py-2 text-center">
                        {w.pdfUrl && (
                          <svg className="w-3.5 h-3.5 text-brand-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">{filtered.length} waiver{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Delete Waiver?</h2>
            <p className="text-sm text-gray-600">
              This will permanently delete the waiver for{' '}
              <span className="font-semibold">{confirmDelete.passenger.firstName} {confirmDelete.passenger.lastName}</span>{' '}
              (<span className="font-mono text-xs">{confirmDelete.waiverUId}</span>). This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteWaiver(confirmDelete);
                    setConfirmDelete(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedWaiver && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80" onClick={() => setSelectedWaiver(null)}>
          <div className="bg-white flex items-center justify-between px-4 py-3 shadow-sm flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="font-semibold text-gray-900">
                {selectedWaiver.passenger.firstName} {selectedWaiver.passenger.lastName}
              </p>
              <p className="text-xs text-gray-400">{selectedWaiver.waiverUId}</p>
            </div>
            <button
              onClick={() => setSelectedWaiver(null)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close PDF viewer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <iframe src={selectedWaiver.pdfUrl} className="w-full h-full border-0" title="Waiver PDF" />
          </div>
        </div>
      )}
    </div>
  );
}
