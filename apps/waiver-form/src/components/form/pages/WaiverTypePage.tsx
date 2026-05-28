import Radio from '../../ui/Radio';
import type { FormPageProps } from './types';
import type { WaiverType } from '../../../types';

type WaiverTypePageProps = Pick<FormPageProps, 'waiverType' | 'onWaiverTypeChange'>;

export default function WaiverTypePage({ waiverType, onWaiverTypeChange, onInputChange }: WaiverTypePageProps & { onInputChange?: (field: import('./types').FormField, value: string | boolean) => void }) {
  const handleChange = (value: WaiverType) => {
    onWaiverTypeChange?.(value);
    onInputChange?.('waiverType', value);
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome</h2>
        <p className="text-gray-600">Please indicate your relationship to the passenger.</p>
      </div>

      <div className="space-y-3">
        <Radio
          id="passenger-radio"
          name="waiverType"
          value="passenger"
          checked={waiverType === 'passenger'}
          onChange={(e) => handleChange(e.target.value as WaiverType)}
          label="I am the passenger"
          description="Complete this form on your own behalf"
        />
        <Radio
          id="representative-radio"
          name="waiverType"
          value="representative"
          checked={waiverType === 'representative'}
          onChange={(e) => handleChange(e.target.value as WaiverType)}
          label="I am a legal representative of the passenger"
          description="I am the Legal Guardian or Power of Attorney authorized to sign on behalf of the passenger"
        />
      </div>
    </div>
  );
}
