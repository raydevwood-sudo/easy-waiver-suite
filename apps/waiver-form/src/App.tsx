import { useState } from 'react';
import Layout from './components/layout/Layout';
import WaiverForm from './components/form/WaiverForm';
import SuccessPage from './components/SuccessPage';
import type { WaiverSubmission } from './types';
import type { LocalFormData } from './components/form/pages/types';
import { submitWaiver } from './services/waiver.service';
import { downloadWaiverPDF } from './services/pdf-generator.service';

type AppState = 'form' | 'success';

export default function App() {
  const [appState, setAppState] = useState<AppState>('form');
  const [submission, setSubmission] = useState<WaiverSubmission | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (formData: LocalFormData) => {
    setSubmitError(null);
    try {
      const { submission: sub } = await submitWaiver(formData, formData.waiverType as import('./types').WaiverType);
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
      {appState === 'form' && <WaiverForm onSubmit={handleSubmit} submitError={submitError} />}
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
