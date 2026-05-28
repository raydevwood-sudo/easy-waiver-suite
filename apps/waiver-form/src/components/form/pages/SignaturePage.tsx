import { PASSENGER_WAIVER, REPRESENTATIVE_WAIVER } from '../../../config/waiver-templates';
import Input from '../../ui/Input';
import type { FormPageProps } from './types';
import type { SignatureSignee } from './types';

type SignaturePageProps = Pick<
  FormPageProps,
  'formData' | 'waiverType' | 'onInputChange' | 'onOpenSignature'
>;

export default function SignaturePage({
  formData,
  waiverType,
  onInputChange,
  onOpenSignature,
}: SignaturePageProps) {
  const isRepresentative = waiverType === 'representative';
  const passengerFullName = `${formData.firstName} ${formData.lastName}`.trim();
  const representativeFullName = isRepresentative
    ? `${formData.representativeFirstName} ${formData.representativeLastName}`.trim()
    : '';

  const acknowledgmentText = isRepresentative
    ? REPRESENTATIVE_WAIVER.informedConsentSection.clauses[4]
    : PASSENGER_WAIVER.acknowledgment;

  const leftColumnTitle = isRepresentative ? 'Legal Representative Signature' : 'Passenger Signature';
  const leftSignerName = isRepresentative ? representativeFullName : passengerFullName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signatures</h2>
        <p className="text-gray-600">Please sign below to complete your agreement.</p>
      </div>

      {/* Acknowledgment box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
        <p className="text-sm text-blue-900 leading-relaxed">{acknowledgmentText}</p>
      </div>

      {/* Signature columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: passenger or legal representative */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">{leftColumnTitle}</h3>
          <div>
            <p className="text-sm font-medium text-gray-700">{leftSignerName}</p>
            {isRepresentative && (
              <p className="text-xs text-gray-500">Legal Representative of {passengerFullName}</p>
            )}
          </div>

          {/* Spacer to align signature button with witness column */}
          <div className="h-[48px]" />

          {formData.passengerSignature ? (
            <div
              className="cursor-pointer border-2 border-brand-500 rounded-lg p-2 bg-white"
              onClick={() => onOpenSignature?.('passenger' as SignatureSignee)}
            >
              <img
                src={formData.passengerSignature}
                alt="Passenger signature"
                className="max-h-[80px] object-contain"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSignature?.('passenger' as SignatureSignee)}
              className="w-full h-[100px] border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-500 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">✏️</span>
              Click to sign
            </button>
          )}
          {formData.passengerTimestamp && (
            <p className="text-xs text-gray-500">
              Signed:{' '}
              {new Date(formData.passengerTimestamp).toLocaleString('en-CA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>

        {/* Right: witness */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Witness</h3>

          <Input
            id="witnessName"
            label="Witness name"
            value={formData.witnessName}
            onChange={(e) => onInputChange('witnessName', e.target.value)}
            placeholder="Full name of witness"
          />

          {formData.witnessSignature ? (
            <div
              className="cursor-pointer border-2 border-brand-500 rounded-lg p-2 bg-white"
              onClick={() => onOpenSignature?.('witness' as SignatureSignee)}
            >
              <img
                src={formData.witnessSignature}
                alt="Witness signature"
                className="max-h-[80px] object-contain"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSignature?.('witness' as SignatureSignee)}
              className="w-full h-[100px] border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-500 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">✏️</span>
              Click to sign
            </button>
          )}
          {formData.witnessTimestamp && (
            <p className="text-xs text-gray-500">
              Signed:{' '}
              {new Date(formData.witnessTimestamp).toLocaleString('en-CA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
