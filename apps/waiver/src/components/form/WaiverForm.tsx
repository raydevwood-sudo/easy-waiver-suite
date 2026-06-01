import { useState, useMemo } from 'react';
import SignatureModal from '@easy-waiver/shared/components/signature/SignatureModal';
import FormProgress from './FormProgress';
import FormNavigation from './FormNavigation';
import WaiverTypePage from './pages/WaiverTypePage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import ClausePage from './pages/ClausePage';
import MediaReleasePage from './pages/MediaReleasePage';
import SignaturePage from './pages/SignaturePage';
import { submitWaiver } from '../../services/api';
import type { WaiverFormData, WaiverType, FormSummary, SubmissionReceipt, AgreementClause } from '../../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-().+]{7,}$/;

// How many clauses to show per page (keeps pages scannable)
const CLAUSES_PER_PAGE = 2;

const INITIAL_FORM_DATA: WaiverFormData = {
  waiverType: 'passenger',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  town: '',
  repFirstName: '',
  repLastName: '',
  email: '',
  phone: '',
  agreements: {},
  mediaRelease: '',
  primarySignature: '',
  primaryTimestamp: null,
  witnessName: '',
  witnessSignature: '',
  witnessTimestamp: null,
};

interface WaiverFormProps {
  passengerForm: FormSummary;
  representativeForm: FormSummary;
  onSuccess: (receipt: SubmissionReceipt, waiverType: WaiverType) => void;
}

type SignatureSignee = 'primary' | 'witness';

// ---------------------------------------------------------------------------
// Step plan — computed from the active form config
// ---------------------------------------------------------------------------
type StepKind =
  | { kind: 'type' }
  | { kind: 'info' }
  | { kind: 'clauses'; sectionIndex: number; clauseBatch: AgreementClause[] }
  | { kind: 'media'; options: import('../../types').RadioOption[] }
  | { kind: 'signature' };

function buildSteps(form: FormSummary): StepKind[] {
  const steps: StepKind[] = [{ kind: 'type' }, { kind: 'info' }];

  for (let si = 0; si < form.config.sections.length; si++) {
    const section = form.config.sections[si];
    if (section.type === 'agreements' && section.clauses?.length) {
      // Split clauses into pages of CLAUSES_PER_PAGE
      for (let i = 0; i < section.clauses.length; i += CLAUSES_PER_PAGE) {
        steps.push({
          kind: 'clauses',
          sectionIndex: si,
          clauseBatch: section.clauses.slice(i, i + CLAUSES_PER_PAGE),
        });
      }
    } else if (section.type === 'radio' && section.options?.length) {
      steps.push({ kind: 'media', options: section.options });
    }
  }

  steps.push({ kind: 'signature' });
  return steps;
}

export default function WaiverForm({ passengerForm, representativeForm, onSuccess }: WaiverFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WaiverFormData>(INITIAL_FORM_DATA);
  const [signatureModal, setSignatureModal] = useState<{ isOpen: boolean; signee: SignatureSignee }>({
    isOpen: false,
    signee: 'primary',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeForm = formData.waiverType === 'representative' ? representativeForm : passengerForm;
  const steps = useMemo(() => buildSteps(activeForm), [activeForm]);
  const totalSteps = steps.length;
  const currentStepDef = steps[currentStep];

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleFieldChange = (field: keyof WaiverFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handleWaiverTypeChange = (type: WaiverType) => {
    setFormData((prev) => ({ ...prev, waiverType: type, agreements: {} }));
    setValidationErrors([]);
  };

  const handleAgreementChange = (clauseId: string, agreed: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: { ...prev.agreements, [clauseId]: agreed },
    }));
    setValidationErrors([]);
  };

  const handleSaveSignature = (dataURL: string, timestamp: Date, signee: SignatureSignee) => {
    const ts = timestamp.getTime();
    if (signee === 'witness') {
      setFormData((prev) => ({ ...prev, witnessSignature: dataURL, witnessTimestamp: ts }));
    } else {
      setFormData((prev) => ({ ...prev, primarySignature: dataURL, primaryTimestamp: ts }));
    }
  };

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------
  const validateStep = (stepDef: StepKind): string[] => {
    const errors: string[] = [];
    const isRep = formData.waiverType === 'representative';

    switch (stepDef.kind) {
      case 'type':
        break;

      case 'info':
        if (!formData.firstName.trim()) errors.push('First name is required.');
        if (!formData.lastName.trim()) errors.push('Last name is required.');
        if (!formData.town.trim()) errors.push('City / Town is required.');
        if (isRep) {
          if (!formData.repFirstName.trim()) errors.push('Representative first name is required.');
          if (!formData.repLastName.trim()) errors.push('Representative last name is required.');
        }
        if (!EMAIL_REGEX.test(formData.email)) errors.push('A valid email address is required.');
        if (!PHONE_REGEX.test(formData.phone)) errors.push('A valid phone number is required.');
        break;

      case 'clauses':
        for (const clause of stepDef.clauseBatch) {
          if (clause.required && !formData.agreements[clause.id]) {
            errors.push(`Please agree to all items before continuing.`);
            break;
          }
        }
        break;

      case 'media':
        if (!formData.mediaRelease) errors.push('Please select a media release option.');
        break;

      case 'signature':
        if (!formData.primarySignature) errors.push('A signature is required to complete the waiver.');
        break;
    }

    return errors;
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const handleNext = async () => {
    const errors = validateStep(currentStepDef);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    if (currentStep === totalSteps - 1) {
      await handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrevious = () => {
    setValidationErrors([]);
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const formSlug = formData.waiverType === 'representative' ? 'representative' : 'passenger';
      const receipt = await submitWaiver(formData, formSlug);
      onSuccess(receipt, formData.waiverType);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Interpolation values — injected into clause text
  // ---------------------------------------------------------------------------
  const interpolation: Record<string, string> = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    fullName: `${formData.firstName} ${formData.lastName}`.trim(),
    town: formData.town,
    repFirstName: formData.repFirstName,
    repLastName: formData.repLastName,
  };

  // ---------------------------------------------------------------------------
  // Render current step
  // ---------------------------------------------------------------------------
  const renderStep = () => {
    switch (currentStepDef.kind) {
      case 'type':
        return (
          <WaiverTypePage
            waiverType={formData.waiverType}
            onChange={handleWaiverTypeChange}
          />
        );

      case 'info':
        return (
          <PersonalInfoPage
            formData={formData}
            waiverType={formData.waiverType}
            onChange={handleFieldChange}
          />
        );

      case 'clauses': {
        const section = activeForm.config.sections[currentStepDef.sectionIndex];
        return (
          <ClausePage
            sectionTitle={section.title}
            sectionDescription={section.description}
            clauses={currentStepDef.clauseBatch}
            agreements={formData.agreements}
            interpolation={interpolation}
            onChange={handleAgreementChange}
          />
        );
      }

      case 'media':
        return (
          <MediaReleasePage
            options={currentStepDef.options}
            selected={formData.mediaRelease}
            onChange={(v) => setFormData((prev) => ({ ...prev, mediaRelease: v }))}
          />
        );

      case 'signature': {
        // Last clause of the last agreements section is typically the acknowledgment
        const lastAgreementsSection = [...activeForm.config.sections]
          .reverse()
          .find((s) => s.type === 'agreements');
        const acknowledgmentText = lastAgreementsSection?.clauses?.at(-1)?.text;

        return (
          <SignaturePage
            formData={formData}
            waiverType={formData.waiverType}
            acknowledgmentText={acknowledgmentText}
            onChange={handleFieldChange}
            onOpenSignature={(signee) => setSignatureModal({ isOpen: true, signee })}
          />
        );
      }
    }
  };

  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <FormProgress currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      <div className="px-6 py-6 min-h-[400px]">
        {renderStep()}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {validationErrors.map((e, i) => (
              <p key={i} className="text-sm text-red-700">{e}</p>
            ))}
          </div>
        )}

        {/* Submission error */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        <FormNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isSubmitting={isSubmitting}
        />
      </div>

      <SignatureModal
        isOpen={signatureModal.isOpen}
        signee={signatureModal.signee === 'primary' ? 'passenger' : 'witness'}
        waiverType={formData.waiverType === 'representative' ? 'representative' : 'passenger'}
        onClose={() => setSignatureModal((s) => ({ ...s, isOpen: false }))}
        onSave={(_dataURL, _timestamp, signee) =>
          handleSaveSignature(_dataURL, _timestamp, signee === 'passenger' ? 'primary' : 'witness')
        }
      />
    </>
  );
}
