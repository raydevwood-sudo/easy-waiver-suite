import { pb } from '../pb';
import type { SubmissionReceipt, WaiverFormData, WaiverType } from '../types';

// ---------------------------------------------------------------------------
// Build submission data payload from form state
// ---------------------------------------------------------------------------
function buildSubmissionData(
  formData: WaiverFormData,
  waiverType: WaiverType
): Record<string, unknown> {
  const isRep = waiverType === 'representative';

  return {
    waiverType,
    ...(isRep
      ? {
          passengerFirstName: formData.firstName,
          passengerLastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || undefined,
          town: formData.town,
          repFirstName: formData.repFirstName,
          repLastName: formData.repLastName,
        }
      : {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || undefined,
          town: formData.town,
        }),
    email: formData.email,
    phone: formData.phone,
    ...formData.agreements,
    mediaRelease: formData.mediaRelease,
    primarySignature: {
      imageUrl: formData.primarySignature,
      timestamp: formData.primaryTimestamp,
    },
    ...(formData.witnessName
      ? {
          witnessSignature: {
            name: formData.witnessName,
            imageUrl: formData.witnessSignature || undefined,
            timestamp: formData.witnessTimestamp || undefined,
          },
        }
      : {}),
  };
}

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function generateCrockfordBase32(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) result += CROCKFORD_ALPHABET[byte % 32];
  return result;
}

// ---------------------------------------------------------------------------
// Submit waiver — public, no authentication required
// ---------------------------------------------------------------------------
export async function submitWaiver(
  formData: WaiverFormData,
  formSlug: string
): Promise<SubmissionReceipt> {
  const prefix = formSlug === 'representative' ? 'REP' : 'PAS';
  const waiverId = `${prefix}-${generateCrockfordBase32(10)}`;
  const now = new Date();
  const submittedAt = now.toISOString();
  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + 1);
  const expiresAt = expiry.toISOString();

  const data = buildSubmissionData(formData, formData.waiverType);

  const isRep = formData.waiverType === 'representative';
  const payload: Record<string, unknown> = {
    waiverId,
    waiverType: formData.waiverType,
    source: 'digital',
    expiryDate: expiresAt,
    passengerFirstName: formData.firstName,
    passengerLastName: formData.lastName,
    passengerFirstNameLower: formData.firstName.toLowerCase(),
    passengerLastNameLower: formData.lastName.toLowerCase(),
    passengerTown: formData.town,
    email: formData.email,
    phone: formData.phone,
    agreements: JSON.stringify(formData.agreements),
    mediaRelease: formData.mediaRelease,
    signatures: JSON.stringify({
      primary: data['primarySignature'],
      witness: data['witnessSignature'],
    }),
    ...(isRep
      ? {
          representativeFirstName: formData.repFirstName,
          representativeLastName: formData.repLastName,
        }
      : {}),
  };

  await pb.collection('waivers').create(payload);

  return {
    id: waiverId,
    submittedAt,
    expiresAt,
    pdfUrl: null,
  };
}
