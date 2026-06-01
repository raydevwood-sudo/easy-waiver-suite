import type { SubmissionReceipt, TenantConfig, WaiverType } from '../types';

interface SuccessPageProps {
  receipt: SubmissionReceipt & { waiverType: WaiverType };
  tenant: TenantConfig;
}

export default function SuccessPage({ receipt, tenant }: SuccessPageProps) {
  const submitted = new Date(receipt.submittedAt).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const expires = receipt.expiresAt
    ? new Date(receipt.expiresAt).toLocaleDateString('en-CA', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <div className="px-6 py-12 text-center space-y-8">
      {/* Icon */}
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
          Thank you. Your waiver has been recorded successfully with {tenant.name}.
        </p>
      </div>

      {/* Details card */}
      <div className="bg-brand-50 border border-brand-500/20 rounded-xl p-6 text-left max-w-sm mx-auto space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Record ID</span>
          <span className="font-mono font-semibold text-gray-800">{receipt.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Submitted</span>
          <span className="text-gray-800">{submitted}</span>
        </div>
        {expires && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Valid until</span>
            <span className="text-gray-800">{expires}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Type</span>
          <span className="text-gray-800 capitalize">{receipt.waiverType}</span>
        </div>
      </div>

      {receipt.pdfUrl && (
        <a
          href={receipt.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white
                     rounded-lg font-medium text-sm hover:bg-brand-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF Copy
        </a>
      )}

      <p className="text-xs text-gray-400">
        Please keep your Record ID for future reference. Your data is stored securely
        on Canadian servers in compliance with PIPEDA.
      </p>
    </div>
  );
}
