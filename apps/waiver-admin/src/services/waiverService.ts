import type { RecordModel } from 'pocketbase';
import { pb } from '../pb';

export type WaiverType = 'passenger' | 'representative';
export type WaiverSource = 'digital' | 'upload' | 'import';

export interface WaiverRecord {
  id: string;
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

function recordToWaiver(record: RecordModel): WaiverRecord {
  const pdfField = record['pdf'] as string | undefined;
  const pdfUrl = pdfField ? pb.files.getURL(record, pdfField) : undefined;

  return {
    id: record.id,
    waiverUId: (record['waiverId'] as string | undefined) ?? record.id,
    waiverType: (record['waiverType'] as WaiverType) ?? 'passenger',
    source: (record['source'] as WaiverSource) ?? 'digital',
    submittedAt: record.created,
    expiryDate: (record['expiryDate'] as string) ?? '',
    passenger: {
      firstName: (record['passengerFirstName'] as string) ?? '',
      lastName: (record['passengerLastName'] as string) ?? '',
      yearOfBirth: record['passengerYearOfBirth'] as number | undefined,
      town: (record['passengerTown'] as string) ?? '',
    },
    representative: record['representativeFirstName']
      ? {
          firstName: record['representativeFirstName'] as string,
          lastName: (record['representativeLastName'] as string) ?? '',
        }
      : undefined,
    contact: {
      email: (record['email'] as string) ?? '',
      phone: (record['phone'] as string) ?? '',
    },
    pdfUrl,
    notes: record['notes'] as string | undefined,
    mediaRelease: record['mediaRelease'] as string | undefined,
  };
}

export function isWaiverValid(record: WaiverRecord): boolean {
  return !!record.expiryDate && new Date(record.expiryDate) > new Date();
}

export function subscribeToWaivers(
  onData: (waivers: WaiverRecord[]) => void,
  onError: (err: Error) => void,
): () => void {
  let unsub: (() => void) | undefined;

  void pb.collection('waivers')
    .getFullList({ sort: '-created' })
      .then((records) => onData(records.map(recordToWaiver)))
      .catch((err: unknown) => onError(err instanceof Error ? err : new Error(String(err))));
  }).then((fn) => { unsub = fn; });

  return () => { void unsub?.(); };
}

export async function deleteWaiver(waiver: WaiverRecord): Promise<void> {
  await pb.collection('waivers').delete(waiver.id);
}
