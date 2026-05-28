import Checkbox from '../../ui/Checkbox';
import { REPRESENTATIVE_WAIVER } from '../../../config/waiver-templates';
import type { FormPageProps } from './types';

type InformedConsentPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function InformedConsentPage2({
  formData,
  onInputChange,
}: InformedConsentPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Understanding of Risks</h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">
        {REPRESENTATIVE_WAIVER.informedConsentSection.clauses[1]}
      </p>

      <Checkbox
        id="informedConsent2"
        name="informedConsent2"
        label="I agree"
        checked={formData.informedConsent2}
        onChange={(e) => onInputChange('informedConsent2', e.target.checked)}
        required
      />
    </div>
  );
}
