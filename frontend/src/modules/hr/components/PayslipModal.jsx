
import React from 'react';
import { Icon } from './Icon.jsx';
import { PrimaryButton, SecondaryButton } from './Buttons.jsx';
import { formatCurrency } from '../utils/format.js';
import {
  getSavedBenefitsSelection,
  calculatePayrollForEmployee
} from '../services/benefitsService.js';

export const PayslipModal = ({ payslipData, onClose, onTriggerToast }) => {
  if (!payslipData) return null;

  // Compute or reuse calculated values
  const activeKeys = payslipData.activeSelection || getSavedBenefitsSelection();
  const calc = payslipData.calc || calculatePayrollForEmployee(payslipData, activeKeys);
  const activeSet = new Set(activeKeys);

  // Compute individual item amounts for breakdown
  const basic = calc.basic;
  const hraAmount = activeSet.has("hra") ? Math.round(basic * 0.50) : 0;
  const daAmount = activeSet.has("da") ? Math.round(basic * 0.10) : 0;
  const conveyanceAmount = activeSet.has("conveyance_allowance") ? 1600 : 0;
  const medicalAmount = activeSet.has("medical_allowance") ? 1250 : 0;
  const specialAmount = activeSet.has("special_allowance") ? 24500 : 0;

  const pfAmount = activeSet.has("pf") ? Math.round(basic * 0.12) : 0;
  const ptAmount = activeSet.has("professional_tax") ? 200 : 0;
  const tdsAmount = activeSet.has("tds") ? Math.round(calc.grossSalary * 0.065) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

      <div className="glass-card max-w-5xl w-full !p-6 border border-line relative animate-in fade-in my-auto">

        {/* COMPANY HEADER */}
        <div className="grid grid-cols-[1fr_1.3fr_auto] items-center gap-4 border-b-2 border-line pb-4 mb-4">

          {/* LEFT - COMPANY LOGO AND NAME */}
          <div className="flex items-center gap-3 min-w-0">

            <div className="w-14 h-14 shrink-0 rounded-xl bg-[#DF1748] text-white font-display font-extrabold flex items-center justify-center text-xl">
              TM
            </div>

            <div className="min-w-0">
              <div className="text-[#DF1748] font-display font-extrabold text-xl leading-tight">
                Technomold
              </div>

              <div className="text-ink font-extrabold text-xs whitespace-nowrap">
                IT SOLUTIONS PVT LTD
              </div>
            </div>

          </div>

          {/* CENTER - COMPANY ADDRESS */}
          <div className="text-center flex flex-col items-center justify-center px-2">

            <div className="text-ink font-bold text-sm">
              Technomold IT Solutions Pvt Ltd
            </div>

            <div className="text-muted text-xs leading-relaxed mt-1">
              Plot No. 24, Hitech City Road, Madhapur,
              <br />
              Hyderabad, Telangana - 500081
            </div>

          </div>

          {/* RIGHT - CLOSE BUTTON */}
          <div className="flex justify-end self-start">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface2 border border-line text-muted hover:text-ink cursor-pointer"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* PAYSLIP TITLE */}
        <div className="bg-[#EAF4F4] border border-[#D1E1E1] text-center py-3 mb-4">
          <h2 className="font-display font-extrabold text-ink text-lg">
            EMPLOYEE PAYSLIP - NOVEMBER 2026
          </h2>
        </div>

        {/* PAYSLIP DETAILS GRID */}
        <div className="grid grid-cols-2 gap-3 text-xs py-3 border-b border-line font-data">

          <div>
            <span className="text-muted">Employee Name:</span>
            <strong className="text-ink font-body ml-1">
              {payslipData.name}
            </strong>
          </div>

          <div>
            <span className="text-muted">Employee ID:</span>
            <strong className="text-accent ml-1">
              {payslipData.id}
            </strong>
          </div>

          <div>
            <span className="text-muted">Designation:</span>
            <strong className="text-ink font-body ml-1">
              {payslipData.role || payslipData.designation}
            </strong>
          </div>

          <div>
            <span className="text-muted">Department:</span>
            <strong className="text-ink font-body ml-1">
              {payslipData.dept || payslipData.department}
            </strong>
          </div>

          <div>
            <span className="text-muted">Paid Days:</span>
            <strong className="text-ink font-num ml-1">
              {30 - (calc.lopDays || 0)} Days
              {calc.lopDays > 0 ? ` (${calc.lopDays}d LOP)` : ''}
            </strong>
          </div>

          <div>
            <span className="text-muted">Payment Mode:</span>
            <strong className="text-ink font-body ml-1">
              Direct NEFT Transfer
            </strong>
          </div>

        </div>

        {/* EARNINGS & DEDUCTIONS BREAKDOWN */}
        <div className="grid grid-cols-2 gap-4 text-xs py-4 font-data">

          {/* EARNINGS */}
          <div className="flex flex-col gap-1.5">

            <div className="font-bold text-ink font-body border-b border-line pb-2">
              EARNINGS BREAKDOWN
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-muted">Basic Salary:</span>
              <span className="font-num">{formatCurrency(basic)}</span>
            </div>

            {hraAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">House Rent Allowance (HRA):</span>
                <span className="font-num">{formatCurrency(hraAmount)}</span>
              </div>
            )}

            {daAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Dearness Allowance (DA):</span>
                <span className="font-num">{formatCurrency(daAmount)}</span>
              </div>
            )}

            {conveyanceAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Conveyance Allowance:</span>
                <span className="font-num">{formatCurrency(conveyanceAmount)}</span>
              </div>
            )}

            {medicalAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Medical Allowance:</span>
                <span className="font-num">{formatCurrency(medicalAmount)}</span>
              </div>
            )}

            {specialAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Special Allowance:</span>
                <span className="font-num">{formatCurrency(specialAmount)}</span>
              </div>
            )}

            {calc.bonusAmount > 0 && (
              <div className="flex justify-between text-good font-semibold">
                <span>
                  {calc.bonusItems?.[0]?.bonusName || "Disbursed Bonus"}:
                </span>
                <span className="font-num">
                  +{formatCurrency(calc.bonusAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-ink pt-2 border-t border-line/60">
              <span>Gross Earnings:</span>
              <span className="font-num">
                {formatCurrency(calc.grossSalary)}
              </span>
            </div>

          </div>

          {/* DEDUCTIONS */}
          <div className="flex flex-col gap-1.5">

            <div className="font-bold text-ink font-body border-b border-line pb-2">
              DEDUCTIONS BREAKDOWN
            </div>

            {pfAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Employee EPF:</span>
                <span className="font-num">{formatCurrency(pfAmount)}</span>
              </div>
            )}

            {ptAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Professional Tax:</span>
                <span className="font-num">{formatCurrency(ptAmount)}</span>
              </div>
            )}

            {tdsAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">Income Tax (TDS):</span>
                <span className="font-num">{formatCurrency(tdsAmount)}</span>
              </div>
            )}

            {calc.lopDeduction > 0 && (
              <div className="flex justify-between text-bad font-semibold">
                <span>Leave Deduction (LOP):</span>
                <span className="font-num">
                  −{formatCurrency(calc.lopDeduction)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-bad pt-2 border-t border-line/60">
              <span>Total Deductions:</span>
              <span className="font-num">
                {formatCurrency(calc.deductions)}
              </span>
            </div>

          </div>

        </div>

        {/* NET SALARY BANNER */}
        <div className="p-4 rounded-xl bg-[#E2F1E9] border border-line flex items-center justify-between gap-3">

          <div>
            <span className="text-muted text-xs font-bold">
              NET PAY
            </span>

            <div className="text-2xl font-num font-extrabold text-good">
              {formatCurrency(calc.netPayable)}
            </div>

            <div className="text-[10.5px] text-muted italic">
              Net payable after statutory adjustments
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">

            <SecondaryButton
              icon="printer"
              onClick={() => {
                alert("Printing Payslip...");
                onClose();
              }}
            >
              Print
            </SecondaryButton>

            <PrimaryButton
              icon="download"
              onClick={() => {
                onTriggerToast("Downloading PDF Payslip");
                onClose();
              }}
            >
              Download PDF
            </PrimaryButton>

          </div>

        </div>

        {/* AMOUNT IN WORDS */}
        <div className="mt-4 p-3 rounded-lg border border-line">

          <div className="font-bold text-ink text-xs mb-1">
            AMOUNT IN WORDS
          </div>

          <div className="text-sm text-ink">
            {payslipData.amountInWords || formatCurrency(calc.netPayable)}
          </div>

        </div>

        {/* FOOTER & AUTHORIZED SIGNATORY */}
        <div className="mt-6 pt-5 border-t border-dashed border-line flex justify-between items-end">

          <div className="text-xs text-muted leading-relaxed">
            <div className="font-bold text-ink">
              Technomold IT Solutions Pvt Ltd
            </div>
            <div>
              Plot No. 24, Hitech City Road, Madhapur,
              <br />
              Hyderabad, Telangana - 500081
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-ink italic text-xl mb-2">
              R. Vinay
            </div>

            <div className="border-t border-line pt-2 font-semibold text-ink">
              Authorized Signatory (R. Vinay)
            </div>

            <div className="text-muted mt-1">
              Technomold IT Solutions Pvt Ltd
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
