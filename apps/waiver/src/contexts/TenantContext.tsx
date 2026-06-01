import { createContext, useEffect, type ReactNode } from 'react';
import { orgConfig } from '@easy-waiver/config';
import { STATIC_FORMS } from '../config/forms';
import type { TenantConfig, FormSummary } from '../types';

const tenant: TenantConfig = {
  id: 'cwas',
  slug: 'cwas',
  name: orgConfig.orgName,
  shortName: orgConfig.orgShortName,
  brandColor: orgConfig.brandColor,
  logoPath: null,
  waiverValidityDays: orgConfig.waiverValidityDays,
};

interface TenantContextValue {
  tenant: TenantConfig;
  forms: FormSummary[];
  loading: boolean;
  error: string | null;
}

export const TenantContext = createContext<TenantContextValue>({
  tenant,
  forms: STATIC_FORMS,
  loading: false,
  error: null,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand', tenant.brandColor);
    document.title = `${tenant.name} — Waiver`;
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, forms: STATIC_FORMS, loading: false, error: null }}>
      {children}
    </TenantContext.Provider>
  );
}
