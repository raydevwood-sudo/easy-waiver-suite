import Checkbox from '../../ui/Checkbox';
import { PASSENGER_WAIVER } from '../../../config/waiver-templates';
import { renderBoldText } from '../../../utils/renderBoldText';
import type { FormPageProps } from './types';

type WaiverAgreementPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function WaiverPage2({ formData, onInputChange }: WaiverAgreementPageProps) {
  const firstName = formData.firstName || '[First Name]';
  const lastName = formData.lastName || '[Last Name]';
  const town = formData.town || '[Town]';
  const fullName = `${firstName} ${lastName}`.trim();
  const clauseText = PASSENGER_WAIVER.waiverSection.clauses[0](firstName, lastName, town);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Waiver of Liability — Identification</h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">
        {renderBoldText(clauseText, [fullName, town])}
      </p>

      <Checkbox
        id="waiver2"
        name="waiver2"
        label="I agree"
        checked={formData.waiver2}
        onChange={(e) => onInputChange('waiver2', e.target.checked)}
        required
      />
    </div>
  );
}
