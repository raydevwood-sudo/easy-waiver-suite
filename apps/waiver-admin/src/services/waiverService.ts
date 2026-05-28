import {
  collection,
  doc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

export type WaiverType = 'passenger' | 'representative';
export type WaiverSource = 'digital' | 'upload' | 'import';

export interface WaiverRecord {
  waiverUId: string;
  waiverType: WaiverType;
  source: WaiverSource;
  submittedAt: string;
  expiryDate: string;
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
  pdfStoragePath?: string;
  pdfUrl?: string;
  notes?: string;
  mediaRelease?: string;
}

export function isWaiverValid(record: WaiverRecord): boolean {
  return !!record.expiryDate && new Date(record.expiryDate) > new Date();
}

export function subscribeToWaivers(
  onData: (waivers: WaiverRecord[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, 'waivers'), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => ({ waiverUId: d.id, ...d.data() } as WaiverRecord)));
    },
    (err) => onError(err),
  );
}

export async function deleteWaiver(waiver: WaiverRecord): Promise<void> {
  if (waiver.pdfStoragePath) {
    try {
      await deleteObject(ref(storage, waiver.pdfStoragePath));
    } catch {
      // Storage object may already be gone — proceed with Firestore delete
    }
  }
  await deleteDoc(doc(db, 'waivers', waiver.waiverUId));
}
