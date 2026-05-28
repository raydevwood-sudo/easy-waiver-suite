import { jsPDF } from 'jspdf';
import type { WaiverSubmission } from '../types';
import { PASSENGER_WAIVER, REPRESENTATIVE_WAIVER } from '../config/waiver-templates';

const CWAS_COLOR: [number, number, number] = [5, 173, 238]; // #05adee
const DARK: [number, number, number] = [30, 41, 59]; // slate-800
const GRAY: [number, number, number] = [100, 116, 139]; // slate-500
const LIGHT_GRAY: [number, number, number] = [226, 232, 240]; // slate-200
const CWAS_LIGHT: [number, number, number] = [230, 247, 253]; // brand-50

const PAGE_W = 216; // Legal mm (8.5")
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface DocState {
  pdf: jsPDF;
  y: number;
  pageNum: number;
}

function checkPageBreak(state: DocState, needed = 10) {
  if (state.y + needed > 338) {
    state.pdf.addPage();
    state.pageNum += 1;
    state.y = MARGIN;
  }
}

function addSectionHeader(state: DocState, title: string) {
  checkPageBreak(state, 16);
  state.y += 2;
  state.pdf.setFillColor(...CWAS_COLOR);
  state.pdf.roundedRect(MARGIN, state.y, CONTENT_W, 7, 2, 2, 'F');
  state.pdf.setTextColor(255, 255, 255);
  state.pdf.setFont('helvetica', 'bold');
  state.pdf.setFontSize(9);
  state.pdf.text(title.toUpperCase(), MARGIN + 4, state.y + 4.9);
  state.pdf.setTextColor(...DARK);
  state.y += 11;
}

function addBulletClause(state: DocState, text: string) {
  checkPageBreak(state, 8);
  state.pdf.setFont('helvetica', 'normal');
  state.pdf.setFontSize(9.5);
  state.pdf.setTextColor(...DARK);
  const lines = state.pdf.splitTextToSize(text, CONTENT_W - 8);
  state.pdf.text('•', MARGIN + 2, state.y);
  state.pdf.text(lines, MARGIN + 7, state.y);
  state.y += lines.length * 5.2 + 1.5;
}

function addParagraph(state: DocState, text: string, indent = 0) {
  checkPageBreak(state, 8);
  state.pdf.setFont('helvetica', 'normal');
  state.pdf.setFontSize(9.5);
  state.pdf.setTextColor(...DARK);
  const lines = state.pdf.splitTextToSize(text, CONTENT_W - indent);
  state.pdf.text(lines, MARGIN + indent, state.y);
  state.y += lines.length * 5.2 + 1.5;
}

/**
 * Renders the intro paragraph with the passenger name bolded inline.
 */
function addIntroParagraph(state: DocState, introText: string, boldName: string, boldTown: string) {
  checkPageBreak(state, 14);
  state.pdf.setFontSize(9.5);
  const lines = state.pdf.splitTextToSize(introText, CONTENT_W);
  let startY = state.y;
  for (const line of lines) {
    // Check if this line contains boldName or boldTown
    const hasBoldName = boldName && line.includes(boldName);
    const hasBoldTown = boldTown && line.includes(boldTown);

    if (!hasBoldName && !hasBoldTown) {
      state.pdf.setFont('helvetica', 'normal');
      state.pdf.text(line, MARGIN, startY);
    } else {
      // Render segment by segment
      let remaining = line;
      let x = MARGIN;
      const targets: { text: string; bold: boolean }[] = [];

      // Split on bold words
      const boldWords = [boldName, boldTown].filter(Boolean);
      while (remaining) {
        let earliest = remaining.length;
        let found = '';
        for (const bw of boldWords) {
          const idx = remaining.indexOf(bw);
          if (idx !== -1 && idx < earliest) {
            earliest = idx;
            found = bw;
          }
        }
        if (!found) {
          targets.push({ text: remaining, bold: false });
          break;
        }
        if (earliest > 0) targets.push({ text: remaining.slice(0, earliest), bold: false });
        targets.push({ text: found, bold: true });
        remaining = remaining.slice(earliest + found.length);
      }

      // Compute space width once — jsPDF may drop trailing-space metrics so we
      // measure it as the difference between 'a ' and 'a' to be reliable.
      const spaceW = state.pdf.getTextWidth('a ') - state.pdf.getTextWidth('a');
      for (const seg of targets) {
        state.pdf.setFont('helvetica', seg.bold ? 'bold' : 'normal');
        const trimmed = seg.text.trimEnd();
        const trailingSpaces = seg.text.length - trimmed.length;
        state.pdf.text(trimmed, x, startY);
        x += state.pdf.getTextWidth(trimmed);
        if (trailingSpaces > 0) {
          // Manually advance x for trailing spaces that getTextWidth may ignore
          x += spaceW * trailingSpaces;
        }
      }
    }
    startY += 5.2;
  }
  state.y = startY + 1.5;
}

function addSignatureBlock(
  state: DocState,
  leftLabel: string,
  leftName: string,
  leftRole: string | undefined,
  leftContact: string | undefined,
  leftImgDataUrl: string | undefined,
  leftTimestamp: string | undefined,
  rightLabel: string,
  rightName: string,
  rightImgDataUrl: string | undefined,
  rightTimestamp: string | undefined,
) {
  checkPageBreak(state, 60);
  const colW = (CONTENT_W - 6) / 2;

  // Left column
  const leftX = MARGIN;
  const rightX = MARGIN + colW + 6;

  // Labels
  state.pdf.setFont('helvetica', 'bold');
  state.pdf.setFontSize(10);
  state.pdf.setTextColor(...DARK);
  state.pdf.text(leftLabel, leftX, state.y);
  state.pdf.text(rightLabel, rightX, state.y);
  state.y += 5;

  // Names
  state.pdf.setFont('helvetica', 'bold');
  state.pdf.setFontSize(10);
  state.pdf.setTextColor(...GRAY);
  state.pdf.text(leftName, leftX, state.y);
  state.pdf.text(rightName, rightX, state.y);
  if (leftRole) {
    state.y += 5;
    state.pdf.setFont('helvetica', 'normal');
    state.pdf.setFontSize(10);
    state.pdf.text(leftRole, leftX, state.y);
  }
  if (leftContact) {
    state.y += 5;
    state.pdf.setFont('helvetica', 'bold');
    state.pdf.setFontSize(10);
    state.pdf.text(leftContact, leftX, state.y);
  }
  state.y += 8;

  // Signature images or placeholder boxes
  const sigH = 15;
  state.pdf.setDrawColor(...LIGHT_GRAY);
  state.pdf.setLineWidth(0.3);

  if (leftImgDataUrl) {
    state.pdf.addImage(leftImgDataUrl, 'PNG', leftX, state.y, colW, sigH);
  } else {
    state.pdf.rect(leftX, state.y, colW, sigH);
  }

  if (rightImgDataUrl) {
    state.pdf.addImage(rightImgDataUrl, 'PNG', rightX, state.y, colW, sigH);
  } else {
    state.pdf.rect(rightX, state.y, colW, sigH);
  }
  state.y += sigH + 2;

  // Timestamps
  state.pdf.setFont('helvetica', 'italic');
  state.pdf.setFontSize(10);
  state.pdf.setTextColor(...GRAY);
  if (leftTimestamp) {
    state.pdf.text(`Signed: ${leftTimestamp}`, leftX, state.y);
  }
  if (rightTimestamp) {
    state.pdf.text(`Signed: ${rightTimestamp}`, rightX, state.y);
  }
  state.y += 7;
}

function formatTimestamp(ts: string | number | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(isoStr: string | undefined): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

let _cachedLogoDataUrl: string | null | undefined = undefined;
async function fetchLogoDataUrl(): Promise<string | null> {
  if (_cachedLogoDataUrl !== undefined) return _cachedLogoDataUrl;
  try {
    const res = await fetch('/apple-touch-icon.png');
    const blob = await res.blob();
    _cachedLogoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    _cachedLogoDataUrl = null;
  }
  return _cachedLogoDataUrl;
}

export async function generateWaiverPDF(submission: WaiverSubmission): Promise<jsPDF> {
  const logoDataUrl = await fetchLogoDataUrl();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'legal' });
  const state: DocState = { pdf, y: MARGIN, pageNum: 1 };
  const isRep = submission.waiverType === 'representative';

  const passengerFullName =
    `${submission.passenger.firstName} ${submission.passenger.lastName}`.trim();
  const passengerTown = submission.passenger.town;
  const representativeFullName = isRep && submission.representative
    ? `${submission.representative.firstName} ${submission.representative.lastName}`.trim()
    : '';

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const logoSize = 18;
  const logoX = MARGIN;
  const logoY = state.y;

  // CWAS logo (top left)
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
  } else {
    pdf.setFillColor(...CWAS_COLOR);
    pdf.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('CWA', logoX + 4, logoY + logoSize / 2 + 1);
  }

  // Title + subtitle left-aligned next to icon
  const titleX = logoX + logoSize + 5;
  const title = isRep ? 'Representative / Dependent Waiver' : 'Passenger Waiver';
  pdf.setTextColor(...DARK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(title, titleX, logoY + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...GRAY);
  pdf.text('Cycling Without Age Society – Sidney', titleX, logoY + 14);

  // Info box (top right) — Raymond Wood style
  const boxW = 56;
  const boxX = PAGE_W - MARGIN - boxW;
  const boxY = state.y;
  const boxH = 18;
  pdf.setDrawColor(...CWAS_COLOR);
  pdf.setLineWidth(0.5);
  pdf.setFillColor(...CWAS_LIGHT);
  pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Waiver ID', boxX + 3, boxY + 5);
  pdf.text('Created', boxX + 3, boxY + 10);
  pdf.text('Expires', boxX + 3, boxY + 15);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(submission.waiverUId ?? '—', boxX + 18, boxY + 5);
  pdf.text(formatDate(submission.submittedAt), boxX + 18, boxY + 10);
  pdf.setTextColor(...CWAS_COLOR);
  pdf.text(formatDate(submission.expiryDate), boxX + 18, boxY + 15);

  state.y += 24;

  // Divider
  pdf.setDrawColor(...LIGHT_GRAY);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, state.y, PAGE_W - MARGIN, state.y);
  state.y += 4;

  // ── CONFIDENTIALITY / APPLICATION AGREEMENT ─────────────────────────────────
  addSectionHeader(state, 'Confidentiality and Application Agreement');

  if (isRep) {
    const introTmpl = REPRESENTATIVE_WAIVER.introduction.template(
      submission.representative?.firstName ?? '',
      submission.representative?.lastName ?? '',
      submission.passenger.firstName,
      submission.passenger.lastName,
      passengerTown,
    );
    addIntroParagraph(state, introTmpl, representativeFullName, passengerTown);
  } else {
    const introTmpl = PASSENGER_WAIVER.introduction.template(
      submission.passenger.firstName,
      submission.passenger.lastName,
      passengerTown,
    );
    addIntroParagraph(state, introTmpl, passengerFullName, '');
  }

  // Handbook link
  checkPageBreak(state, 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...CWAS_COLOR);
  const handbookText = 'View the Passenger Handbook';
  pdf.textWithLink(handbookText, MARGIN, state.y, {
    url: 'https://drive.google.com/file/d/1mpVzTmqHwoPzY3BOmx2VK8RCb_i9YQC-/view?usp=drive_link',
  });
  pdf.setDrawColor(...CWAS_COLOR);
  pdf.setLineWidth(0.25);
  pdf.line(MARGIN, state.y + 1, MARGIN + pdf.getTextWidth(handbookText), state.y + 1);
  state.y += 4;

  // ── WAIVER / INFORMED CONSENT CLAUSES ────────────────────────────────────────
  if (isRep) {
    addSectionHeader(state, REPRESENTATIVE_WAIVER.informedConsentSection.title);
    const identificationClause = REPRESENTATIVE_WAIVER.informedConsentSection.clauses[0](
      submission.passenger.firstName,
      submission.passenger.lastName,
      passengerTown,
    );
    addBulletClause(state, identificationClause);
    for (const clause of REPRESENTATIVE_WAIVER.informedConsentSection.clauses.slice(1, 4) as string[]) {
      addBulletClause(state, clause);
    }
  } else {
    addSectionHeader(state, PASSENGER_WAIVER.waiverSection.title);
    const passengerIdClause = PASSENGER_WAIVER.waiverSection.clauses[0](
      submission.passenger.firstName,
      submission.passenger.lastName,
      passengerTown,
    );
    addBulletClause(state, passengerIdClause);
    for (const clause of PASSENGER_WAIVER.waiverSection.clauses.slice(1) as string[]) {
      addBulletClause(state, clause);
    }
  }

  // ── MEDIA RELEASE ────────────────────────────────────────────────────────────
  const mediaSection = isRep
    ? REPRESENTATIVE_WAIVER.mediaReleaseSection
    : PASSENGER_WAIVER.mediaReleaseSection;

  state.y -= 1; // tighten gap before media release
  addSectionHeader(state, mediaSection.title);
  addParagraph(state, mediaSection.description);

  // Show selected option with checkbox-style indicator
  const selectedOption = submission.mediaRelease;
  checkPageBreak(state, 8);
  // Draw checkbox: outline square + checkmark
  const cbX = MARGIN + 2;
  const cbY = state.y - 3.5;
  const cbS = 3.8;
  pdf.setDrawColor(...DARK);
  pdf.setLineWidth(0.4);
  pdf.rect(cbX, cbY, cbS, cbS);
  // Always draw checkmark — the displayed text already represents the chosen option
  pdf.setLineWidth(0.6);
  pdf.setDrawColor(...CWAS_COLOR);
  pdf.line(cbX + 0.6, cbY + cbS * 0.55, cbX + cbS * 0.42, cbY + cbS - 0.6);
  pdf.line(cbX + cbS * 0.42, cbY + cbS - 0.6, cbX + cbS - 0.4, cbY + 0.5);
  pdf.setTextColor(...DARK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  const optLines = pdf.splitTextToSize(selectedOption, CONTENT_W - 8);
  pdf.text(optLines, MARGIN + 8, state.y);
  state.y += optLines.length * 5.2 + 1.5;

  // ── ACKNOWLEDGMENT ───────────────────────────────────────────────────────────
  checkPageBreak(state, 12);
  const acknowledgment = isRep
    ? REPRESENTATIVE_WAIVER.informedConsentSection.clauses[4]
    : PASSENGER_WAIVER.acknowledgment;

  pdf.setFillColor(...CWAS_LIGHT);
  const ackLines = pdf.splitTextToSize(acknowledgment, CONTENT_W - 8);
  const ackH = ackLines.length * 5.2 + 4;
  pdf.roundedRect(MARGIN, state.y, CONTENT_W, ackH, 2, 2, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...DARK);
  pdf.text(ackLines, MARGIN + 4, state.y + 4);
  state.y += ackH + 2;

  // ── SIGNATURES ───────────────────────────────────────────────────────────────
  addSectionHeader(state, 'Signatures');

  const leftLabel = isRep ? 'Legal Representative Signature' : 'Passenger Signature';
  const leftName = isRep ? representativeFullName : passengerFullName;
  const leftRole = isRep ? `Legal Representative of ${passengerFullName}` : undefined;

  const email = submission.contact?.email ?? '';
  const phone = submission.contact?.phone ?? '';
  const contactParts = [email, phone].filter(Boolean);
  const leftContact = contactParts.length ? contactParts.join('  |  ') : undefined;

  addSignatureBlock(
    state,
    leftLabel,
    leftName,
    leftRole,
    leftContact,
    submission.signatures.passenger.imageUrl || undefined,
    submission.signatures.passenger.timestamp
      ? formatTimestamp(submission.signatures.passenger.timestamp)
      : undefined,
    'Witness',
    submission.signatures.witness.name,
    submission.signatures.witness.imageUrl,
    submission.signatures.witness.timestamp
      ? formatTimestamp(submission.signatures.witness.timestamp)
      : undefined,
  );

  // ── FOOTER (all pages) ───────────────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(...LIGHT_GRAY);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, 348, PAGE_W - MARGIN, 348);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...GRAY);
    const version = isRep ? 'CWAS-REP-v1.0' : 'CWAS-PAS-v1.0';
    pdf.text(version, MARGIN, 352);
    pdf.text(formatDate(submission.submittedAt), PAGE_W / 2, 352, { align: 'center' });
    pdf.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN, 352, { align: 'right' });
  }

  return pdf;
}

export async function downloadWaiverPDF(submission: WaiverSubmission): Promise<void> {
  const pdf = await generateWaiverPDF(submission);
  const filename = `${submission.waiverUId ?? 'waiver'}.pdf`;
  pdf.save(filename);
}
