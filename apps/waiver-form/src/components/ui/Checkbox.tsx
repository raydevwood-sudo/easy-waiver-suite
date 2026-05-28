import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-3 cursor-pointer group ${className}`}
    >
      <input
        type="checkbox"
        id={inputId}
        {...props}
        className="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
      />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-5">
        {label}
      </span>
    </label>
  );
}
