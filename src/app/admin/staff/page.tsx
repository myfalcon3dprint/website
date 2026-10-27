'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { StaffRole, StaffUser, StaffInvitation } from '@/lib/types';
import { 
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert, 
  Trash2, Mail, Clock, CheckCircle2, AlertCircle, 
  ChevronRight, Copy, Check, RefreshCw, KeyRound, 
  Settings2, HelpCircle, X
} from 'lucide-react';

interface RoleDefinition {
  id: StaffRole;
  title: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  permissions: {
    orders: string;
    catalog: string;
    production: string;
    customers: string;
    finances: string;
    admin: string;
  };
}

const ROLES_INFO: RoleDefinition[] = [
  {
    id: 'owner',
    title: 'Studio Owner',
    badgeColor: '#B45309',
    badgeBg: '#FEF3C7',
    description: 'Full administrative authority across all studio operations, financial reconciliations, staff permissions, and store settings.',
    permissions: {
      orders: 'Full edit, item corrections & cancellations',
      catalog: 'Full create, edit, pricing & archiving',
      production: 'Full queue, equipment & reprint control',
      customers: 'Full CRM notes, histories & data exports',
      finances: 'Payment verification, refunds & ledger audits',
      admin: 'Staff invitations, role controls & system settings',
    },
  },
  {
    id: 'order_manager',
    title: 'Order Manager',
    badgeColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    description: 'Oversees customer orders, shipping dispatch, address corrections, and courier tracking updates.',
    permissions: {
      orders: 'Status updates, address corrections, shipping slips',
      catalog: 'Read-only catalog viewing',
      production: 'View-only queue coordination',
      customers: 'Customer history & internal order notes',
      finances: 'View payments & outstanding COD dues',
      admin: 'No staff or system settings access',
    },
  },
  {
    id: 'production_operator',
    title: 'Production Operator',
    badgeColor: '#047857',
    badgeBg: '#D1FAE5',
    description: 'Runs workshop 3D printers, manages print jobs, conducts quality control checks, and reports reprints.',
    permissions: {
      orders: 'View production-linked order line items',
      catalog: 'View filament, resin & variant specifications',
      production: 'Claim jobs, pass/fail QC, defect reporting, reprints',
      customers: 'No customer contact info access',
      finances: 'No financial access',
      admin: 'No administrative access',
    },
  },
  {
    id: 'catalog_editor',
    title: 'Catalog Editor',
    badgeColor: '#6D28D9',
    badgeBg: '#EDE9FE',
    description: 'Manages products, variants, studio photography, video reels, categories, and homepage showcases.',
    permissions: {
      orders: 'No order access',
      catalog: 'Add/edit products, stock adjustments, categories, media',
      production: 'No production access',
      customers: 'No customer personal info access',
      finances: 'Set product base prices & variant adjustments',
      admin: 'Homepage banners, slides & appearance controls',
    },
  },
  {
    id: 'support',
    title: 'Customer Support',
    badgeColor: '#BE185D',
    badgeBg: '#FCE7F3',
    description: 'Handles incoming customer messages, custom CAD print inquiries, review moderation, and email previews.',
    permissions: {
      orders: 'View order delivery status to assist customers',
      catalog: 'Search products & variant specs for inquiries',
      production: 'Check estimated lead times for quotes',
      customers: 'Respond to tickets, bulk inquiries, review approvals',
      finances: 'View payment status indicators',
      admin: 'Preview email templates (cannot send live emails)',
    },
  },
];

export default function AdminStaffPage() {
  const { user, profile } = useAuthUser();
  const currentRole = profile?.role || 'customer';
  const isOwner = currentRole === 'owner';

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'matrix'>('members');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('production_operator');
  const [inviteDays, setInviteDays] = useState(7);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Change Role Modal
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<StaffRole>('order_manager');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Remove Staff Modal
  const [removingStaff, setRemovingStaff] = useState<StaffUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Link copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStaffData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch staff directory');

      setStaffList(data.staff || []);
      setInvitations(data.invitations || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching staff records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setErrorMsg('Please enter a valid staff email address.');
      return;
    }

    setIsSubmittingInvite(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/staff/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          expiresInDays: inviteDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue staff invitation');

      setSuccessMsg(data.message || `Invitation successfully sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('production_operator');
      fetchStaffData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRoleChangeSubmit = async () => {
    if (!editingStaff) return;
    setIsUpdatingRole(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingStaff.id,
          role: newSelectedRole,
          reason: roleChangeReason.trim() || 'Role permission tier updated by owner',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update staff role');

      setSuccessMsg(`Role for ${editingStaff.name} updated to ${newSelectedRole}.`);
      setEditingStaff(null);
      setRoleChangeReason('');
      fetchStaffData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRemoveStaff = async () => {
    if (!removingStaff) return;
    setIsRemoving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/staff?userId=${encodeURIComponent(removingStaff.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke staff access');

      setSuccessMsg(`Staff privileges revoked for ${removingStaff.name}.`);
      setRemovingStaff(null);
      fetchStaffData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove staff');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRevokeInvitation = async (email: string) => {
    if (!confirm(`Are you sure you want to cancel the pending invitation for ${email}?`)) return;

    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/staff/invitations?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke invitation');

      setSuccessMsg(`Invitation for ${email} has been revoked.`);
      fetchStaffData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const copyInviteLink = (email: string, id: string) => {
    const inviteUrl = `${window.location.origin}/auth/accept-invite?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered lists
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeInvitations = invitations.filter((i) => i.status === 'pending');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#F59E0B' }}>
              <Users size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
              Staff & Permissions
            </h1>
          </div>
          <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem' }}>
            Manage studio team access, role-based capabilities, and secure staff invitations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchStaffData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: '#FFFFFF',
              border: '1px solid #64748B',
              borderRadius: '8px',
              color: '#0F172A',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {isOwner && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: '#C2410C',
                border: '1px solid #C2410C',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(194, 65, 12, 0.2)',
              }}
            >
              <UserPlus size={16} />
              Invite Staff Member
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div style={{
          padding: '1rem',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          color: '#B91C1C',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '1rem',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '8px',
          color: '#047857',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'members' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'members' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Active Team Members ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'invitations' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'invitations' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Pending Invitations
          {activeInvitations.length > 0 && (
            <span style={{
              background: '#FEF3C7',
              color: '#B45309',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.125rem 0.5rem',
              borderRadius: '999px',
            }}>
              {activeInvitations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'matrix' ? '2px solid #C2410C' : '2px solid transparent',
            color: activeTab === 'matrix' ? '#C2410C' : '#475569',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Permissions Matrix
        </button>
      </div>

      {/* Tab 1: Active Team Members */}
      {activeTab === 'members' && (
        <div>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: '260px',
                padding: '0.625rem 1rem',
                background: '#FFFFFF',
                border: '1px solid #64748B',
                borderRadius: '8px',
                color: '#0F172A',
                fontSize: '0.875rem',
              }}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                background: '#FFFFFF',
                border: '1px solid #64748B',
                borderRadius: '8px',
                color: '#0F172A',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Roles</option>
              <option value="owner">Studio Owner</option>
              <option value="order_manager">Order Manager</option>
              <option value="production_operator">Production Operator</option>
              <option value="catalog_editor">Catalog Editor</option>
              <option value="support">Customer Support</option>
            </select>
          </div>

          {/* Members Table */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Staff Member</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Assigned Role</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Primary Responsibilities</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => {
                  const roleMeta = ROLES_INFO.find((r) => r.id === staff.role) || ROLES_INFO[0];
                  const isCurrentProfile = staff.id === profile?.id || staff.email === user?.email;

                  return (
                    <tr key={staff.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: roleMeta.badgeBg,
                            color: roleMeta.badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                          }}>
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {staff.name}
                              {isCurrentProfile && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  background: '#FFF7ED',
                                  color: '#9A3412',
                                  fontWeight: 700,
                                }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ color: '#475569', fontSize: '0.8rem' }}>{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '6px',
                          background: roleMeta.badgeBg,
                          color: roleMeta.badgeColor,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}>
                          <Shield size={12} />
                          {roleMeta.title}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#475569', maxWidth: '380px' }}>
                        <span style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                          {roleMeta.description}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {isOwner ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setNewSelectedRole(staff.role);
                              }}
                              style={{
                                padding: '0.4rem 0.75rem',
                                background: '#FFFFFF',
                                border: '1px solid #64748B',
                                borderRadius: '6px',
                                color: '#0F172A',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Edit Role
                            </button>

                            <button
                              onClick={() => setRemovingStaff(staff)}
                              disabled={isCurrentProfile}
                              title={isCurrentProfile ? 'Cannot remove your own active owner account' : 'Revoke staff access'}
                              style={{
                                padding: '0.4rem 0.6rem',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                color: isCurrentProfile ? '#94A3B8' : '#DC2626',
                                fontSize: '0.8rem',
                                cursor: isCurrentProfile ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Owner Controlled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Invitations */}
      {activeTab === 'invitations' && (
        <div>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Invited Email</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Invited Role</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Expires At</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const roleMeta = ROLES_INFO.find((r) => r.id === inv.role) || ROLES_INFO[0];
                  const isExpired = new Date(inv.expiresAt).getTime() < Date.now();

                  return (
                    <tr key={inv.id || inv.email} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{inv.email}</div>
                        {inv.invitedByName && (
                          <div style={{ fontSize: '0.75rem', color: '#475569' }}>By {inv.invitedByName}</div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '6px',
                          background: roleMeta.badgeBg,
                          color: roleMeta.badgeColor,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}>
                          {roleMeta.title}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        {inv.status === 'pending' && !isExpired && (
                          <span style={{ color: '#B45309', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={14} /> Pending
                          </span>
                        )}
                        {inv.status === 'revoked' && (
                          <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.8rem' }}>Revoked</span>
                        )}
                        {(inv.status === 'expired' || isExpired) && inv.status !== 'revoked' && (
                          <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>Expired</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#475569', fontSize: '0.8rem' }}>
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {inv.status === 'pending' && !isExpired && isOwner && (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => copyInviteLink(inv.email, inv.id)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                background: '#FFFFFF',
                                border: '1px solid #64748B',
                                borderRadius: '6px',
                                color: '#0F172A',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              {copiedId === inv.id ? <Check size={14} color="#047857" /> : <Copy size={14} />}
                              {copiedId === inv.id ? 'Copied' : 'Copy Link'}
                            </button>

                            <button
                              onClick={() => handleRevokeInvitation(inv.email)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                color: '#DC2626',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Revoke
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No active or past staff invitations on record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Orders & Fulfillment</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Products & Storefront</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Production & QC</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Customer CRM</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Finance & Settings</th>
              </tr>
            </thead>
            <tbody>
              {ROLES_INFO.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: r.badgeColor, marginBottom: '0.25rem' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', maxWidth: '160px' }}>{r.description}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', color: '#0F172A', fontSize: '0.8rem' }}>{r.permissions.orders}</td>
                  <td style={{ padding: '1.25rem 1rem', color: '#0F172A', fontSize: '0.8rem' }}>{r.permissions.catalog}</td>
                  <td style={{ padding: '1.25rem 1rem', color: '#0F172A', fontSize: '0.8rem' }}>{r.permissions.production}</td>
                  <td style={{ padding: '1.25rem 1rem', color: '#0F172A', fontSize: '0.8rem' }}>{r.permissions.customers}</td>
                  <td style={{ padding: '1.25rem 1rem', color: '#0F172A', fontSize: '0.8rem' }}>
                    <div>{r.permissions.finances}</div>
                    <div style={{ marginTop: '0.25rem', color: '#475569' }}>{r.permissions.admin}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#C2410C" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Invite Staff Member
                </h2>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@falcon3dprints.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#FFFFFF',
                    border: '1px solid #64748B',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                  Assign Role & Capabilities
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#FFFFFF',
                    border: '1px solid #64748B',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="production_operator">Production Operator (Workshop & QC)</option>
                  <option value="order_manager">Order Manager (Orders & Dispatch)</option>
                  <option value="catalog_editor">Catalog Editor (Storefront & Inventory)</option>
                  <option value="support">Customer Support (Inquiries & Reviews)</option>
                  <option value="owner">Studio Owner (Full Privileges)</option>
                </select>

                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#475569',
                }}>
                  {ROLES_INFO.find((r) => r.id === inviteRole)?.description}
                </div>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                  Invitation Expiration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={inviteDays}
                  onChange={(e) => setInviteDays(parseInt(e.target.value, 10) || 7)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#FFFFFF',
                    border: '1px solid #64748B',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  Default is 7 days. If not accepted before expiration, the token is automatically invalidated.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: '#FFFFFF',
                    border: '1px solid #64748B',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#C2410C',
                    border: '1px solid #C2410C',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: isSubmittingInvite ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmittingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingStaff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#0F172A' }}>
              Modify Role: {editingStaff.name}
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Select New Role
              </label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as StaffRole)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="owner">Studio Owner</option>
                <option value="order_manager">Order Manager</option>
                <option value="production_operator">Production Operator</option>
                <option value="catalog_editor">Catalog Editor</option>
                <option value="support">Customer Support</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Reason for Change (Audit Logged)
              </label>
              <input
                type="text"
                placeholder="e.g. Promoted to Lead Order Manager"
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeSubmit}
                disabled={isUpdatingRole}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#C2410C',
                  border: '1px solid #C2410C',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: isUpdatingRole ? 'not-allowed' : 'pointer',
                }}
              >
                {isUpdatingRole ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Staff Modal */}
      {removingStaff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#DC2626', marginBottom: '1rem' }}>
              <ShieldAlert size={28} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Revoke Staff Access
              </h3>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Are you sure you want to revoke staff privileges for <strong style={{ color: '#0F172A' }}>{removingStaff.name}</strong> ({removingStaff.email})? 
              They will immediately lose access to all admin tools and their account will revert to a standard customer profile.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRemovingStaff(null)}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#FFFFFF',
                  border: '1px solid #64748B',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveStaff}
                disabled={isRemoving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#DC2626',
                  border: '1px solid #DC2626',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: isRemoving ? 'not-allowed' : 'pointer',
                }}
              >
                {isRemoving ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
