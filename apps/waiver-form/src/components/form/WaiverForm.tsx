import { useState, useMemo } from 'react';
import type { LocalFormData, SignatureSignee } from './pages/types';
import FormProgress from './FormProgress';
import FormNavigation from './FormNavigation';
import SignatureModal from '../signature/SignatureModal';

// Step pages
import WaiverTypePage from './pages/WaiverTypePage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import WaiverPage1 from './pages/WaiverPage1';
import WaiverPage2 from './pages/WaiverPage2';
import WaiverPage3 from './pages/WaiverPage3';
import WaiverPage4 from './pages/WaiverPage4';
import WaiverPage5 from './pages/WaiverPage5';
import InformedConsentPage1 from './pages/InformedConsentPage1';
import InformedConsentPage2 from './pages/InformedConsentPage2';
import InformedConsentPage3 from './pages/InformedConsentPage3';
import InformedConsentPage4 from './pages/InformedConsentPage4';
import InformedConsentPage5 from './pages/InformedConsentPage5';
import MediaReleasePage from './pages/MediaReleasePage';
import SignaturePage from './pages/SignaturePage';

export const PASSENGER_STEPS = 9;
export const REPRESENTATIVE_STEPS = 9;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-().+]{7,}$/;

const INITIAL_FORM_DATA: LocalFormData = {
  waiverType: 'passenger' as const,
  firstName: '',
  lastName: '',
  yearOfBirth: '',
  town: '',
  representativeFirstName: '',
  representativeLastName: '',
  email: '',
  phone: '',
  waiver1: false,
  waiver2: false,
  waiver3: false,
  waiver4: false,
  waiver5: false,
  informedConsent1: false,
  informedConsent2: false,
  informedConsent3: false,
  informedConsent4: false,
  informedConsent5: false,
  mediaRelease: '',
  passengerSignature: '',
  passengerTimestamp: null,
  witnessName: '',
  witnessSignature: '',
  witnessTimestamp: null,
};

interface WaiverFormProps {
  onSubmit: (formData: LocalFormData) => Promise<void>;
  submitError?: string | null;
}

export default function WaiverForm({ onSubmit, submitError }: WaiverFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<LocalFormData>(INITIAL_FORM_DATA);
  const totalSteps = formData.waiverType === 'representative' ? REPRESENTATIVE_STEPS : PASSENGER_STEPS;
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    signee: SignatureSignee;
  }>({ isOpen: false, signee: 'passenger' });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof LocalFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation errors on change
    if (validationErrors.length > 0) setValidationErrors([]); 
  };

  const handleOpenSignature = (signee: SignatureSignee) => {
    setSignatureModal({ isOpen: true, signee });
  };

  const handleSaveSignature = (dataURL: string, timestamp: Date, signee: SignatureSignee) => {
    const ts = timestamp.getTime();
    if (signee === 'witness') {
      setFormData((prev) => ({
        ...prev,
        witnessSignature: dataURL,
        witnessTimestamp: ts,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        passengerSignature: dataURL,
        passengerTimestamp: ts,
      }));
    }
  };

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    const isRep = formData.waiverType === 'representative';

    switch (step) {
      case 0:
        // Waiver type — always valid (default is set)
        break;
      case 1:
        if (!formData.firstName.trim()) errors.push('First name is required.');
        if (!formData.lastName.trim()) errors.push('Last name is required.');
        if (!formData.town.trim()) errors.push('Town is required.');
        if (formData.yearOfBirth && formData.yearOfBirth.length === 4) {
          const currentYear = new Date().getFullYear();
          const yob = Number(formData.yearOfBirth);
          if (yob > currentYear) errors.push('Year of birth cannot be in the future.');
          else if (yob < currentYear - 120) errors.push(`Year of birth must be ${currentYear - 120} or later.`);
        }
        if (!isRep) {
          // Email and phone are only collected for passenger (self-submitting) waivers
          if (!EMAIL_REGEX.test(formData.email)) errors.push('A valid email address is required.');
          if (!PHONE_REGEX.test(formData.phone)) errors.push('A valid phone number is required.');
        }
        if (isRep) {
          if (!formData.representativeFirstName.trim())
            errors.push("Representative's first name is required.");
          if (!formData.representativeLastName.trim())
            errors.push("Representative's last name is required.");
        }
        break;
      case 2:
        if (isRep ? !formData.informedConsent1 : !formData.waiver1)
          errors.push('You must agree to continue.');
        break;
      case 3:
        if (isRep ? !formData.informedConsent5 : !formData.waiver2)
          errors.push('You must agree to continue.');
        break;
      case 4:
        if (isRep ? !formData.informedConsent2 : !formData.waiver3)
          errors.push('You must agree to continue.');
        break;
      case 5:
        if (isRep ? !formData.informedConsent3 : !formData.waiver4)
          errors.push('You must agree to continue.');
        break;
      case 6:
        if (isRep ? !formData.informedConsent4 : !formData.waiver5)
          errors.push('You must agree to continue.');
        break;
      case 7:
        if (!formData.mediaRelease)
          errors.push('Please select a media release option.');
        break;
      case 8:
        if (!formData.passengerSignature) errors.push('Passenger signature is required.');
        if (!formData.witnessName.trim()) errors.push('Witness name is required.');
        if (!formData.witnessSignature) errors.push('Witness signature is required.');
        break;
    }
    return errors;
  };

  const isNextDisabled = useMemo(
    () => validateStep(currentStep).length > 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep, formData],
  );

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) return;

    if (currentStep === totalSteps - 1) {
      // Submit
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentStep === 0) return;
    setValidationErrors([]);
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStep = () => {
    const isRep = formData.waiverType === 'representative';
    const props = {
      formData,
      waiverType: formData.waiverType,
      onInputChange: handleInputChange,
      onOpenSignature: handleOpenSignature,
    };

    switch (currentStep) {
      case 0:
        return <WaiverTypePage {...props} />;
      case 1:
        return <PersonalInfoPage {...props} />;
      case 2:
        return isRep ? <InformedConsentPage1 {...props} /> : <WaiverPage1 {...props} />;
      case 3:
        return isRep ? <InformedConsentPage5 {...props} /> : <WaiverPage2 {...props} />;
      case 4:
        return isRep ? <InformedConsentPage2 {...props} /> : <WaiverPage3 {...props} />;
      case 5:
        return isRep ? <InformedConsentPage3 {...props} /> : <WaiverPage4 {...props} />;
      case 6:
        return isRep ? <InformedConsentPage4 {...props} /> : <WaiverPage5 {...props} />;
      case 7:
        return <MediaReleasePage {...props} />;
      case 8:
        return <SignaturePage {...props} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="px-6 pt-6">
        <FormProgress currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Submission failed</p>
          <p className="text-sm text-red-700 mt-1">{submitError}</p>
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-700">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step content */}
      <div className="px-6 py-6">{renderStep()}</div>

      {/* Navigation */}
      <div className="px-6 pb-6">
        <FormNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isSubmitting={isSubmitting}
          nextDisabled={isNextDisabled}
        />
      </div>

      {/* Signature modal */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        signee={signatureModal.signee}
        waiverType={formData.waiverType as 'passenger' | 'representative'}
        onClose={() => setSignatureModal((s) => ({ ...s, isOpen: false }))}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
