/**
 * OrgConfig — all organisation-specific values in one place.
 *
 * To deploy this waiver suite for a new organisation:
 *   1. Copy this file and fill in your values.
 *   2. Set VITE_POCKETBASE_URL in each app's .env to your PocketBase instance.
 */

export interface OrgConfig {
  /** Full legal name of the organisation. Appears on all waiver PDFs and pages. */
  orgName: string;

  /** Short name / abbreviation used in UI headings. */
  orgShortName: string;

  /**
   * Staff email domain restriction for the admin/upload/pilot-waiver apps.
   * Leave empty ('') to allow any PocketBase user to sign in.
   * Example: 'myorganisation.org'
   */
  staffEmailDomain: string;

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
  staffEmailDomain: '',
  brandColor: '#05adee',
  waiverValidityDays: 365,
};

export default orgConfig;
