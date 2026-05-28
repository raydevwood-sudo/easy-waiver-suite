import { useState, useMemo } from 'react';
import type { LocalFormData, SignatureSignee } from './pages/types';
import FormProgress from './FormProgress';
import FormNavigation from './FormNavigation';
import SignatureModal from '../signature/SignatureModal';

import PersonalInfoPage from './pages/PersonalInfoPage';
import WaiverPage1 from './pages/WaiverPage1';
import WaiverPage2 from './pages/WaiverPage2';
import WaiverPage3 from './pages/WaiverPage3';
import WaiverPage4 from './pages/WaiverPage4';
import WaiverPage5 from './pages/WaiverPage5';
import MediaReleasePage from './pages/MediaReleasePage';
import SignaturePage from './pages/SignaturePage';

export const TOTAL_STEPS = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-().+]{7,}$/;

const INITIAL_FORM_DATA: LocalFormData = {
  firstName: '',
  lastName: '',
  town: '',
  email: '',
  phone: '',
  waiver1: false,
  waiver2: false,
  waiver3: false,
  waiver4: false,
  waiver5: false,
  mediaRelease: '',
  pilotSignature: '',
  pilotTimestamp: null,
  witnessName: '',
  witnessSignature: '',
  witnessTimestamp: null,
};

interface WaiverFormProps {
  onSubmit: (formData: LocalFormData) => Promise<void>;
  submitError?: string | null;
  initialFormData?: Partial<LocalFormData>;
  lockedFields?: Set<keyof LocalFormData>;
}

export default function WaiverForm({ onSubmit, submitError, initialFormData, lockedFields }: WaiverFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<LocalFormData>({ ...INITIAL_FORM_DATA, ...initialFormData });
  const [signatureModal, setSignatureModal] = useState<{ isOpen: boolean; signee: SignatureSignee }>({
    isOpen: false,
    signee: 'pilot',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof LocalFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const handleOpenSignature = (signee: SignatureSignee) => {
    setSignatureModal({ isOpen: true, signee });
  };

  const handleSaveSignature = (dataURL: string, timestamp: Date, signee: SignatureSignee) => {
    const ts = timestamp.getTime();
    if (signee === 'witness') {
      setFormData((prev) => ({ ...prev, witnessSignature: dataURL, witnessTimestamp: ts }));
    } else {
      setFormData((prev) => ({ ...prev, pilotSignature: dataURL, pilotTimestamp: ts }));
    }
  };

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    switch (step) {
      case 0:
        if (!formData.firstName.trim()) errors.push('First name is required.');
        if (!formData.lastName.trim()) errors.push('Last name is required.');
        if (!formData.town.trim()) errors.push('Town is required.');
        if (!EMAIL_REGEX.test(formData.email)) errors.push('A valid email address is required.');
        if (!PHONE_REGEX.test(formData.phone)) errors.push('A valid phone number is required.');
        break;
      case 1: if (!formData.waiver1) errors.push('You must agree to continue.'); break;
      case 2: if (!formData.waiver2) errors.push('You must agree to continue.'); break;
      case 3: if (!formData.waiver3) errors.push('You must agree to continue.'); break;
      case 4: if (!formData.waiver4) errors.push('You must agree to continue.'); break;
      case 5: if (!formData.waiver5) errors.push('You must agree to continue.'); break;
      case 6: if (!formData.mediaRelease) errors.push('Please select a media release option.'); break;
      case 7:
        if (!formData.pilotSignature) errors.push('Pilot signature is required.');
        if (!formData.witnessName.trim()) errors.push('Witness name is required.');
        if (!formData.witnessSignature) errors.push('Witness signature is required.');
        break;
    }
    return errors;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isNextDisabled = useMemo(() => validateStep(currentStep).length > 0, [currentStep, formData]);

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) { setValidationErrors(errors); return; }
    setValidationErrors([]);

    if (currentStep === TOTAL_STEPS - 1) {
      setIsSubmitting(true);
      try { await onSubmit(formData); } finally { setIsSubmitting(false); }
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
    const props = { formData, onInputChange: handleInputChange, onOpenSignature: handleOpenSignature };
    switch (currentStep) {
      case 0: return <PersonalInfoPage {...props} lockedFields={lockedFields} />;
      case 1: return <WaiverPage1 {...props} />;
      case 2: return <WaiverPage2 {...props} />;
      case 3: return <WaiverPage3 {...props} />;
      case 4: return <WaiverPage4 {...props} />;
      case 5: return <WaiverPage5 {...props} />;
      case 6: return <MediaReleasePage {...props} />;
      case 7: return <SignaturePage {...props} />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="px-6 pt-6">
        <FormProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      {submitError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Submission failed</p>
          <p className="text-sm text-red-700 mt-1">{submitError}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((err, i) => <li key={i} className="text-sm text-red-700">{err}</li>)}
          </ul>
        </div>
      )}

      <div className="px-6 py-6">{renderStep()}</div>

      <div className="px-6 pb-6">
        <FormNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isSubmitting={isSubmitting}
          nextDisabled={isNextDisabled}
        />
      </div>

      <SignatureModal
        isOpen={signatureModal.isOpen}
        signee={signatureModal.signee}
        onClose={() => setSignatureModal((s) => ({ ...s, isOpen: false }))}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
