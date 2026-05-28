import type { ReactNode } from 'react';

/**
 * Renders `text` as a React node with every occurrence of each string in
 * `boldTargets` wrapped in a <strong> element.
 */
export function renderBoldText(text: string, boldTargets: string[]): ReactNode {
  const parts: { text: string; bold: boolean }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest = remaining.length;
    let found = '';
    for (const target of boldTargets) {
      if (!target) continue;
      const idx = remaining.indexOf(target);
      if (idx !== -1 && idx < earliest) {
        earliest = idx;
        found = target;
      }
    }
    if (!found) {
      parts.push({ text: remaining, bold: false });
      break;
    }
    if (earliest > 0) parts.push({ text: remaining.slice(0, earliest), bold: false });
    parts.push({ text: found, bold: true });
    remaining = remaining.slice(earliest + found.length);
  }

  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-semibold text-gray-900">
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
