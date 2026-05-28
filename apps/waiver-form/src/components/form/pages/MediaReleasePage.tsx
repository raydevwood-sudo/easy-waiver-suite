import Radio from '../../ui/Radio';
import { PASSENGER_WAIVER, REPRESENTATIVE_WAIVER } from '../../../config/waiver-templates';
import type { FormPageProps } from './types';

type MediaReleasePageProps = Pick<FormPageProps, 'formData' | 'waiverType' | 'onInputChange'>;

export default function MediaReleasePage({
  formData,
  waiverType,
  onInputChange,
}: MediaReleasePageProps) {
  const isRepresentative = waiverType === 'representative';
  const passengerFirstName = formData.firstName || 'the passenger';

  // Get the media release section from the correct template
  const mediaRelease = isRepresentative
    ? REPRESENTATIVE_WAIVER.mediaReleaseSection
    : PASSENGER_WAIVER.mediaReleaseSection;

  // Resolve — passenger options are strings, representative options are functions
  const resolveOption = (option: string | ((name: string) => string)): string =>
    typeof option === 'function' ? option(passengerFirstName) : option;

  const fullConsentValue = resolveOption(mediaRelease.options.fullConsent);
  const noConsentValue = resolveOption(mediaRelease.options.noConsent);

  // Display labels differ by waiver type
  const consentLabel = isRepresentative
    ? `I consent to the use of ${passengerFirstName}'s likeness`
    : 'I consent to the use of my likeness';

  const consentDescription = isRepresentative
    ? "You agree to the passenger's photos/videos being used for promotional purposes"
    : 'You agree to photos/videos being used for promotional purposes';

  const noConsentDescription = isRepresentative
    ? "The passenger's likeness will not be used in any manner"
    : 'Your likeness will not be used in any manner';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{mediaRelease.title}</h2>
        <p className="text-gray-600">{mediaRelease.description}</p>
      </div>

      <div className="space-y-3">
        <Radio
          id="consent"
          name="mediaRelease"
          value={fullConsentValue}
          checked={formData.mediaRelease === fullConsentValue}
          onChange={(e) => onInputChange('mediaRelease', e.target.value)}
          label={consentLabel}
          description={consentDescription}
        />
        <Radio
          id="noConsent"
          name="mediaRelease"
          value={noConsentValue}
          checked={formData.mediaRelease === noConsentValue}
          onChange={(e) => onInputChange('mediaRelease', e.target.value)}
          label="I do not consent"
          description={noConsentDescription}
        />
      </div>
    </div>
  );
}
