import { useMemo, useState } from 'react';
import Layout from './components/layout/Layout';
import WaiverForm from './components/form/WaiverForm';
import SuccessPage from './components/SuccessPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { LocalFormData } from './components/form/pages/types';
import type { WaiverSubmission } from './types';
import { submitWaiver } from './services/waiver.service';
import { downloadWaiverPDF } from './services/pdf-generator.service';

type AppState = 'form' | 'success';

function AppContent() {
  const { currentUser, volunteerProfile, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('form');
  const [submission, setSubmission] = useState<WaiverSubmission | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { initialFormData, lockedFields } = useMemo(() => {
    if (!volunteerProfile) return { initialFormData: undefined, lockedFields: undefined };

    const [firstName = '', ...rest] = volunteerProfile.displayName.trim().split(' ');
    const lastName = rest.join(' ');
    const partial: Partial<LocalFormData> = {};
    const locked = new Set<keyof LocalFormData>();

    if (volunteerProfile.email) { partial.email = volunteerProfile.email; locked.add('email'); }
    if (firstName) { partial.firstName = firstName; locked.add('firstName'); }
    if (lastName) { partial.lastName = lastName; locked.add('lastName'); }
    if (volunteerProfile.phone) { partial.phone = volunteerProfile.phone; locked.add('phone'); }

    return { initialFormData: partial, lockedFields: locked };
  }, [volunteerProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleSubmit = async (formData: LocalFormData) => {
    setSubmitError(null);
    try {
      const { submission: sub } = await submitWaiver(formData);
      setSubmission(sub);
      setAppState('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!submission) return;
    setIsGeneratingPDF(true);
    try {
      await downloadWaiverPDF(submission);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Layout>
      {appState === 'form' && (
        <WaiverForm
          onSubmit={handleSubmit}
          submitError={submitError}
          initialFormData={initialFormData}
          lockedFields={lockedFields}
        />
      )}
      {appState === 'success' && submission && (
        <SuccessPage
          submission={submission}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={isGeneratingPDF}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
