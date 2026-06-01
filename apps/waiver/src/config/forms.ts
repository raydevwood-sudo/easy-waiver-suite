import type { FormSummary } from '../types';

export const PASSENGER_FORM: FormSummary = {
  id: 'passenger',
  slug: 'passenger',
  name: 'Passenger Waiver',
  version: '1.0',
  requiresAuth: false,
  config: {
    submissionIdPrefix: 'PAS',
    fields: [
      { id: 'firstName', type: 'text', label: 'First Name', required: true },
      { id: 'lastName', type: 'text', label: 'Last Name', required: true },
      { id: 'dateOfBirth', type: 'dob', label: 'Date of Birth', required: false },
      { id: 'town', type: 'text', label: 'Town / City', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', type: 'tel', label: 'Phone', required: true },
    ],
    sections: [
      {
        id: 'agreements',
        type: 'agreements',
        title: 'Liability Waiver',
        clauses: [
          { id: 'clause1', text: 'I understand that participation in the Cycling Without Age program involves physical activity and associated risks.', required: true },
          { id: 'clause2', text: 'I voluntarily assume all risks associated with participation and release the organization from liability.', required: true },
          { id: 'clause3', text: 'I confirm that the passenger is medically fit to participate in this activity.', required: true },
          { id: 'clause4', text: 'I have read and understand this waiver.', required: true },
        ],
      },
      {
        id: 'mediaRelease',
        type: 'radio',
        title: 'Photo & Media Release',
        description: 'Please indicate your consent for photo and media use.',
        options: [
          {
            id: 'consent',
            label: 'I consent',
            description: 'I consent to Cycling Without Age Society using recordings of the passenger participating in their program for the purposes listed above.',
          },
          {
            id: 'noConsent',
            label: 'I do not consent',
            description: 'Do not use their likeness in any manner.',
          },
        ],
      },
    ],
    signatures: [
      { id: 'primary', label: 'Passenger or Guardian Signature', type: 'draw', required: true },
      { id: 'witness', label: 'Witness Name', type: 'both', required: false, nameFieldId: 'witnessName' },
    ],
  },
};

export const REPRESENTATIVE_FORM: FormSummary = {
  id: 'representative',
  slug: 'representative',
  name: 'Representative / POA Waiver',
  version: '1.0',
  requiresAuth: false,
  config: {
    submissionIdPrefix: 'REP',
    fields: [
      { id: 'passengerFirstName', type: 'text', label: 'Passenger First Name', required: true },
      { id: 'passengerLastName', type: 'text', label: 'Passenger Last Name', required: true },
      { id: 'dateOfBirth', type: 'dob', label: 'Date of Birth', required: false },
      { id: 'town', type: 'text', label: 'Town / City', required: true },
      { id: 'repFirstName', type: 'text', label: 'Representative First Name', required: true },
      { id: 'repLastName', type: 'text', label: 'Representative Last Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', type: 'tel', label: 'Phone', required: true },
    ],
    sections: [
      {
        id: 'agreements',
        type: 'agreements',
        title: 'Liability Waiver',
        clauses: [
          { id: 'clause1', text: 'I understand that participation in the Cycling Without Age program involves physical activity and associated risks.', required: true },
          { id: 'clause2', text: 'I, as legal representative/POA, voluntarily assume all risks and release the organization from liability on behalf of the passenger.', required: true },
          { id: 'clause3', text: 'I confirm that the passenger is medically fit to participate in this activity.', required: true },
          { id: 'clause4', text: 'I have the legal authority to sign this waiver on behalf of the passenger.', required: true },
        ],
      },
      {
        id: 'mediaRelease',
        type: 'radio',
        title: 'Photo & Media Release',
        description: 'Please indicate your consent for photo and media use.',
        options: [
          {
            id: 'consent',
            label: 'I consent',
            description: 'I consent to Cycling Without Age Society using recordings of the passenger participating in their program for the purposes listed above.',
          },
          {
            id: 'noConsent',
            label: 'I do not consent',
            description: 'Do not use their likeness in any manner.',
          },
        ],
      },
    ],
    signatures: [
      { id: 'primary', label: 'Representative Signature', type: 'draw', required: true },
      { id: 'witness', label: 'Witness Name', type: 'both', required: false, nameFieldId: 'witnessName' },
    ],
  },
};

export const STATIC_FORMS: FormSummary[] = [PASSENGER_FORM, REPRESENTATIVE_FORM];
