import Radio from '@easy-waiver/shared/components/ui/Radio';
import type { WaiverType } from '../../../types';

interface WaiverTypePageProps {
  waiverType: WaiverType;
  onChange: (type: WaiverType) => void;
}

export default function WaiverTypePage({ waiverType, onChange }: WaiverTypePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome</h2>
        <p className="text-gray-600">Please indicate your relationship to the participant.</p>
      </div>
      <div className="space-y-3">
        <Radio
          id="type-passenger"
          name="waiverType"
          value="passenger"
          checked={waiverType === 'passenger'}
          onChange={() => onChange('passenger')}
          label="I am the participant"
          description="Complete this waiver on your own behalf"
        />
        <Radio
          id="type-representative"
          name="waiverType"
          value="representative"
          checked={waiverType === 'representative'}
          onChange={() => onChange('representative')}
          label="I am a legal representative of the participant"
          description="I am the Legal Guardian or Power of Attorney authorized to sign on behalf of the participant"
        />
      </div>
    </div>
  );
}
