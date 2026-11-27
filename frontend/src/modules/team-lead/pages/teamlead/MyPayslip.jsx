import {
  ArrowLeft as PayslipBackIcon,
  Eye as PayslipEyeIcon,
  Wallet as PayslipWalletIcon,
  CalendarDays as PayslipCalendarIcon
} from 'lucide-react';

import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import {
  Download,
  Printer,
  Loader2,
  FileText
} from 'lucide-react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';

import {
  getEmployeeProfile,
  getEmployeeId,
  getEmployeeIds
} from '../../utils/employeeData.js';

// ============================================================
// COMPANY CONFIGURATION
// ============================================================

const COMPANY = {
  name: 'Technomold',
  legalName: 'Technomold IT Solutions Private Limited',
  phone: '+91 90000 00000',
  email: 'hr@technomold.com',
  address:
    'Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081'
};

const PAY_PERIOD = 'November 2026';

// PAYSLIP_HISTORY_V1

const PAYSLIP_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const getPeriodKey = period => {

  const value =
    String(period || '').trim();

  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return value;
  }

  const [month, year] =
    value.split(/\s+/);

  const monthIndex =
    PAYSLIP_MONTHS.findIndex(
      item =>
        item.toLowerCase() ===
        String(month).toLowerCase()
    );

  if (
    monthIndex < 0 ||
    !/^\d{4}$/.test(year || '')
  ) {
    return '';
  }

  return `${year}-${String(
    monthIndex + 1
  ).padStart(2, '0')}`;
};

const getPeriodLabel = period => {

  const key =
    getPeriodKey(period);

  if (!key) return '';

  const [year, month] =
    key.split('-');

  return `${PAYSLIP_MONTHS[
    Number(month) - 1
  ]} ${year}`;
};

const getSamplePeriods = () => {

  const today = new Date();

  return Array.from(
    { length: 6 },
    (_, index) => {

      const date = new Date(
        today.getFullYear(),
        today.getMonth() - index,
        1
      );

      return `${PAYSLIP_MONTHS[
        date.getMonth()
      ]} ${date.getFullYear()}`;

    }
  );
};

// ============================================================
// HELPERS
// ============================================================

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const displayValue = value => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return 'Not Provided';
  }

  return String(value);
};

const number = value => {

  const parsed = Number(
    String(value ?? '')
      .replace(/[â‚¹,\s]/g, '')
  );

  return Number.isFinite(parsed)
    ? Math.max(0, parsed)
    : 0;
};

const roundMoney = value =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatCurrency = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number(value));

const maskAccount = value => {

  if (!value) return 'Not Provided';

  const account = String(value);

  return account.length > 4
    ? `XXXX${account.slice(-4)}`
    : 'Not Provided';
};

// ============================================================
// AMOUNT IN WORDS
// ============================================================

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen'
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety'
];

const numberToWords = value => {

  const n = Math.floor(value);

  if (n === 0) return 'Zero';

  if (n < 20) return ONES[n];

  if (n < 100) {
    return [
      TENS[Math.floor(n / 10)],
      n % 10 ? ONES[n % 10] : ''
    ].filter(Boolean).join(' ');
  }

  if (n < 1000) {
    return [
      ONES[Math.floor(n / 100)],
      'Hundred',
      n % 100
        ? numberToWords(n % 100)
        : ''
    ].filter(Boolean).join(' ');
  }

  const scales = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand']
  ];

  for (const [scale, label] of scales) {

    if (n >= scale) {
      return [
        numberToWords(
          Math.floor(n / scale)
        ),
        label,
        n % scale
          ? numberToWords(n % scale)
          : ''
      ].filter(Boolean).join(' ');
    }
  }

  return '';
};

const amountInWords = amount => {

  const paiseTotal =
    Math.round(number(amount) * 100);

  const rupees =
    Math.floor(paiseTotal / 100);

  const paise =
    paiseTotal % 100;

  return [
    'Rupees',
    numberToWords(rupees),
    paise
      ? `and ${numberToWords(paise)} Paise`
      : '',
    'Only'
  ].filter(Boolean).join(' ');
};

// ============================================================
// EMPLOYEE IDENTITY
// ============================================================

const getPayslipIdentity = profile => ({
  employeeId: displayValue(
    profile.employeeId
  ),

  name: displayValue(
    profile.name || profile.fullName
  ),

  designation: displayValue(
    profile.designation || profile.role
  ),

  department: displayValue(
    profile.department || profile.dept
  ),

  joiningDate: displayValue(
    profile.joiningDate || profile.joined
  ),

  dob: profile.demoDateOfBirth
    ? `${profile.dateOfBirth} (Demo)`
    : displayValue(
        profile.dateOfBirth || profile.dob
      ),

  gender: displayValue(
    profile.gender
  ),

  grade: displayValue(
    profile.grade ||
    profile.band ||
    profile.payrollSummary?.grade
  ),

  bankName: displayValue(
    profile.bankName ||
    profile.bankDetails?.bankName
  ),

  bankAccount: maskAccount(
    profile.bankAccount ||
    profile.accountNumber ||
    profile.bankDetails?.accountNumber
  ),

  pan: displayValue(
    profile.pan || profile.panNumber
  ),

  pfNumber: displayValue(
    profile.pfNumber ||
    profile.epfNumber
  ),

  uan: displayValue(
    profile.uan ||
    profile.uanNumber
  ),

  esiNumber: displayValue(
    profile.esiNumber ||
    profile.esicNumber
  ),

  location: displayValue(
    profile.workLocation ||
    profile.location ||
    profile.city
  ),

  paymentMode: displayValue(
    profile.paymentMode ||
    profile.bankDetails?.paymentMode
  )
});

// ============================================================
// DEMO PAYROLL DATA
// Used only when personal itemized payroll is unavailable.
// ============================================================

const getDemoMonthDays = period => {

  const key = getPeriodKey(period);

  if (!key) return 30;

  const [year, month] =
    key.split('-').map(Number);

  return new Date(
    year,
    month,
    0
  ).getDate();
};

const getDemoPayroll = (employeeId, payPeriod = PAY_PERIOD) => ({
  employeeId,

  payPeriod,

  standardDays: getDemoMonthDays(payPeriod),
  payableDays: getDemoMonthDays(payPeriod) - 2,
  lopDays: 2,

  basicSalary: 30000,
  hra: 15000,
  conveyanceSpecialAllowance: 10000,
  bonus: 0,
  otherAllowance: 0,

  epf: 1800,
  professionalTax: 200,
  tds: 0,

  lopDeduction: roundMoney(
    55000 / getDemoMonthDays(payPeriod) * 2
  ),

  arrears: 0,

  paymentMode: 'Bank Transfer',

  isDemo: true
});

// ============================================================
// PERSONAL PAYROLL RESOLUTION
// No unrelated employee salary records are used.
// ============================================================

const resolvePayroll = (
  profile,
  currentUser,
  payPeriod = PAY_PERIOD
) => {

  const employeeId =
    getEmployeeId(currentUser);

  const employeeIds =
    getEmployeeIds(currentUser);

  const candidates = [
    profile.payslip,
    profile.payroll,
    profile.payrollSummary,

    ...(
      Array.isArray(profile.payslips)
        ? profile.payslips
        : []
    )
  ];

  const actualRecord = candidates.find(
    record => {

      if (
        !record ||
        typeof record !== 'object' ||
        record.isDemo
      ) {
        return false;
      }

      const recordId = normalize(
        record.employeeId ||
        record.userId
      );

      if (
        recordId &&
        !employeeIds.includes(recordId)
      ) {
        return false;
      }

      const period = normalize(
        record.payPeriod ||
        record.period ||
        record.month
      );

      if (
        ![
          normalize(payPeriod),
          getPeriodKey(payPeriod)
        ].includes(period)
      ) {
        return false;
      }

      const requiredValues = [
        record.basicSalary,
        record.hra,
        record.conveyanceSpecialAllowance,
        record.bonus,
        record.otherAllowance,
        record.epf,
        record.professionalTax,
        record.tds,
        record.lopDeduction,
        record.standardDays,
        record.payableDays,
        record.lopDays
      ];

      return requiredValues.every(value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '' &&
        Number.isFinite(
          Number(
            String(value).replace(/[â‚¹,\s]/g, '')
          )
        ) &&
        Number(
          String(value).replace(/[â‚¹,\s]/g, '')
        ) >= 0
      ) &&
      number(record.standardDays) > 0 &&
      number(record.payableDays) +
      number(record.lopDays) ===
      number(record.standardDays);
    }
  );

  if (actualRecord) {
    return {
      ...actualRecord,
      employeeId,
      payPeriod,
      isDemo: false
    };
  }

  return getDemoPayroll(employeeId, payPeriod);
};

// ============================================================
// SALARY CALCULATIONS
// ============================================================

const calculatePayslip = payroll => {

  const createEarning = (
    label,
    amount,
    arrear = 0
  ) => ({
    label,
    monthlyRate: number(amount),
    currentMonth: number(amount),
    arrear: number(arrear),

    total: roundMoney(
      number(amount) + number(arrear)
    )
  });

  const earnings = [
    createEarning(
      'BASIC SALARY',
      payroll.basicSalary,
      payroll.basicArrear
    ),

    createEarning(
      'HOUSE RENT ALLOWANCE',
      payroll.hra,
      payroll.hraArrear
    ),

    createEarning(
      'CONVEYANCE & SPECIAL',
      payroll.conveyanceSpecialAllowance,
      payroll.conveyanceArrear
    ),

    createEarning(
      'BONUS',
      payroll.bonus,
      payroll.bonusArrear
    ),

    createEarning(
      'OTHER ALLOWANCE',
      payroll.otherAllowance,
      payroll.otherAllowanceArrear
    )
  ];

  const deductions = [
    {
      label: 'EMPLOYEE EPF',
      amount: number(payroll.epf)
    },
    {
      label: 'PROFESSIONAL TAX',
      amount: number(payroll.professionalTax)
    },
    {
      label: 'TDS',
      amount: number(payroll.tds)
    },
    {
      label: 'LEAVE DEDUCTION (LOP)',
      amount: number(payroll.lopDeduction)
    }
  ];

  const totals = {
    monthlyRate: roundMoney(
      earnings.reduce(
        (sum, item) =>
          sum + item.monthlyRate,
        0
      )
    ),

    currentMonth: roundMoney(
      earnings.reduce(
        (sum, item) =>
          sum + item.currentMonth,
        0
      )
    ),

    arrear: roundMoney(
      earnings.reduce(
        (sum, item) =>
          sum + item.arrear,
        0
      )
    ),

    grossEarnings: roundMoney(
      earnings.reduce(
        (sum, item) =>
          sum + item.total,
        0
      )
    ),

    totalDeductions: roundMoney(
      deductions.reduce(
        (sum, item) =>
          sum + item.amount,
        0
      )
    )
  };

  totals.netPay = roundMoney(
    totals.grossEarnings -
    totals.totalDeductions
  );

  return {
    earnings,
    deductions,
    totals,

    amountInWords:
      totals.netPay >= 0
        ? amountInWords(totals.netPay)
        : 'Invalid negative net pay'
  };
};

// ============================================================
// TABLE STYLES
// ============================================================

// PROFESSIONAL_PAYSLIP_V2

const cellClass = 'payslip-cell';

const labelClass =
  `${cellClass} payslip-label`;

const valueClass =
  `${cellClass} payslip-value`;

const moneyClass =
  `${cellClass} payslip-money`;

const formatDocumentCurrency = value =>
  'Rs. ' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number(value));

// ============================================================
// EMPLOYEE DETAILS TABLE
// ============================================================

const EmployeeDetailsTable = ({
  identity
}) => {

  const rows = [
    [
      'Employee ID',
      identity.employeeId,
      'Date of Joining',
      identity.joiningDate
    ],

    [
      'Employee Name',
      identity.name,
      'Date of Birth',
      identity.dob
    ],

    [
      'Designation',
      identity.designation,
      'Gender',
      identity.gender
    ],

    [
      'Department',
      identity.department,
      'Grade',
      identity.grade
    ],

    [
      'Bank Name',
      identity.bankName,
      'Location',
      identity.location
    ],

    [
      'Bank Account',
      identity.bankAccount,
      'PAN',
      identity.pan
    ],

    [
      'PF Number',
      identity.pfNumber,
      'UAN',
      identity.uan
    ],

    [
      'ESI Number',
      identity.esiNumber,
      'Payment Mode',
      identity.paymentMode
    ]
  ];

  return (
    <table className="
      w-full table-fixed border-collapse
      border border-[#657078]
    ">

      <colgroup>
        <col style={{ width: '19%' }} />
        <col style={{ width: '31%' }} />
        <col style={{ width: '19%' }} />
        <col style={{ width: '31%' }} />
      </colgroup>

      <tbody>

        {rows.map(
          ([label1, value1, label2, value2]) => (

            <tr key={label1}>

              <th
                scope="row"
                className={`${labelClass} text-left`}
              >
                {label1}
              </th>

              <td className={valueClass}>
                {value1}
              </td>

              <th
                scope="row"
                className={`${labelClass} text-left`}
              >
                {label2}
              </th>

              <td className={valueClass}>
                {value2}
              </td>

            </tr>

          )
        )}

      </tbody>
    </table>
  );
};

// ============================================================
// EARNINGS AND DEDUCTIONS TABLE
// ============================================================

const SalaryTable = ({
  earnings,
  deductions,
  totals
}) => {

  const rowCount = Math.max(
    earnings.length,
    deductions.length
  );

  const headers = [
    'EARNINGS',
    'MONTHLY',
    'CURRENT',
    'ARREAR',
    'TOTAL',
    'DEDUCTIONS',
    'TOTAL'
  ];

  return (

    <table
      className="payslip-salary-table"
      aria-label="Earnings and deductions"
    >

      <colgroup>

        <col style={{ width: '22%' }} />

        <col style={{ width: '12%' }} />

        <col style={{ width: '12%' }} />

        <col style={{ width: '10%' }} />

        <col style={{ width: '12%' }} />

        <col style={{ width: '20%' }} />

        <col style={{ width: '12%' }} />

      </colgroup>

      <thead>

        <tr>

          {headers.map((header, index) => (

            <th
              scope="col"
              key={`${header}-${index}`}
              className={`
                ${cellClass}
                payslip-table-heading
              `}
            >

              {header}

            </th>

          ))}

        </tr>

      </thead>

      <tbody>

        {Array.from(
          { length: rowCount },
          (_, index) => {

            const earning = earnings[index];

            const deduction = deductions[index];

            return (

              <tr key={index}>

                <td className={cellClass}>

                  {earning?.label || '\u2014'}

                </td>

                <td className={moneyClass}>

                  {earning
                    ? formatDocumentCurrency(
                        earning.monthlyRate
                      )
                    : '\u2014'}

                </td>

                <td className={moneyClass}>

                  {earning
                    ? formatDocumentCurrency(
                        earning.currentMonth
                      )
                    : '\u2014'}

                </td>

                <td className={moneyClass}>

                  {earning
                    ? formatDocumentCurrency(
                        earning.arrear
                      )
                    : '\u2014'}

                </td>

                <td className={moneyClass}>

                  {earning
                    ? formatDocumentCurrency(
                        earning.total
                      )
                    : '\u2014'}

                </td>

                <td className={cellClass}>

                  {deduction?.label || '\u2014'}

                </td>

                <td className={moneyClass}>

                  {deduction
                    ? formatDocumentCurrency(
                        deduction.amount
                      )
                    : '\u2014'}

                </td>

              </tr>

            );

          }
        )}

        {/* SALARY TOTALS */}

        <tr className="payslip-total-row">

          <td className={labelClass}>

            GROSS EARNINGS

          </td>

          <td className={moneyClass}>

            {formatDocumentCurrency(
              totals.monthlyRate
            )}

          </td>

          <td className={moneyClass}>

            {formatDocumentCurrency(
              totals.currentMonth
            )}

          </td>

          <td className={moneyClass}>

            {formatDocumentCurrency(
              totals.arrear
            )}

          </td>

          <td className={moneyClass}>

            {formatDocumentCurrency(
              totals.grossEarnings
            )}

          </td>

          <td className={labelClass}>

            TOTAL DEDUCTIONS

          </td>

          <td className={moneyClass}>

            {formatDocumentCurrency(
              totals.totalDeductions
            )}

          </td>

        </tr>

      </tbody>

    </table>

  );

};

// ============================================================
// MAIN PAYSLIP COMPONENT
// ============================================================

export default function MyPayslip({
  employeeView = false,
  payPeriod = PAY_PERIOD,
  onBack
} = {}) {

  const {
    currentUser,
    teamMembers = [],
    triggerToast,
    isLoading,
    loadError
  } = useTeamLead();

  const payslipRef = useRef(null);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const profile = getEmployeeProfile(
    currentUser,
    teamMembers
  );

  const employeeId =
    getEmployeeId(currentUser);

  const payroll = resolvePayroll(
    profile,
    currentUser,
    payPeriod
  );

  const identity = {
    ...getPayslipIdentity(profile),

    paymentMode: displayValue(
      payroll.paymentMode ||
      profile.paymentMode ||
      profile.bankDetails?.paymentMode
    )
  };


  // PAYSLIP_PREVIEW_DETAILS_V1

  if (payroll.isDemo) {

    const previewDetails = {

      employeeId: 'EMP-PREVIEW-001',

      name: 'Employee',

      designation: 'Team Lead',

      department: 'Engineering',

      joiningDate: '01-07-2024',

      dob: '01-01-2000',

      gender: 'Not Disclosed',

      grade: 'G2',

      bankName: 'Example Bank',

      bankAccount: 'XXXX4582',

      pan: 'XXXXX1234X',

      pfNumber: 'PF-EXAMPLE-001',

      uan: 'XXXXXXXX4821',

      esiNumber: 'XXXXXX2584',

      location: 'Hyderabad',

      paymentMode: 'Bank Transfer'

    };

    const missingValues = [
      '',
      '-',
      '--',
      'not provided',
      'not available',
      'not specified',
      'undefined',
      'null',
      'n/a'
    ];

    Object.entries(previewDetails).forEach(
      ([key, value]) => {

        const existing = String(
          identity[key] ?? ''
        ).trim();

        if (
          missingValues.includes(
            existing.toLowerCase()
          )
        ) {

          identity[key] = value;

        } else {

          identity[key] = existing
            .replace(/\s*\(Demo\)/gi, '')
            .trim();

        }

      }
    );

  }

  const {
    earnings,
    deductions,
    totals,
    amountInWords: salaryInWords
  } = calculatePayslip(payroll);

  // ==========================================================
  // DOWNLOAD PAYSLIP PDF
  // ==========================================================

  const handleDownload = async () => {

    if (
      !payslipRef.current ||
      isDownloading ||
      !employeeId ||
      totals.netPay < 0
    ) {
      return;
    }

    setIsDownloading(true);

    try {

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const documentImages = Array.from(
        payslipRef.current.querySelectorAll('img')
      );

      await Promise.all(
        documentImages.map(async image => {

          if (typeof image.decode === 'function') {

            await image.decode();

          }

          if (!image.complete || !image.naturalWidth) {

            throw new Error(
              'Company logo could not be loaded.'
            );

          }

        })
      );

      const canvas = await html2canvas(
        payslipRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,

          width: Math.ceil(payslipRef.current.getBoundingClientRect().width),

          windowWidth:
            Math.max(
              1280,
              payslipRef.current.scrollWidth
            )
        }
      );

      const image =
        canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 8;

      const scale = Math.min(
        (pageWidth - margin * 2) /
          canvas.width,

        (pageHeight - margin * 2) /
          canvas.height
      );

      const imageWidth =
        canvas.width * scale;

      const imageHeight =
        canvas.height * scale;

      pdf.addImage(
        image,
        'PNG',
        (pageWidth - imageWidth) / 2,
        margin,
        imageWidth,
        imageHeight
      );

      const safeName = identity.name
        .replace(/[\\/:*?"<>|]/g, '-');

      const prefix = payroll.isDemo
        ? 'Preview Payslip'
        : 'Employee Payslip';

      pdf.save(
        `${prefix} - ${safeName} - ${payPeriod}.pdf`
      );

      triggerToast?.(
        'Payslip PDF generated.',
        'good'
      );

    } catch (error) {

      console.error(
        'Payslip PDF error:',
        error
      );

      triggerToast?.(
        'Unable to download payslip.',
        'error'
      );

    } finally {

      setIsDownloading(false);

    }
  };

  // ==========================================================
  // PRINT
  // ==========================================================

  const handlePrint = () => {

    if (
      !payslipRef.current ||
      totals.netPay < 0
    ) {
      return;
    }

    window.print();
  };

  // ==========================================================
  // LOADING / ERROR / IDENTITY VALIDATION
  // ==========================================================

  if (isLoading) {
    return (
      <div className="
        glass-card !p-8
        text-center text-muted
      ">
        Loading your payslip...
      </div>
    );
  }

  if (loadError || !employeeId) {
    return (
      <div className="
        glass-card !p-8
        text-center
      ">

        <FileText className="
          mx-auto h-7 w-7
          text-muted
        "/>

        <p className="mt-3 text-sm text-ink">
          Personal payroll information is unavailable.
        </p>

      </div>
    );
  }

  // ==========================================================
  // PAYSLIP UI
  // ==========================================================

  return (
    <div className="
      mx-auto max-w-[1400px]
      space-y-5
    ">

      <style>{`

        /* PROFESSIONAL PAYSLIP DOCUMENT */

        #personal-payslip {
          box-sizing: border-box;
          width: 730px;
          min-width: 730px;
          margin: 0 auto;
          padding: 18px;
          border: 1px solid #b5b5b5;
          background: #ffffff;
          color: #111111;
          font-size: 11px;
          line-height: 1.45;
        }

        #personal-payslip,
        #personal-payslip * {
          font-family: Arial, sans-serif !important;
          box-sizing: border-box;
        }

        /* CENTERED COMPANY HEADER */

        #personal-payslip .payslip-company-header {
          display: grid;
          grid-template-columns: 125px minmax(0, 1fr) 125px;
          align-items: start;
          gap: 10px;
          padding: 8px 0 15px;
        }

        #personal-payslip .payslip-logo {
          display: block;
          width: 125px;
          max-height: 65px;
          height: auto;
          object-fit: contain;
          object-position: left top;
        }

        #personal-payslip .payslip-company-information {
          min-width: 0;
          text-align: center;
        }

        #personal-payslip .payslip-company-name {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.45;
          color: #111111;
          text-transform: uppercase;
        }

        #personal-payslip .payslip-company-address {
          margin-top: 7px;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.6;
          color: #111111;
        }

        #personal-payslip .payslip-period-title {
          padding: 14px 8px 16px;
          border-top: 1px solid #b5b5b5;
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: #111111;
        }

        #personal-payslip .payslip-demo-label {
          margin: 0 0 12px;
          padding: 5px 8px;
          border: 1px solid #d6b56d;
          background: #fff8e8;
          color: #795413;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
        }

        /* EMPLOYEE AND SALARY TABLES */

        #personal-payslip table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          border: 1px solid #777777;
        }

        #personal-payslip .payslip-cell {
          border: 1px solid #777777;
          padding: 9px 6px;
          vertical-align: middle;
          color: #111111;
          font-size: 10.5px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        #personal-payslip .payslip-label {
          background: #f3f4f5;
          text-align: left;
          font-weight: 700;
        }

        #personal-payslip .payslip-value {
          background: #ffffff;
          font-weight: 500;
        }

        #personal-payslip .payslip-money {
          text-align: right;
          font-size: 10px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        #personal-payslip .payslip-table-heading {
          padding: 10px 4px;
          background: #e6eaed;
          color: #111111;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
        }

        #personal-payslip .payslip-total-row td {
          background: #eef1f3;
          font-weight: 700;
        }

        /* ATTENDANCE SUMMARY */

        #personal-payslip .payslip-attendance-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin: 13px 0;
          border: 1px solid #777777;
          background: #f1f3f4;
          font-size: 10.5px;
          font-weight: 700;
        }

        #personal-payslip .payslip-attendance-summary > div {
          padding: 9px 5px;
          text-align: center;
          border-right: 1px solid #b5b5b5;
        }

        #personal-payslip .payslip-attendance-summary > div:last-child {
          border-right: none;
        }

        /* NET PAY */

        #personal-payslip .payslip-net-pay {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 14px;
          margin-top: 14px;
          border: 1px solid #777777;
          background: #e3eee8;
        }

        #personal-payslip .payslip-net-pay-title {
          font-size: 13px;
          font-weight: 700;
        }

        #personal-payslip .payslip-net-pay-amount {
          color: #111111;
          font-size: 17px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        /* AMOUNT IN WORDS */

        #personal-payslip .payslip-amount-words {
          margin-top: 10px;
          padding: 12px;
          border: 1px solid #777777;
          font-size: 11px;
          line-height: 1.6;
        }

        #personal-payslip .payslip-amount-words h3 {
          margin: 0 0 4px;
          font-size: 10.5px;
          font-weight: 700;
        }

        /* AUTHORIZED SIGNATORY */

        #personal-payslip .payslip-footer {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding-top: 18px;
        }

        #personal-payslip .payslip-signatory {
          width: 230px;
          text-align: center;
          font-size: 10.5px;
          line-height: 1.6;
        }

        #personal-payslip .payslip-signature-space {
          height: 38px;
          margin-bottom: 7px;
          border-bottom: 1px solid #777777;
        }

        #personal-payslip .payslip-document-status {
          margin-top: 17px;
          padding-top: 9px;
          border-top: 1px solid #d5d5d5;
          color: #555555;
          font-size: 9px;
          text-align: center;
          line-height: 1.5;
        }

        #personal-payslip .chaturya-signature {
    font-family: 'Segoe Script', 'Brush Script MT', cursive !important;
}

/* A4 PORTRAIT PRINT */

        @media print {

          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body:has(#personal-payslip)
          > :not(:has(#personal-payslip)):not(#personal-payslip),

          body :has(#personal-payslip)
          > :not(:has(#personal-payslip)):not(#personal-payslip) {
            display: none !important;
          }

          body *:has(#personal-payslip) {
            display: block !important;
            position: static !important;
            overflow: visible !important;
            width: auto !important;
            min-width: 0 !important;
            max-width: none !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            transform: none !important;
            animation: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          #personal-payslip {
            position: static !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 1px solid #777777 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          #personal-payslip tr,
          #personal-payslip section,
          #personal-payslip footer {
            break-inside: avoid;
          }

        }

      `}</style>

      {/* PAGE HEADER */}

      <div className="
        flex flex-wrap items-center
        justify-between gap-4
      ">

        <div>

          <h1 className="
            font-display text-xl
            font-bold text-ink
          ">
            {'Payslip - ' + payPeriod}
          </h1>

          

        </div>

        <div className="
          flex flex-wrap items-center gap-2
        ">

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isDownloading}
              className="
                inline-flex items-center gap-2
                rounded-xl border border-line
                bg-surface2 px-4 py-2.5
                text-xs font-semibold text-ink
                hover:border-accent/40
                disabled:opacity-50
              "
            >
              <PayslipBackIcon className="h-4 w-4" />
              Back to Payslips
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            disabled={totals.netPay < 0}
            className="
              inline-flex items-center gap-2
              rounded-xl border border-line
              bg-surface2 px-4 py-2.5
              text-xs font-semibold text-ink
              hover:brightness-110
              disabled:opacity-50
            "
          >

            <Printer className="h-4 w-4"/>

            Print

          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={
              isDownloading ||
              totals.netPay < 0
            }
            className="
              inline-flex items-center gap-2
              rounded-xl bg-accent
              px-4 py-2.5 text-xs
              font-bold text-on-accent
              hover:brightness-110
              disabled:opacity-50
            "
          >

            {isDownloading ? (

              <Loader2 className="
                h-4 w-4 animate-spin
              "/>

            ) : (

              <Download className="h-4 w-4"/>

            )}

            {isDownloading
              ? 'Generating...'
              : 'Download My Payslip'}

          </button>

        </div>

      </div>

      

      {totals.netPay < 0 && (

        <div className="
          rounded-xl border border-bad/30
          bg-bad/10 p-3 text-xs text-bad
        ">
          Payroll totals are inconsistent.
          Download and print are disabled.
        </div>

      )}

      {/* PAYSLIP DOCUMENT */}

      <div className="overflow-x-auto rounded-lg">

        <article
          id="personal-payslip"
          ref={payslipRef}
          aria-label={`Payslip for ${payPeriod}`}
        >

          {/* COMPANY HEADER */}

          <header className="payslip-company-header">

            <div>

              <img
                src="/technomold-payslip-logo.png"
                alt="Technomold company logo"
                className="payslip-logo"
              />

            </div>

            <div className="payslip-company-information">

              <h2 className="payslip-company-name">

                {COMPANY.legalName}

              </h2>

              <div className="payslip-company-address">

                <div>
                  Plot No. 24, Hitech City Road,
                </div>

                <div>
                  Madhapur, Hyderabad,
                </div>

                <div>
                  Telangana - 500081
                </div>

              </div>

            </div>

            {/* BALANCED RIGHT COLUMN */}

            <div aria-hidden="true" />

          </header>

          {/* PAY PERIOD */}

          <div className="payslip-period-title">

            Payslip for the month of{' '}

            {payPeriod.toUpperCase()}

          </div>

          

          {/* EMPLOYEE INFORMATION */}

          <EmployeeDetailsTable
            identity={identity}
          />

          {/* ATTENDANCE SUMMARY */}

          <section className="payslip-attendance-summary">

            <div>

              Standard Days:{' '}

              {number(payroll.standardDays)}

            </div>

            <div>

              Payable Days:{' '}

              {number(payroll.payableDays)}

            </div>

            <div>

              LOP Days:{' '}

              {number(payroll.lopDays)}

            </div>

            <div>

              Arrear Days:{' '}

              {payroll.arrearDays != null &&
               String(payroll.arrearDays).trim() !== ''
                ? number(payroll.arrearDays)
                : payroll.isDemo
                  ? 0
                  : 'Not Provided'}

            </div>

          </section>

          {/* EARNINGS AND DEDUCTIONS */}

          <SalaryTable
            earnings={earnings}
            deductions={deductions}
            totals={totals}
          />

          {/* NET PAY */}

          <section className="payslip-net-pay">

            <h3 className="payslip-net-pay-title">

              NET PAY

            </h3>

            <p className="payslip-net-pay-amount">

              {totals.netPay >= 0

                ? formatDocumentCurrency(
                    totals.netPay
                  )

                : 'Invalid payroll total'}

            </p>

          </section>

          {/* AMOUNT IN WORDS */}

          <section className="payslip-amount-words">

            <h3>

              AMOUNT IN WORDS:

            </h3>

            <p>

              {salaryInWords}

            </p>

          </section>

          {/* AUTHORIZED SIGNATORY */}

          <footer className="payslip-footer">

            <div className="payslip-signatory">

              <div
                style={{
                  height: '65px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #777777',
                  marginBottom: '7px'
                }}
              >

                {payroll.isDemo && (
                  <svg
                    width="200"
                    height="65"
                    viewBox="0 0 200 65"
                  >

                    <g transform="rotate(-7 100 32)">

                      <text
                        x="100"
                        y="37"
                        textAnchor="middle"
                        style={{
                          fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
                          fontSize: '30px',
                          fontStyle: 'italic',
                          fill: '#152c57'
                        }}
                        className="chaturya-signature"
                      >
                        Chaturya
                      </text>

                      <path
                        d="M25 49 Q90 39 177 44 Q130 48 76 54"
                        fill="none"
                        stroke="#152c57"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />

                    </g>

                  </svg>
                )}

              </div>

              <p style={{ fontWeight: 700 }}>
                Authorized Signatory
              </p>

              <p>
                {COMPANY.legalName}
              </p>

            </div>

          </footer>

          {/* DOCUMENT STATUS */}

          <div className="payslip-document-status">

            {payroll.isDemo

              ? 'Sample Payroll Record - Not Valid as Proof of Salary'

              : 'System-generated payroll statement. Authorization is subject to company verification.'}

          </div>

        </article>

      </div>

    </div>
  );
}

// ============================================================
// EMPLOYEE PORTAL EXPORT
// ============================================================

const EmployeePayslipHistory = ({
  profile,
  currentUser
}) => {

  const [selectedPeriod, setSelectedPeriod] =
    useState('');

  const [yearFilter, setYearFilter] =
    useState('all');

  const [search, setSearch] =
    useState('');

  const candidateRecords = [
    profile.payslip,
    profile.payroll,
    profile.payrollSummary,
    ...(
      Array.isArray(profile.payslips)
        ? profile.payslips
        : []
    )
  ].filter(Boolean);

  const actualPeriods = [
    ...new Set(
      candidateRecords
        .map(record =>
          getPeriodLabel(
            record.payPeriod ||
            record.period ||
            record.month
          )
        )
        .filter(Boolean)
    )
  ].filter(period =>
    !resolvePayroll(
      profile,
      currentUser,
      period
    ).isDemo
  );

  // Do not mix sample salary history with
  // available genuine payroll records.

  const periods = (
    actualPeriods.length
      ? actualPeriods
      : getSamplePeriods()
  ).sort((left, right) =>
    getPeriodKey(right).localeCompare(
      getPeriodKey(left)
    )
  );

  const records = periods.map(period => {

    const payroll = resolvePayroll(
      profile,
      currentUser,
      period
    );

    const calculated =
      calculatePayslip(payroll);

    return {
      period,
      payroll,
      ...calculated
    };

  });

  const years = [
    ...new Set(
      periods.map(period =>
        getPeriodKey(period).slice(0, 4)
      )
    )
  ];

  const filteredRecords = records.filter(
    record => {

      const matchesYear =
        yearFilter === 'all' ||
        getPeriodKey(
          record.period
        ).startsWith(yearFilter);

      const matchesSearch =
        normalize(record.period).includes(
          normalize(search)
        );

      return (
        matchesYear &&
        matchesSearch
      );

    }
  );

  const latestRecord = records[0];

  const isSampleHistory =
    actualPeriods.length === 0;

  if (
    selectedPeriod &&
    periods.includes(selectedPeriod)
  ) {
    return (
      <MyPayslip
        key={selectedPeriod}
        employeeView
        payPeriod={selectedPeriod}
        onBack={() =>
          setSelectedPeriod('')
        }
      />
    );
  }

  return (
    <div className="
      mx-auto max-w-[1400px]
      space-y-5
    ">

      {/* PAYROLL SUMMARY */}

      <div className="
        grid gap-4
        sm:grid-cols-2 xl:grid-cols-3
      ">

        {[
          {
            label: 'Latest Net Pay',
            value: latestRecord &&
              latestRecord.totals.netPay >= 0
                ? formatCurrency(
                    latestRecord.totals.netPay
                  )
                : 'N/A',
            icon: PayslipWalletIcon
          },
          {
            label: 'Latest Pay Period',
            value: latestRecord?.period || 'N/A',
            icon: PayslipCalendarIcon
          },
          {
            label: 'Available Payslips',
            value: records.length,
            icon: FileText
          }
        ].map(item => {

          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="glass-card !p-5"
            >

              <div className="
                flex items-center
                justify-between gap-3
              ">

                <p className="
                  text-xs font-medium text-muted
                ">
                  {item.label}
                </p>

                <div className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl border border-accent/20
                  bg-accent/10
                ">
                  <Icon className="
                    h-5 w-5 text-accent
                  "/>
                </div>

              </div>

              <p className="
                mt-4 font-data text-xl
                font-bold text-ink
              ">
                {item.value}
              </p>

            </article>
          );

        })}

      </div>

      {/* PAYSLIP HISTORY */}

      <section className="glass-card !p-5">

        <div className="
          mb-5 flex flex-wrap items-center
          justify-between gap-3
        ">

          <h2 className="
            font-display text-base
            font-semibold text-ink
          ">
            Payslip History
          </h2>

          <div className="
            flex flex-wrap items-center gap-2
          ">

            <input
              type="search"
              value={search}
              placeholder="Search pay period..."
              onChange={event =>
                setSearch(event.target.value)
              }
              className="
                rounded-xl border border-line
                bg-surface2 px-3 py-2.5
                text-xs text-ink outline-none
                focus:border-accent
              "
            />

            <select
              value={yearFilter}
              onChange={event =>
                setYearFilter(event.target.value)
              }
              className="
                rounded-xl border border-line
                bg-surface2 px-3 py-2.5
                text-xs text-ink outline-none
              "
            >
              <option value="all">
                All Years
              </option>

              {years.map(year => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}

            </select>

          </div>

        </div>

        

        <div className="
          overflow-x-auto rounded-xl
          border border-line/50
        ">

          <table className="
            w-full whitespace-nowrap
            text-left text-xs
          ">

            <thead className="bg-surface2">

              <tr>

                {[
                  'Pay Period',
                  'Gross Earnings',
                  'Deductions',
                  'Net Pay',
                  'Status',
                  'Action'
                ].map(label => (

                  <th
                    key={label}
                    className="
                      px-4 py-4
                      font-semibold text-muted
                    "
                  >
                    {label}
                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {filteredRecords.map(record => (

                <tr
                  key={record.period}
                  className="
                    border-t border-line/50
                    hover:bg-surface2/40
                  "
                >

                  <td className="
                    px-4 py-4 font-semibold
                    text-ink
                  ">

                    <div className="
                      flex items-center gap-3
                    ">

                      <span className="
                        flex h-9 w-9 items-center
                        justify-center rounded-lg
                        bg-accent/10 text-accent
                      ">
                        <FileText className="h-4 w-4" />
                      </span>

                      {record.period}

                    </div>

                  </td>

                  <td className="
                    px-4 py-4 text-muted
                    font-data tabular-nums
                  ">
                    {formatCurrency(
                      record.totals.grossEarnings
                    )}
                  </td>

                  <td className="
                    px-4 py-4 text-muted
                    font-data tabular-nums
                  ">
                    {formatCurrency(
                      record.totals.totalDeductions
                    )}
                  </td>

                  <td className="
                    px-4 py-4 font-data
                    font-bold text-accent
                    tabular-nums
                  ">

                    {record.totals.netPay >= 0
                      ? formatCurrency(
                          record.totals.netPay
                        )
                      : 'Invalid'}

                  </td>

                  <td className="px-4 py-4">

                    <span className="
                      rounded-lg border border-line
                      bg-surface2 px-2.5 py-1.5
                      text-[10px] font-medium
                      text-muted
                    ">

                      {record.payroll.isDemo
                        ? 'Preview'
                        : 'Available'}

                    </span>

                  </td>

                  <td className="px-4 py-4">

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPeriod(
                          record.period
                        )
                      }
                      className="
                        inline-flex items-center gap-2
                        rounded-lg border border-accent/30
                        bg-accent/10 px-3 py-2
                        font-semibold text-accent
                        hover:bg-accent/20
                      "
                    >
                      <PayslipEyeIcon className="h-4 w-4" />
                      View Payslip
                    </button>

                  </td>

                </tr>

              ))}

              {!filteredRecords.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="
                      px-4 py-10 text-center
                      text-muted
                    "
                  >
                    No payslips match your filters.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        <p className="
          mt-4 text-[11px] text-muted
        ">
          Showing {filteredRecords.length} of
          {' '}{records.length} payslips
        </p>

      </section>

    </div>
  );
};

export const EmployeePayslip = () => {

  const {
    currentUser,
    teamMembers = [],
    isLoading,
    loadError
  } = useTeamLead();

  const employeeId =
    getEmployeeId(currentUser);

  const profile = getEmployeeProfile(
    currentUser,
    teamMembers
  );

  if (isLoading) {
    return (
      <div className="
        glass-card !p-8 text-center
        text-sm text-muted
      ">
        Loading payslips...
      </div>
    );
  }

  if (loadError || !employeeId) {
    return (
      <div className="
        glass-card !p-8 text-center
        text-sm text-muted
      ">
        Personal payroll information is unavailable.
      </div>
    );
  }

  return (
    <EmployeePayslipHistory
      key={employeeId}
      profile={profile}
      currentUser={currentUser}
    />
  );
};