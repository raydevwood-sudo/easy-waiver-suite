import Checkbox from '../../ui/Checkbox';
import { REPRESENTATIVE_WAIVER } from '../../../config/waiver-templates';
import { renderBoldText } from '../../../utils/renderBoldText';
import type { FormPageProps } from './types';

type InformedConsentPageProps = Pick<FormPageProps, 'formData' | 'waiverType' | 'onInputChange'> & {
  formData: FormPageProps['formData'];
};

export default function InformedConsentPage1({
  formData,
  onInputChange,
}: InformedConsentPageProps) {
  const repFirstName = formData.representativeFirstName || '[Representative First Name]';
  const repLastName = formData.representativeLastName || '[Representative Last Name]';
  const repFullName = `${repFirstName} ${repLastName}`.trim();
  const introText = REPRESENTATIVE_WAIVER.introduction.template(
    repFirstName,
    repLastName,
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

      <div className="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-r-lg">
        <p className="text-sm text-brand-900">
          This informed consent is for Legal Guardians or Power of Attorney representing a
          dependant participating in the Cycling Without Age Program.
        </p>
      </div>

      <p className="text-base leading-relaxed text-gray-700">{renderBoldText(introText, [repFullName])}</p>

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
        id="informedConsent1"
        name="informedConsent1"
        label="I agree"
        checked={formData.informedConsent1}
        onChange={(e) => onInputChange('informedConsent1', e.target.checked)}
        required
      />
    </div>
  );
}
