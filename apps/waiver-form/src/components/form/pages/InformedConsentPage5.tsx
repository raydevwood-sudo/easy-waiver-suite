import Checkbox from '../../ui/Checkbox';
import { REPRESENTATIVE_WAIVER } from '../../../config/waiver-templates';
import { renderBoldText } from '../../../utils/renderBoldText';
import type { FormPageProps } from './types';

type InformedConsentPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function InformedConsentPage5({
  formData,
  onInputChange,
}: InformedConsentPageProps) {
  const firstName = formData.firstName || '[First Name]';
  const lastName = formData.lastName || '[Last Name]';
  const town = formData.town || '[Town]';
  const fullName = `${firstName} ${lastName}`.trim();
  const clauseText = REPRESENTATIVE_WAIVER.informedConsentSection.clauses[4];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informed Consent — Identification</h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">
        {renderBoldText(clauseText, [fullName, town])}
      </p>

      <Checkbox
        id="informedConsent5"
        name="informedConsent5"
        label="I agree"
        checked={formData.informedConsent5}
        onChange={(e) => onInputChange('informedConsent5', e.target.checked)}
        required
      />
    </div>
  );
}
