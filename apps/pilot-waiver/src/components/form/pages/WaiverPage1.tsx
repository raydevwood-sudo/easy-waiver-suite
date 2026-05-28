import Checkbox from '../../ui/Checkbox';
import { PILOT_WAIVER } from '../../../config/waiver-templates';
import type { FormPageProps } from './types';

type WaiverAgreementPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function WaiverPage1({ formData, onInputChange }: WaiverAgreementPageProps) {
  const introText = PILOT_WAIVER.introduction.template(
    formData.firstName || '[First Name]',
    formData.lastName || '[Last Name]',
    formData.town || '[Town]',
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Confidentiality and Application Agreement
        </h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">{introText}</p>

      <Checkbox
        id="waiver1"
        name="waiver1"
        label="I agree"
        checked={formData.waiver1}
        onChange={(e) => onInputChange('waiver1', e.target.checked)}
        required
      />
    </div>
  );
}
