import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { StatusPill } from '../shared/StatusPill';
import { IconKey, IconShield, IconCheck, IconSearch } from '../shared/Icons';
import { IT_ADMIN_ROLE_PERMISSIONS } from '../../data/accessMatrix';

export function AccessMfaSubDashboard({ onBack }) {
  const {
    mfaPolicies,
    updateMfaPolicy,
    pendingRequests,
    approveAccessRequest,
    rejectAccessRequest,
    navigate,
    hasPermission
  } = useStore();
  const canReadSecurity = hasPermission('Security', 'read');
  const canUpdateSecurity = hasPermission('Security', 'update');

  const [permissionFilter, setPermissionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPermissions = IT_ADMIN_ROLE_PERMISSIONS.filter(p => {
    const matchFilter = permissionFilter === 'All' || p.permission === permissionFilter;
    const matchSearch = p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (!canReadSecurity) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Access Governance Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Security: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in-50 duration-200">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[var(--radius)] bg-surface border border-line">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1 text-[12px] rounded-full bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition-colors"
            >
              ← Back to Overview
            </button>
          )}
          <div>
            <h2 className="font-display font-bold text-[18px] text-ink leading-tight">
              Access Governance & Role-Based Permissions Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Role-based access control (RBAC), administrative permissions matrix, MFA policies, and approval workflows
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate('access')}
          ariaLabel="Open Full Matrix"
        >
          Open Matrix View
        </Button>
      </div>

      {/* 1. ROLE-BASED PERMISSIONS TABLE (4. Role-Based Permissions from Specification) */}
      <Card
        title="4. Role-Based Permissions — IT Administrator Matrix"
        subText="Defined authorization scope and security boundaries for the IT Administrator role"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted">Role:</span>
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-accent/15 text-accent border border-accent/30">
              IT Administrator
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink focus:outline-none focus:border-accent w-44"
              />
              <IconSearch className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-1 bg-surface2 p-0.5 rounded-lg border border-line text-[12px]">
              {['All', 'Allow', 'Deny'].map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPermissionFilter(filter)}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                    permissionFilter === filter
                      ? 'bg-accent text-on-accent font-bold'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-1 w-full min-w-0">
          <table className="w-full text-left border-collapse text-[13px] min-w-[600px]">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="pb-2.5 text-ink font-bold">Action</th>
                <th scope="col" className="pb-2.5 text-ink font-bold">Operational Scope</th>
                <th scope="col" className="pb-2.5 text-ink font-bold">Category</th>
                <th scope="col" className="pb-2.5 text-ink font-bold text-right">Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-line">
              {filteredPermissions.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface2/50 transition-colors">
                  <td className="py-3 font-semibold text-ink">
                    {item.action}
                  </td>
                  <td className="py-3 text-[12px] text-muted">
                    {item.description}
                  </td>
                  <td className="py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-surface2 border border-line/50 text-muted font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {item.permission === 'Allow' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                        <IconCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Allow
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                        <IconShield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        Deny
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-lg bg-surface2/60 border border-line/60 flex items-start gap-2.5 text-[12px] text-muted mt-2">
          <IconShield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Zero-Trust & Principle of Least Privilege: </span>
            The IT Administrator role grants comprehensive control over enterprise user accounts, technical access, hardware device custody, SaaS licensing, support escalations, and security audit telemetry. In compliance with separation of duties, viewing employee payroll or financial compensation is strictly <strong className="text-bad">Denied</strong>.
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MFA Configuration Policies */}
        <Card
          title="Multi-Factor Authentication (MFA) Policies"
          subText="Zero-trust cryptographic identity controls"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Enforce FIDO2 / WebAuthn Hardware Keys</span>
                <span className="text-[11px] text-muted">Requires physical YubiKey or Touch ID biometric</span>
              </div>
              <input
                type="checkbox"
                checked={mfaPolicies.enforceWebAuthn}
                onChange={(e) => updateMfaPolicy('enforceWebAuthn', e.target.checked)}
                disabled={!canUpdateSecurity}
                style={{ accentColor: 'var(--accent)' }}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Mandate MFA for Privileged Cloud Consoles</span>
                <span className="text-[11px] text-muted">AWS, GCP & Kubernetes admin access</span>
              </div>
              <input
                type="checkbox"
                checked={mfaPolicies.requireFido2ForAdmin}
                onChange={(e) => updateMfaPolicy('requireFido2ForAdmin', e.target.checked)}
                disabled={!canUpdateSecurity}
                style={{ accentColor: 'var(--accent)' }}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Block Legacy Basic Authentication</span>
                <span className="text-[11px] text-muted">Rejects non-MFA POP3, IMAP, and legacy SMTP</span>
              </div>
              <input
                type="checkbox"
                checked={mfaPolicies.blockLegacyAuth}
                onChange={(e) => updateMfaPolicy('blockLegacyAuth', e.target.checked)}
                disabled={!canUpdateSecurity}
                style={{ accentColor: 'var(--accent)' }}
                className="w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Access Approval Workflows */}
        <Card
          title="Access Approval Workflow Queue"
          subText="Pending privileged entitlement authorizations"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line">
            {pendingRequests.map(req => (
              <div key={req.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-[13px]">{req.userName}</span>
                    <Tag>{req.app}</Tag>
                    <StatusPill status={req.status} />
                  </div>
                  <span className="text-[11px] text-muted truncate max-w-xs">{req.justification}</span>
                </div>

                {req.status === 'pending' && canUpdateSecurity && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => rejectAccessRequest(req.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => approveAccessRequest(req.id)}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
