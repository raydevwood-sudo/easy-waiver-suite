import Input from '@easy-waiver/shared/components/ui/Input';
import type { WaiverFormData, WaiverType } from '../../../types';

interface SignaturePageProps {
  formData: WaiverFormData;
  waiverType: WaiverType;
  acknowledgmentText?: string;
  onChange: (field: keyof WaiverFormData, value: string) => void;
  onOpenSignature: (signee: 'primary' | 'witness') => void;
}

export default function SignaturePage({
  formData,
  waiverType,
  acknowledgmentText,
  onChange,
  onOpenSignature,
}: SignaturePageProps) {
  const isRep = waiverType === 'representative';
  const participantName = `${formData.firstName} ${formData.lastName}`.trim();
  const repName = `${formData.repFirstName} ${formData.repLastName}`.trim();

  const primaryLabel = isRep ? 'Legal Representative Signature' : 'Your Signature';
  const primaryName = isRep ? repName : participantName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signatures</h2>
        <p className="text-gray-600">Please sign below to complete the agreement.</p>
      </div>

      {acknowledgmentText && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
          <p className="text-sm text-blue-900 leading-relaxed">{acknowledgmentText}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Primary signature */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">{primaryLabel}</h3>
          <p className="text-sm font-medium text-gray-700">{primaryName}</p>
          {isRep && (
            <p className="text-xs text-gray-500">
              Legal representative of {participantName}
            </p>
          )}

          {formData.primarySignature ? (
            <button
              type="button"
              onClick={() => onOpenSignature('primary')}
              className="w-full border-2 border-brand-500 rounded-lg p-2 bg-white hover:border-brand-600 transition-colors"
              aria-label="Edit signature"
            >
              <img
                src={formData.primarySignature}
                alt="Signature"
                className="max-h-24 mx-auto"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSignature('primary')}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg
                         flex items-center justify-center text-sm text-brand-600 font-medium
                         hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              + Sign here
            </button>
          )}

          {formData.primaryTimestamp && (
            <p className="text-xs text-gray-400">
              Signed {new Date(formData.primaryTimestamp).toLocaleString('en-CA')}
            </p>
          )}
        </div>

        {/* Witness signature (optional) */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Witness <span className="font-normal text-gray-400">(optional)</span></h3>

          <Input
            label="Witness Name"
            id="witnessName"
            value={formData.witnessName}
            onChange={(e) => onChange('witnessName', e.target.value)}
            placeholder="Full name"
          />

          {formData.witnessSignature ? (
            <button
              type="button"
              onClick={() => onOpenSignature('witness')}
              className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white hover:border-gray-400 transition-colors"
              aria-label="Edit witness signature"
            >
              <img
                src={formData.witnessSignature}
                alt="Witness signature"
                className="max-h-24 mx-auto"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSignature('witness')}
              disabled={!formData.witnessName.trim()}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg
                         flex items-center justify-center text-sm text-gray-500 font-medium
                         hover:border-gray-400 hover:bg-gray-50 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Witness sign here
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
