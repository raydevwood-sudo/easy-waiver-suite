import { TenantProvider } from './contexts/TenantContext';
import { useTenant } from './contexts/useTenant';
import Layout from './components/layout/Layout';
import WaiverForm from './components/form/WaiverForm';
import SuccessPage from './components/SuccessPage';
import { useState } from 'react';
import type { SubmissionReceipt, WaiverType } from './types';

function AppContent() {
  const { tenant, forms, loading, error } = useTenant();
  const [receipt, setReceipt] = useState<(SubmissionReceipt & { waiverType: WaiverType }) | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-2">
          <p className="text-red-600 font-medium">Unable to load the waiver form.</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // The passenger and representative form configs come from the API
  const passengerForm = forms.find((f) => f.slug === 'passenger');
  const representativeForm = forms.find((f) => f.slug === 'representative');

  if (!passengerForm || !representativeForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-red-600 font-medium">Waiver forms are not configured for this organisation.</p>
      </div>
    );
  }

  return (
    <Layout>
      {receipt ? (
        <SuccessPage receipt={receipt} tenant={tenant} />
      ) : (
        <WaiverForm
          passengerForm={passengerForm}
          representativeForm={representativeForm}
          onSuccess={(r, type) => setReceipt({ ...r, waiverType: type })}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}
