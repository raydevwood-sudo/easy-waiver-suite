/**
 * OrgConfig — all organisation-specific values in one place.
 *
 * To deploy this waiver suite for a new organisation:
 *   1. Copy this file and fill in your values.
 *   2. Update the Google Workspace domain, Firebase project, and branding.
 *   3. The Cloud Function names must match what you deploy in your Firebase project.
 */

export interface OrgConfig {
  /** Full legal name of the organisation. Appears on all waiver PDFs and pages. */
  orgName: string;

  /** Short name / abbreviation used in UI headings. */
  orgShortName: string;

  /**
   * Google Workspace domain for staff authentication.
   * Only accounts ending with this domain are allowed to log in to
   * the upload, admin, and pilot-waiver apps.
   * Example: 'myorganisation.org'
   */
  staffEmailDomain: string;

  /**
   * Firestore database ID.
   * Use '(default)' unless you have a named database.
   */
  firestoreDatabase: string;

  /**
   * Name of the Firestore collection where waiver documents are stored.
   */
  waiversCollection: string;

  /**
   * Name of the Firestore collection where volunteer/pilot profiles are stored.
   */
  volunteersCollection: string;

  /**
   * Name of the Firebase Cloud Function that handles public waiver submissions.
   * This function must validate App Check, store the PDF, and write to Firestore.
   */
  submitWaiverFunctionName: string;

  /**
   * Name of the Firebase Cloud Function that handles volunteer/pilot waiver submissions.
   * This function must validate the Firebase ID token before accepting submissions.
   */
  submitVolunteerWaiverFunctionName: string;

  /**
   * Record type ID used in the volunteers collection for pilot/volunteer waivers.
   * Must match the value expected by submitVolunteerWaiverFunctionName.
   */
  volunteerWaiverRecordTypeId: string;

  /**
   * Primary brand colour (hex). Used throughout the UI and Tailwind theme.
   * Example: '#05adee'
   */
  brandColor: string;

  /**
   * Waiver validity period in days. Defaults to 365 (1 year).
   */
  waiverValidityDays: number;
}

// ---------------------------------------------------------------------------
// Default config — Cycling Without Age Society (CWAS)
// Replace these values when deploying for another organisation.
// ---------------------------------------------------------------------------
const orgConfig: OrgConfig = {
  orgName: 'Cycling Without Age Society',
  orgShortName: 'CWAS',
  staffEmailDomain: 'cyclingwithoutagesociety.org',
  firestoreDatabase: 'canada',
  waiversCollection: 'waivers',
  volunteersCollection: 'volunteers',
  submitWaiverFunctionName: 'submitWaiverSecure',
  submitVolunteerWaiverFunctionName: 'submitVolunteerRecord',
  volunteerWaiverRecordTypeId: 'VOL_WAIV',
  brandColor: '#05adee',
  waiverValidityDays: 365,
};

export default orgConfig;
