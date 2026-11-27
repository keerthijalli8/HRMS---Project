import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../Icon.jsx';
import { BonusStepper } from './BonusStepper.jsx';
import { EmployeePicker } from './EmployeePicker.jsx';
import { BonusDetailsForm } from './BonusDetailsForm.jsx';
import { BonusReview } from './BonusReview.jsx';
import { BonusHistoryTable } from './BonusHistoryTable.jsx';
import {
  getBonuses,
  subscribeBonuses,
  getDraft,
  clearDraft,
  saveDraft
} from '../../services/bonusService.js';
import { isHRorAdmin } from '../../services/teamService.js';
import { formatINR } from '../../utils/renderValue.js';

export const BonusPage = ({
  currentUser,
  onTriggerToast,
  onNavigate,
  setCurrentRoute
}) => {
  const isHr = useMemo(() => isHRorAdmin(currentUser), [currentUser]);

  // Main Tab: "give" | "history"
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("tab") === "history" ? "history" : "give";
    }
    return "give";
  });

  // Stepper: 1 | 2 | 3
  const [currentStep, setCurrentStep] = useState(1);

  // Bonus Form State
  const [bonusConfig, setBonusConfig] = useState({
    name: "Q3 Performance & Diwali Bonus",
    type: "Performance",
    payCycle: "November 2026",
    reason: "Recognition of outstanding delivery across cross-functional enterprise objectives.",
    amountMode: "fixed",
    fixedAmount: 25000,
    percentageBasis: "basic",
    percentageValue: 10,
    paymentTiming: "payroll",
    paymentDate: "",
    selectedEmployeeIds: [],
    customAmounts: {},
    items: []
  });

  // Draft notice state
  const [savedDraft, setSavedDraft] = useState(null);

  // Bonuses list from storage
  const [bonusesList, setBonusesList] = useState(() => getBonuses());

  // Subscribe to bonus updates
  useEffect(() => {
    const unsub = subscribeBonuses(() => {
      setBonusesList(getBonuses());
    });
    return unsub;
  }, []);

  // Check for saved draft on mount
  useEffect(() => {
    const draft = getDraft();
    if (draft && draft.name) {
      setSavedDraft(draft);
    }
  }, []);

  // Resume Draft handler
  const handleResumeDraft = () => {
    if (savedDraft) {
      setBonusConfig({
        ...bonusConfig,
        ...savedDraft
      });
      if (savedDraft.step) {
        setCurrentStep(savedDraft.step);
      }
      setSavedDraft(null);
      onTriggerToast?.("Resumed draft bonus allocation.");
    }
  };

  // Discard Draft handler
  const handleDiscardDraft = () => {
    clearDraft();
    setSavedDraft(null);
    onTriggerToast?.("Draft discarded.");
  };

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.toString());
      } catch (e) {}
    }
  };

  // Summary statistics for Header
  const stats = useMemo(() => {
    const paidOrApproved = bonusesList.filter(b => b.status === "Paid" || b.status === "Approved");
    const totalOutflow = paidOrApproved.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const uniqueRecipients = new Set();
    paidOrApproved.forEach(b => {
      (b.items || []).forEach(it => uniqueRecipients.add(it.employeeId));
    });

    return {
      totalOutflow,
      recipientCount: uniqueRecipients.size,
      totalCampaigns: bonusesList.length,
      currentCycle: "November 2026"
    };
  }, [bonusesList]);

  // Non-HR Role Guard
  if (!isHr) {
    return (
      <div className="glass-card !p-12 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Icon name="lock" className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-2xl text-ink">
            Restricted Disbursal Access
          </h2>
          <p className="text-xs text-muted mt-1.5 max-w-md">
            Only designated HR Managers and Corporate Administrators are authorized to allocate and manage employee bonuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (setCurrentRoute) setCurrentRoute("overview");
            else if (onNavigate) onNavigate("overview");
          }}
          className="mt-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent font-bold text-xs flex items-center gap-2 hover:opacity-95 transition cursor-pointer shadow-lg"
        >
          <Icon name="arrow-left" className="w-4 h-4 text-on-accent" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full animate-fadeIn">
      {/* ================= HERO HEADER & STATS ================= */}
      <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent/30 to-accent2/30 border border-accent/40 text-accent flex items-center justify-center shadow-lg">
              <Icon name="gift" className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-ink">
                  Bonus &amp; Incentive Allocation
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-wider">
                  Selective Disbursal
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Allocate discretionary, festive, and performance awards to selected employees with instant payroll integration.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-surface2/60 p-1 rounded-xl border border-line self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange("give")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "give"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2"
              }`}
            >
              <span>Bonus</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("history")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "history"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2"
              }`}
            >
              <span>Bonus History ({bonusesList.length})</span>
            </button>
          </div>
        </div>

        {/* Global Summary KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-line/50 text-xs">
          <div className="p-3 rounded-xl bg-surface2/30 border border-line/60">
            <span className="text-[10.5px] text-muted block uppercase font-semibold">Total Disbursed (FY26)</span>
            <span className="font-num font-extrabold text-lg text-accent mt-0.5 block">
              {formatINR(stats.totalOutflow)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface2/30 border border-line/60">
            <span className="text-[10.5px] text-muted block uppercase font-semibold">Unique Staff Rewarded</span>
            <span className="font-num font-extrabold text-lg text-ink mt-0.5 block">
              {stats.recipientCount} Employees
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface2/30 border border-line/60">
            <span className="text-[10.5px] text-muted block uppercase font-semibold">Active Payroll Cycle</span>
            <span className="font-bold text-lg text-ink mt-0.5 block">
              {stats.currentCycle}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface2/30 border border-line/60">
            <span className="text-[10.5px] text-muted block uppercase font-semibold">Allocations Completed</span>
            <span className="font-num font-extrabold text-lg text-good mt-0.5 block">
              {stats.totalCampaigns} Campaigns
            </span>
          </div>
        </div>
      </div>

      {/* ================= RESUME DRAFT BANNER ================= */}
      {savedDraft && activeTab === "give" && (
        <div className="p-3.5 rounded-2xl bg-accent2/15 border border-accent2/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Icon name="save" className="w-4 h-4 text-accent2 shrink-0" />
            <div>
              <strong className="text-ink font-bold">Unsaved Bonus Draft Found:</strong>{" "}
              <span className="text-muted">"{savedDraft.name}" with {savedDraft.selectedEmployeeIds?.length || 0} selected recipients.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResumeDraft}
              className="px-3 py-1.5 rounded-lg bg-accent text-on-accent font-bold text-xs hover:opacity-95 cursor-pointer shadow-sm"
            >
              Resume Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-lg bg-surface2 text-muted hover:text-bad text-xs font-semibold cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 1: BONUS WIZARD ================= */}
      {activeTab === "give" && (
        <div className="flex flex-col gap-5 animate-in fade-in">
          {/* 3-Step Guided Stepper */}
          <BonusStepper
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />

          {/* STEP 1: EMPLOYEE PICKER */}
          {currentStep === 1 && (
            <EmployeePicker
              selectedEmployeeIds={bonusConfig.selectedEmployeeIds}
              onSelectionChange={(ids) => {
                setBonusConfig(prev => ({
                  ...prev,
                  selectedEmployeeIds: ids
                }));
                // Auto-save draft
                saveDraft({
                  ...bonusConfig,
                  selectedEmployeeIds: ids,
                  step: 1
                });
              }}
              onContinue={() => setCurrentStep(2)}
              currentUser={currentUser}
            />
          )}

          {/* STEP 2: BONUS DETAILS */}
          {currentStep === 2 && (
            <BonusDetailsForm
              bonusConfig={bonusConfig}
              onChange={(updated) => {
                setBonusConfig(updated);
                saveDraft({
                  ...updated,
                  step: 2
                });
              }}
              onBack={() => setCurrentStep(1)}
              onContinue={() => setCurrentStep(3)}
              selectedEmployeeIds={bonusConfig.selectedEmployeeIds}
            />
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {currentStep === 3 && (
            <BonusReview
              bonusConfig={bonusConfig}
              currentUser={currentUser}
              onBack={() => setCurrentStep(2)}
              onComplete={() => {
                // Navigate to History tab
                setActiveTab("history");
                setCurrentStep(1);
                // Reset form
                setBonusConfig({
                  name: "Performance & Festive Award",
                  type: "Performance",
                  payCycle: "November 2026",
                  reason: "",
                  amountMode: "fixed",
                  fixedAmount: 25000,
                  percentageBasis: "basic",
                  percentageValue: 10,
                  paymentTiming: "payroll",
                  paymentDate: "",
                  selectedEmployeeIds: [],
                  customAmounts: {},
                  items: []
                });
              }}
              onTriggerToast={onTriggerToast}
            />
          )}
        </div>
      )}

      {/* ================= TAB 2: BONUS HISTORY ================= */}
      {activeTab === "history" && (
        <BonusHistoryTable
          bonuses={bonusesList}
          currentUser={currentUser}
          onTriggerToast={onTriggerToast}
          onEditDraft={(draft) => {
            setBonusConfig({
              ...bonusConfig,
              ...draft
            });
            setActiveTab("give");
            setCurrentStep(draft.step || 2);
          }}
        />
      )}
    </div>
  );
};

export default BonusPage;
