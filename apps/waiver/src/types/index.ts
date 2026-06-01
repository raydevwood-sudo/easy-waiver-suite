// ---------------------------------------------------------------------------
// Types shared between components in apps/waiver
// ---------------------------------------------------------------------------

export type WaiverType = 'passenger' | 'representative';

// FormConfig matches the shape stored in the API's forms.config column
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'dob' | 'year' | 'date' | 'select' | 'textarea' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  group?: string;
}

export interface AgreementClause {
  id: string;
  text: string;
  required: boolean;
}

export interface RadioOption {
  id: string;
  label: string;
  description?: string;
}

export interface FormSection {
  id: string;
  type: 'agreements' | 'radio' | 'fields' | 'info';
  title: string;
  description?: string;
  clauses?: AgreementClause[];
  options?: RadioOption[];
}

export interface SignatureConfig {
  id: string;
  label: string;
  type: 'draw' | 'type' | 'both';
  required: boolean;
  nameFieldId?: string;
}

export interface FormConfig {
  submissionIdPrefix: string;
  fields: FormField[];
  sections: FormSection[];
  signatures: SignatureConfig[];
}

export interface FormSummary {
  id: string;
  slug: string;
  name: string;
  version: string;
  requiresAuth: boolean;
  config: FormConfig;
}

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  brandColor: string;
  logoPath: string | null;
  waiverValidityDays: number;
}

// ---------------------------------------------------------------------------
// The in-progress form state.
// agreements and media release are keyed dynamically from FormConfig.
// ---------------------------------------------------------------------------
export interface WaiverFormData {
  waiverType: WaiverType;
  // Passenger / person being covered
  firstName: string;
  lastName: string;
  dateOfBirth: string;   // ISO date string e.g. "1985-06-15"
  town: string;
  // Representative / POA / Guardian (only for waiverType === 'representative')
  repFirstName: string;
  repLastName: string;
  // Contact — always collected
  email: string;
  phone: string;
  // Dynamic: clause IDs → agreed boolean
  agreements: Record<string, boolean>;
  // Dynamic: selected radio option ID
  mediaRelease: string;
  // Signatures
  primarySignature: string;      // base64 data URL
  primaryTimestamp: number | null;
  witnessName: string;
  witnessSignature: string;
  witnessTimestamp: number | null;
}

// The confirmation returned after successful submission
export interface SubmissionReceipt {
  id: string;
  submittedAt: string;
  expiresAt: string | null;
  pdfUrl: string | null;
}
