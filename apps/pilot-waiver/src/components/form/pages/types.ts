export type LocalFormData = {
  firstName: string;
  lastName: string;
  town: string;
  email: string;
  phone: string;
  waiver1: boolean;
  waiver2: boolean;
  waiver3: boolean;
  waiver4: boolean;
  waiver5: boolean;
  mediaRelease: string;
  pilotSignature: string;
  pilotTimestamp: number | null;
  witnessName: string;
  witnessSignature: string;
  witnessTimestamp: number | null;
};

export type FormField = keyof LocalFormData;
export type SignatureSignee = 'pilot' | 'witness';

export interface FormPageProps {
  formData: LocalFormData;
  onInputChange: (field: FormField, value: string | boolean) => void;
  onOpenSignature: (signee: SignatureSignee) => void;
}
