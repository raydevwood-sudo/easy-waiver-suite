import { useState } from 'react';
import Input from '@easy-waiver/shared/components/ui/Input';
import type { WaiverFormData, WaiverType } from '../../../types';

interface PersonalInfoPageProps {
  formData: WaiverFormData;
  waiverType: WaiverType;
  onChange: (field: keyof WaiverFormData, value: string) => void;
}

export default function PersonalInfoPage({ formData, waiverType, onChange }: PersonalInfoPageProps) {
  const isRep = waiverType === 'representative';
  const [showDobInfo, setShowDobInfo] = useState(false);

  return (
    <div className="space-y-6">
      {/* Participant section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          {isRep ? 'Participant Information' : 'Your Information'}
        </h2>
        <p className="text-sm text-gray-500">
          {isRep
            ? 'Please provide the details of the person participating.'
            : 'Please provide your details.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          autoComplete="given-name"
          required
        />
        <Input
          label="Last Name"
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          autoComplete="family-name"
          required
        />
      </div>

      {/* Date of Birth */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
            Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowDobInfo((v) => !v)}
            aria-label="Why do we need this?"
            className="text-gray-400 hover:text-brand-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 8h.01M12 12v4" />
            </svg>
          </button>
        </div>
        {showDobInfo && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
            Date of birth helps us verify your record when you participate in future events.
            It is never shared publicly and is stored securely on Canadian servers.
          </p>
        )}
        <input
          id="dateOfBirth"
          type="date"
          max={new Date().toISOString().split('T')[0]}
          min={`${new Date().getFullYear() - 120}-01-01`}
          value={formData.dateOfBirth}
          onChange={(e) => onChange('dateOfBirth', e.target.value)}
          className="block w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      <Input
        label="City / Town"
        id="town"
        value={formData.town}
        onChange={(e) => onChange('town', e.target.value)}
        autoComplete="address-level2"
        required
      />

      {/* Legal representative section */}
      {isRep && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Representative Information</h3>
            <p className="text-sm text-gray-500">Your details as legal guardian or power of attorney.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Representative First Name"
              id="repFirstName"
              value={formData.repFirstName}
              onChange={(e) => onChange('repFirstName', e.target.value)}
              autoComplete="given-name"
              required
            />
            <Input
              label="Representative Last Name"
              id="repLastName"
              value={formData.repLastName}
              onChange={(e) => onChange('repLastName', e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            autoComplete="tel"
            required
          />
        </div>
      </div>
    </div>
  );
}
