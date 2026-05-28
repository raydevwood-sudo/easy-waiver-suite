import { orgConfig } from '@waiver-suite/config';
import type { WaiverType, WaiverSubmission } from '../types';
import type { LocalFormData } from '../components/form/pages/types';
import { generateWaiverPDF } from './pdf-generator.service';
import { getToken } from 'firebase/app-check';
import { appCheck } from '../firebase';

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

export function generateWaiverId(type: WaiverType = 'passenger'): string {
  const prefix = type === 'representative' ? 'REP' : 'PAS';
  return `${prefix}-${generateCrockfordBase32(10)}`;
}

export function convertFormDataToSubmission(
  formData: LocalFormData,
  waiverType: WaiverType,
  docId: string,
  submittedAt: string,
  expiryDate: string,
): WaiverSubmission {
  const submission: WaiverSubmission = {
    waiverUId: docId,
    submittedAt,
    expiryDate,
    waiverType,
    passenger: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      town: formData.town,
      ...(formData.yearOfBirth && Number(formData.yearOfBirth) > 1900
        ? { yearOfBirth: Number(formData.yearOfBirth) }
        : {}),
    },
    contact: {
      email: formData.email,
      phone: formData.phone,
    },
    agreements: {
      informedConsent1: formData.informedConsent1,
      informedConsent2: formData.informedConsent2,
      informedConsent3: formData.informedConsent3,
      informedConsent4: formData.informedConsent4,
      informedConsent5: formData.informedConsent5,
      waiver1: formData.waiver1,
      waiver2: formData.waiver2,
      waiver3: formData.waiver3,
      waiver4: formData.waiver4,
      waiver5: formData.waiver5,
    },
    mediaRelease: formData.mediaRelease,
    signatures: {
      passenger: {
        imageUrl: formData.passengerSignature,
        timestamp: formData.passengerTimestamp
          ? new Date(formData.passengerTimestamp).toISOString()
          : new Date().toISOString(),
      },
      witness: {
        name: formData.witnessName,
        imageUrl: formData.witnessSignature || undefined,
        timestamp: formData.witnessTimestamp
          ? new Date(formData.witnessTimestamp).toISOString()
          : undefined,
      },
    },
  };

  if (waiverType === 'representative') {
    submission.representative = {
      firstName: formData.representativeFirstName,
      lastName: formData.representativeLastName,
    };
  }

  return submission;
}

export async function submitWaiver(
  formData: LocalFormData,
  waiverType: WaiverType,
): Promise<{ docId: string; submission: WaiverSubmission }> {
  const docId = generateWaiverId(waiverType);
  const now = new Date();
  const submittedAt = now.toISOString();

  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + 1);
  const expiryDate = expiry.toISOString();

  const submission = convertFormDataToSubmission(
    formData,
    waiverType,
    docId,
    submittedAt,
    expiryDate,
  );

  // Generate PDF and encode as base64
  const pdf = await generateWaiverPDF(submission);
  const pdfBase64 = pdf.output('datauristring').split(',')[1];

  // Derive the Cloud Function endpoint from the project ID env var
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
  const functionsBaseUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL as string | undefined;
  const region = import.meta.env.VITE_FUNCTIONS_REGION ?? 'northamerica-northeast1';
  const endpoint = functionsBaseUrl
    ? `${functionsBaseUrl.replace(/\/$/, '')}/submitWaiverSecure`
    : `https://${region}-${projectId}.cloudfunctions.net/submitWaiverSecure`;

  // Attach App Check token — required for production submission
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!appCheck) {
    throw new Error('App Check is not initialized. Cannot submit waiver.');
  }
  const appCheckTokenResult = await getToken(appCheck, false);
  headers['X-Firebase-AppCheck'] = appCheckTokenResult.token;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ docId, waiverRecord: submission, pdfBase64 }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Waiver submission failed (${response.status}): ${text}`);
  }

  const result = await response.json() as { pdfUrl?: string; pdfStoragePath?: string };
  submission.pdfUrl = result.pdfUrl;
  submission.pdfStoragePath = result.pdfStoragePath;
  submission.source = 'digital';

  return { docId, submission };
}
