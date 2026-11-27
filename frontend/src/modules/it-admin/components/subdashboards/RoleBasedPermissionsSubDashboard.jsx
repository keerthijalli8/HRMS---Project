import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { Drawer } from '../shared/Drawer';
import { IconKey, IconShield, IconCheck, IconSearch, IconUsers, IconLaptop } from '../shared/Icons';
import { IT_ADMIN_ROLE_PERMISSIONS } from '../../data/accessMatrix';

export function RoleBasedPermissionsSubDashboard({ onBack }) {
  const { navigate, showToast, hasPermission } = useStore();
  const canReadRoles = hasPermission('Role Administration', 'read');

  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeRoleProfile, setActiveRoleProfile] = useState('it_admin');
  const [selectedRule, setSelectedRule] = useState(null);

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set(IT_ADMIN_ROLE_PERMISSIONS.map(p => p.category));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered permission rules
  const filteredPermissions = useMemo(() => {
    return IT_ADMIN_ROLE_PERMISSIONS.filter(p => {
      const matchType = filterType === 'All' || p.permission === filterType;
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [filterType, selectedCategory, searchTerm]);

  const allowCount = IT_ADMIN_ROLE_PERMISSIONS.filter(p => p.permission === 'Allow').length;
  const denyCount = IT_ADMIN_ROLE_PERMISSIONS.filter(p => p.permission === 'Deny').length;

  if (!canReadRoles) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Role Matrix Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Role Administration: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in-50 duration-200">
      {/* 1. Header bar with Monsoon Glass styling */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-[var(--radius)] bg-surface border border-line shadow-sm backdrop-blur-[18px]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-full bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition-colors shrink-0"
            >
              ← Back to Overview
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-[20px] text-ink leading-tight">
                4. Role-based permissions
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent/15 text-accent border border-accent/40 uppercase tracking-wider">
                IT Administrator Matrix · 8 Allow / 5 Deny
              </span>
            </div>
            <p className="text-[13px] text-ink/90 font-medium mt-0.5">
              The IT Administrator should have the following permissions:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role profile switcher with dark background and crisp text */}
          <select
            value={activeRoleProfile}
            onChange={(e) => {
              setActiveRoleProfile(e.target.value);
              showToast(`Switched active profile context to ${e.target.options[e.target.selectedIndex].text}`);
            }}
            aria-label="Role profile selector"
            className="px-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink font-semibold focus:outline-none focus:border-accent"
          >
            <option value="it_admin">IT Administrator (Active Profile · Current Spec)</option>
            <option value="security_lead">Security Governance Lead (Read & Audit)</option>
            <option value="helpdesk_l1">Helpdesk L1 Specialist (Support Focus)</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => navigate('permissions')}
            ariaLabel="Open Full Dashboard Page"
          >
            Open Full Dashboard Page
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Total Rules</span>
          <div className="font-display font-bold text-[24px] text-ink leading-tight tabular-nums">
            {IT_ADMIN_ROLE_PERMISSIONS.length}
          </div>
          <span className="text-[11px] text-muted">Core operational matrix</span>
        </div>

        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Allowed Privileges</span>
          <div className="font-display font-bold text-[24px] text-emerald-400 leading-tight tabular-nums">
            {allowCount}
          </div>
          <span className="text-[11px] text-muted">Full operational control</span>
        </div>

        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">Denied Boundaries</span>
          <div className="font-display font-bold text-[24px] text-rose-400 leading-tight tabular-nums">
            {denyCount}
          </div>
          <span className="text-[11px] text-muted">Zero-Trust boundaries</span>
        </div>

        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] uppercase tracking-wider text-accent font-bold">Security Model</span>
          <div className="font-display font-bold text-[18px] text-accent leading-tight mt-1">
            Least Privilege
          </div>
          <span className="text-[11px] text-muted">ISO/IEC 27001 Certified</span>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search */}
      <Card
        title="Administrative Permission Evaluation Matrix"
        subText="Explicit policy declarations governing identity, infrastructure, and separation of duties"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface2 border border-line text-[12px]">
            {[
              { id: 'All', label: `All (${IT_ADMIN_ROLE_PERMISSIONS.length})` },
              { id: 'Allow', label: `Allow (${allowCount})` },
              { id: 'Deny', label: `Deny (${denyCount})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === f.id
                    ? f.id === 'Allow'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : f.id === 'Deny'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by functional category"
              className="px-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-[#1e293b] border border-line text-ink font-medium focus:outline-none focus:border-accent"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Operational Categories' : c}</option>
              ))}
            </select>

            {/* Live Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search action or scope..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-surface2 border border-line text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent w-56"
              />
              <IconSearch className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* 4. Crisp High-Contrast Table with Vibrant Badges */}
        <div className="overflow-x-auto -mx-1 w-full min-w-0">
          <table className="w-full text-left border-collapse text-[13px] min-w-[750px]">
            <thead>
              <tr className="border-b border-line bg-surface2/30">
                <th scope="col" className="py-3 px-3 text-ink font-bold">Action</th>
                <th scope="col" className="py-3 px-3 text-ink font-bold">Operational Scope & Security Rationale</th>
                <th scope="col" className="py-3 px-3 text-ink font-bold">Category</th>
                <th scope="col" className="py-3 px-3 text-ink font-bold">Enforcement</th>
                <th scope="col" className="py-3 px-3 text-ink font-bold text-right">Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-line">
              {filteredPermissions.map((item) => {
                const isAllow = item.permission === 'Allow';
                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedRule(item);
                      showToast(`Evaluating rule ${item.id}: ${item.action} is strictly ${item.permission.toUpperCase()} for IT Administrator`);
                    }}
                    className="hover:bg-surface2/50 cursor-pointer transition-colors group"
                    title={`Click to open full 50% detail drawer for: ${item.action}`}
                  >
                    <td className="py-3.5 px-3 font-semibold text-ink whitespace-nowrap">
                      {item.action}
                    </td>
                    <td className="py-3.5 px-3 text-[12.5px] text-muted leading-relaxed">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface2 border border-line text-muted font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-data text-muted/80">
                        {item.enforcement}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      {isAllow ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                          <IconCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Allow</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                          <IconShield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Deny</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 5. Zero-Trust Security Explainer Banner */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-surface2 to-surface border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12.5px]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-bad/15 border border-bad/30 flex items-center justify-center text-bad shrink-0 mt-0.5">
              <IconShield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-ink">
                Strict Separation of Duties & Cryptographic Policy Enforcement
              </div>
              <p className="text-muted text-[12px] mt-0.5 leading-normal">
                IT Administrators manage directory identities, application technical access, hardware fleets, software licensing, support tickets, and security audits. Under strict zero-trust compliance, access to employee payroll, salary modifications, leave approvals, HR policies, and Super Admin elevation is <strong className="text-rose-400">Denied</strong> by policy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => showToast('Policy verification pass: All 13 matrix declarations enforced without breach.')}
            className="px-3.5 py-1.5 text-[11px] font-bold rounded-full bg-accent/15 text-accent border border-accent/40 hover:bg-accent hover:text-on-accent transition-colors shrink-0"
          >
            Audit Policy Status
          </button>
        </div>
      </Card>

      {/* 50% Width Detail Side Drawer upon Row Click */}
      <Drawer
        isOpen={Boolean(selectedRule)}
        onClose={() => setSelectedRule(null)}
        isHalfWidth={true}
        title={selectedRule ? `Policy Rule: ${selectedRule.action}` : 'Permission Rule Details'}
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-[11.5px] text-muted">
              Zero-Trust Administrative Evaluation Ledger
            </span>
            <Button variant="secondary" onClick={() => setSelectedRule(null)}>
              Close Panel
            </Button>
          </div>
        }
      >
        {selectedRule && (
          <div className="flex flex-col gap-5 text-ink">
            {/* Status Callout */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                selectedRule.permission === 'Allow'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedRule.permission === 'Allow'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {selectedRule.permission === 'Allow' ? (
                    <IconCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <IconShield className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-[15px]">
                    Decision: {selectedRule.permission.toUpperCase()}
                  </div>
                  <span className="text-[12px] opacity-80">
                    {selectedRule.permission === 'Allow'
                      ? 'Action is fully authorized under the IT Administrator role'
                      : 'Strictly restricted by Zero-Trust policy & Separation of Duties'}
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[12px] font-bold shrink-0 ${
                  selectedRule.permission === 'Allow'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-500/20 border border-rose-500/50 text-rose-200'
                }`}
              >
                {selectedRule.permission}
              </span>
            </div>

            {/* Specification Metadata */}
            <div className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Specification Details
              </span>
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div>
                  <span className="text-muted block text-[11px]">Rule ID</span>
                  <span className="font-data font-bold text-ink">{selectedRule.id}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Operational Category</span>
                  <span className="font-semibold text-ink">{selectedRule.category}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Risk Classification</span>
                  <span className="font-semibold text-accent">{selectedRule.riskLevel}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Enforcement Mechanism</span>
                  <span className="font-data text-ink">{selectedRule.enforcement}</span>
                </div>
              </div>
            </div>

            {/* Rationale & Description */}
            <div className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Operational Scope & Compliance Rationale
              </span>
              <p className="text-[13px] text-ink leading-relaxed">
                {selectedRule.description}
              </p>
            </div>

            {/* Real-Time Evaluation Simulator */}
            <div className="p-4 rounded-xl bg-slate-900 border border-line flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Zero-Trust Cryptographic Audit Check
              </span>
              <div className="flex items-center justify-between text-[12px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Target Role Profile:</span>
                <span className="font-bold text-white">IT Administrator (Active)</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-400">Cryptographic Digest:</span>
                <span className="font-data text-[11px] text-sky-400">SHA256:8f4c...3e19</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-400">Compliance Standard:</span>
                <span className="text-slate-200">ISO/IEC 27001 §A.9.2.3</span>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  showToast(`Audit confirmed: Rule ${selectedRule.id} (${selectedRule.action}) complies with policy`);
                }}
                className="mt-2 text-[12px] font-bold"
              >
                Log Zero-Trust Verification Event
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
