import { PILOT_WAIVER } from '../../../config/waiver-templates';
import Input from '../../ui/Input';
import type { FormPageProps, SignatureSignee } from './types';

type SignaturePageProps = Pick<FormPageProps, 'formData' | 'onInputChange' | 'onOpenSignature'>;

export default function SignaturePage({ formData, onInputChange, onOpenSignature }: SignaturePageProps) {
  const pilotFullName = `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signatures</h2>
        <p className="text-gray-600">Please sign below to complete your agreement.</p>
      </div>

      {/* Acknowledgment box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
        <p className="text-sm text-blue-900 leading-relaxed">{PILOT_WAIVER.acknowledgment}</p>
      </div>

      {/* Signature columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Pilot */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Pilot Signature</h3>
          <div>
            <p className="text-sm font-medium text-gray-700">{pilotFullName}</p>
          </div>

          {/* Spacer to align with witness column */}
          <div className="h-[48px]" />

          {formData.pilotSignature ? (
            <div
              className="cursor-pointer border-2 border-brand-500 rounded-lg p-2 bg-white"
              onClick={() => onOpenSignature?.('pilot' as SignatureSignee)}
            >
              <img
                src={formData.pilotSignature}
                alt="Pilot signature"
                className="max-h-[80px] object-contain"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSignature?.('pilot' as SignatureSignee)}
              className="w-full h-[100px] border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-500 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">✏️</span>
              Click to sign
            </button>
          )}
          {formData.pilotTimestamp && (
            <p className="text-xs text-gray-500">
              Signed:{' '}
              {new Date(formData.pilotTimestamp).toLocaleString('en-CA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>

        {/* Right: Witness */}
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
