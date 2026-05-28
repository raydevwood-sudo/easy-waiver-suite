import Input from '../../ui/Input';
import type { FormPageProps } from './types';

type PersonalInfoPageProps = Pick<FormPageProps, 'formData' | 'onInputChange'> & {
  lockedFields?: Set<keyof import('./types').LocalFormData>;
};

function LockedBadge() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded px-1.5 py-0.5">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      from your account
    </span>
  );
}

export default function PersonalInfoPage({ formData, onInputChange, lockedFields }: PersonalInfoPageProps) {
  const locked = lockedFields ?? new Set();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pilot / Volunteer Information</h2>
        <p className="text-sm text-gray-500">Please review and complete your details</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          {locked.has('firstName') && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <LockedBadge />
            </label>
          )}
          <Input
            label={locked.has('firstName') ? undefined : 'First Name'}
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            autoComplete="given-name"
            required
            readOnly={locked.has('firstName')}
            className={locked.has('firstName') ? 'bg-gray-50 text-gray-700 cursor-default' : undefined}
          />
        </div>
        <div>
          {locked.has('lastName') && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <LockedBadge />
            </label>
          )}
          <Input
            label={locked.has('lastName') ? undefined : 'Last Name'}
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            autoComplete="family-name"
            required
            readOnly={locked.has('lastName')}
            className={locked.has('lastName') ? 'bg-gray-50 text-gray-700 cursor-default' : undefined}
          />
        </div>
      </div>

      <Input
        label="Town / City"
        id="town"
        value={formData.town}
        onChange={(e) => onInputChange('town', e.target.value)}
        autoComplete="address-level2"
        required
      />

      <div>
        {locked.has('email') && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <LockedBadge />
          </label>
        )}
        <Input
          label={locked.has('email') ? undefined : 'Email Address'}
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          autoComplete="email"
          required
          readOnly={locked.has('email')}
          className={locked.has('email') ? 'bg-gray-50 text-gray-700 cursor-default' : undefined}
        />
      </div>

      <div>
        {locked.has('phone') && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <LockedBadge />
          </label>
        )}
        <Input
          label={locked.has('phone') ? undefined : 'Phone Number'}
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
          autoComplete="tel"
          required
          readOnly={locked.has('phone')}
          className={locked.has('phone') ? 'bg-gray-50 text-gray-700 cursor-default' : undefined}
        />
      </div>
    </div>
  );
}
