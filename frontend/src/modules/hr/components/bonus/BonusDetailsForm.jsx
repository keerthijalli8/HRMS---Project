import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../Icon.jsx';
import { Select } from '../Select.jsx';
import { BONUS_TYPES, PAY_CYCLES } from '../../services/bonusService.js';
import { formatINR } from '../../utils/renderValue.js';
import { loadAllEmployees } from '../../services/teamService.js';

export const BonusDetailsForm = ({
  bonusConfig,
  onChange,
  onBack,
  onContinue,
  selectedEmployeeIds = []
}) => {
  const {
    name = "",
    type = "Performance",
    payCycle = "November 2026",
    reason = "",
    amountMode = "fixed", // "fixed" | "percentage" | "custom"
    fixedAmount = 25000,
    percentageBasis = "basic", // "basic" | "ctc"
    percentageValue = 10,
    paymentTiming = "payroll", // "payroll" | "separate"
    paymentDate = "",
    customAmounts = {} // { [empId]: amount }
  } = bonusConfig;

  const [errors, setErrors] = useState({});
  const [csvText, setCsvText] = useState("");
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvError, setCsvError] = useState("");

  // Load all selected employee full profiles
  const allEmployees = useMemo(() => loadAllEmployees(), []);
  const selectedEmployees = useMemo(() => {
    const idSet = new Set(selectedEmployeeIds);
    return allEmployees.filter(e => idSet.has(e.id || e.employeeId)).map(emp => {
      // Basic salary approximation
      let basic = 60000;
      let annualCtc = 1800000;
      if (emp.salary && typeof emp.salary === "string") {
        const match = emp.salary.match(/₹?([\d.]+)\s*L/);
        if (match) {
          annualCtc = Math.round(parseFloat(match[1]) * 100000);
          basic = Math.round((annualCtc / 12) * 0.40);
        }
      }
      return {
        ...emp,
        id: emp.id || emp.employeeId,
        basic,
        annualCtc
      };
    });
  }, [allEmployees, selectedEmployeeIds]);

  // Compute calculated amounts, TDS, and net for each selected employee
  const employeeItems = useMemo(() => {
    return selectedEmployees.map(emp => {
      let gross = 0;
      if (amountMode === "fixed") {
        gross = Math.max(0, Number(fixedAmount) || 0);
      } else if (amountMode === "percentage") {
        const pct = Math.max(0, Number(percentageValue) || 0) / 100;
        if (percentageBasis === "basic") {
          gross = Math.round(emp.basic * pct);
        } else {
          gross = Math.round((emp.annualCtc / 12) * pct);
        }
      } else if (amountMode === "custom") {
        gross = Math.max(0, Number(customAmounts[emp.id]) || 0);
      }

      // 10% standard withholding TDS under Indian Income Tax Act Sec 192/194
      const tds = Math.round(gross * 0.10);
      const net = gross - tds;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.dept || emp.department || "Engineering",
        basic: emp.basic,
        annualCtc: emp.annualCtc,
        amount: gross,
        tds,
        net
      };
    });
  }, [selectedEmployees, amountMode, fixedAmount, percentageBasis, percentageValue, customAmounts]);

  // Totals
  const totalGross = useMemo(() => employeeItems.reduce((acc, it) => acc + it.amount, 0), [employeeItems]);
  const totalTds = useMemo(() => employeeItems.reduce((acc, it) => acc + it.tds, 0), [employeeItems]);
  const totalNet = useMemo(() => employeeItems.reduce((acc, it) => acc + it.net, 0), [employeeItems]);

  // Handle field change helper
  const updateField = (field, value) => {
    onChange({
      ...bonusConfig,
      [field]: value
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Custom amount per employee input
  const handleCustomAmountChange = (empId, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = {
      ...customAmounts,
      [empId]: num
    };
    onChange({
      ...bonusConfig,
      customAmounts: updated
    });
  };

  // CSV Import parser
  const handleApplyCsv = () => {
    setCsvError("");
    if (!csvText.trim()) {
      setCsvError("Please paste or upload CSV content.");
      return;
    }

    try {
      const lines = csvText.trim().split("\n");
      const updated = { ...customAmounts };
      let matchCount = 0;

      lines.forEach((line, idx) => {
        const parts = line.split(",").map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const empId = parts[0].toUpperCase();
          const amt = parseInt(parts[1], 10);
          if (empId && !isNaN(amt)) {
            // Find if this ID is in selected employees
            const match = selectedEmployees.find(e => e.id.toUpperCase() === empId);
            if (match) {
              updated[match.id] = Math.max(0, amt);
              matchCount++;
            }
          }
        }
      });

      if (matchCount === 0) {
        setCsvError("No matching selected employee IDs found in CSV data. Use format: EMP-1042,25000");
        return;
      }

      onChange({
        ...bonusConfig,
        customAmounts: updated
      });
      setIsCsvModalOpen(false);
      setCsvText("");
    } catch (e) {
      setCsvError("Failed to parse CSV: " + e.message);
    }
  };

  // Validation before proceeding
  const handleContinue = () => {
    const nextErrors = {};
    if (!name || !name.trim()) {
      nextErrors.name = "Bonus name is required.";
    }
    if (!reason || !reason.trim()) {
      nextErrors.reason = "Justification / remarks are required for corporate audit compliance.";
    }
    if (amountMode === "fixed" && (!fixedAmount || Number(fixedAmount) <= 0)) {
      nextErrors.fixedAmount = "Please enter a valid fixed bonus amount greater than ₹0.";
    }
    if (amountMode === "percentage" && (!percentageValue || Number(percentageValue) <= 0)) {
      nextErrors.percentageValue = "Percentage must be greater than 0%.";
    }
    if (amountMode === "custom") {
      const hasZero = selectedEmployees.some(emp => (Number(customAmounts[emp.id]) || 0) <= 0);
      if (hasZero) {
        nextErrors.custom = "All selected employees must have a custom bonus amount greater than ₹0.";
      }
    }
    if (paymentTiming === "separate" && !paymentDate) {
      nextErrors.paymentDate = "Please choose a scheduled payout date.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Attach computed employee items into payload
    onChange({
      ...bonusConfig,
      items: employeeItems,
      totalAmount: totalGross,
      totalTds,
      totalNet
    });

    onContinue();
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Main Configuration Form */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md">
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2.5">
              <Icon name="gift" className="w-4 h-4 text-accent" />
              <span>General Bonus Information</span>
            </h3>

            {/* Bonus Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-muted block text-[11px] font-semibold mb-1">
                  Bonus Title / Campaign Name <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Diwali Festive Bonus 2026"
                  className={`w-full px-3 py-2 rounded-xl bg-surface2 border text-xs text-ink focus:outline-none transition ${
                    errors.name ? "border-bad focus:border-bad" : "border-line focus:border-accent"
                  }`}
                />
                {errors.name && <span className="text-[11px] text-bad mt-1 block">{errors.name}</span>}
              </div>

              <div>
                <label className="text-muted block text-[11px] font-semibold mb-1">
                  Bonus Classification / Category
                </label>
                <Select
                  value={type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  {BONUS_TYPES.map(bt => (
                    <option key={bt.id} value={bt.id}>
                      {bt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Pay Cycle & Payment Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-muted block text-[11px] font-semibold mb-1">
                  Payroll Cycle / Month
                </label>
                <Select
                  value={payCycle}
                  onChange={(e) => updateField("payCycle", e.target.value)}
                >
                  {PAY_CYCLES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-muted block text-[11px] font-semibold mb-1">
                  Disbursal Timing
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("paymentTiming", "payroll")}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      paymentTiming === "payroll"
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-surface2/50 border-line text-muted hover:text-ink"
                    }`}
                  >
                    Include in Payroll
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("paymentTiming", "separate")}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      paymentTiming === "separate"
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-surface2/50 border-line text-muted hover:text-ink"
                    }`}
                  >
                    Separate Payout
                  </button>
                </div>
              </div>
            </div>

            {/* Payout Date (if separate) */}
            {paymentTiming === "separate" && (
              <div className="text-xs animate-in fade-in">
                <label className="text-muted block text-[11px] font-semibold mb-1">
                  Scheduled Disbursal Date <span className="text-bad">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => updateField("paymentDate", e.target.value)}
                  className={`w-full sm:w-1/2 px-3 py-2 rounded-xl bg-surface2 border text-xs text-ink focus:outline-none transition ${
                    errors.paymentDate ? "border-bad" : "border-line focus:border-accent"
                  }`}
                />
                {errors.paymentDate && <span className="text-[11px] text-bad mt-1 block">{errors.paymentDate}</span>}
              </div>
            )}

            {/* Remarks / Justification (Mandatory) */}
            <div className="text-xs">
              <label className="text-muted block text-[11px] font-semibold mb-1">
                Reason / Remarks (Required for Audit & Compliance) <span className="text-bad">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => updateField("reason", e.target.value)}
                rows={3}
                placeholder="Enter justification, approval memo, or festive note for records..."
                className={`w-full px-3 py-2 rounded-xl bg-surface2 border text-xs text-ink placeholder:text-muted focus:outline-none transition ${
                  errors.reason ? "border-bad focus:border-bad" : "border-line focus:border-accent"
                }`}
              />
              {errors.reason && <span className="text-[11px] text-bad mt-1 block">{errors.reason}</span>}
            </div>
          </div>

          {/* Amount Mode Configuration Card */}
          <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-4 shadow-md">
            <h3 className="font-display font-bold text-sm text-ink flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Icon name="dollar-sign" className="w-4 h-4 text-accent" />
                <span>Bonus Amount Calculation Mode</span>
              </div>
              <span className="text-xs font-semibold text-muted">
                {selectedEmployees.length} Recipients
              </span>
            </h3>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => updateField("amountMode", "fixed")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  amountMode === "fixed"
                    ? "bg-accent/20 border-accent text-ink shadow-md"
                    : "bg-surface2/40 border-line text-muted hover:text-ink hover:border-line/80"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Same Fixed Amount</span>
                  {amountMode === "fixed" && <Icon name="check" className="w-3.5 h-3.5 text-accent" />}
                </div>
                <span className="text-[11px] text-muted">Equal lump-sum across all selected staff</span>
              </button>

              <button
                type="button"
                onClick={() => updateField("amountMode", "percentage")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  amountMode === "percentage"
                    ? "bg-accent/20 border-accent text-ink shadow-md"
                    : "bg-surface2/40 border-line text-muted hover:text-ink hover:border-line/80"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Percentage Based</span>
                  {amountMode === "percentage" && <Icon name="check" className="w-3.5 h-3.5 text-accent" />}
                </div>
                <span className="text-[11px] text-muted">% of monthly basic salary or annual CTC</span>
              </button>

              <button
                type="button"
                onClick={() => updateField("amountMode", "custom")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  amountMode === "custom"
                    ? "bg-accent/20 border-accent text-ink shadow-md"
                    : "bg-surface2/40 border-line text-muted hover:text-ink hover:border-line/80"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Custom per Employee</span>
                  {amountMode === "custom" && <Icon name="check" className="w-3.5 h-3.5 text-accent" />}
                </div>
                <span className="text-[11px] text-muted">Individual amounts & CSV upload</span>
              </button>
            </div>

            {/* Mode A: Fixed Amount */}
            {amountMode === "fixed" && (
              <div className="p-4 rounded-xl bg-surface2/30 border border-line flex flex-col gap-2 text-xs animate-in fade-in">
                <label className="text-muted block text-[11px] font-semibold">
                  Fixed Bonus Amount per Employee (INR) <span className="text-bad">*</span>
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink">₹</span>
                  <input
                    type="number"
                    value={fixedAmount}
                    onChange={(e) => updateField("fixedAmount", e.target.value)}
                    min={0}
                    step={1000}
                    placeholder="25000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-num font-bold text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-muted">
                  Each of the {selectedEmployees.length} employees will receive {formatINR(fixedAmount)}.
                </span>
                {errors.fixedAmount && <span className="text-[11px] text-bad">{errors.fixedAmount}</span>}
              </div>
            )}

            {/* Mode B: Percentage Based */}
            {amountMode === "percentage" && (
              <div className="p-4 rounded-xl bg-surface2/30 border border-line flex flex-col gap-3 text-xs animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted block text-[11px] font-semibold mb-1">
                      Percentage Rate (%) <span className="text-bad">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={percentageValue}
                        onChange={(e) => updateField("percentageValue", e.target.value)}
                        min={1}
                        max={100}
                        step={1}
                        className="w-full px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-num font-bold text-ink focus:border-accent focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-muted block text-[11px] font-semibold mb-1">
                      Calculation Base
                    </label>
                    <Select
                      value={percentageBasis}
                      onChange={(e) => updateField("percentageBasis", e.target.value)}
                    >
                      <option value="basic">Monthly Basic Salary</option>
                      <option value="ctc">Monthly CTC Equivalent</option>
                    </Select>
                  </div>
                </div>
                <span className="text-[11px] text-muted">
                  Bonus is dynamically computed from each employee's {percentageBasis === "basic" ? "basic salary" : "monthly CTC"}.
                </span>
                {errors.percentageValue && <span className="text-[11px] text-bad">{errors.percentageValue}</span>}
              </div>
            )}

            {/* Mode C: Custom Amount per Employee Table + CSV Import */}
            {amountMode === "custom" && (
              <div className="flex flex-col gap-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">
                    Enter custom bonus amounts below or import via CSV:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
                    <span>Import CSV</span>
                  </button>
                </div>

                {errors.custom && <span className="text-xs text-bad">{errors.custom}</span>}

                <div className="max-h-60 overflow-y-auto rounded-xl border border-line bg-surface2/20">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10px] sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3">Basic Pay</th>
                        <th className="py-2.5 px-3 text-right">Bonus Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/40">
                      {selectedEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-surface2/40">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-ink block">{emp.name}</span>
                            <span className="text-[10px] text-muted font-num">{emp.id} &bull; {emp.dept || "Engg"}</span>
                          </td>
                          <td className="py-2.5 px-3 font-num text-muted">
                            {formatINR(emp.basic)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center relative">
                              <span className="absolute left-2.5 text-xs text-muted">₹</span>
                              <input
                                type="number"
                                min={0}
                                step={500}
                                value={customAmounts[emp.id] !== undefined ? customAmounts[emp.id] : 25000}
                                onChange={(e) => handleCustomAmountChange(emp.id, e.target.value)}
                                className="w-32 pl-6 pr-2 py-1 rounded-lg bg-surface2 border border-line text-xs font-num font-bold text-ink text-right focus:border-accent focus:outline-none"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Indian Tax & Real-Time Impact Summary Card */}
        <div className="flex flex-col gap-4">
          {/* Statutory Tax Compliance Banner */}
          <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3 shadow-md bg-gradient-to-br from-[#061e29] to-[#071a24]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center">
                <Icon name="shield" className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-ink">Taxable Under Sec 17(1)</h4>
                <span className="text-[10px] text-accent font-semibold">Indian Income Tax Act</span>
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              Performance, festive, and discretionary bonuses are fully treated as <strong>Profits in lieu of Salary</strong>. Statutory TDS is estimated at a standard 10% withholding rate and will be reflected on Form 16 / Part B.
            </p>

            <div className="pt-2 border-t border-line/60 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between text-muted">
                <span>Tax Category:</span>
                <span className="text-ink font-semibold">Fully Taxable (Earnings)</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Statutory Deductions:</span>
                <span className="text-bad font-semibold">TDS Applicable</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>PF Impact:</span>
                <span className="text-muted font-semibold">Exempt (Discretionary)</span>
              </div>
            </div>
          </div>

          {/* Real-time Summary Tile */}
          <div className="glass-card !p-5 border border-line rounded-2xl flex flex-col gap-3.5 shadow-md">
            <h4 className="font-display font-bold text-xs text-ink uppercase tracking-wider border-b border-line pb-2">
              Financial Disbursal Forecast
            </h4>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Total Recipients:</span>
              <span className="font-bold text-accent font-num">{selectedEmployees.length} Employees</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Gross Bonus Outflow:</span>
              <span className="font-extrabold text-ink font-num text-sm">{formatINR(totalGross)}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Est. TDS Withholding (10%):</span>
              <span className="font-bold text-bad font-num">{formatINR(totalTds)}</span>
            </div>

            <div className="pt-3 border-t border-line/60 flex justify-between items-center text-xs font-bold text-good">
              <span>Net Payable Disbursal:</span>
              <span className="font-num text-base font-extrabold">{formatINR(totalNet)}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface2/40 border border-line/60 text-[11px] text-muted text-center mt-1">
              Payment mode: <strong className="text-ink">{paymentTiming === "payroll" ? "Consolidated in monthly payroll" : `Direct NEFT on ${paymentDate || "selected date"}`}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-2 transition cursor-pointer"
        >
          <Icon name="arrow-left" className="w-4 h-4 text-accent" />
          <span>Back to Employee Picker</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="px-5 py-2.5 rounded-xl bg-accent text-on-accent font-display font-extrabold text-xs flex items-center gap-2 shadow-lg hover:opacity-95 transition cursor-pointer"
        >
          <span>Continue to Review & Confirm</span>
          <Icon name="arrow-right" className="w-4 h-4 text-on-accent" />
        </button>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full !p-6 border border-line rounded-2xl flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Icon name="upload" className="w-4 h-4 text-accent" />
                <h4 className="font-display font-bold text-sm text-ink">Import Custom Amounts CSV</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="text-muted hover:text-ink text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-muted">
              Paste CSV records in the format <code>EmployeeID,Amount</code> (one per line). Example:
            </p>
            <pre className="p-2.5 rounded-xl bg-surface2/60 border border-line text-[11px] font-mono text-accent">
              EMP-1042,35000&#10;EMP-1001,28000&#10;EMP-2001,22000
            </pre>

            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="EMP-1042,35000"
              className="w-full p-3 rounded-xl bg-surface2 border border-line text-xs font-mono text-ink focus:border-accent focus:outline-none"
            />

            {csvError && <span className="text-xs text-bad">{csvError}</span>}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-surface2 text-muted hover:text-ink text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCsv}
                className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-md cursor-pointer"
              >
                Apply Custom Amounts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusDetailsForm;
