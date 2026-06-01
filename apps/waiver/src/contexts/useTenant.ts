import { useContext } from 'react';
import { TenantContext } from './TenantContext';

export function useTenant() {
  return useContext(TenantContext);
}
