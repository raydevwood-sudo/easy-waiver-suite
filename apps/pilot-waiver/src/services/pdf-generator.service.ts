import { jsPDF } from 'jspdf';
import type { WaiverSubmission } from '../types';
import { PILOT_WAIVER } from '../config/waiver-templates';

const CWAS_COLOR: [number, number, number] = [5, 173, 238];
const DARK: [number, number, number] = [30, 41, 59];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT_GRAY: [number, number, number] = [226, 232, 240];
const CWAS_LIGHT: [number, number, number] = [230, 247, 253];

const PAGE_W = 216;
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

function addIntroParagraph(state: DocState, introText: string, boldName: string, boldTown: string) {
  checkPageBreak(state, 14);
  state.pdf.setFontSize(9.5);
  const lines = state.pdf.splitTextToSize(introText, CONTENT_W);
  let startY = state.y;
  for (const line of lines) {
    const hasBoldName = boldName && line.includes(boldName);
    const hasBoldTown = boldTown && line.includes(boldTown);
    if (!hasBoldName && !hasBoldTown) {
      state.pdf.setFont('helvetica', 'normal');
      state.pdf.text(line, MARGIN, startY);
    } else {
      let remaining = line;
      let x = MARGIN;
      const boldWords = [boldName, boldTown].filter(Boolean);
      while (remaining) {
        let earliest = remaining.length;
        let found = '';
        for (const bw of boldWords) {
          const idx = remaining.indexOf(bw);
          if (idx !== -1 && idx < earliest) { earliest = idx; found = bw; }
        }
        if (!found) { state.pdf.setFont('helvetica', 'normal'); state.pdf.text(remaining, x, startY); break; }
        if (earliest > 0) { state.pdf.setFont('helvetica', 'normal'); const pre = remaining.slice(0, earliest); state.pdf.text(pre, x, startY); x += state.pdf.getTextWidth(pre); }
        state.pdf.setFont('helvetica', 'bold'); state.pdf.text(found, x, startY); x += state.pdf.getTextWidth(found);
        remaining = remaining.slice(earliest + found.length);
      }
    }
    startY += 5.2;
  }
  state.y = startY + 1.5;
}

function formatTimestamp(ts: string | number | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-CA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDate(isoStr: string | undefined): string {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('en-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
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

  const pilotFullName = `${submission.pilot.firstName} ${submission.pilot.lastName}`.trim();
  const pilotTown = submission.pilot.town;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const logoSize = 18;
  const logoX = MARGIN;
  const logoY = state.y;

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

  const titleX = logoX + logoSize + 5;
  pdf.setTextColor(...DARK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('Pilot / Volunteer Waiver', titleX, logoY + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...GRAY);
  pdf.text('Cycling Without Age Society – Sidney', titleX, logoY + 14);

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
  pdf.setTextColor(...DARK);
  pdf.text(submission.waiverUId ?? '—', boxX + 18, boxY + 5);
  pdf.text(formatDate(submission.submittedAt), boxX + 18, boxY + 10);
  pdf.setTextColor(...CWAS_COLOR);
  pdf.text(formatDate(submission.expiryDate), boxX + 18, boxY + 15);

  state.y += 24;

  pdf.setDrawColor(...LIGHT_GRAY);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, state.y, PAGE_W - MARGIN, state.y);
  state.y += 4;

  // ── PILOT INFO ───────────────────────────────────────────────────────────────
  addSectionHeader(state, 'Pilot / Volunteer Information');

  const infoY = state.y;
  const col1 = MARGIN;
  const col2 = MARGIN + CONTENT_W / 2;

  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Full Name', col1, infoY);
  pdf.text('Town / City', col2, infoY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...DARK);
  pdf.text(pilotFullName, col1, infoY + 5);
  pdf.text(pilotTown, col2, infoY + 5);

  state.y = infoY + 12;
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Email', col1, state.y);
  pdf.text('Phone', col2, state.y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...DARK);
  pdf.text(submission.contact.email, col1, state.y + 5);
  pdf.text(submission.contact.phone || '—', col2, state.y + 5);
  state.y += 14;

  // ── INTRODUCTION ─────────────────────────────────────────────────────────────
  addSectionHeader(state, 'Confidentiality and Application Agreement');
  const introText = PILOT_WAIVER.introduction.template(
    submission.pilot.firstName,
    submission.pilot.lastName,
    pilotTown,
  );
  addIntroParagraph(state, introText, pilotFullName, pilotTown);

  // ── WAIVER CLAUSES ───────────────────────────────────────────────────────────
  addSectionHeader(state, 'Terms and Conditions');
  for (const clause of PILOT_WAIVER.waiverSection.clauses) {
    addBulletClause(state, clause);
  }

  // ── MEDIA RELEASE ────────────────────────────────────────────────────────────
  addSectionHeader(state, 'Media Release');
  addParagraph(state, submission.mediaRelease ?? PILOT_WAIVER.mediaReleaseSection.options.noConsent);

  // ── ACKNOWLEDGMENT ───────────────────────────────────────────────────────────
  addSectionHeader(state, 'Acknowledgment');
  addParagraph(state, PILOT_WAIVER.acknowledgment);

  // ── SIGNATURE — two columns: pilot + witness ─────────────────────────────────
  checkPageBreak(state, 60);
  addSectionHeader(state, 'Signatures');

  const colW = (CONTENT_W - 6) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + 6;

  // Labels
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...DARK);
  pdf.text('Pilot Signature', leftX, state.y);
  pdf.text('Witness', rightX, state.y);
  state.y += 5;

  // Names
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...GRAY);
  pdf.text(pilotFullName, leftX, state.y);
  const witnessName = submission.signatures?.witness?.name ?? '';
  pdf.text(witnessName, rightX, state.y);
  state.y += 8;

  // Signature images
  const sigH = 15;
  pdf.setDrawColor(...LIGHT_GRAY);
  pdf.setLineWidth(0.3);

  const pilotImgUrl = submission.signatures?.pilot?.imageUrl;
  if (pilotImgUrl) {
    pdf.addImage(pilotImgUrl, 'PNG', leftX, state.y, colW, sigH);
  } else {
    pdf.rect(leftX, state.y, colW, sigH);
  }

  const witnessImgUrl = submission.signatures?.witness?.imageUrl;
  if (witnessImgUrl) {
    pdf.addImage(witnessImgUrl, 'PNG', rightX, state.y, colW, sigH);
  } else {
    pdf.rect(rightX, state.y, colW, sigH);
  }
  state.y += sigH + 2;

  // Timestamps
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(...GRAY);
  const pilotTs = submission.signatures?.pilot?.timestamp;
  const witnessTs = submission.signatures?.witness?.timestamp;
  if (pilotTs) pdf.text(`Signed: ${formatTimestamp(pilotTs)}`, leftX, state.y);
  if (witnessTs) pdf.text(`Signed: ${formatTimestamp(witnessTs)}`, rightX, state.y);
  state.y += 7;

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const totalPages = state.pageNum;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...GRAY);
    pdf.text(
      `Cycling Without Age Society – Sidney  |  Pilot Waiver  |  Page ${i} of ${totalPages}`,
      PAGE_W / 2,
      354,
      { align: 'center' },
    );
  }

  return pdf;
}

export async function downloadWaiverPDF(submission: WaiverSubmission): Promise<void> {
  const pdf = await generateWaiverPDF(submission);
  const firstName = submission.pilot.firstName ?? 'pilot';
  const lastName = submission.pilot.lastName ?? 'waiver';
  pdf.save(`${firstName}-${lastName}-pilot-waiver.pdf`);
}
