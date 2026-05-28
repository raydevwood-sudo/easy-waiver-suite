import Checkbox from '../../ui/Checkbox';
import type { FormPageProps, LocalFormData } from './types';
import { PILOT_WAIVER } from '../../../config/waiver-templates';

interface WaiverClausePageProps extends Pick<FormPageProps, 'formData' | 'onInputChange'> {
  clauseIndex: number; // 0-based index into PILOT_WAIVER.waiverSection.clauses
  fieldName: keyof LocalFormData; // e.g. 'waiver2'
}

export default function WaiverClausePage({
  formData,
  onInputChange,
  clauseIndex,
  fieldName,
}: WaiverClausePageProps) {
  const clauses = PILOT_WAIVER.waiverSection.clauses;
  const clause = clauses[clauseIndex];
  const isLast = clauseIndex === clauses.length - 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {PILOT_WAIVER.waiverSection.title}
        </h2>
        <p className="text-sm text-gray-500">
          Clause {clauseIndex + 1} of {clauses.length}
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <p className="text-gray-800 leading-relaxed">{clause}</p>
      </div>

      <Checkbox
        id={fieldName}
        checked={formData[fieldName] as boolean}
        onChange={(e) => onInputChange(fieldName, e.target.checked)}
        required
        label={
          isLast
            ? 'I have read and agree to the above clause'
            : 'I have read and agree to the above clause'
        }
      />
    </div>
  );
}
