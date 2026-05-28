export type WaiverType = 'passenger' | 'representative';

export interface FormData {
  waiverType: WaiverType;
  // Passenger info
  firstName: string;
  lastName: string;
  yearOfBirth?: number;
  town: string;
  // Representative info (only when waiverType === 'representative')
  representativeFirstName: string;
  representativeLastName: string;
  // Contact
  email: string;
  phone: string;
  // Passenger waiver agreements (waiver1 = intro, waiver2-5 = clauses[0-3])
  waiver1: boolean;
  waiver2: boolean;
  waiver3: boolean;
  waiver4: boolean;
  waiver5: boolean;
  // Representative informed consent agreements (ic1 = clause[0], ic2-5 = clauses[1-4] where clauses[4] is the acknowledgment)
  informedConsent1: boolean;
  informedConsent2: boolean;
  informedConsent3: boolean;
  informedConsent4: boolean;
  informedConsent5: boolean;
  // Media release – stored as the resolved option string
  mediaRelease: string;
  // Signatures
  passengerSignature: string;
  passengerTimestamp: number | null;
  witnessName: string;
  witnessSignature: string;
  witnessTimestamp: number | null;
}

export interface WaiverSubmission {
  waiverUId?: string;
  submittedAt?: string;
  expiryDate?: string;
  waiverType: WaiverType;
  /** Path in Firebase Storage, e.g. waivers/PAS-XXXXXXXXXX.pdf */
  pdfStoragePath?: string;
  /** Public download URL for the generated PDF */
  pdfUrl?: string;
  /** 'digital' = submitted via form; 'upload' = staff-uploaded paper scan */
  source?: 'digital' | 'upload';
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
    passenger: {
      imageUrl: string;
      timestamp: string;
    };
    witness: {
      name: string;
      imageUrl?: string;
      timestamp?: string;
    };
  };
}
