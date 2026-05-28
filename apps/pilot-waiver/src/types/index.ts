export interface WaiverSubmission {
  waiverUId: string;
  submittedAt: string;
  expiryDate: string;
  waiverType: 'pilot';
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
    pilot: { imageUrl: string; timestamp: string; };
    witness: { name: string; imageUrl?: string; timestamp?: string; };
  };
  pdfUrl?: string;
  pdfStoragePath?: string;
}
