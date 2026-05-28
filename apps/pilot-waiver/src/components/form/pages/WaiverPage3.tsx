import Checkbox from '../../ui/Checkbox';
import { PILOT_WAIVER } from '../../../config/waiver-templates';
import type { FormPageProps } from './types';

type WaiverAgreementPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function WaiverPage3({ formData, onInputChange }: WaiverAgreementPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Understanding of Risks</h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">
        {PILOT_WAIVER.waiverSection.clauses[1]}
      </p>

      <Checkbox
        id="waiver3"
        name="waiver3"
        label="I agree"
        checked={formData.waiver3}
        onChange={(e) => onInputChange('waiver3', e.target.checked)}
        required
      />
    </div>
  );
}
