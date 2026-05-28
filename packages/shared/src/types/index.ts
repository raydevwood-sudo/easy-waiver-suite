// ---------------------------------------------------------------------------
// Shared waiver types — used across all apps in the suite
// ---------------------------------------------------------------------------

export type WaiverType = 'passenger' | 'representative' | 'pilot';

export interface PassengerWaiverSubmission {
  waiverUId?: string;
  submittedAt?: string;
  expiryDate?: string;
  waiverType: 'passenger' | 'representative';
  pdfStoragePath?: string;
  pdfUrl?: string;
  source?: 'digital' | 'upload' | 'import';
  passenger: {
    firstName: string;
    lastName: string;
    yearOfBirth?: number;
    town: string;
  };
  representative?: {
    firstName: string;
    lastName: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  agreements: {
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
  };
  mediaRelease: string;
  signatures: {
    passenger: { imageUrl: string; timestamp: string };
    witness: { name: string; imageUrl?: string; timestamp?: string };
  };
}

export interface PilotWaiverSubmission {
  waiverUId: string;
  submittedAt: string;
  expiryDate: string;
  waiverType: 'pilot';
  pdfStoragePath?: string;
  pdfUrl?: string;
  pilot: {
    firstName: string;
    lastName: string;
    town: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  agreements: {
    waiver1: boolean;
    waiver2: boolean;
    waiver3: boolean;
    waiver4: boolean;
    waiver5: boolean;
  };
  mediaRelease: string;
  signatures: {
    pilot: { imageUrl: string; timestamp: string };
    witness: { name: string; imageUrl?: string; timestamp?: string };
  };
}

/** Union type covering all waiver submission shapes */
export type WaiverSubmission = PassengerWaiverSubmission | PilotWaiverSubmission;
