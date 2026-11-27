// src/pages/RoleDashboardPlaceholder.jsx
// Phase 1 verified role landing view until Phases 2-8 migrate each dashboard module.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { ROLE_META } from '../auth/roles.js';
import { Dashboard } from '../modules/auth/pages/Dashboard.jsx';

export function RoleDashboardPlaceholder({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meta = ROLE_META[role] || { label: role, description: '' };
  const otherRoles = (user?.roles || []).filter(r => r !== role);

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 border border-accent/30 bg-accent/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-tpl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
              Active Workspace · {role}
            </div>
            <h2 className="font-display font-bold text-lg text-ink">
              {meta.label}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {meta.description} (Module migration scheduled in Phases 2–8; showing verified biometric session &amp; recent sign-ins below.)
            </p>
          </div>
        </div>

        {otherRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-accent" />
              Switch:
            </span>
            {otherRoles.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => navigate(ROLE_META[r].path)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition-colors"
              >
                <span>{ROLE_META[r].shortLabel}</span>
                <ArrowRight className="w-3 h-3 text-accent" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dashboard />
    </div>
  );
}

export default RoleDashboardPlaceholder;
