import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusPill } from '../shared/StatusPill';
import { Tag } from '../shared/Tag';
import { Avatar } from '../shared/Avatar';
import { EmployeeDetailDrawer } from '../shared/EmployeeDetailDrawer';
import { IconUsers, IconPlus, IconCheck, IconAlertTriangle } from '../shared/Icons';

export function UserAccountSubDashboard({ onBack }) {
  const {
    users,
    bulkCreateUsers,
    automateOffboarding,
    setUserStatus,
    hasPermission,
    showToast
  } = useStore();
  const canReadUsers = hasPermission('User Profiles', 'read');
  const canCreateUsers = hasPermission('User Profiles', 'write');
  const canUpdateUsers = hasPermission('User Profiles', 'update');

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState(null);
  const [bulkInput, setBulkInput] = useState(
    "Aditya Deshmukh, aditya.d@company.in, Engineering, Frontend Engineer, Bengaluru\nRitu Sen, ritu.sen@company.in, Design, UI Designer, Pune\nManish Kaushik, manish.k@company.in, Sales, Sales Lead, Gurugram"
  );

  const [offboardingTarget, setOffboardingTarget] = useState(null);

  // Accounts nearing expiry (contractors / temporary workers)
  const expiringAccounts = [
    { name: 'Suresh Reddy', role: 'Logistics Coordinator', expiry: 'in 8 days (30 Nov 2026)', dept: 'Operations', type: 'Contractor' },
    { name: 'Jyoti Nair', role: 'Talent Acquisition Coordinator', expiry: 'in 14 days (07 Dec 2026)', dept: 'HR', type: 'Intern' },
    { name: 'Kartik Chidambaram', role: 'Firmware Engineer', expiry: 'in 22 days (15 Dec 2026)', dept: 'Engineering', type: 'Contractor' },
  ];

  const handleBulkSubmit = () => {
    if (!hasPermission('User Profiles', 'write')) return;
    const lines = bulkInput.trim().split('\n');
    const parsed = lines.map(line => {
      const [name, email, department, role, location] = line.split(',').map(s => s?.trim());
      return { name: name || 'Team Member', email, department: department || 'Engineering', role: role || 'Associate', location: location || 'Bengaluru' };
    }).filter(u => u.name);

    if (parsed.length > 0) {
      bulkCreateUsers(parsed);
      setBulkModalOpen(false);
    }
  };

  if (!canReadUsers) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">User Accounts Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have User Profiles: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in-50 duration-200">
      {/* Sub-dashboard Header bar */}
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
              User Account & Identity Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Bulk account creation, automated onboarding/offboarding workflows, and account expiry governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateUsers && <Button
            variant="secondary"
            onClick={() => setBulkModalOpen(true)}
            ariaLabel="Bulk Account Creation"
          >
            Bulk Account Creation
          </Button>}
        </div>
      </div>

      {/* Grid with 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Account Expiry & Automated Lifecycle */}
        <Card
          title="Account Expiry & Contractor Governance"
          subText="Temporary and contractor account validity monitoring"
        >
          <div className="flex flex-col divide-y divide-dashed divide-line">
            {expiringAccounts.map((acc, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const u = users.find(x => x.name === acc.name);
                    if (u) setSelectedUserForDrawer(u);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const u = users.find(x => x.name === acc.name);
                      if (u) setSelectedUserForDrawer(u);
                    }
                  }}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group/user"
                  title={`Click to view full details for ${acc.name} in 50% side drawer`}
                >
                  <Avatar name={acc.name} size={28} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-[13px] group-hover/user:text-accent transition-colors">{acc.name}</span>
                      <Tag>{acc.type}</Tag>
                    </div>
                    <span className="text-[11px] text-warn font-medium font-data">{acc.expiry} · {acc.dept}</span>
                  </div>
                </div>

                {canUpdateUsers && <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const u = users.find(x => x.name === acc.name);
                    if (u) setOffboardingTarget(u);
                  }}
                  ariaLabel={`Automate offboarding for ${acc.name}`}
                >
                  Automate Offboarding
                </Button>}
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Automated Onboarding Workflows */}
        <Card
          title="Automated Onboarding Pipeline"
          subText="Standardized zero-touch provision checklist verification"
        >
          <div className="flex flex-col gap-2.5 text-[12px]">
            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Google Workspace / O365 SSO Setup</span>
                <span className="text-muted text-[11px]">Auto-creates corporate mailbox & aliases</span>
              </div>
              <span className="text-good font-bold flex items-center gap-1 text-[11px]">
                <IconCheck className="w-3.5 h-3.5" /> Automated
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">MDM Device Zero-Touch Enrollment</span>
                <span className="text-muted text-[11px]">Pushes certificates & disk encryption keys</span>
              </div>
              <span className="text-good font-bold flex items-center gap-1 text-[11px]">
                <IconCheck className="w-3.5 h-3.5" /> Automated
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">FIDO2 / TOTP Security Key Enforcement</span>
                <span className="text-muted text-[11px]">Forces hardware key enrollment before VPN login</span>
              </div>
              <span className="text-accent font-bold flex items-center gap-1 text-[11px]">
                Active Policy
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bulk Account Creation Modal */}
      {canCreateUsers && bulkModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0a222b',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--card-shadow)',
              padding: 'var(--pad)',
            }}
            className="flex flex-col gap-4 text-left animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-line pb-2">
              <h3 className="font-display font-bold text-[16px] text-ink">
                Bulk User Account Creation
              </h3>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="text-muted hover:text-ink text-[13px]"
              >
                ✕
              </button>
            </div>

            <p className="text-[12px] text-muted">
              Paste employee records in CSV format: <code>Full Name, Email, Department, Role, Location</code>
            </p>

            <textarea
              rows={6}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full px-3 py-2 text-[12px] font-data rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBulkSubmit}>
                Provision All Accounts
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Offboarding Confirmation Modal */}
      {canUpdateUsers && offboardingTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#0a222b',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--card-shadow)',
              padding: 'var(--pad)',
            }}
            className="flex flex-col gap-4 text-left animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2 text-bad">
              <IconAlertTriangle className="w-5 h-5" />
              <h3 className="font-display font-bold text-[16px] text-ink">
                Execute Automated Offboarding
              </h3>
            </div>

            <p className="text-[13px] text-muted leading-relaxed">
              This will automatically perform:
            </p>
            <ul className="text-[12px] text-ink list-disc list-inside space-y-1 bg-surface2/40 p-3 rounded-lg border border-line">
              <li>Deactivate identity in IAM Directory</li>
              <li>Revoke all VPN, GitHub, Jira, AWS, and Email tokens</li>
              <li>Flag all assigned laptops and devices for overdue return</li>
              <li>Invalidate active OAuth2 and SSO sessions</li>
            </ul>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button variant="secondary" onClick={() => setOffboardingTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (!hasPermission('User Profiles', 'update')) return;
                  automateOffboarding(offboardingTarget.id);
                  setOffboardingTarget(null);
                }}
              >
                Execute Offboarding
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 50% WIDTH SIDE DRAWER FOR EMPLOYEE FULL DETAILS */}
      <EmployeeDetailDrawer
        isOpen={!!selectedUserForDrawer}
        onClose={() => setSelectedUserForDrawer(null)}
        employee={selectedUserForDrawer}
      />
    </div>
  );
}
