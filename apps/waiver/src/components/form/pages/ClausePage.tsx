import Checkbox from '@easy-waiver/shared/components/ui/Checkbox';
import type { AgreementClause } from '../../../types';

/**
 * Generic clause page — renders one or more agreement clauses from FormConfig.
 * Each clause maps to a checkbox in formData.agreements[clause.id].
 */
interface ClausePageProps {
  sectionTitle: string;
  sectionDescription?: string;
  clauses: AgreementClause[];
  agreements: Record<string, boolean>;
  // Interpolation values — injected into clause text where {firstName} etc. appear
  interpolation?: Record<string, string>;
  onChange: (clauseId: string, agreed: boolean) => void;
}

/** Replace {key} tokens in clause text with interpolation values */
function interpolate(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `[${key}]`);
}

/** Render **bold** shorthand as <strong> */
function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function ClausePage({
  sectionTitle,
  sectionDescription,
  clauses,
  agreements,
  interpolation = {},
  onChange,
}: ClausePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{sectionTitle}</h2>
        {sectionDescription && (
          <p className="text-sm text-gray-500">{sectionDescription}</p>
        )}
      </div>

      <p className="text-xs text-gray-400 italic">Please read and check each item to continue.</p>

      <div className="space-y-5">
        {clauses.map((clause) => {
          const text = interpolate(clause.text, interpolation);
          return (
            <div key={clause.id} className="space-y-2">
              <p className="text-sm leading-relaxed text-gray-700">{renderText(text)}</p>
              <Checkbox
                id={clause.id}
                name={clause.id}
                label="I agree"
                checked={agreements[clause.id] ?? false}
                onChange={(e) => onChange(clause.id, e.target.checked)}
                required={clause.required}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
