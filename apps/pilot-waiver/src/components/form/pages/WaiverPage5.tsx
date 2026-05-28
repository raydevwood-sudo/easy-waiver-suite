import Checkbox from '../../ui/Checkbox';
import { PILOT_WAIVER } from '../../../config/waiver-templates';
import type { FormPageProps } from './types';

type WaiverAgreementPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function WaiverPage5({ formData, onInputChange }: WaiverAgreementPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Indemnification</h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">
        {PILOT_WAIVER.waiverSection.clauses[3]}
      </p>

      <Checkbox
        id="waiver5"
        name="waiver5"
        label="I agree"
        checked={formData.waiver5}
        onChange={(e) => onInputChange('waiver5', e.target.checked)}
        required
      />
    </div>
  );
}
