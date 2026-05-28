import Checkbox from '../../ui/Checkbox';
import { PASSENGER_WAIVER } from '../../../config/waiver-templates';
import { renderBoldText } from '../../../utils/renderBoldText';
import type { FormPageProps } from './types';

type WaiverAgreementPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'>;

export default function WaiverPage1({ formData, onInputChange }: WaiverAgreementPageProps) {
  const firstName = formData.firstName || '[First Name]';
  const lastName = formData.lastName || '[Last Name]';
  const town = formData.town || '[Town]';
  const fullName = `${firstName} ${lastName}`.trim();
  const introText = PASSENGER_WAIVER.introduction.template(firstName, lastName, town);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Confidentiality and Application Agreement
        </h2>
        <p className="text-sm text-gray-500">Please read and agree to continue</p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">{renderBoldText(introText, [fullName])}</p>

      <a
        href="https://drive.google.com/file/d/1mpVzTmqHwoPzY3BOmx2VK8RCb_i9YQC-/view?usp=drive_link"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-2"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        View the Passenger Handbook &rarr;
      </a>

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
