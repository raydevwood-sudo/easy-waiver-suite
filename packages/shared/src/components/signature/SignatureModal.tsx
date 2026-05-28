import SignatureCanvas from './SignatureCanvas';

export type SignatureSignee = 'passenger' | 'pilot' | 'witness';

interface SignatureModalProps {
  isOpen: boolean;
  signee: SignatureSignee;
  waiverType?: 'passenger' | 'representative' | 'pilot';
  onClose: () => void;
  onSave: (dataURL: string, timestamp: Date, signee: SignatureSignee) => void;
}

export default function SignatureModal({
  isOpen,
  signee,
  waiverType,
  onClose,
  onSave,
}: SignatureModalProps) {
  if (!isOpen) return null;

  const title =
    signee === 'witness'
      ? 'Witness Signature'
      : waiverType === 'representative'
      ? 'Legal Representative Signature'
      : waiverType === 'pilot'
      ? 'Pilot Signature'
      : 'Passenger Signature';

  const handleSave = (dataURL: string, timestamp: Date) => {
    onSave(dataURL, timestamp, signee);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <SignatureCanvas onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
