import Button from '@easy-waiver/shared/components/ui/Button';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting?: boolean;
  nextDisabled?: boolean;
}

export default function FormNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isSubmitting = false,
  nextDisabled = false,
}: FormNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200">
      <Button
        variant="secondary"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
      >
        ← Previous
      </Button>
      <Button
        variant="primary"
        onClick={onNext}
        disabled={isSubmitting || nextDisabled}
        loading={isSubmitting && isLastStep}
      >
        {isLastStep ? 'Submit ✓' : 'Next →'}
      </Button>
    </div>
  );
}
