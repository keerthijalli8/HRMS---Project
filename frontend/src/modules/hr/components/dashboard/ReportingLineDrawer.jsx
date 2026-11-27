import React, { useEffect, useRef } from 'react';
import { CANONICAL_EMPLOYEES_12 } from '../../data/mockDb.js';

export const ReportingLineDrawer = ({
  isOpen,
  onClose,
  currentUser,
  onNavigate
}) => {
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Match current user in canonical 12 employee list
  const matchedEmp = CANONICAL_EMPLOYEES_12.find(
    e => e.id === currentUser?.employeeId || e.employeeId === currentUser?.employeeId || e.email === currentUser?.email
  ) || currentUser;

  const managerName = matchedEmp?.mgr || currentUser?.mgr || "Executive Board";
  const reportingToId = matchedEmp?.reportingToId || currentUser?.reportingToId;

  // Executive board and leaders list (MAIN_TL, Super Admin, and Department Heads)
  const leaders = CANONICAL_EMPLOYEES_12.filter(
    e => e.isDepartmentHead || e.role === "MAIN_TL" || e.systemRole?.includes("Admin") || e.systemRole?.includes("Manager")
  );

  // Handle Escape key and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleOutsideClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    // Focus close button without page scroll jump
    setTimeout(() => {
      closeBtnRef.current?.focus({ preventScroll: true });
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Focus trap inside drawer
  const handleTrapFocus = (e) => {
    if (!drawerRef.current || e.key !== 'Tab') return;
    const focusable = drawerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  const handleViewProfile = (empId) => {
    onClose();
    if (onNavigate) {
      onNavigate(`/hr/teams/employees/${empId}`);
    } else {
      window.history.pushState({}, "", `/hr/teams/employees/${empId}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleViewFullHierarchy = () => {
    onClose();
    if (onNavigate) {
      onNavigate("/hr/teams?tab=my-team");
    } else {
      window.history.pushState({}, "", "/hr/teams?tab=my-team");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onKeyDown={handleTrapFocus}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Reporting Line"
        className="w-full max-w-md h-full bg-[#071720] border-l border-line shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250 text-left"
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface/50">
          <div>
            <h2 className="font-display font-bold text-ink text-lg tracking-tight">
              Reporting Line
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Organizational hierarchy chain & leadership
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
            aria-label="Close reporting line drawer"
          >
            Close
          </button>
        </div>

        {/* Content Body: The User -> The Manager -> The Leaders */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* 1. You (Current User) */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent font-data">
              Your Position
            </span>
            <div className="p-3.5 rounded-xl bg-surface2/60 border border-line">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-sm">{matchedEmp?.name || currentUser?.name || "You"}</span>
                <span className="text-[11px] font-mono text-muted">{matchedEmp?.id || currentUser?.employeeId}</span>
              </div>
              <div className="text-xs text-ink/90 font-medium mt-0.5">
                {matchedEmp?.designation || currentUser?.designation || matchedEmp?.role || "Staff"}
              </div>
              <div className="text-[11px] text-muted mt-1">
                {matchedEmp?.dept || currentUser?.dept || "Department"} · {matchedEmp?.email || currentUser?.email}
              </div>
            </div>
          </div>

          {/* 2. Direct Reporting Authority */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-data">
              Reports Directly To
            </span>
            <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-sm">{managerName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent/20 text-accent">
                  Direct Line
                </span>
              </div>
              <div className="text-xs text-ink/80 mt-1">
                {reportingToId ? (
                  <span>Employee ID: <strong className="font-mono text-ink">{reportingToId}</strong></span>
                ) : (
                  <span>Executive Governance & Board of Directors</span>
                )}
              </div>
              {reportingToId && (
                <button
                  type="button"
                  onClick={() => handleViewProfile(reportingToId)}
                  className="mt-2 text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  View Manager Profile →
                </button>
              )}
            </div>
          </div>

          {/* 3. Executive Board & Department Leaders */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-data">
              Leadership & Executive Board ({leaders.length})
            </span>
            <div className="flex flex-col gap-2.5">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="p-3 rounded-xl bg-surface2/40 border border-line/70 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-ink text-xs">{leader.name}</div>
                      <div className="text-[11px] text-muted">{leader.designation}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewProfile(leader.id)}
                      className="text-xs font-semibold text-accent hover:underline cursor-pointer px-2 py-1 rounded hover:bg-surface2 transition"
                    >
                      View Profile
                    </button>
                  </div>
                  <div className="text-[11px] text-muted flex items-center justify-between border-t border-line/30 pt-1 mt-0.5">
                    <span>{leader.dept}</span>
                    <span className="font-mono text-[10.5px] text-muted/80">{leader.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface/50 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleViewFullHierarchy}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-on-accent font-semibold text-xs hover:brightness-105 active:scale-[0.98] transition cursor-pointer text-center"
          >
            View Full Team Hierarchy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-surface2 border border-line text-xs font-semibold text-muted hover:text-ink transition cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportingLineDrawer;
