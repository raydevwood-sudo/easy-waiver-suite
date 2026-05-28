import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

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
    firstNameLower: string;
    lastNameLower: string;
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
  pdfStoragePath?: string;
  pdfUrl?: string;
  notes?: string;
  mediaRelease?: string;
}

export function isWaiverValid(record: WaiverRecord): boolean {
  return !!record.expiryDate && new Date(record.expiryDate) > new Date();
}

export async function fetchAllWaivers(): Promise<WaiverRecord[]> {
  const q = query(collection(db, 'waivers'), orderBy('submittedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ waiverUId: d.id, ...d.data() } as WaiverRecord));
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
  for (const byte of array) {
    result += CROCKFORD_ALPHABET[byte % 32];
  }
  return result;
}

function generateWaiverId(type: WaiverType): string {
  const prefix = type === 'representative' ? 'REP' : 'PAS';
  return `${prefix}-${generateCrockfordBase32(10)}`;
}

export async function uploadWaiver(input: UploadWaiverInput): Promise<WaiverRecord> {
  const docId = generateWaiverId(input.waiverType);
  const storagePath = `waivers/${docId}.pdf`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, input.pdfFile, { contentType: 'application/pdf' });
  const pdfUrl = await getDownloadURL(storageRef);

  const record: WaiverRecord = {
    waiverUId: docId,
    waiverType: input.waiverType,
    source: 'upload',
    submittedAt: input.submittedAt,
    expiryDate: input.expiryDate,
    passenger: {
      firstName:      input.passengerFirstName.trim(),
      lastName:       input.passengerLastName.trim(),
      firstNameLower: input.passengerFirstName.trim().toLowerCase(),
      lastNameLower:  input.passengerLastName.trim().toLowerCase(),
      town:           input.passengerTown,
    },

    pdfStoragePath: storagePath,
    pdfUrl,
    ...(input.notes ? { notes: input.notes } : {}),
    ...(input.photoPermission !== undefined ? {
      mediaRelease: input.photoPermission
        ? `I consent to Cycling Without Age Society using recordings of ${input.passengerFirstName} participating in their program for the purposes listed above.`
        : `I do not consent. Do not use ${input.passengerFirstName}'s likeness in any manner.`,
    } : {}),
  };

  if (
    input.waiverType === 'representative' &&
    input.representativeFirstName &&
    input.representativeLastName
  ) {
    record.representative = {
      firstName: input.representativeFirstName,
      lastName: input.representativeLastName,
    };
  }

  await setDoc(doc(collection(db, 'waivers'), docId), record);
  return record;
}
