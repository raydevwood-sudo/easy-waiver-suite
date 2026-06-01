import Radio from '@easy-waiver/shared/components/ui/Radio';
import type { RadioOption } from '../../../types';

interface MediaReleasePageProps {
  options: RadioOption[];
  selected: string;
  onChange: (value: string) => void;
}

export default function MediaReleasePage({ options, selected, onChange }: MediaReleasePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Photography &amp; Media Release</h2>
        <p className="text-sm text-gray-500">
          Please indicate your consent for photography and video during events.
        </p>
      </div>
      <div className="space-y-3">
        {options.map((opt) => (
          <Radio
            key={opt.id}
            id={`media-${opt.id}`}
            name="mediaRelease"
            value={opt.id}
            checked={selected === opt.id}
            onChange={() => onChange(opt.id)}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
    </div>
  );
}
