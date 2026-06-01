import { orgConfig } from '@easy-waiver/config';
import type { WaiverSubmission } from '../types';
import type { LocalFormData } from '../components/form/pages/types';
import { generateWaiverPDF } from './pdf-generator.service';
import { pb } from '../pb';

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateCrockfordBase32(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) result += CROCKFORD_ALPHABET[byte % 32];
  return result;
}

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
  const docId = generateWaiverId();
  const now = new Date();
  const submittedAt = now.toISOString();
  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + Math.round(orgConfig.waiverValidityDays / 365));
  const expiryDate = expiry.toISOString();

  const submission = convertFormDataToSubmission(formData, docId, submittedAt, expiryDate);

  const pdf = await generateWaiverPDF(submission);
  const pdfBlob = pdf.output('blob');
  const pdfFile = new File([pdfBlob], `${docId}.pdf`, { type: 'application/pdf' });

  const data = new FormData();
  data.append('waiverId', docId);
  data.append('waiverType', 'pilot');
  data.append('source', 'digital');
  data.append('submittedAt', submittedAt);
  data.append('expiryDate', expiryDate);
  data.append('pilotFirstName', formData.firstName);
  data.append('pilotLastName', formData.lastName);
  data.append('pilotTown', formData.town);
  data.append('email', formData.email);
  data.append('phone', formData.phone);
  data.append('agreements', JSON.stringify(submission.agreements));
  data.append('signatures', JSON.stringify(submission.signatures));
  if (formData.mediaRelease) data.append('mediaRelease', formData.mediaRelease);
  data.append('pdf', pdfFile);

  const record = await pb.collection('volunteer_waivers').create(data);
  submission.pdfUrl = pb.files.getURL(record, record['pdf'] as string);

  return { docId, submission };
}
