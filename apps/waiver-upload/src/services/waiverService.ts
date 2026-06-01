import { pb } from '../pb';

export type WaiverType = 'passenger' | 'representative';
export type WaiverSource = 'digital' | 'upload';

export interface WaiverRecord {
  waiverUId: string;
  waiverType: WaiverType;
  source: WaiverSource;
  submittedAt: string;
  expiryDate: string;
  passenger: {
    firstName: string;
    lastName: string;
    town: string;
  };
  representative?: {
    firstName: string;
    lastName: string;
  };
  contact?: {
    email: string;
    phone: string;
  };
  pdfUrl?: string;
  notes?: string;
  mediaRelease?: string;
}

export function isWaiverValid(record: WaiverRecord): boolean {
  return !!record.expiryDate && new Date(record.expiryDate) > new Date();
}

export interface UploadWaiverInput {
  waiverType: WaiverType;
  passengerFirstName: string;
  passengerLastName: string;
  passengerTown: string;
  representativeFirstName?: string;
  representativeLastName?: string;
  submittedAt: string;
  expiryDate: string;
  pdfFile: File;
  notes?: string;
  photoPermission?: boolean;
}

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateCrockfordBase32(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) result += CROCKFORD_ALPHABET[byte % 32];
  return result;
}

function generateWaiverId(type: WaiverType): string {
  const prefix = type === 'representative' ? 'REP' : 'PAS';
  return `${prefix}-${generateCrockfordBase32(10)}`;
}

export async function uploadWaiver(input: UploadWaiverInput): Promise<WaiverRecord> {
  const docId = generateWaiverId(input.waiverType);

  const passenger = {
    firstName: input.passengerFirstName.trim(),
    lastName: input.passengerLastName.trim(),
    town: input.passengerTown,
  };

  let mediaRelease: string | undefined;
  if (input.photoPermission !== undefined) {
    mediaRelease = input.photoPermission
      ? `I consent to Cycling Without Age Society using recordings of ${input.passengerFirstName} participating in their program for the purposes listed above.`
      : `I do not consent. Do not use ${input.passengerFirstName}'s likeness in any manner.`;
  }

  const representative =
    input.waiverType === 'representative' &&
    input.representativeFirstName &&
    input.representativeLastName
      ? { firstName: input.representativeFirstName, lastName: input.representativeLastName }
      : undefined;

  const data = new FormData();
  data.append('waiverId', docId);
  data.append('waiverType', input.waiverType);
  data.append('source', 'upload');
  data.append('expiryDate', input.expiryDate);
  data.append('passengerFirstName', passenger.firstName);
  data.append('passengerLastName', passenger.lastName);
  data.append('passengerFirstNameLower', passenger.firstName.toLowerCase());
  data.append('passengerLastNameLower', passenger.lastName.toLowerCase());
  data.append('passengerTown', input.passengerTown);
  if (representative) {
    data.append('representativeFirstName', representative.firstName);
    data.append('representativeLastName', representative.lastName);
  }
  if (input.notes) data.append('notes', input.notes);
  if (mediaRelease) data.append('mediaRelease', mediaRelease);
  data.append('pdf', input.pdfFile);

  const record = await pb.collection('waivers').create(data);
  const pdfField = record['pdf'] as string | undefined;
  const pdfUrl = pdfField ? pb.files.getURL(record, pdfField) : undefined;

  return {
    waiverUId: docId,
    waiverType: input.waiverType,
    source: 'upload',
    submittedAt: input.submittedAt,
    expiryDate: input.expiryDate,
    passenger,
    representative,
    pdfUrl,
    notes: input.notes,
    mediaRelease,
  };
}

