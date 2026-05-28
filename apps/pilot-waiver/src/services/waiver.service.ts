import { orgConfig } from '@waiver-suite/config';
import type { WaiverSubmission } from '../types';
import type { LocalFormData } from '../components/form/pages/types';
import { generateWaiverPDF } from './pdf-generator.service';
import { getToken } from 'firebase/app-check';
import { getIdToken } from 'firebase/auth';
import { appCheck, auth } from '../firebase';

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateCrockfordBase32(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) result += CROCKFORD_ALPHABET[byte % 32];
  return result;
}

export function generateRecordId(): string {
  return `VOL-REC-${generateCrockfordBase32(10)}`;
}

export function generateDocumentId(): string {
  return `VOL-DOC-${generateCrockfordBase32(10)}`;
}

/** @deprecated Use generateRecordId() for new submissions */
export function generateWaiverId(): string {
  return `PIL-${generateCrockfordBase32(10)}`;
}

export function convertFormDataToSubmission(
  formData: LocalFormData,
  docId: string,
  submittedAt: string,
  expiryDate: string,
): WaiverSubmission {
  return {
    waiverUId: docId,
    submittedAt,
    expiryDate,
    waiverType: 'pilot',
    pilot: { firstName: formData.firstName, lastName: formData.lastName, town: formData.town },
    contact: { email: formData.email, phone: formData.phone },
    agreements: {
      waiver1: formData.waiver1,
      waiver2: formData.waiver2,
      waiver3: formData.waiver3,
      waiver4: formData.waiver4,
      waiver5: formData.waiver5,
    },
    mediaRelease: formData.mediaRelease,
    signatures: {
      pilot: {
        imageUrl: formData.pilotSignature,
        timestamp: formData.pilotTimestamp ? new Date(formData.pilotTimestamp).toISOString() : new Date().toISOString(),
      },
      witness: {
        name: formData.witnessName,
        imageUrl: formData.witnessSignature || undefined,
        timestamp: formData.witnessTimestamp ? new Date(formData.witnessTimestamp).toISOString() : undefined,
      },
    },
  };
}

export async function submitWaiver(formData: LocalFormData): Promise<{ docId: string; submission: WaiverSubmission }> {
  const recordId = generateRecordId();
  const documentId = generateDocumentId();
  const now = new Date();
  const submittedAt = now.toISOString();
  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + 1);
  const expiryDate = expiry.toISOString();

  const submission = convertFormDataToSubmission(formData, recordId, submittedAt, expiryDate);
  const pdf = await generateWaiverPDF(submission);
  const pdfBase64 = pdf.output('datauristring').split(',')[1];

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
  const region = import.meta.env.VITE_FUNCTIONS_REGION ?? 'northamerica-northeast1';
  const endpoint = `https://${region}-${projectId}.cloudfunctions.net/submitVolunteerRecord`;

  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to submit a waiver.');
  const idToken = await getIdToken(currentUser);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  };
  if (appCheck) {
    const tokenResult = await getToken(appCheck, false);
    headers['X-Firebase-AppCheck'] = tokenResult.token;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      recordId,
      documentId,
      recordTypeId: orgConfig.volunteerWaiverRecordTypeId,
      recordFields: {
        title: 'Volunteer Liability Waiver',
        shortCode: 'WAIV',
        description: 'Annual volunteer liability waiver',
      },
      pdfBase64,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json() as { downloadUrl?: string; storagePath?: string };
  submission.pdfUrl = result.downloadUrl;
  submission.pdfStoragePath = result.storagePath;

  return { docId: recordId, submission };
}
