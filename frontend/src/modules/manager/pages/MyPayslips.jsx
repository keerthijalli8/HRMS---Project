import React, { useState } from 'react';
import Card from '../components/Card';
import Kpi from '../components/Kpi';
import {
  Receipt,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Mail,
  Building,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  downloadPayslipPDF,
  downloadPayslipCSV,
  downloadForm16,
  printPayslip,
} from '../utils/exportUtils';
import { TECHNOMOLD_LOGO_DATA_URL } from '../utils/logoData';

const PAYSLIP_HISTORY = [
  {
    month: 'November 2026',
    shortMonth: 'Nov 2026',
    period: '01 Nov 2026 – 30 Nov 2026',
    payDate: '30 Nov 2026',
    status: 'Disbursed',
    gross: '₹66,330.00',
    deductionsTotal: '₹2,000.00',
    net: '₹64,330.00',
    netInWords: 'Rupees Sixty Four Thousand Three Hundred Thirty Only',
    daysWorked: 30,
    lopDays: 0,
    bank: 'Not Provided',
    bankName: 'Not Provided',
    bankAccount: 'Not Provided',
    earnings: [
      { label: 'BASIC SALARY', amount: '₹35,417.00', ytd: '₹2,83,336.00' },
      { label: 'HOUSE RENT ALLOWANCE', amount: '₹17,709.00', ytd: '₹1,41,672.00' },
      { label: 'CONVEYANCE & SPECIAL', amount: '₹13,204.00', ytd: '₹1,05,632.00' },
      { label: 'BONUS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'OTHER ALLOWANCE', amount: '₹0.00', ytd: '₹0.00' },
    ],
    deductions: [
      { label: 'EMPLOYEE EPF', amount: '₹1,800.00', ytd: '₹14,400.00' },
      { label: 'PROFESSIONAL TAX', amount: '₹200.00', ytd: '₹1,600.00' },
      { label: 'TDS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'LEAVE DEDUCTION (LOP)', amount: '₹0.00', ytd: '₹0.00' },
    ],
  },
  {
    month: 'October 2026',
    shortMonth: 'Oct 2026',
    period: '01 Oct 2026 – 31 Oct 2026',
    payDate: '31 Oct 2026',
    status: 'Disbursed',
    gross: '₹66,330.00',
    deductionsTotal: '₹2,000.00',
    net: '₹64,330.00',
    netInWords: 'Rupees Sixty Four Thousand Three Hundred Thirty Only',
    daysWorked: 31,
    lopDays: 0,
    bank: 'Not Provided',
    bankName: 'Not Provided',
    bankAccount: 'Not Provided',
    earnings: [
      { label: 'BASIC SALARY', amount: '₹35,417.00', ytd: '₹2,47,919.00' },
      { label: 'HOUSE RENT ALLOWANCE', amount: '₹17,709.00', ytd: '₹1,23,963.00' },
      { label: 'CONVEYANCE & SPECIAL', amount: '₹13,204.00', ytd: '₹92,428.00' },
      { label: 'BONUS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'OTHER ALLOWANCE', amount: '₹0.00', ytd: '₹0.00' },
    ],
    deductions: [
      { label: 'EMPLOYEE EPF', amount: '₹1,800.00', ytd: '₹12,600.00' },
      { label: 'PROFESSIONAL TAX', amount: '₹200.00', ytd: '₹1,400.00' },
      { label: 'TDS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'LEAVE DEDUCTION (LOP)', amount: '₹0.00', ytd: '₹0.00' },
    ],
  },
  {
    month: 'September 2026',
    shortMonth: 'Sep 2026',
    period: '01 Sep 2026 – 30 Sep 2026',
    payDate: '30 Sep 2026',
    status: 'Disbursed',
    gross: '₹66,330.00',
    deductionsTotal: '₹2,000.00',
    net: '₹64,330.00',
    netInWords: 'Rupees Sixty Four Thousand Three Hundred Thirty Only',
    daysWorked: 30,
    lopDays: 0,
    bank: 'Not Provided',
    bankName: 'Not Provided',
    bankAccount: 'Not Provided',
    earnings: [
      { label: 'BASIC SALARY', amount: '₹35,417.00', ytd: '₹2,12,502.00' },
      { label: 'HOUSE RENT ALLOWANCE', amount: '₹17,709.00', ytd: '₹1,06,254.00' },
      { label: 'CONVEYANCE & SPECIAL', amount: '₹13,204.00', ytd: '₹79,224.00' },
      { label: 'BONUS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'OTHER ALLOWANCE', amount: '₹0.00', ytd: '₹0.00' },
    ],
    deductions: [
      { label: 'EMPLOYEE EPF', amount: '₹1,800.00', ytd: '₹10,800.00' },
      { label: 'PROFESSIONAL TAX', amount: '₹200.00', ytd: '₹1,200.00' },
      { label: 'TDS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'LEAVE DEDUCTION (LOP)', amount: '₹0.00', ytd: '₹0.00' },
    ],
  },
  {
    month: 'August 2026',
    shortMonth: 'Aug 2026',
    period: '01 Aug 2026 – 31 Aug 2026',
    payDate: '31 Aug 2026',
    status: 'Disbursed',
    gross: '₹66,330.00',
    deductionsTotal: '₹2,000.00',
    net: '₹64,330.00',
    netInWords: 'Rupees Sixty Four Thousand Three Hundred Thirty Only',
    daysWorked: 31,
    lopDays: 0,
    bank: 'Not Provided',
    bankName: 'Not Provided',
    bankAccount: 'Not Provided',
    earnings: [
      { label: 'BASIC SALARY', amount: '₹35,417.00', ytd: '₹1,77,085.00' },
      { label: 'HOUSE RENT ALLOWANCE', amount: '₹17,709.00', ytd: '₹88,545.00' },
      { label: 'CONVEYANCE & SPECIAL', amount: '₹13,204.00', ytd: '₹66,020.00' },
      { label: 'BONUS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'OTHER ALLOWANCE', amount: '₹0.00', ytd: '₹0.00' },
    ],
    deductions: [
      { label: 'EMPLOYEE EPF', amount: '₹1,800.00', ytd: '₹9,000.00' },
      { label: 'PROFESSIONAL TAX', amount: '₹200.00', ytd: '₹1,000.00' },
      { label: 'TDS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'LEAVE DEDUCTION (LOP)', amount: '₹0.00', ytd: '₹0.00' },
    ],
  },
  {
    month: 'July 2026',
    shortMonth: 'Jul 2026',
    period: '01 Jul 2026 – 31 Jul 2026',
    payDate: '31 Jul 2026',
    status: 'Disbursed',
    gross: '₹66,330.00',
    deductionsTotal: '₹2,000.00',
    net: '₹64,330.00',
    netInWords: 'Rupees Sixty Four Thousand Three Hundred Thirty Only',
    daysWorked: 31,
    lopDays: 0,
    bank: 'Not Provided',
    bankName: 'Not Provided',
    bankAccount: 'Not Provided',
    earnings: [
      { label: 'BASIC SALARY', amount: '₹35,417.00', ytd: '₹1,41,668.00' },
      { label: 'HOUSE RENT ALLOWANCE', amount: '₹17,709.00', ytd: '₹70,836.00' },
      { label: 'CONVEYANCE & SPECIAL', amount: '₹13,204.00', ytd: '₹52,816.00' },
      { label: 'BONUS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'OTHER ALLOWANCE', amount: '₹0.00', ytd: '₹0.00' },
    ],
    deductions: [
      { label: 'EMPLOYEE EPF', amount: '₹1,800.00', ytd: '₹7,200.00' },
      { label: 'PROFESSIONAL TAX', amount: '₹200.00', ytd: '₹800.00' },
      { label: 'TDS', amount: '₹0.00', ytd: '₹0.00' },
      { label: 'LEAVE DEDUCTION (LOP)', amount: '₹0.00', ytd: '₹0.00' },
    ],
  },
];

const EMPLOYEE_RECORD = {
  name: 'Meera Reddy',
  id: 'EMP-1001',
  role: 'TL',
  department: 'Human Resources',
  gender: 'Female',
  grade: 'L2',
  dob: '1992-08-20',
  doj: '2021-02-01',
  location: 'Hyderabad',
  pan: 'Not Provided',
  uan: 'Not Provided',
  pf: 'Not Provided',
  esi: 'Not Applicable',
  paymentMode: 'Bank Transfer',
  bankName: 'Not Provided',
  bankAccount: 'Not Provided',
};

export default function MyPayslips({ onTriggerToast }) {
  const [selectedMonth, setSelectedMonth] = useState('November 2026');

  const notify = (msg, undoFn) => {
    if (onTriggerToast) onTriggerToast(msg, undoFn);
  };

  const currentSlip = PAYSLIP_HISTORY.find((p) => p.month === selectedMonth) || PAYSLIP_HISTORY[0];

  const handleDownloadPdf = (slip = currentSlip) => {
    downloadPayslipPDF(slip, EMPLOYEE_RECORD);
    notify(`Downloaded Technomold-Payslip-${slip.month.replace(/\s+/g, '-')}.pdf`);
  };

  const handleDownloadCsv = (slip = currentSlip) => {
    downloadPayslipCSV(slip, EMPLOYEE_RECORD);
    notify(`Downloaded Technomold-Payslip-${slip.month.replace(/\s+/g, '-')}.csv`);
  };

  const handleDownloadForm16 = () => {
    downloadForm16(EMPLOYEE_RECORD);
    notify('Downloaded Form-16-PartA-PartB-FY26-27.pdf');
  };

  const handlePrintSlip = (slip = currentSlip) => {
    printPayslip(slip, EMPLOYEE_RECORD);
  };

  const handleEmailSlip = () => {
    notify(`Sent encrypted PDF payslip to meera.reddy@technomold.com`);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-display font-bold text-ink">My Payslips & Compensation</h2>
          <p className="text-[12.5px] text-muted">
            Official Technomold salary statements, statutory deductions, and tax compliance
          </p>
        </div>

        {/* Action Downloads Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleDownloadPdf(currentSlip)}
            className="px-3.5 py-2 rounded-xl font-bold text-[12px] flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--on-accent)',
            }}
            title="Download official PDF salary slip"
          >
            <Download size={14} strokeWidth={2.4} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadCsv(currentSlip)}
            className="px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download salary breakdown in CSV spreadsheet format"
          >
            <FileSpreadsheet size={14} className="text-accent" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadForm16}
            className="px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Form 16 Tax Certificate PDF"
          >
            <FileText size={14} className="text-muted" />
            <span>Form 16</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrintSlip(currentSlip)}
            className="p-2 rounded-xl bg-surface2 border border-line hover:border-accent text-muted hover:text-ink transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer size={15} />
          </button>

          <button
            type="button"
            onClick={handleEmailSlip}
            className="p-2 rounded-xl bg-surface2 border border-line hover:border-accent text-muted hover:text-ink transition-colors cursor-pointer"
            title="Email to registered mail"
          >
            <Mail size={15} />
          </button>
        </div>
      </div>

      {/* Compensation Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Annual Fixed CTC"
          value="₹8.50 L"
          change="₹66,330/mo"
          sublabel="Gross annual package"
          trend="neutral"
        />
        <Kpi
          label={`Net Take-Home (${currentSlip.shortMonth})`}
          value={currentSlip.net}
          change="Paid on time"
          sublabel="Payment Mode: Bank Transfer"
          trend="up"
        />
        <Kpi
          label="YTD Tax Deposited (TDS)"
          value="₹0.00"
          change="Section 87A rebate"
          sublabel="Form 24Q compliant"
          trend="neutral"
        />
        <Kpi
          label="EPF Accumulation"
          value="₹36,000"
          change="+₹3,600/mo"
          sublabel="Employer + Employee"
          trend="up"
        />
      </div>

      {/* Monthly Payslip Selector Cards with Direct Download Option on Every Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PAYSLIP_HISTORY.map((ps) => {
          const isSelected = ps.month === selectedMonth;

          return (
            <div
              key={ps.month}
              onClick={() => setSelectedMonth(ps.month)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface2 border-accent ring-2 ring-accent/30 shadow-md'
                  : 'bg-surface2/50 border-line hover:border-line/80 hover:bg-surface2'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold font-mono text-ink">{ps.shortMonth}</span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-good/15 text-good border border-good/30">
                  {ps.status}
                </span>
              </div>

              <div className="mt-2">
                <span className="text-[10px] text-muted uppercase font-mono block">Net Disbursed</span>
                <span className="text-[16px] font-bold font-mono text-accent block leading-tight">
                  {ps.net}
                </span>
              </div>

              {/* Card Footer with Direct Download Button */}
              <div className="mt-2 pt-1.5 border-t border-line/40 text-[10px] text-muted flex items-center justify-between font-mono">
                <span>{ps.daysWorked}d worked</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPdf(ps);
                  }}
                  className="p-1 rounded-md bg-surface border border-line hover:border-accent hover:text-accent text-ink transition-colors cursor-pointer"
                  title={`Download PDF for ${ps.shortMonth}`}
                >
                  <Download size={11} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Formatted Payslip View (Matches Sample PDF) */}
      <Card
        title={`EMPLOYEE PAYSLIP - ${currentSlip.month.toUpperCase()}`}
        subtitle={`Standard Days: ${currentSlip.daysWorked} · Payable Days: ${currentSlip.daysWorked} · LOP Days: ${currentSlip.lopDays} · Arrear Days: 0`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPdf(currentSlip)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-accent text-on-accent hover:brightness-110 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Download PDF in official format"
            >
              <Download size={12} strokeWidth={2.4} />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintSlip(currentSlip)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface2 border border-line hover:border-accent text-ink flex items-center gap-1 transition-colors cursor-pointer"
              title="Print Official Payslip"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Header Identity Box */}
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={TECHNOMOLD_LOGO_DATA_URL}
                alt="Technomold IT Solutions Pvt Ltd"
                className="h-10 max-w-[200px] object-contain rounded-md"
              />
            </div>

            <div className="text-right text-[11px] text-muted">
              <strong className="text-ink font-bold block">Technomold IT Solutions Pvt Ltd</strong>
              <span>Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081</span>
            </div>
          </div>

          {/* 4-Column Employee Info Grid (Matching PDF sample) */}
          <div className="border border-line rounded-xl overflow-hidden divide-y divide-line text-[12px] bg-surface2/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Employee ID</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.id}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Date of Joining</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.doj}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Employee Name</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.name}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Date of Birth</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.dob}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Designation</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.role}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Gender</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.gender}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Department</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.department}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Grade</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.grade}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Bank Name</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.bankName}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Location</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.location}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Bank Account</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.bankAccount}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">PAN</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.pan}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">PF Number</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.pf}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">UAN</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.uan}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-line">
              <div className="p-2.5 font-bold text-muted bg-surface2/30">ESI Number</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.esi}</div>
              <div className="p-2.5 font-bold text-muted bg-surface2/30">Payment Mode</div>
              <div className="p-2.5 font-semibold text-ink">{EMPLOYEE_RECORD.paymentMode}</div>
            </div>
          </div>

          {/* Days Summary Strip */}
          <div className="py-2 px-4 rounded-xl bg-surface2/50 border border-line text-center font-bold text-[12px] text-ink font-mono">
            Standard Days: {currentSlip.daysWorked} &nbsp;·&nbsp; Payable Days: {currentSlip.daysWorked} &nbsp;·&nbsp; LOP Days: {currentSlip.lopDays} &nbsp;·&nbsp; Arrear Days: 0
          </div>

          {/* Table Breakdown (Dual-sided Earnings & Deductions) */}
          <div className="border border-line rounded-xl overflow-x-auto">
            <table className="w-full text-left text-[11.5px] border-collapse">
              <thead>
                <tr className="bg-[#daf0ee] text-ink font-bold divide-x divide-line/40">
                  <th className="p-2.5">EARNINGS</th>
                  <th className="p-2.5 text-right">MONTHLY</th>
                  <th className="p-2.5 text-right">CURRENT</th>
                  <th className="p-2.5 text-right">ARREAR</th>
                  <th className="p-2.5 text-right">TOTAL</th>
                  <th className="p-2.5">DEDUCTIONS</th>
                  <th className="p-2.5 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                <tr className="divide-x divide-line/40">
                  <td className="p-2 text-ink font-medium">BASIC SALARY</td>
                  <td className="p-2 text-right font-mono">Rs. 35,417.00</td>
                  <td className="p-2 text-right font-mono">Rs. 35,417.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono font-semibold">Rs. 35,417.00</td>
                  <td className="p-2 text-ink font-medium">EMPLOYEE EPF</td>
                  <td className="p-2 text-right font-mono font-semibold text-bad">Rs. 1,800.00</td>
                </tr>
                <tr className="divide-x divide-line/40">
                  <td className="p-2 text-ink font-medium">HOUSE RENT ALLOWANCE</td>
                  <td className="p-2 text-right font-mono">Rs. 17,709.00</td>
                  <td className="p-2 text-right font-mono">Rs. 17,709.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono font-semibold">Rs. 17,709.00</td>
                  <td className="p-2 text-ink font-medium">PROFESSIONAL TAX</td>
                  <td className="p-2 text-right font-mono font-semibold text-bad">Rs. 200.00</td>
                </tr>
                <tr className="divide-x divide-line/40">
                  <td className="p-2 text-ink font-medium">CONVEYANCE & SPECIAL</td>
                  <td className="p-2 text-right font-mono">Rs. 13,204.00</td>
                  <td className="p-2 text-right font-mono">Rs. 13,204.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono font-semibold">Rs. 13,204.00</td>
                  <td className="p-2 text-ink font-medium">TDS</td>
                  <td className="p-2 text-right font-mono font-semibold text-muted">Rs. 0.00</td>
                </tr>
                <tr className="divide-x divide-line/40">
                  <td className="p-2 text-ink font-medium">BONUS</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-ink font-medium">LEAVE DEDUCTION (LOP)</td>
                  <td className="p-2 text-right font-mono font-semibold text-muted">Rs. 0.00</td>
                </tr>
                <tr className="divide-x divide-line/40">
                  <td className="p-2 text-ink font-medium">OTHER ALLOWANCE</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2 text-muted">-</td>
                  <td className="p-2 text-center text-muted font-mono">-</td>
                </tr>
                <tr className="divide-x divide-line/40 font-bold bg-surface2/60">
                  <td className="p-2.5 text-ink">GROSS EARNINGS</td>
                  <td className="p-2.5 text-right font-mono text-accent">Rs. 66,330.00</td>
                  <td className="p-2.5 text-right font-mono text-accent">Rs. 66,330.00</td>
                  <td className="p-2.5 text-right font-mono text-muted">Rs. 0.00</td>
                  <td className="p-2.5 text-right font-mono text-accent">Rs. 66,330.00</td>
                  <td className="p-2.5 text-ink">TOTAL DEDUCTIONS</td>
                  <td className="p-2.5 text-right font-mono text-bad">Rs. 2,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NET PAY Bar */}
          <div className="p-3.5 rounded-xl bg-[#daf0ee] flex items-center justify-between text-ink font-bold">
            <span className="text-[14px]">NET PAY</span>
            <span className="text-[20px] font-mono font-extrabold">{currentSlip.net}</span>
          </div>

          {/* Amount in Words & Signatory */}
          <div className="p-4 rounded-xl bg-surface2/30 border border-line flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                AMOUNT IN WORDS:
              </span>
              <span className="text-[13px] font-medium text-ink">
                {currentSlip.netInWords}
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-end text-center sm:text-right font-mono">
              <span className="font-serif italic text-[18px] text-ink font-bold mb-1">R. Vinay</span>
              <div className="w-48 h-[1px] bg-line mb-1" />
              <strong className="text-[11px] text-ink">Authorized Signatory (R. Vinay)</strong>
              <span className="text-[10px] text-muted">Technomold IT Solutions Pvt Ltd</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
