/**
 * Pilot Waiver Content Templates - Version Controlled
 *
 * Clauses are placeholders — update once content is provided.
 *
 * Version History:
 * - v1.0 (2026-04-03): Initial version
 * - v1.1 (2026-04-03): Final clause text added
 */

export const WAIVER_VERSION = 'v1.1';
export const WAIVER_VERSION_DATE = '2026-04-03';
export const ORGANIZATION_NAME = 'Cycling Without Age Society';
export const ORGANIZATION_NAME_SHORT = 'CWAS';
export const ORGANIZATION_LOGO_URL = '/android-chrome-512x512.png';

export const PILOT_WAIVER = {
  title: 'Pilot Volunteer Waiver and Release of Liability',

  introduction: {
    template: (firstName: string, lastName: string, town: string) =>
      `I, ${firstName} ${lastName}, of the town of ${town}, have received, read and understand the Cycling Without Age Pilot Handbook and Confidentiality guidelines, and agree to abide by the procedures listed therein and I attest that all of the information I have provided herein is accurate and complete. I understand and agree that acceptance into the program is entirely at the discretion of the Cycling Without Age Society program coordinator.`,
  },

  waiverSection: {
    title: 'Waiver of Liability',
    clauses: [
      // clauses[0] – Participation
      'I, the undersigned, am the person named herein taking part in the Cycling Without Age Program as a pilot.',

      // clauses[1] – Inherent Risks
      'I understand and agree that there are inherent risks associated with participation in this activity, that my participation is voluntary and that I am physically fit enough to participate in the activity.',

      // clauses[2] – Assumption of Responsibility
      'I accept all responsibility for my participation including the possibility of personal injury, death, property damage or any kind notwithstanding that the injury, loss may have been contributed to or occasioned by the negligence of the Cycling Without Age Society and its officers, directors, employed, members, agents, assigns, legal representative and successors.',

      // clauses[3] – Indemnification
      'I do hereby indemnify and hold harmless the Cycling Without Age Society, its officers, directors, employees, members, agents, assigns, legal representatives and successors and any and all business associates and partners involved in the above noted activity and each of them, their owner, officers, and employees hereby waiving all claims for damage now or in the future arising from any loss, accident, injury or death which may be caused by or arise from participation of the individual named herein during this event; and agree to assume all risks for the activity noted above that the individual named herein has agreed to participate in.',
    ],
  },

  acknowledgment:
    'My signature acknowledges that I am over the age of 18 and had sufficient time to read and understand the waiver. I have had the opportunity to seek my own legal advice and that I understand and agree to the conditions stated in this document and that they are binding on my heirs, next of kin, executors, administrators and successors.',

  mediaReleaseSection: {
    title: 'Media Release',
    description:
      'Cycling Without Age Society occasionally takes photos/videos of their rides and pilots for the purpose of promoting their program on digital and print media including social networks, CWAS website, and other news and advertising.',
    options: {
      fullConsent:
        'I consent to Cycling Without Age Society using recordings of me participating in their program for the purposes listed above.',

      consentWithInitials:
        'I consent to Cycling Without Age Society using recordings of me participating in their program for the purposes listed above. However, I request that my full name not be shown, and I prefer to be identified by initials instead.',

      noConsent:
        'I do not consent to Cycling Without Age Society using recordings of me participating in their program for the purposes listed above.',
    },
  },
};
