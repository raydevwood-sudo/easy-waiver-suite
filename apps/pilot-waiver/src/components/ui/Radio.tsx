import type { InputHTMLAttributes } from 'react';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export default function Radio({ label, description, id, className = '', ...props }: RadioProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      htmlFor={inputId}
      className={`
        flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
        ${props.checked
          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30'
          : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50'
        }
        ${className}
      `}
    >
      <input
        type="radio"
        id={inputId}
        {...props}
        className="mt-0.5 h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
      />
      <div>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
        )}
      </div>
    </label>
  );
}
