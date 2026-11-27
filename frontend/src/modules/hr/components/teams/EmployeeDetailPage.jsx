import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../Icon.jsx';
import { TeamBreadcrumbs } from './TeamBreadcrumbs.jsx';
import { ExperienceBadge } from './ExperienceBadge.jsx';
import { getEmployeeDetail, isHRorAdmin, deleteEmployee } from '../../services/teamService.js';
import { formatTenureAtCompany, formatExperience } from '../../config/teams.js';
import { formatDate } from '../../utils/format.js';
import { renderValue, formatINR } from '../../utils/renderValue.js';
import { AuditLogViewer } from '../audit/AuditLogViewer.jsx';
import { logEvent } from '../../services/auditService.js';
import { ConfirmDeleteEmployeeModal } from './ConfirmDeleteEmployeeModal.jsx';

export const EmployeeDetailPage = ({
  employeeId,
  initialTab,
  onBack,
  onNavigate,
  onEditEmployee,
  currentUser,
  viewer,
  onTriggerToast
}) => {
  const viewerUser = currentUser || viewer;

  // Read initial tab from props or URL
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get("tab");
      if (tabParam === "activity" || tabParam === "overview" || tabParam === "job" || tabParam === "attendance" || tabParam === "leave" || tabParam === "documents") {
        return tabParam;
      }
    }
    return "overview";
  });

  const [isSalaryUnlocked, setIsSalaryUnlocked] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    if (!employeeId) return;
    setIsDeleting(true);
    const res = deleteEmployee(employeeId, viewerUser);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    if (res.ok) {
      if (onTriggerToast) onTriggerToast(res.message);
      if (onBack) onBack();
    } else {
      if (onTriggerToast) onTriggerToast(res.error || "Failed to delete employee.");
    }
  };

  // Sync tab change to URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tabId);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }
  };

  const detailResult = useMemo(() => {
    return getEmployeeDetail(employeeId, viewerUser);
  }, [employeeId, viewerUser]);

  const isHr = useMemo(() => isHRorAdmin(viewerUser), [viewerUser]);
  const canEdit = isHr;

  if (detailResult.notFound) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Icon name="alert-triangle" className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink">
            Employee Not Found
          </h2>
          <p className="text-xs text-muted mt-1.5 max-w-md">
            No employee with ID "{renderValue(employeeId)}" was found in the organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else if (onNavigate) onNavigate("/teams");
          }}
          className="mt-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center gap-2 hover:opacity-95 transition cursor-pointer shadow-lg"
        >
          <Icon name="arrow-left" className="w-4 h-4 text-on-accent" />
          <span>Back to Teams</span>
        </button>
      </div>
    );
  }

  const { employee, reportingTL, hierarchyChain = [], attendanceSummary, hasFullAccess } = detailResult;

  const isSelf = viewerUser && ((viewerUser.employeeId || viewerUser.id) === employee.id);

  // Log profile visit if viewing someone else
  useEffect(() => {
    if (employee?.id && !isSelf) {
      logEvent({
        action: "view_profile",
        category: "Sensitive",
        module: "Teams",
        description: `Viewed employee profile of ${employee.name} (${employee.id})`,
        target: { type: "Employee", id: employee.id, name: employee.name },
        user: viewerUser,
        isSensitive: true
      });
    }
  }, [employee?.id, isSelf]);

  const initials = employee.name
    ? employee.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : "EM";

  const tenureAtCompany = formatTenureAtCompany(employee.joiningDate);
  const totalExperienceFormatted = formatExperience(employee.totalExperienceYears, employee.previousCompanies);

  // Text-only tabs, no icons or circles
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "job", label: "Job & Experience" },
    { id: "attendance", label: "Attendance" },
    { id: "leave", label: "Leave" },
    ...(hasFullAccess ? [{ id: "documents", label: "Documents" }] : []),
    { id: "activity", label: isSelf ? "My Activity" : "Activity Log" }
  ];

  const salaryBreakdown = employee.salaryBreakdown;

  return (
    <div className="flex flex-col gap-5 w-full animate-fadeIn">
      {/* ================= BREADCRUMBS & TOP NAV ================= */}
      <div className="glass-card !p-4 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
        <TeamBreadcrumbs
          items={[
            {
              label: renderValue(employee.dept, "Department"),
              route: `/teams/departments/${String(employee.dept || "engineering").toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
            },
            { label: renderValue(employee.name, "Employee Profile"), route: null }
          ]}
          onNavigate={onNavigate}
        />

        {/* ================= PROFILE HERO HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-line/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar / Photo */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-accent/30 to-accent2/30 border-2 border-accent/40 text-accent font-display font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-xl">
                {initials}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface ${
                  employee.status === "Active"
                    ? "bg-emerald-400"
                    : employee.status === "On Leave"
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}
                title={`Status: ${renderValue(employee.status)}`}
              />
            </div>

            {/* Main Info */}
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-ink leading-tight">
                  {renderValue(employee.name)}
                </h1>
                <ExperienceBadge
                  totalYears={employee.totalExperienceYears}
                  previousCompanies={employee.previousCompanies}
                />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  employee.role === "MAIN_TL"
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : employee.role === "TL"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-surface2 text-muted border border-line"
                }`}>
                  {employee.role === "MAIN_TL" ? "Main TL" : employee.role === "TL" ? "Team Lead" : "Employee"}
                </span>
              </div>

              <div className="text-xs text-muted flex flex-wrap items-center gap-2">
                <strong className="text-ink font-semibold">{renderValue(employee.designation)}</strong>
                <span>&bull;</span>
                <span>{renderValue(employee.dept)}</span>
                <span>&bull;</span>
                <span className="font-num font-bold text-ink">{renderValue(employee.id)}</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-semibold">{renderValue(tenureAtCompany)}</span>
              </div>

              {reportingTL && (
                <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                  <span>Reporting to:</span>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(`/teams/employees/${reportingTL.id}`)}
                    className="text-accent font-semibold hover:underline cursor-pointer"
                  >
                    {renderValue(reportingTL.name)} ({renderValue(reportingTL.designation)})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {employee.email && (
              <a
                href={`mailto:${employee.email}`}
                className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition"
              >
                <Icon name="mail" className="w-3.5 h-3.5 text-accent" />
                <span>Email</span>
              </a>
            )}

            {employee.phone && employee.phone !== "+91 ••••• •••••" && (
              <a
                href={`tel:${employee.phone}`}
                className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition"
              >
                <Icon name="phone" className="w-3.5 h-3.5 text-accent" />
                <span>Call</span>
              </a>
            )}

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onEditEmployee?.(employee)}
                  className="px-3.5 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer shadow-md"
                >
                  <Icon name="edit" className="w-3.5 h-3.5 text-on-accent" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-bad/15 text-bad hover:bg-bad/25 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-bad/30"
                  title="Delete employee record"
                >
                  <Icon name="trash-2" className="w-3.5 h-3.5 text-bad" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation Pill - Text Only, No Icons, No Circles */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 border-t border-line/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2/50"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Details */}
            <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2">
                <Icon name="user" className="w-4 h-4 text-accent" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">Work Email</span>
                  <span className="font-semibold text-ink select-all">{renderValue(employee.email)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Phone Number</span>
                  <span className="font-semibold text-ink font-num">{renderValue(employee.phone)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Date of Birth</span>
                  <span className="font-semibold text-ink font-num">{renderValue(employee.dob)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Gender</span>
                  <span className="font-semibold text-ink">{renderValue(employee.gender)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Blood Group</span>
                  <span className="font-semibold text-ink font-num">{renderValue(employee.bloodGroup)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Location</span>
                  <span className="font-semibold text-ink">{renderValue(employee.location)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-line/60 text-xs flex flex-col gap-1">
                <span className="text-muted text-[11px]">Residential Address</span>
                <span className="font-semibold text-ink">{renderValue(employee.address)}</span>
              </div>

              <div className="text-xs flex flex-col gap-1">
                <span className="text-muted text-[11px]">Emergency Contact</span>
                <span className="font-semibold text-ink">{renderValue(employee.emergencyContact)}</span>
              </div>
            </div>

            {/* Employment & Reporting Hierarchy */}
            <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2">
                <Icon name="briefcase" className="w-4 h-4 text-accent" />
                <span>Employment & Hierarchy</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">Joining Date</span>
                  <span className="font-semibold text-ink font-num">{formatDate(employee.joiningDate)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Employment Type</span>
                  <span className="font-semibold text-ink">{renderValue(employee.employmentType)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Work Mode</span>
                  <span className="font-semibold text-ink">{renderValue(employee.workMode)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Probation Status</span>
                  <span className="font-semibold text-ink">{renderValue(employee.probationStatus)}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Annual Salary (CTC)</span>
                  {!hasFullAccess || !isHr ? (
                    <span className="font-semibold text-muted text-xs flex items-center gap-1.5 mt-0.5">
                      <Icon name="lock" className="w-3.5 h-3.5 text-muted" />
                      <span>Restricted</span>
                    </span>
                  ) : (
                    <span className="font-extrabold text-accent font-num">
                      {isSalaryUnlocked ? renderValue(employee.salary) : "••••••••"}
                    </span>
                  )}
                </div>
              </div>

              {/* Reporting Hierarchy Chain */}
              <div className="pt-3 border-t border-line/60">
                <span className="text-muted text-[11px] font-semibold uppercase tracking-wider block mb-2">
                  Reporting Lineage
                </span>
                <div className="flex flex-col gap-2">
                  {hierarchyChain.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-num font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate?.(`/teams/employees/${p.id}`)}
                        className="text-ink font-semibold hover:text-accent transition text-left cursor-pointer"
                      >
                        {renderValue(p.name)} <span className="text-muted font-normal">({renderValue(p.designation)})</span>
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-accent font-bold pl-7">
                    &bull; {renderValue(employee.name)} (Current)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confidential Salary Structure Card (HR/Admin Only) */}
          {hasFullAccess && isHr && (
            <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="dollar-sign" className="w-4 h-4 text-accent" />
                    <h3 className="font-display font-bold text-sm text-ink">
                      Confidential Compensation & Salary Structure
                    </h3>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Authorized compensation details for {renderValue(employee.name)} ({renderValue(employee.id)})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isSalaryUnlocked;
                    setIsSalaryUnlocked(next);
                    if (next) {
                      logEvent({
                        action: "salary_unlock",
                        category: "Sensitive",
                        module: "Teams",
                        description: `Unlocked confidential compensation structure for ${employee.name} (${employee.id})`,
                        target: { type: "Employee", id: employee.id, name: employee.name },
                        user: viewerUser,
                        isSensitive: true
                      });
                    }
                    onTriggerToast?.(next ? "Salary view unlocked." : "Salary details hidden.");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto ${
                    isSalaryUnlocked
                      ? "bg-good/15 border-good/40 text-good"
                      : "bg-surface2 border-line text-muted hover:text-ink hover:border-accent"
                  }`}
                >
                  <Icon name={isSalaryUnlocked ? "check" : "eye"} className="w-3.5 h-3.5" />
                  <span>{isSalaryUnlocked ? "Salary Revealed" : "Unlock Confidential Salaries"}</span>
                </button>
              </div>

              {!isSalaryUnlocked ? (
                <div className="p-6 rounded-xl bg-surface2/30 border border-line/60 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-surface2 border border-line flex items-center justify-center text-muted">
                    <Icon name="lock" className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    Salary details are protected under corporate privacy policy
                  </span>
                  <span className="text-[11px] text-muted">
                    Click "Unlock Confidential Salaries" above to review compensation components.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly Earnings Components */}
                    <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2.5 text-xs">
                      <span className="font-bold text-ink border-b border-line pb-1.5 flex items-center justify-between">
                        <span>Earnings Breakdown (Monthly)</span>
                        <span className="text-accent font-data">Monthly Rate</span>
                      </span>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Basic Salary:</span>
                        <span className="font-num font-semibold text-ink">{formatINR(salaryBreakdown?.basic || 65000)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">House Rent Allowance (HRA):</span>
                        <span className="font-num font-semibold text-ink">{formatINR(salaryBreakdown?.hra || 32500)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Dearness Allowance (DA):</span>
                        <span className="font-num font-semibold text-ink">{formatINR(salaryBreakdown?.da || 13000)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Conveyance Allowance:</span>
                        <span className="font-num font-semibold text-ink">{formatINR(salaryBreakdown?.conveyance || 1600)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Medical Allowance:</span>
                        <span className="font-num font-semibold text-ink">{formatINR(salaryBreakdown?.medical || 1250)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Special Allowance:</span>
                        <span className="font-num font-semibold text-ink">{formatINR(salaryBreakdown?.special || 24500)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-line/60 font-bold text-ink">
                        <span>Gross Monthly Earnings:</span>
                        <span className="font-num text-accent">{formatINR(salaryBreakdown?.gross || 150000)}</span>
                      </div>
                    </div>

                    {/* Monthly Deductions Components */}
                    <div className="p-4 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2.5 text-xs">
                      <span className="font-bold text-ink border-b border-line pb-1.5 flex items-center justify-between">
                        <span>Statutory Deductions (Monthly)</span>
                        <span className="text-bad font-data">Deductions</span>
                      </span>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Provident Fund (PF - 12%):</span>
                        <span className="font-num font-semibold text-bad">{formatINR(salaryBreakdown?.pf || 7800)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Employee State Insurance (ESI):</span>
                        <span className="font-num font-semibold text-bad">{formatINR(salaryBreakdown?.esi || 0)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Professional Tax (PT):</span>
                        <span className="font-num font-semibold text-bad">{formatINR(salaryBreakdown?.pt || 200)}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-muted">Income Tax (TDS Estimate):</span>
                        <span className="font-num font-semibold text-bad">{formatINR(salaryBreakdown?.tds || 14000)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-line/60 font-bold text-bad">
                        <span>Total Monthly Deductions:</span>
                        <span className="font-num">{formatINR(salaryBreakdown?.deductions || 22000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Net Disbursal & Annual CTC Bar */}
                  <div className="p-4 rounded-xl bg-surface2/60 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-muted block text-[11px]">Monthly Net Take-Home</span>
                      <span className="text-lg font-num font-extrabold text-good">
                        {formatINR(salaryBreakdown?.net || 128000)}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-muted block text-[11px]">Total Cost to Company (Annual CTC)</span>
                      <span className="text-lg font-num font-extrabold text-accent">
                        {salaryBreakdown?.annualCtcFormatted || renderValue(employee.salary)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: JOB & EXPERIENCE ================= */}
      {activeTab === "job" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {/* Experience Timeline */}
          <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2">
              <Icon name="clock" className="w-4 h-4 text-accent" />
              <span>Career Experience Timeline</span>
            </h3>

            <div className="p-3 rounded-xl bg-surface2/30 border border-line/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted block">Total Experience</span>
                <span className="font-display font-bold text-base text-ink">{renderValue(totalExperienceFormatted)}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Tenure at Company</span>
                <span className="font-display font-bold text-base text-accent">{renderValue(tenureAtCompany)}</span>
              </div>
            </div>

            {/* Previous Companies Timeline */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Previous Organizations</span>
              {!employee.previousCompanies || employee.previousCompanies.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface2/20 text-center text-xs text-muted">
                  No prior companies recorded (Fresher entry level).
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 border-l-2 border-line pl-3 ml-2">
                  {employee.previousCompanies.map((c, i) => (
                    <div key={i} className="relative text-xs">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface" />
                      <div className="font-bold text-ink">{renderValue(c.company, "Organization")}</div>
                      <div className="text-muted">{renderValue(c.role, "Role")} &bull; <span className="font-num font-semibold text-accent">{renderValue(c.duration, "-")}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Education & Skills */}
          <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3 shadow-md">
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2">
              <Icon name="graduation-cap" className="w-4 h-4 text-accent" />
              <span>Education, Skills & Certifications</span>
            </h3>

            {/* Education List with explicit fields */}
            <div>
              <span className="text-[11px] text-muted block mb-2 font-semibold uppercase tracking-wider">Education & Academic History</span>
              {employee.educationList && employee.educationList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {employee.educationList.map((edu, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-surface2/30 border border-line/60 text-xs">
                      <div className="font-bold text-ink">{renderValue(edu.degree, "Degree")}</div>
                      <div className="text-muted flex items-center gap-2 mt-0.5">
                        <span>{renderValue(edu.institution, "-")}</span>
                        {edu.year && edu.year !== "-" && (
                          <>
                            <span>&bull;</span>
                            <span className="font-num">{renderValue(edu.year)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="font-semibold text-ink text-xs">{renderValue(employee.education)}</span>
              )}
            </div>

            <div className="pt-2 border-t border-line/60">
              <span className="text-[11px] text-muted block mb-2 font-semibold uppercase tracking-wider">Skills Matrix</span>
              <div className="flex flex-wrap gap-1.5">
                {(employee.skills || []).map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-surface2/70 border border-line text-xs font-semibold text-ink">
                    {renderValue(skill)}
                  </span>
                ))}
              </div>
            </div>

            {employee.certificationsList && employee.certificationsList.length > 0 && (
              <div className="pt-2 border-t border-line/60">
                <span className="text-[11px] text-muted block mb-2 font-semibold uppercase tracking-wider">Certifications</span>
                <ul className="flex flex-col gap-2 text-xs">
                  {employee.certificationsList.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-surface2/25 border border-line/40 text-ink">
                      <Icon name="check-circle" className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink">{renderValue(cert.name)}</span>
                        {cert.issuer && <span className="text-[11px] text-muted">{renderValue(cert.issuer)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ATTENDANCE ================= */}
      {activeTab === "attendance" && (
        <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
              <Icon name="clock" className="w-4 h-4 text-accent" />
              <span>Monthly Attendance Record</span>
            </h3>
            <span className="text-xs text-muted">
              Current Month: <strong className="text-ink">November 2026</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-surface2/30 border border-line">
              <span className="text-[11px] text-muted block">Present Days</span>
              <span className="font-num font-extrabold text-lg text-emerald-400">
                {attendanceSummary?.summaryCards?.presentDays ?? 8}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/30 border border-line">
              <span className="text-[11px] text-muted block">WFH Days</span>
              <span className="font-num font-extrabold text-lg text-cyan-400">
                {attendanceSummary?.summaryCards?.wfhDays ?? 1}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/30 border border-line">
              <span className="text-[11px] text-muted block">Late Check-ins</span>
              <span className="font-num font-extrabold text-lg text-amber-300">
                {attendanceSummary?.summaryCards?.lateArrivals ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface2/30 border border-line">
              <span className="text-[11px] text-muted block">Avg Working Hours</span>
              <span className="font-num font-extrabold text-lg text-ink">
                {attendanceSummary?.summaryCards?.avgHoursPerDay ?? "8h 45m"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: LEAVE ================= */}
      {activeTab === "leave" && (
        <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md animate-fadeIn">
          <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-3">
            <Icon name="calendar" className="w-4 h-4 text-accent" />
            <span>Leave Balances & Status</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface2/30 border border-line">
              <span className="text-xs text-muted block">Earned / Casual Leave</span>
              <span className="font-num font-bold text-xl text-ink mt-1 block">14 Days</span>
              <span className="text-[10px] text-muted">Available of 18 annual</span>
            </div>
            <div className="p-4 rounded-xl bg-surface2/30 border border-line">
              <span className="text-xs text-muted block">Sick Leave</span>
              <span className="font-num font-bold text-xl text-ink mt-1 block">8 Days</span>
              <span className="text-[10px] text-muted">Available of 10 annual</span>
            </div>
            <div className="p-4 rounded-xl bg-surface2/30 border border-line">
              <span className="text-xs text-muted block">Comp Off</span>
              <span className="font-num font-bold text-xl text-ink mt-1 block">2 Days</span>
              <span className="text-[10px] text-muted">Valid till 31 Dec 2026</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: DOCUMENTS (HR/ADMIN ONLY) ================= */}
      {activeTab === "documents" && hasFullAccess && (
        <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md animate-fadeIn">
          <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-3">
            <Icon name="file-text" className="w-4 h-4 text-accent" />
            <span>Employee Verified Documents</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface2/30 border border-line flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink block">Appointment Letter</span>
                <span className="text-[10px] text-muted font-num">Signed 2021-03-12 &bull; PDF</span>
              </div>
              <Icon name="check-circle" className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="p-3.5 rounded-xl bg-surface2/30 border border-line flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink block">PAN & Aadhaar KYC</span>
                <span className="text-[10px] text-muted font-num">Verified &bull; Government ID</span>
              </div>
              <Icon name="check-circle" className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="p-3.5 rounded-xl bg-surface2/30 border border-line flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink block">Degree Certificate</span>
                <span className="text-[10px] text-muted font-num">Verified &bull; Education</span>
              </div>
              <Icon name="check-circle" className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: ACTIVITY LOG ================= */}
      {activeTab === "activity" && (
        <div className="animate-fadeIn">
          <AuditLogViewer
            employeeId={employee.id}
            employeeName={employee.name}
            currentUser={viewerUser}
            onNavigateEmployee={onNavigate}
          />
        </div>
      )}

      {/* Confirmation Modal for Employee Deletion */}
      <ConfirmDeleteEmployeeModal
        isOpen={isDeleteModalOpen}
        employee={employee}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default EmployeeDetailPage;
