'use client';

import React, { createContext, useContext } from 'react';
import { StaffRole } from '@/lib/rbac';

export interface AdminRoleContextValue {
  effectiveRole: StaffRole;
  actualRole: StaffRole;
  isPreviewMode: boolean;
  canMutate: boolean;
}

export const AdminRoleContext = createContext<AdminRoleContextValue>({
  effectiveRole: 'owner',
  actualRole: 'owner',
  isPreviewMode: false,
  canMutate: true,
});

export const useAdminRole = () => useContext(AdminRoleContext);
