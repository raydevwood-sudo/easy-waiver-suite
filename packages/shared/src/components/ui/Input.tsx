import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        {...props}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm shadow-inner-soft
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
