import SignatureCanvas from './SignatureCanvas';
import type { SignatureSignee } from '../form/pages/types';

interface SignatureModalProps {
  isOpen: boolean;
  signee: SignatureSignee;
  onClose: () => void;
  onSave: (dataURL: string, timestamp: Date, signee: SignatureSignee) => void;
}

export default function SignatureModal({ isOpen, signee, onClose, onSave }: SignatureModalProps) {
  if (!isOpen) return null;

  const title = signee === 'witness' ? 'Witness Signature' : 'Pilot Signature';

  const handleSave = (dataURL: string, timestamp: Date) => {
    onSave(dataURL, timestamp, signee);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
