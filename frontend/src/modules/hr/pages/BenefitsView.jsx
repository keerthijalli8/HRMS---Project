import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { formatCurrency } from '../utils/format.js';
import { BenefitsSelector } from '../components/BenefitsSelector.jsx';
import {
  getCompanyById,
  getCompanyConfig,
  getComponents,
  addComponent,
  updateComponent,
  toggleComponentStatus,
  deleteComponent,
  isComponentAssigned,
  getHealthInsurance,
  updateHealthInsurance,
  getEnrollments,
  enrollEmployee,
  unenrollEmployee,
  getEmployeeStructures,
  getEmployeeStructure,
  saveEmployeeStructure,
  getChangeHistory,
  getPresetLibrary,
  subscribeCompanyStore
} from '../data/companyStore.js';
import {
  buildPayrollConfigExport,
  downloadPayrollConfigJson
} from '../services/payrollConfigExport.js';
import { employeeData } from '../data/mockData.js';
import { BonusStepper } from '../components/bonus/BonusStepper.jsx';
import { EmployeePicker } from '../components/bonus/EmployeePicker.jsx';
import { BonusDetailsForm } from '../components/bonus/BonusDetailsForm.jsx';
import { BonusReview } from '../components/bonus/BonusReview.jsx';
import { BonusHistoryTable } from '../components/bonus/BonusHistoryTable.jsx';
import {
  getBonuses,
  subscribeBonuses,
  getDraft,
  clearDraft,
  saveDraft,
  getBonusSummaryStats
} from '../services/bonusService.js';
import { isHRorAdmin } from '../services/teamService.js';
import { formatINR } from '../utils/renderValue.js';

export const BenefitsView = ({ currentUser, onTriggerToast, setCurrentRoute, onNavigate }) => {
  const companyId = currentUser?.companyId || "NEX-IND";
  const company = getCompanyById(companyId);

  const isHrOrAdmin = isHRorAdmin(currentUser);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab");
        if (tabParam === "bonus" && isHrOrAdmin) return "bonus";
        if (tabParam === "allowances" || tabParam === "components") return "allowances";
        if (tabParam && ["insurance", "structure", "export"].includes(tabParam)) return tabParam;
      } catch (e) {}
    }
    return "allowances";
  });

  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab");
        if (tabParam === "bonus" && isHrOrAdmin) {
          setActiveTab("bonus");
        } else if (tabParam === "insurance" || tabParam === "structure" || tabParam === "export") {
          setActiveTab(tabParam);
        } else {
          setActiveTab("allowances");
        }
      } catch (e) {}
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHrOrAdmin]);

  const handleTabChange = (newTab) => {
    if (newTab === "bonus" && !isHrOrAdmin) {
      onTriggerToast?.("Permission denied: HR access required for Bonus");
      return;
    }
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.pathname = "/hr/benefits-allowances";
        url.searchParams.set("tab", newTab);
        window.history.pushState({}, "", url.toString());
      } catch (e) {}
    }
  };

  const [bonusesList, setBonusesList] = useState(() => getBonuses());
  const [bonusStats, setBonusStats] = useState(() => getBonusSummaryStats());
  const [isGiveBonusOpen, setIsGiveBonusOpen] = useState(false);
  const [currentBonusStep, setCurrentBonusStep] = useState(1);
  const [savedDraft, setSavedDraft] = useState(null);

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

  useEffect(() => {
    const unsub = subscribeBonuses(() => {
      setBonusesList(getBonuses());
      setBonusStats(getBonusSummaryStats());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const draft = getDraft();
    if (draft && draft.name) {
      setSavedDraft(draft);
    }
  }, []);

  const handleResumeDraft = () => {
    if (savedDraft) {
      setBonusConfig(prev => ({
        ...prev,
        ...savedDraft
      }));
      if (savedDraft.step) {
        setCurrentBonusStep(savedDraft.step);
      }
      setIsGiveBonusOpen(true);
      setSavedDraft(null);
      onTriggerToast?.("Resumed draft bonus allocation.");
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setSavedDraft(null);
    onTriggerToast?.("Draft discarded.");
  };

  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeCompanyStore(() => {
      setStoreVersion(v => v + 1);
    });
    return unsubscribe;
  }, [companyId]);

  const components = useMemo(() => getComponents(companyId), [companyId, storeVersion]);
  const healthInsurance = useMemo(() => getHealthInsurance(companyId), [companyId, storeVersion]);
  const enrollments = useMemo(() => getEnrollments(companyId), [companyId, storeVersion]);
  const employeeStructures = useMemo(() => getEmployeeStructures(companyId), [companyId, storeVersion]);
  const changeHistory = useMemo(() => getChangeHistory(companyId), [companyId, storeVersion]);
  const presetLibrary = useMemo(() => getPresetLibrary(), []);

  const companyEmployees = useMemo(() => {
    let list = [...employeeData.filter(e => (e.companyId || "NEX-IND") === companyId)];
    try {
      const raw = localStorage.getItem("hrms_registered_users");
      if (raw) {
        const registered = JSON.parse(raw);
        for (const reg of registered) {
          const regCompany = reg.companyId || "NEX-IND";
          if (regCompany === companyId && !list.some(e => e.id === reg.employeeId)) {
            list.push({
              id: reg.employeeId,
              name: reg.name || `${reg.firstName} ${reg.lastName}`,
              email: reg.email,
              companyId: regCompany,
              dept: reg.dept || "Engineering",
              role: reg.role || "Software Engineer",
              status: "Active"
            });
          }
        }
      }
    } catch (e) {}
    return list;
  }, [companyId, storeVersion]);

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [selectedLibraryKeys, setSelectedLibraryKeys] = useState([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'Earning',
    calcType: 'Fixed amount',
    value: '',
    frequency: 'Monthly',
    taxable: true,
    eligibility: 'All employees'
  });
  const [editingComponent, setEditingComponent] = useState(null);
  const [viewingComponent, setViewingComponent] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [insuranceForm, setInsuranceForm] = useState(() => ({ ...healthInsurance }));
  useEffect(() => {
    setInsuranceForm({ ...healthInsurance });
  }, [healthInsurance]);

  const [enrollModalEmployee, setEnrollModalEmployee] = useState(null);
  const [enrollDependents, setEnrollDependents] = useState([]);
  const [assignModalEmployee, setAssignModalEmployee] = useState(null);
  const [assignStructureState, setAssignStructureState] = useState([]);

  const handleOpenLibrary = () => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    const existingKeys = new Set(components.map(c => c.key));
    const available = presetLibrary.filter(item => !existingKeys.has(item.key));
    setSelectedLibraryKeys([]);
    setIsLibraryModalOpen(true);
  };

  const handleSaveLibraryComponents = () => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    if (selectedLibraryKeys.length === 0) {
      setIsLibraryModalOpen(false);
      return;
    }

    selectedLibraryKeys.forEach(key => {
      const preset = presetLibrary.find(p => p.key === key);
      if (preset) {
        addComponent(companyId, {
          key: preset.key,
          name: preset.name,
          category: preset.category,
          calcType: preset.calcType,
          value: preset.defaultValue,
          frequency: preset.frequency,
          taxable: preset.taxable,
          eligibility: preset.eligibility,
          note: preset.note || "",
          active: true
        }, currentUser);
      }
    });

    onTriggerToast(`Added ${selectedLibraryKeys.length} component(s) from preset library`);
    setIsLibraryModalOpen(false);
  };

  const handleSaveCustomComponent = (e) => {
    e.preventDefault();
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    if (!customForm.name.trim()) {
      onTriggerToast("Component name is required");
      return;
    }

    addComponent(companyId, {
      name: customForm.name.trim(),
      category: customForm.category,
      calcType: customForm.calcType,
      value: customForm.value.trim() || "0",
      frequency: customForm.frequency,
      taxable: customForm.taxable,
      eligibility: customForm.eligibility,
      active: true
    }, currentUser);

    onTriggerToast(`Created custom component: ${customForm.name}`);
    setCustomForm({
      name: '',
      category: 'Earning',
      calcType: 'Fixed amount',
      value: '',
      frequency: 'Monthly',
      taxable: true,
      eligibility: 'All employees'
    });
    setIsCustomModalOpen(false);
  };

  const handleSaveEditComponent = (e) => {
    e.preventDefault();
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    const target = viewingComponent || editingComponent;
    if (!target) return;

    updateComponent(companyId, target.id, {
      name: target.name,
      value: target.value,
      frequency: target.frequency,
      taxable: target.taxable,
      eligibility: target.eligibility,
      active: target.active
    }, currentUser);

    onTriggerToast(`Updated component: ${target.name}`);
    setEditingComponent(null);
    setViewingComponent(null);
  };

  const handleToggleComponent = (comp) => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    toggleComponentStatus(companyId, comp.id, currentUser);
    onTriggerToast(`Component "${comp.name}" is now ${!comp.active ? 'Active' : 'Inactive'}`);
  };

  const handleRequestDelete = (comp) => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    setDeleteConfirmation(comp);
  };

  const handleConfirmDelete = () => {
    if (!isHrOrAdmin || !deleteConfirmation) return;
    deleteComponent(companyId, deleteConfirmation.id, currentUser);
    onTriggerToast(`Deleted component "${deleteConfirmation.name}"`);
    setDeleteConfirmation(null);
  };

  const handleSaveInsuranceConfig = (e) => {
    e.preventDefault();
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }

    updateHealthInsurance(companyId, insuranceForm, currentUser);
    onTriggerToast("Health insurance policy configuration saved");
  };

  const handleOpenEnrollModal = (employee) => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    if (!healthInsurance.enabled) {
      onTriggerToast("Cannot enroll: Group Health Insurance is disabled for this company.");
      return;
    }

    const currentEnrollment = enrollments[employee.id];
    setEnrollModalEmployee(employee);
    if (currentEnrollment && currentEnrollment.dependents) {
      setEnrollDependents([...currentEnrollment.dependents]);
    } else {
      setEnrollDependents([
        { name: employee.name, relation: "Self", age: 30 }
      ]);
    }
  };

  const handleAddDependentRow = () => {
    const allowed = healthInsurance.dependentsCovered || ["Self"];
    const fallbackRelation = allowed.find(r => r !== "Self") || "Spouse";
    setEnrollDependents(prev => [
      ...prev,
      { name: "", relation: fallbackRelation, age: 25 }
    ]);
  };

  const handleRemoveDependentRow = (index) => {
    setEnrollDependents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEnrollment = () => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    if (!enrollModalEmployee) return;

    const valid = enrollDependents.filter(d => d.name.trim().length > 0);
    if (valid.length === 0) {
      onTriggerToast("Please specify at least 1 covered member");
      return;
    }

    enrollEmployee(companyId, enrollModalEmployee.id, valid, currentUser);
    onTriggerToast(`Enrolled ${enrollModalEmployee.name} in Health Insurance`);
    setEnrollModalEmployee(null);
  };

  const handleUnenroll = (empId, name) => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    unenrollEmployee(companyId, empId, currentUser);
    onTriggerToast(`Removed insurance enrollment for ${name}`);
  };

  const handleOpenAssignModal = (employee) => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    const currentStructure = getEmployeeStructure(companyId, employee.id);
    const activeEarningsAndBenefits = components.filter(c => c.active && (c.category === "Earning" || c.category === "Benefit"));

    const stateList = activeEarningsAndBenefits.map(comp => {
      const existing = currentStructure.find(s => s.componentKey === comp.key);
      return {
        componentKey: comp.key,
        componentName: comp.name,
        category: comp.category,
        calcType: comp.calcType,
        defaultValue: comp.value,
        enabled: existing ? existing.enabled : true,
        overrideValue: existing ? existing.overrideValue || "" : ""
      };
    });

    setAssignModalEmployee(employee);
    setAssignStructureState(stateList);
  };

  const handleSaveEmployeeStructure = () => {
    if (!isHrOrAdmin) {
      onTriggerToast("Permission denied: HR access required");
      return;
    }
    if (!assignModalEmployee) return;

    const payload = assignStructureState.map(item => ({
      componentKey: item.componentKey,
      enabled: Boolean(item.enabled),
      overrideValue: (item.overrideValue || "").trim()
    }));

    saveEmployeeStructure(companyId, assignModalEmployee.id, payload, currentUser);
    onTriggerToast(`Assigned salary structure for ${assignModalEmployee.name}`);
    setAssignModalEmployee(null);
  };

  if (!isHrOrAdmin) {
    const myEmpId = currentUser?.employeeId || "EMP-1042";
    const myStructure = getEmployeeStructure(companyId, myEmpId);
    const myInsurance = enrollments[myEmpId];

    const myItems = components
      .filter(c => c.active && (c.category === "Earning" || c.category === "Benefit"))
      .map(comp => {
        const assigned = myStructure.find(s => s.componentKey === comp.key);
        const isEnabled = assigned ? assigned.enabled : true;
        const override = assigned?.overrideValue || "";
        return {
          ...comp,
          isEnabled,
          override
        };
      })
      .filter(item => item.isEnabled);

    return (
      <div className="flex flex-col gap-5">
        <div className="glass-card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-line">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-ink text-xl">Benefits & Allowances</h1>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
                Read-Only View
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Company-assigned compensation components and medical insurance for <span className="text-ink font-semibold">{company.name}</span> ({company.city}, {company.state})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Employee ID:</span>
            <span className="text-xs font-data font-bold text-accent bg-surface2 px-2.5 py-1 rounded-lg border border-line">
              {myEmpId}
            </span>
          </div>
        </div>

        <BenefitsSelector currentUser={currentUser} onTriggerToast={onTriggerToast} />

        <div className="glass-card flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <Icon name="shield" className="w-4 h-4 text-accent" />
              <h2 className="font-display font-bold text-ink text-base">Group Health Insurance</h2>
            </div>
            {myInsurance?.enrolled ? (
              <span className="glass-pill px-2.5 py-0.5 text-xs text-good font-semibold border border-good/40">
                Active Policy
              </span>
            ) : (
              <span className="glass-pill px-2.5 py-0.5 text-xs text-muted border border-line">
                Not Enrolled
              </span>
            )}
          </div>

          {myInsurance?.enrolled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[11px]">Insurance Provider</span>
                <span className="font-semibold text-ink text-sm block mt-0.5">{healthInsurance.provider || "Star Health"}</span>
                <span className="text-[10px] text-muted font-num mt-0.5 block">Policy: {healthInsurance.policyNumber || "--"}</span>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[11px]">Sum Insured</span>
                <span className="font-semibold text-good text-sm block mt-0.5 font-num">
                  {formatCurrency(healthInsurance.sumInsured || 0)}
                </span>
                <span className="text-[10px] text-muted mt-0.5 block">Annual Family Floater</span>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[11px]">Health Card ID</span>
                <span className="font-bold text-accent text-sm block mt-0.5 font-data">
                  {myInsurance.cardNumber}
                </span>
                <span className="text-[10px] text-muted mt-0.5 block">Issued: {myInsurance.enrolledAt || "Active"}</span>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line">
                <span className="text-muted block text-[11px]">Policy Validity Period</span>
                <span className="font-semibold text-ink text-xs block mt-0.5 font-data">
                  {healthInsurance.policyStartDate || "01 Apr 2026"} to {healthInsurance.policyEndDate || "31 Mar 2027"}
                </span>
                <span className="text-[10px] text-accent mt-0.5 block">
                  Premium: {healthInsurance.premiumPaidBy === "Shared" ? `Shared (${healthInsurance.employeeSharePercent}% employee)` : "100% Company Paid"}
                </span>
              </div>

              <div className="md:col-span-2 lg:col-span-4 p-3 rounded-xl bg-surface2/30 border border-line/60">
                <span className="text-muted text-[11px] font-medium block mb-2">Covered Family Members ({myInsurance.dependents?.length || 0}):</span>
                <div className="flex flex-wrap gap-2">
                  {myInsurance.dependents && myInsurance.dependents.length > 0 ? (
                    myInsurance.dependents.map((dep, idx) => (
                      <div key={idx} className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-line text-xs flex items-center gap-2">
                        <span className="font-medium text-ink">{dep.name}</span>
                        <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                          {dep.relation} ({dep.age}y)
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted text-xs italic">Self only</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface2/30 border border-line text-xs text-muted flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">You are currently not enrolled in company health insurance.</p>
                <p className="text-[11px] mt-0.5">Please contact your HR department ({company.name}) to check eligibility and submit family member details.</p>
              </div>
              <SecondaryButton onClick={() => onTriggerToast("Enquiry submitted to HR desk")}>
                Inquire with HR
              </SecondaryButton>
            </div>
          )}
        </div>

        <div className="glass-card flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div>
              <h2 className="font-display font-bold text-ink text-base">My Allowances & Entitlements</h2>
              <p className="text-xs text-muted">Components active under your individual compensation structure</p>
            </div>
            <span className="text-xs text-muted">{myItems.length} Active Items</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {myItems.map(item => (
              <div key={item.id} className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col justify-between gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-ink text-sm block">{item.name}</span>
                    <span className="text-[11px] text-muted">{item.calcType}</span>
                  </div>
                  <span className="text-xs font-medium text-ink">
                    {item.category}
                  </span>
                </div>

                <div className="pt-2 border-t border-line/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Value / Entitlement</span>
                    <span className="font-bold text-ink font-data text-xs">
                      {item.override ? (
                        <span className="text-good font-semibold flex items-center gap-1">
                          {item.override.startsWith("₹") || item.override.endsWith("%") ? item.override : `₹${item.override}`}
                          <span className="text-[9.5px] bg-good/15 text-good px-1 rounded">Personal Override</span>
                        </span>
                      ) : (
                        item.value.startsWith("₹") || item.value.endsWith("%") || item.value === "Balancing figure" || item.value.startsWith("Sum") ? item.value : `₹${item.value}`
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted font-medium capitalize">{item.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeEarnings = components.filter(c => c.active && c.category === "Earning").length;
  const activeBenefits = components.filter(c => c.active && c.category === "Benefit").length;
  const activeStatutory = components.filter(c => c.active && c.category === "Deduction").length;
  const enrolledEmployeesCount = Object.values(enrollments).filter(e => e.enrolled).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-line">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-ink text-xl">Benefits & Allowances</h1>
            <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-data font-semibold">
              {currentUser?.systemRole || "HR"} Mode
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Compensation components, group health insurance & employee structures for <span className="text-ink font-semibold">{company.name}</span> ({company.city}, {company.state})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-surface2/60 p-1 rounded-xl border border-line/80 text-xs">
            {[
              { id: "allowances", label: "Allowances" },
              ...(isHrOrAdmin ? [{ id: "bonus", label: "Bonus" }] : []),
              { id: "insurance", label: "Health Insurance" },
              { id: "structure", label: "Employee Structure" },
              { id: "export", label: "Export", icon: "download" }
            ].map(tab => {
              const isSelected = activeTab === tab.id || (tab.id === "allowances" && activeTab === "components");
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-accent text-on-accent shadow-sm"
                      : "text-muted hover:text-ink hover:bg-surface2"
                  }`}
                >
                  {tab.icon && (
                    <Icon name={tab.icon} className={`w-3.5 h-3.5 ${isSelected ? "text-on-accent" : "text-muted"}`} />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= TAB 1: ALLOWANCES & SALARY COMPONENTS ================= */}
      {(activeTab === "allowances" || activeTab === "components") && (
        <div className="flex flex-col gap-5">
          <BenefitsSelector currentUser={currentUser} onTriggerToast={onTriggerToast} />

          <div className="glass-card !p-4 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-ink text-sm">
                Advanced Customization
              </h3>
              <p className="text-xs text-muted">
                Add enterprise components from the preset library or create tailored allowances
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SecondaryButton icon="filter" onClick={handleOpenLibrary}>
                Add from Library
              </SecondaryButton>
              <PrimaryButton icon="user-plus" onClick={() => setIsCustomModalOpen(true)}>
                Add Custom Component
              </PrimaryButton>
            </div>
          </div>

          {/* Master Table with Clean Text Type, Taxable & Status Eye Icon */}
          <div className="glass-card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Component Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Calculation Rule</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Taxable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {components.map((comp) => {
                    const isStatutory = comp.category === "Deduction" || comp.calcType === "Statutory";
                    return (
                      <tr key={comp.id} className="hover:bg-surface2/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-ink">{comp.name}</div>
                          <div className="text-[10px] text-muted font-data">{comp.key}</div>
                          {comp.note && (
                            <div className="text-[10px] text-warn/80 italic mt-0.5">{comp.note}</div>
                          )}
                        </td>
                        {/* Clean Type (No box) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-ink">
                            {comp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted">{comp.calcType}</td>
                        <td className="py-3 px-4 text-muted">{comp.frequency}</td>
                        {/* Clean Taxable (No box) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-xs font-medium ${comp.taxable ? "text-ink" : "text-muted"}`}>
                            {comp.taxable ? "Taxable" : "Exempt"}
                          </span>
                        </td>
                        {/* Status Column with Eye Icon to Open View/Edit Modal */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingComponent({ ...comp })}
                            className="p-1.5 rounded-lg bg-surface2/60 border border-line text-muted hover:text-accent hover:border-accent transition inline-flex items-center justify-center cursor-pointer shadow-sm"
                            title="View / Edit component details"
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isStatutory && (
                              <button
                                onClick={() => setEditingComponent({ ...comp })}
                                className="p-1.5 rounded-lg bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition cursor-pointer"
                                title="Edit component"
                              >
                                <Icon name="settings" className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isStatutory && (
                              <button
                                onClick={() => handleRequestDelete(comp)}
                                className="p-1.5 rounded-lg bg-surface2 border border-line text-bad/80 hover:text-bad hover:border-bad transition cursor-pointer"
                                title="Delete component"
                              >
                                <Icon name="x" className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isStatutory && (
                              <span className="text-[10px] text-muted italic">Statutory</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-sm">Configuration Change Audit History</h3>
              </div>
              <span className="text-xs text-muted font-data">{changeHistory.length} event(s) logged</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto text-xs pr-1">
              {changeHistory.map((item) => (
                <div key={item.id} className="p-2 rounded-lg bg-surface2/40 border border-line flex items-center justify-between gap-3 text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-accent">{item.who}</span>
                    <span className="text-muted">·</span>
                    <span className="text-ink">{item.what}</span>
                  </div>
                  <span className="text-[10px] text-muted font-data shrink-0">{item.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: BONUS ================= */}
      {activeTab === "bonus" && isHrOrAdmin && (
        <div className="flex flex-col gap-5 animate-in fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="glass-card !p-3.5 border border-line flex flex-col justify-between">
              <span className="text-[10.5px] text-muted block uppercase font-semibold">Total Bonuses Given (This Year)</span>
              <span className="font-num font-extrabold text-xl text-ink mt-1 block">
                {bonusStats.totalBonusesGivenThisYear} {bonusStats.totalBonusesGivenThisYear === 1 ? "Disbursal" : "Disbursals"}
              </span>
            </div>

            <div className="glass-card !p-3.5 border border-line flex flex-col justify-between">
              <span className="text-[10.5px] text-muted block uppercase font-semibold">Total Disbursed / Approved</span>
              <span className="font-num font-extrabold text-xl text-accent mt-1 block">
                {formatINR(bonusStats.totalAmountThisYear)}
              </span>
            </div>

            <div className="glass-card !p-3.5 border border-line flex flex-col justify-between">
              <span className="text-[10.5px] text-muted block uppercase font-semibold">Pending Approvals</span>
              <span className="font-num font-extrabold text-xl text-warn mt-1 block">
                {bonusStats.pendingApprovalsCount} {bonusStats.pendingApprovalsCount === 1 ? "Record" : "Records"}
              </span>
            </div>

            <div className="glass-card !p-3.5 border border-line flex flex-col justify-between">
              <span className="text-[10.5px] text-muted block uppercase font-semibold">Last Bonus Date</span>
              <span className="font-bold text-sm text-ink mt-1 block">
                {bonusStats.lastBonusDate}
              </span>
            </div>
          </div>

          <div className="glass-card !p-4 border border-accent/40 bg-gradient-to-r from-accent/15 via-surface2/60 to-accent2/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-ink text-base sm:text-lg">
                  Employee Bonus & Incentive Allocation
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-wider">
                  Selective
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Allocate performance, festive, spot, and retention bonuses to designated team members with live TDS impact and payroll run integration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsGiveBonusOpen(!isGiveBonusOpen)}
              aria-label="Bonus"
              title="Bonus"
              className="px-5 py-2.5 rounded-xl bg-accent text-on-accent hover:opacity-95 font-bold text-xs flex items-center justify-center transition cursor-pointer shadow-lg shrink-0"
            >
              <span>{isGiveBonusOpen ? "Close Wizard" : "Bonus"}</span>
            </button>
          </div>

          {savedDraft && !isGiveBonusOpen && (
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
                  className="px-3.5 py-1.5 rounded-lg bg-accent text-on-accent font-bold text-xs hover:opacity-95 cursor-pointer shadow-sm"
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

          {isGiveBonusOpen && (
            <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-5 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-ink text-sm">
                    Active Bonus Allocation Wizard — Step {currentBonusStep} of 3
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGiveBonusOpen(false)}
                  className="text-xs text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                  <span>Minimize Wizard</span>
                </button>
              </div>

              <BonusStepper
                currentStep={currentBonusStep}
                onStepClick={(step) => setCurrentBonusStep(step)}
              />

              {currentBonusStep === 1 && (
                <EmployeePicker
                  selectedEmployeeIds={bonusConfig.selectedEmployeeIds}
                  onSelectionChange={(ids) => {
                    setBonusConfig(prev => ({
                      ...prev,
                      selectedEmployeeIds: ids
                    }));
                    saveDraft({
                      ...bonusConfig,
                      selectedEmployeeIds: ids,
                      step: 1
                    });
                  }}
                  onContinue={() => setCurrentBonusStep(2)}
                  currentUser={currentUser}
                />
              )}

              {currentBonusStep === 2 && (
                <BonusDetailsForm
                  bonusConfig={bonusConfig}
                  onChange={(updated) => {
                    setBonusConfig(updated);
                    saveDraft({
                      ...updated,
                      step: 2
                    });
                  }}
                  onBack={() => setCurrentBonusStep(1)}
                  onContinue={() => setCurrentBonusStep(3)}
                  selectedEmployeeIds={bonusConfig.selectedEmployeeIds}
                />
              )}

              {currentBonusStep === 3 && (
                <BonusReview
                  bonusConfig={bonusConfig}
                  currentUser={currentUser}
                  onBack={() => setCurrentBonusStep(2)}
                  onComplete={() => {
                    setIsGiveBonusOpen(false);
                    setCurrentBonusStep(1);
                    clearDraft();
                    setSavedDraft(null);
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
                    setBonusesList(getBonuses());
                    setBonusStats(getBonusSummaryStats());
                    onTriggerToast?.("Bonus successfully allocated!");
                  }}
                  onTriggerToast={onTriggerToast}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Bonus History & Audit Trail</h3>
                <span className="glass-pill px-2 py-0.5 text-xs text-muted font-num">
                  {bonusesList.length} Records
                </span>
              </div>
            </div>

            <BonusHistoryTable
              bonuses={bonusesList}
              currentUser={currentUser}
              onTriggerToast={onTriggerToast}
              onEditDraft={(draft) => {
                setBonusConfig(prev => ({
                  ...prev,
                  ...draft
                }));
                setCurrentBonusStep(draft.step || 2);
                setIsGiveBonusOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ================= TAB 2: HEALTH INSURANCE ================= */}
      {activeTab === "insurance" && (
        <div className="flex flex-col gap-5">
          <form onSubmit={handleSaveInsuranceConfig} className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="shield" className="w-5 h-5 text-accent" />
                <div>
                  <h2 className="font-display font-bold text-ink text-base">Corporate Group Health Insurance Policy</h2>
                  <p className="text-xs text-muted">Master policy rules governing employee family medical cover</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-ink">
                  {insuranceForm.enabled ? "Policy Active" : "Policy Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => setInsuranceForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${insuranceForm.enabled ? 'bg-accent' : 'bg-surface2 border border-line'}`}
                >
                  <span className={`w-4.5 h-4.5 rounded-full bg-bg absolute top-0.5 transition-transform ${insuranceForm.enabled ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {insuranceForm.enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-muted block mb-1">Insurance Provider *</label>
                  <input
                    type="text"
                    value={insuranceForm.provider || ""}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                    placeholder="e.g. Star Health & Allied Insurance"
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Master Policy Number *</label>
                  <input
                    type="text"
                    value={insuranceForm.policyNumber || ""}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                    placeholder="e.g. STAR-POL-883912"
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Sum Insured (₹) *</label>
                  <input
                    type="number"
                    value={insuranceForm.sumInsured || ""}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, sumInsured: Number(e.target.value) })}
                    placeholder="500000"
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Premium Paid By *</label>
                  <select
                    value={insuranceForm.premiumPaidBy || "Company"}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, premiumPaidBy: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="Company">Company (100% Employer)</option>
                    <option value="Employee">Employee (100% Deducted)</option>
                    <option value="Shared">Shared (Employer + Employee)</option>
                  </select>
                </div>

                {insuranceForm.premiumPaidBy === "Shared" && (
                  <div>
                    <label className="text-muted block mb-1">Employee Share (%) *</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={insuranceForm.employeeSharePercent || 30}
                      onChange={(e) => setInsuranceForm({ ...insuranceForm, employeeSharePercent: Number(e.target.value) })}
                      className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                    />
                  </div>
                )}

                <div>
                  <label className="text-muted block mb-1">Eligibility Period</label>
                  <select
                    value={insuranceForm.eligibility || "From joining date"}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, eligibility: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="From joining date">From joining date</option>
                    <option value="After 1 month of service">After 1 month of service</option>
                    <option value="After 3 months of service">After 3 months of service</option>
                    <option value="After 6 months of service">After 6 months of service</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1">Policy Start Date</label>
                  <input
                    type="date"
                    value={insuranceForm.policyStartDate || ""}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyStartDate: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Policy End Date</label>
                  <input
                    type="date"
                    value={insuranceForm.policyEndDate || ""}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyEndDate: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-4 p-3 rounded-xl bg-surface2/40 border border-line">
                  <label className="text-muted block text-xs font-semibold mb-2">Allowed Dependents Covered Under Float Policy:</label>
                  <div className="flex flex-wrap gap-4 text-xs">
                    {["Self", "Spouse", "Children", "Parents"].map(rel => {
                      const isChecked = (insuranceForm.dependentsCovered || []).includes(rel);
                      return (
                        <label key={rel} className="flex items-center gap-2 cursor-pointer text-ink">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = insuranceForm.dependentsCovered || [];
                              if (e.target.checked) {
                                setInsuranceForm({ ...insuranceForm, dependentsCovered: [...current, rel] });
                              } else {
                                setInsuranceForm({ ...insuranceForm, dependentsCovered: current.filter(r => r !== rel) });
                              }
                            }}
                            className="w-4 h-4 rounded text-accent bg-surface2 border-line"
                          />
                          <span>{rel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                  <PrimaryButton icon="check" type="submit">
                    Save Policy Configuration
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface2/30 border border-line text-xs text-muted flex items-center justify-between">
                <span>Group Health Insurance is currently <strong>disabled</strong> for {company.name}. Enrollments cannot be added while disabled.</span>
                <PrimaryButton icon="check" type="submit">
                  Save Disabled State
                </PrimaryButton>
              </div>
            )}
          </form>

          <div className="glass-card flex flex-col gap-3 !p-0 overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Employee Insurance Enrollments</h3>
                <p className="text-xs text-muted">
                  {enrolledEmployeesCount} of {companyEmployees.length} employees enrolled
                </p>
              </div>
              {!healthInsurance.enabled && (
                <span className="text-xs text-warn font-semibold">
                  Enrollment blocked (Insurance disabled)
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Health Card ID</th>
                    <th className="py-3 px-4">Covered Members</th>
                    <th className="py-3 px-4 text-right">Enrollment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {companyEmployees.map(emp => {
                    const enroll = enrollments[emp.id];
                    const isEnrolled = Boolean(enroll && enroll.enrolled);

                    return (
                      <tr key={emp.id} className="hover:bg-surface2/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={emp.name} />
                            <div>
                              <div className="font-semibold text-ink">{emp.name}</div>
                              <div className="text-[11px] text-muted">{emp.id} · {emp.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isEnrolled ? "bg-good/15 text-good border border-good/30" : "bg-surface2 text-muted border border-line"}`}>
                            {isEnrolled ? "Enrolled" : "Not Enrolled"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-data font-bold text-accent">
                          {isEnrolled ? enroll.cardNumber : "—"}
                        </td>
                        <td className="py-3 px-4 text-muted text-[11px]">
                          {isEnrolled && enroll.dependents ? (
                            <div className="flex flex-wrap gap-1">
                              {enroll.dependents.map((d, di) => (
                                <span key={di} className="bg-surface2 px-1.5 py-0.5 rounded text-[10px] text-ink border border-line">
                                  {d.name} ({d.relation})
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isEnrolled ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <SecondaryButton onClick={() => handleOpenEnrollModal(emp)}>
                                Edit Members
                              </SecondaryButton>
                              <button
                                onClick={() => handleUnenroll(emp.id, emp.name)}
                                className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-bad hover:bg-bad/15 transition cursor-pointer text-xs"
                              >
                                Unenroll
                              </button>
                            </div>
                          ) : (
                            <PrimaryButton
                              disabled={!healthInsurance.enabled}
                              onClick={() => handleOpenEnrollModal(emp)}
                            >
                              Enroll
                            </PrimaryButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: EMPLOYEE STRUCTURE ================= */}
      {activeTab === "structure" && (
        <div className="glass-card flex flex-col gap-4 !p-0 overflow-hidden">
          <div className="p-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-ink text-base">Employee Compensation Structures</h2>
              <p className="text-xs text-muted">
                Assign and override component allowances on a per-employee basis for {company.name}
              </p>
            </div>
            <div className="text-xs text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-xl font-medium">
              Configuration Only · No payroll calculations executed here
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Assigned Components</th>
                  <th className="py-3 px-4">Individual Overrides</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {companyEmployees.map(emp => {
                  const struct = employeeStructures[emp.id] || [];
                  const activeCount = struct.filter(s => s.enabled).length;
                  const overrideCount = struct.filter(s => s.enabled && s.overrideValue).length;

                  return (
                    <tr key={emp.id} className="hover:bg-surface2/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name} />
                          <div>
                            <div className="font-semibold text-ink">{emp.name}</div>
                            <div className="text-[11px] text-muted font-data">{emp.id} · {emp.dept}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">{emp.role}</td>
                      <td className="py-3 px-4">
                        <span className="font-data font-semibold text-ink">
                          {activeCount > 0 ? `${activeCount} components` : "Using company defaults"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {overrideCount > 0 ? (
                          <span className="glass-pill px-2 py-0.5 text-good font-semibold text-[10.5px]">
                            {overrideCount} override(s)
                          </span>
                        ) : (
                          <span className="text-muted text-[11px]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <SecondaryButton icon="settings" onClick={() => handleOpenAssignModal(emp)}>
                          Assign Structure
                        </SecondaryButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: EXPORT ================= */}
      {activeTab === "export" && (
        <div className="glass-card flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="download" className="w-5 h-5 text-accent" />
                <h2 className="font-display font-bold text-ink text-base">Export Payroll Configuration</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Hand this file or schema to the payroll team for integration. Conforms strictly to <code className="text-accent bg-surface2 px-1 rounded font-mono text-[11px]">docs/payroll-config-schema.md</code>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SecondaryButton
                icon="file-text"
                onClick={() => {
                  const exportJson = JSON.stringify(buildPayrollConfigExport(companyId), null, 2);
                  navigator.clipboard.writeText(exportJson);
                  onTriggerToast("Copied payroll configuration JSON to clipboard");
                }}
              >
                Copy JSON
              </SecondaryButton>
              <PrimaryButton
                icon="download"
                onClick={() => downloadPayrollConfigJson(companyId)}
              >
                Download JSON
              </PrimaryButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-2 right-2 text-[10px] text-muted font-mono uppercase bg-surface2 px-2 py-1 rounded border border-line">
              payroll-config-{company.code}.json
            </div>
            <pre className="p-4 rounded-xl bg-[#030d13]/90 border border-line text-accent font-mono text-[11px] leading-relaxed max-h-[500px] overflow-auto select-all">
              {JSON.stringify(buildPayrollConfigExport(companyId), null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ================= VIEW / EDIT COMPONENT MODAL (WITH NEAT STATUS SWITCH) ================= */}
      {viewingComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveEditComponent} className="glass-card max-w-md w-full !p-5 border border-line shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Component Details</h3>
                <span className="text-[11px] text-accent font-data">{viewingComponent.key}</span>
              </div>
              <button type="button" onClick={() => setViewingComponent(null)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Component Name</label>
                <input
                  type="text"
                  value={viewingComponent.name}
                  onChange={(e) => setViewingComponent({ ...viewingComponent, name: e.target.value })}
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Value / Rate</label>
                  <input
                    type="text"
                    value={viewingComponent.value}
                    onChange={(e) => setViewingComponent({ ...viewingComponent, value: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Cycle</label>
                  <select
                    value={viewingComponent.frequency}
                    onChange={(e) => setViewingComponent({ ...viewingComponent, frequency: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Eligibility</label>
                <input
                  type="text"
                  value={viewingComponent.eligibility}
                  onChange={(e) => setViewingComponent({ ...viewingComponent, eligibility: e.target.value })}
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              {/* Neater Status Switch Box */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface2/40 border border-line/80 mt-1">
                <div className="flex flex-col">
                  <span className="text-ink font-bold text-xs">Component Status</span>
                  <span className="text-[11px] text-muted">
                    {viewingComponent.active ? "Active (Included in payroll)" : "Inactive (Disabled)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingComponent({ ...viewingComponent, active: !viewingComponent.active })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${viewingComponent.active ? 'bg-accent' : 'bg-surface2 border border-line'}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-bg absolute top-0.5 transition-transform ${viewingComponent.active ? 'left-6.5' : 'left-0.5'}`} />
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={viewingComponent.taxable}
                  onChange={(e) => setViewingComponent({ ...viewingComponent, taxable: e.target.checked })}
                  className="w-4 h-4 rounded text-accent bg-surface2 border-line"
                />
                <span className="text-ink">Taxable Component</span>
              </label>
            </div>

            {/* Clean Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => setViewingComponent(null)}
                className="px-4 py-2 rounded-xl bg-surface2/80 hover:bg-surface2 border border-line text-ink text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 1: ADD FROM LIBRARY ================= */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full !p-5 border border-line shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Add from Component Library</h3>
                <p className="text-xs text-muted">Select standard Indian IT components to adopt for {company.name}</p>
              </div>
              <button onClick={() => setIsLibraryModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1 text-xs">
              {presetLibrary.map(item => {
                const isAlreadyAdded = components.some(c => c.key === item.key);
                const isChecked = selectedLibraryKeys.includes(item.key);

                return (
                  <label
                    key={item.key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      isAlreadyAdded
                        ? "bg-surface2/20 border-line/40 opacity-50 cursor-not-allowed"
                        : isChecked
                        ? "bg-accent/15 border-accent text-ink"
                        : "bg-surface2/50 border-line text-muted hover:border-line"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={isAlreadyAdded}
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLibraryKeys([...selectedLibraryKeys, item.key]);
                          } else {
                            setSelectedLibraryKeys(selectedLibraryKeys.filter(k => k !== item.key));
                          }
                        }}
                        className="w-4 h-4 rounded text-accent"
                      />
                      <div>
                        <div className="font-semibold text-ink">{item.name}</div>
                        <div className="text-[10.5px] text-muted">{item.calcType} · Default: {item.defaultValue}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface2 border border-line">
                      {isAlreadyAdded ? "Already Added" : item.category}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <SecondaryButton onClick={() => setIsLibraryModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSaveLibraryComponents} disabled={selectedLibraryKeys.length === 0}>
                Add Selected ({selectedLibraryKeys.length})
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD CUSTOM COMPONENT ================= */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveCustomComponent} className="glass-card max-w-md w-full !p-5 border border-line shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <h3 className="font-display font-bold text-ink text-base">Create Custom Component</h3>
              <button type="button" onClick={() => setIsCustomModalOpen(false)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Component Name *</label>
                <input
                  type="text"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="e.g. Relocation Allowance"
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Category *</label>
                  <select
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="Earning">Earning</option>
                    <option value="Benefit">Benefit</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1">Calculation Type *</label>
                  <select
                    value={customForm.calcType}
                    onChange={(e) => setCustomForm({ ...customForm, calcType: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="Fixed amount">Fixed amount (₹)</option>
                    <option value="% of Basic">% of Basic</option>
                    <option value="% of Gross">% of Gross</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Default Value *</label>
                  <input
                    type="text"
                    value={customForm.value}
                    onChange={(e) => setCustomForm({ ...customForm, value: e.target.value })}
                    placeholder="e.g. 5000 or 10%"
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Frequency</label>
                  <select
                    value={customForm.frequency}
                    onChange={(e) => setCustomForm({ ...customForm, frequency: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={customForm.eligibility}
                  onChange={(e) => setCustomForm({ ...customForm, eligibility: e.target.value })}
                  placeholder="e.g. All employees or After 6 months"
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={customForm.taxable}
                  onChange={(e) => setCustomForm({ ...customForm, taxable: e.target.checked })}
                  className="w-4 h-4 rounded text-accent bg-surface2 border-line"
                />
                <span className="text-ink">Taxable under Indian Income Tax guidelines</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <SecondaryButton onClick={() => setIsCustomModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                Create Component
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 3: EDIT COMPONENT ================= */}
      {editingComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveEditComponent} className="glass-card max-w-md w-full !p-5 border border-line shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Edit Component</h3>
                <span className="text-[11px] text-accent font-data">{editingComponent.key}</span>
              </div>
              <button type="button" onClick={() => setEditingComponent(null)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Component Name</label>
                <input
                  type="text"
                  value={editingComponent.name}
                  onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-muted block mb-1">Value / Rate</label>
                  <input
                    type="text"
                    value={editingComponent.value}
                    onChange={(e) => setEditingComponent({ ...editingComponent, value: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                    required
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Cycle</label>
                  <select
                    value={editingComponent.frequency}
                    onChange={(e) => setEditingComponent({ ...editingComponent, frequency: e.target.value })}
                    className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Eligibility</label>
                <input
                  type="text"
                  value={editingComponent.eligibility}
                  onChange={(e) => setEditingComponent({ ...editingComponent, eligibility: e.target.value })}
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingComponent.taxable}
                  onChange={(e) => setEditingComponent({ ...editingComponent, taxable: e.target.checked })}
                  className="w-4 h-4 rounded text-accent bg-surface2 border-line"
                />
                <span className="text-ink">Taxable Component</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <SecondaryButton onClick={() => setEditingComponent(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                Save Changes
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 4: DELETE CONFIRMATION ================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-sm w-full !p-5 border border-bad/50 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-bad">
              <Icon name="alert-triangle" className="w-5 h-5 text-bad" />
              <h3 className="font-display font-bold text-ink text-base">Delete Component?</h3>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to delete <strong className="text-ink">{deleteConfirmation.name}</strong>?
            </p>

            {isComponentAssigned(companyId, deleteConfirmation.key) && (
              <div className="p-2.5 rounded-lg bg-bad/15 border border-bad/40 text-bad text-[11px] leading-tight">
                ⚠️ This component is currently assigned in one or more employee salary structures. Deleting it will remove it from all employee records.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </SecondaryButton>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg bg-bad text-white font-semibold text-xs hover:bg-bad/90 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: ENROLL EMPLOYEE IN INSURANCE ================= */}
      {enrollModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full !p-5 border border-line shadow-2xl flex flex-col gap-3.5 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Health Insurance Enrollment</h3>
                <p className="text-xs text-muted">{enrollModalEmployee.name} ({enrollModalEmployee.id})</p>
              </div>
              <button onClick={() => setEnrollModalEmployee(null)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-surface2/40 border border-line text-xs flex items-center justify-between">
              <div>
                <span className="text-muted block text-[10.5px]">Generated TPA Card Number</span>
                <span className="font-bold text-accent font-data">HI-{company.code}-{enrollModalEmployee.id}</span>
              </div>
              <span className="text-[10.5px] text-muted">
                Allowed: {(healthInsurance.dependentsCovered || []).join(", ")}
              </span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-56 pr-1 text-xs">
              <span className="text-muted font-semibold text-[11px]">Covered Family Members:</span>
              {enrollDependents.map((dep, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-surface2/50 border border-line flex items-center gap-2">
                  <input
                    type="text"
                    value={dep.name}
                    onChange={(e) => {
                      const updated = [...enrollDependents];
                      updated[idx].name = e.target.value;
                      setEnrollDependents(updated);
                    }}
                    placeholder="Full Name"
                    className="flex-1 bg-surface2 border border-line rounded px-2 py-1 text-ink focus:border-accent outline-none text-xs"
                    required
                  />

                  <select
                    value={dep.relation}
                    onChange={(e) => {
                      const updated = [...enrollDependents];
                      updated[idx].relation = e.target.value;
                      setEnrollDependents(updated);
                    }}
                    className="w-24 bg-surface2 border border-line rounded px-2 py-1 text-ink focus:border-accent outline-none text-xs"
                  >
                    {(healthInsurance.dependentsCovered || ["Self"]).map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={dep.age}
                    onChange={(e) => {
                      const updated = [...enrollDependents];
                      updated[idx].age = Number(e.target.value);
                      setEnrollDependents(updated);
                    }}
                    placeholder="Age"
                    className="w-14 bg-surface2 border border-line rounded px-2 py-1 text-ink focus:border-accent outline-none text-xs font-data"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveDependentRow(idx)}
                    className="text-bad hover:text-bad/80 p-1 cursor-pointer"
                    title="Remove"
                  >
                    <Icon name="x" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddDependentRow}
                className="w-full py-1.5 border border-dashed border-line hover:border-accent text-accent text-xs rounded-lg transition text-center cursor-pointer"
              >
                + Add Another Dependent
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <SecondaryButton onClick={() => setEnrollModalEmployee(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSaveEnrollment}>
                Confirm Enrollment
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: ASSIGN EMPLOYEE STRUCTURE ================= */}
      {assignModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full !p-5 border border-line shadow-2xl flex flex-col gap-3.5 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div>
                <h3 className="font-display font-bold text-ink text-base">Assign Salary Structure</h3>
                <p className="text-xs text-muted">{assignModalEmployee.name} ({assignModalEmployee.id}) · {assignModalEmployee.role}</p>
              </div>
              <button onClick={() => setAssignModalEmployee(null)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-muted italic bg-surface2/30 p-2 rounded-lg border border-line/40">
              Configuration only: customize active allowances & benefit components or specify individual monthly overrides. No gross or net totals are calculated.
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-64 pr-1 text-xs">
              {assignStructureState.map((item, idx) => (
                <div
                  key={item.componentKey}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                    item.enabled ? "bg-surface2/40 border-line" : "bg-surface2/10 border-line/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => {
                        const updated = [...assignStructureState];
                        updated[idx].enabled = e.target.checked;
                        setAssignStructureState(updated);
                      }}
                      className="w-4 h-4 rounded text-accent bg-surface2 border-line"
                    />
                    <div>
                      <div className="font-semibold text-ink">{item.componentName}</div>
                      <div className="text-[10.5px] text-muted">
                        Default: <span className="font-data text-accent">{item.defaultValue}</span> ({item.calcType})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted whitespace-nowrap">Override:</span>
                    <input
                      type="text"
                      disabled={!item.enabled}
                      value={item.overrideValue}
                      onChange={(e) => {
                        const updated = [...assignStructureState];
                        updated[idx].overrideValue = e.target.value;
                        setAssignStructureState(updated);
                      }}
                      placeholder={item.defaultValue}
                      className="w-24 bg-surface2 border border-line rounded px-2 py-1 text-ink focus:border-accent outline-none text-xs font-data disabled:opacity-40"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <SecondaryButton onClick={() => setAssignModalEmployee(null)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSaveEmployeeStructure}>
                Save Structure
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};