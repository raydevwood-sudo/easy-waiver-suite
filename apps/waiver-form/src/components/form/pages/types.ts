import type { WaiverType } from '../../../types';

// The LocalFormData matches FormData but with looser types for in-progress state
export type LocalFormData = {
  waiverType: WaiverType;
  firstName: string;
  lastName: string;
  yearOfBirth: string;
  town: string;
  representativeFirstName: string;
  representativeLastName: string;
  email: string;
  phone: string;
  waiver1: boolean;
  waiver2: boolean;
  waiver3: boolean;
  waiver4: boolean;
  waiver5: boolean;
  informedConsent1: boolean;
  informedConsent2: boolean;
  informedConsent3: boolean;
  informedConsent4: boolean;
  informedConsent5: boolean;
  // Empty string means not yet selected
  mediaRelease: string;
  passengerSignature: string;
  passengerTimestamp: number | null;
  witnessName: string;
  witnessSignature: string;
  witnessTimestamp: number | null;
};

export type FormField = keyof LocalFormData;

export type SignatureSignee = 'passenger' | 'witness';

export interface FormPageProps {
  formData: LocalFormData;
  waiverType: WaiverType;
  onInputChange: (field: FormField, value: string | boolean) => void;
  onWaiverTypeChange?: (waiverType: WaiverType) => void;
  onOpenSignature: (signee: SignatureSignee) => void;
}
