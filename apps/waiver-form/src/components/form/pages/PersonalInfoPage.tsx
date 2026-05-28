import { useState } from 'react';
import Input from '../../ui/Input';
import type { FormPageProps } from './types';

type PersonalInfoPageProps = Pick<FormPageProps, 'formData' | 'waiverType' | 'onInputChange'>;

export default function PersonalInfoPage({
  formData,
  waiverType,
  onInputChange,
}: PersonalInfoPageProps) {
  const isRepresentative = waiverType === 'representative';
  const [showYobInfo, setShowYobInfo] = useState(false);
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 120;
  const maxYear = currentYear;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Passenger Information</h2>
        <p className="text-sm text-gray-500">Please provide the passenger's details</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          autoComplete="given-name"
          required
        />
        <Input
          label="Last Name"
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          autoComplete="family-name"
          required
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="yearOfBirth" className="block text-sm font-medium text-gray-700">
            Year of Birth
          </label>
          <button
            type="button"
            onClick={() => setShowYobInfo((v) => !v)}
            aria-label="Why do we need this?"
            className="text-gray-400 hover:text-brand-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 8h.01M12 12v4" />
            </svg>
          </button>
          <span className="text-xs text-gray-500 italic">Why do we need this?</span>
        </div>
        {showYobInfo && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
            Your year of birth helps us verify your waiver when you book a future ride and contributes to anonymous ridership statistics. It is never shared publicly.
          </p>
        )}
        <input
          id="yearOfBirth"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={formData.yearOfBirth}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (raw.length === 4) {
              const num = Number(raw);
              if (num < minYear) { onInputChange('yearOfBirth', String(minYear)); return; }
              if (num > maxYear) { onInputChange('yearOfBirth', String(maxYear)); return; }
            }
            onInputChange('yearOfBirth', raw);
          }}
          placeholder="e.g. 1955"
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-inner-soft placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        <p className="mt-1 text-xs text-gray-400">Enter a year between {minYear} and {maxYear}</p>
      </div>

      <Input
        label="Town / City"
        id="town"
        value={formData.town}
        onChange={(e) => onInputChange('town', e.target.value)}
        autoComplete="address-level2"
        required
      />

      {!isRepresentative && (
        <>
          <Input
            label="Email Address"
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            autoComplete="tel"
            required
          />
        </>
      )}

      {isRepresentative && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Legal Representative Information
            </h3>
            <p className="text-sm text-gray-500">
              Provide your name and contact details as the Legal Guardian or Power of Attorney
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Representative First Name"
              id="representativeFirstName"
              value={formData.representativeFirstName}
              onChange={(e) => onInputChange('representativeFirstName', e.target.value)}
              autoComplete="given-name"
              required
            />
            <Input
              label="Representative Last Name"
              id="representativeLastName"
              value={formData.representativeLastName}
              onChange={(e) => onInputChange('representativeLastName', e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
          <Input
            label="Representative Email Address"
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Representative Phone Number"
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            autoComplete="tel"
            required
          />
        </div>
      )}
    </div>
  );
}
