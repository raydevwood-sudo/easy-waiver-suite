import Radio from '../../ui/Radio';
import { PILOT_WAIVER } from '../../../config/waiver-templates';
import type { FormPageProps } from './types';

type MediaReleasePageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function MediaReleasePage({ formData, onInputChange }: MediaReleasePageProps) {
  const { title, description, options } = PILOT_WAIVER.mediaReleaseSection;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="space-y-3">
        <Radio
          id="fullConsent"
          name="mediaRelease"
          value={options.fullConsent}
          checked={formData.mediaRelease === options.fullConsent}
          onChange={(e) => onInputChange('mediaRelease', e.target.value)}
          label="I consent to the use of my likeness"
          description="You agree to photos/videos being used for promotional purposes"
        />
        <Radio
          id="noConsent"
          name="mediaRelease"
          value={options.noConsent}
          checked={formData.mediaRelease === options.noConsent}
          onChange={(e) => onInputChange('mediaRelease', e.target.value)}
          label="I do not consent"
          description="Your likeness will not be used in any manner"
        />
      </div>
    </div>
  );
}
