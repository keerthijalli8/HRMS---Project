import React from 'react';

/**
 * Status pill: 1px currentColor border, 7px dot, 12px text. Always dot + text.
 * IT status colours:
 *   Accounts: active good, provisioning info, suspended accent2, deactivated bad.
 *   Assets: in stock good, assigned info, in repair warn, retired bad, overdue return warn.
 *   Tickets: open info, in progress accent2, on hold warn, resolved good, breached SLA bad.
 *   Priority: critical bad, high warn, medium info, low muted.
 *   Alerts / login events: success good, failed login warn, blocked / suspicious bad, MFA challenge info.
 */

const COLOR_MAP = {
  // Accounts
  active: 'var(--good)',
  provisioning: 'var(--info)',
  suspended: 'var(--accent2)',
  deactivated: 'var(--bad)',

  // Assets
  'in stock': 'var(--good)',
  assigned: 'var(--info)',
  'in repair': 'var(--warn)',
  retired: 'var(--bad)',
  'overdue return': 'var(--warn)',

  // Tickets
  open: 'var(--info)',
  'in progress': 'var(--accent2)',
  'on hold': 'var(--warn)',
  resolved: 'var(--good)',
  'breached SLA': 'var(--bad)',

  // Priorities
  critical: 'var(--bad)',
  high: 'var(--warn)',
  medium: 'var(--info)',
  low: 'var(--muted)',

  // Alerts & Events
  success: 'var(--good)',
  'failed login': 'var(--warn)',
  'blocked / suspicious': 'var(--bad)',
  'MFA challenge': 'var(--info)',

  // Access requests & general
  approved: 'var(--good)',
  pending: 'var(--warn)',
  rejected: 'var(--bad)',
  'expiring soon': 'var(--warn)',
  renewed: 'var(--good)'
};

export function StatusPill({ status, label, className = '' }) {
  const normKey = (status || '').toLowerCase();
  const color = COLOR_MAP[normKey] || 'var(--muted)';
  const displayLabel = label || status;

  return (
    <span
      style={{
        borderColor: color,
        color: color
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[12px] font-medium leading-none shrink-0 capitalize ${className}`}
    >
      <span
        style={{ backgroundColor: color }}
        className="w-[7px] h-[7px] rounded-full shrink-0"
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
}
