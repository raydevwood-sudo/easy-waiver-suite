import Button from './ui/Button';
import type { WaiverSubmission } from '../types';

interface SuccessPageProps {
  submission: WaiverSubmission;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}

export default function SuccessPage({
  submission,
  onDownloadPDF,
  isGeneratingPDF,
}: SuccessPageProps) {
  const formattedExpiry = submission.expiryDate
    ? new Date(submission.expiryDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const formattedSubmitted = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="px-6 py-12 text-center space-y-8">
      {/* Success icon */}
      <div className="flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Waiver Submitted!</h2>
        <p className="text-gray-600">
          Thank you,{' '}
          <strong>
            {submission.passenger.firstName} {submission.passenger.lastName}
          </strong>
          . Your waiver has been recorded successfully.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-brand-50 border border-brand-500/20 rounded-xl p-6 text-left max-w-sm mx-auto space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Waiver ID</span>
          <span className="font-mono font-semibold text-gray-800">{submission.waiverUId ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Submitted</span>
          <span className="text-gray-800">{formattedSubmitted}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Expires</span>
          <span className="font-semibold text-brand-600">{formattedExpiry}</span>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        This waiver is valid for one year. Save or print your PDF copy for your records.
      </p>

      <Button
        variant="primary"
        onClick={onDownloadPDF}
        loading={isGeneratingPDF}
        className="mx-auto"
      >
        {isGeneratingPDF ? 'Generating PDF…' : '⬇ Download PDF'}
      </Button>
    </div>
  );
}
