// src/components/DashboardSwitcher.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { ROLE_META, getHighestPriorityRole, getRoleFromPath } from '../auth/roles.js';

export function DashboardSwitcher({ className = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const roles = user?.roles || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (roles.length <= 1) return null;

  const activeRole = getRoleFromPath(location.pathname) || getHighestPriorityRole(roles);
  const activeMeta = ROLE_META[activeRole] || { label: activeRole };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line text-[12px] font-semibold text-ink hover:border-accent hover:bg-surface2 transition-all cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>{activeMeta.shortLabel || activeMeta.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-tpl bg-card-bg backdrop-blur-xl border border-line shadow-2xl p-1.5 z-50"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-line/40 mb-1">
            Switch Role Dashboard ({roles.length})
          </div>
          <div className="space-y-0.5">
            {roles.map((role, idx) => {
              const meta = ROLE_META[role];
              if (!meta) return null;
              const isCurrent = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    navigate(meta.path);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    isCurrent
                      ? 'bg-accent/15 text-accent font-semibold'
                      : 'text-ink hover:bg-surface2'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs flex items-center gap-1.5">
                      <span className="truncate">{meta.label}</span>
                      {idx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface2 text-muted font-mono uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted truncate">{meta.path}</div>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardSwitcher;
