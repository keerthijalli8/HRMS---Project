// Payslip PDF & Document Export Engine
// Exact replica of the official Technomold IT Solutions Pvt Ltd Employee Payslip layout
import { downloadCSV } from './exportUtils';
import { TECHNOMOLD_LOGO_DATA_URL, LOGO_HEX, LOGO_WIDTH, LOGO_HEIGHT } from './logoData';

/**
 * Converts numeric amount to Indian currency words
 * e.g. 64330 -> "Rupees Sixty Four Thousand Three Hundred Thirty Only"
 */
export function numberToIndianWords(number) {
  const n = Math.round(Number(number) || 0);
  if (n === 0) return 'Rupees Zero Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertSection(num) {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '') + ' ';
    } else if (num > 0) {
      str += units[num] + ' ';
    }
    return str;
  }

  let result = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) result += convertSection(crore) + 'Crore ';
  if (lakh > 0) result += convertSection(lakh) + 'Lakh ';
  if (thousand > 0) result += convertSection(thousand) + 'Thousand ';
  if (remainder > 0) result += convertSection(remainder);

  return 'Rupees ' + result.trim() + ' Only';
}

/**
 * Formats a number or string into Rs. XX,XXX.00
 */
function formatRupees(val) {
  if (val === '-' || val === '—') return '-';
  if (!val && val !== 0) return 'Rs. 0.00';
  const clean = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 'Rs. 0.00';
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAmount(val) {
  if (!val && val !== 0) return 0;
  const clean = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Extracts and maps structured breakdown components from slip
 */
function resolveSalaryComponents(slip) {
  const earningsList = slip.earnings || [];
  const deductionsList = slip.deductions || [];

  // Helper to find amount by keyword
  const findEarn = (kw) => {
    const item = earningsList.find((e) => e.label?.toLowerCase().includes(kw));
    return item ? parseAmount(item.amount) : 0;
  };
  const findDed = (kw) => {
    const item = deductionsList.find((d) => d.label?.toLowerCase().includes(kw));
    return item ? parseAmount(item.amount) : 0;
  };

  const basic = findEarn('basic') || (parseAmount(slip.gross) ? Math.round(parseAmount(slip.gross) * 0.5) : 35417);
  const hra = findEarn('rent') || findEarn('hra') || (parseAmount(slip.gross) ? Math.round(parseAmount(slip.gross) * 0.25) : 17709);
  const conv = findEarn('special') || findEarn('conveyance') || (parseAmount(slip.gross) ? Math.round(parseAmount(slip.gross) * 0.18) : 13204);
  const bonus = findEarn('bonus') || findEarn('incentive') || (parseAmount(slip.gross) ? parseAmount(slip.gross) - (basic + hra + conv) : 0);
  const other = findEarn('other') || 0;

  const gross = basic + hra + conv + bonus + other;

  const epf = findDed('provident') || findDed('epf') || 1800;
  const pt = findDed('professional') || findDed('pt') || 200;
  const tds = findDed('tds') || findDed('tax') || 0;
  const lop = findDed('lop') || findDed('leave') || 0;

  const totalDeductions = epf + pt + tds + lop;
  const net = gross - totalDeductions;

  return {
    basic,
    hra,
    conv,
    bonus,
    other,
    gross,
    epf,
    pt,
    tds,
    lop,
    totalDeductions,
    net,
  };
}

/**
 * Generates and downloads an exact PDF matching the official Technomold payslip layout
 */
export function downloadPayslipPDF(slip = {}, employee = {}) {
  const sanitize = (str) => String(str || '').replace(/[()\\]/g, '').replace(/₹/g, 'Rs. ');

  const empName = employee.name || 'Lokesh Kumar';
  const empId = employee.id || 'EMP-1001';
  const empRole = employee.role || 'Engineering Manager';
  const empDept = employee.department || 'Platform Engineering';
  const empPan = employee.pan || 'ABCDE1234F';
  const empUan = employee.uan || '10098452109';
  const empDob = employee.dob || '1992-08-20';
  const empDoj = employee.doj || '2021-02-01';
  const empGender = employee.gender || 'Male';
  const empGrade = employee.grade || 'L2';
  const empLoc = employee.location || 'Hyderabad';
  const empBank = slip.bankName || employee.bankName || (slip.bank ? String(slip.bank).split('(')[0].trim() : 'HDFC Bank');
  const empAccount = slip.bankAccount || employee.bankAccount || (slip.bank && slip.bank.includes('••••') ? '•••• 4892' : 'Not Provided');
  const empPf = employee.pf || 'Not Provided';
  const empEsi = employee.esi || 'Not Applicable';
  const empPaymentMode = employee.paymentMode || 'Bank Transfer';

  const monthUpper = (slip.month || 'NOVEMBER 2026').toUpperCase();

  const standardDays = slip.daysWorked || 30;
  const payableDays = slip.daysWorked || 30;
  const lopDays = slip.lopDays || 0;
  const arrearDays = 0;

  const comp = resolveSalaryComponents(slip);
  const netWords = slip.netInWords || numberToIndianWords(comp.net);

  let stream = '';

  const setStrokeColor = (r, g, b) => { stream += `${r} ${g} ${b} RG\n`; };
  const setFillColor = (r, g, b) => { stream += `${r} ${g} ${b} rg\n`; };
  const setLineWidth = (w) => { stream += `${w} w\n`; };

  const line = (x1, y1, x2, y2) => {
    stream += `${x1} ${y1} m ${x2} ${y2} l S\n`;
  };

  const rect = (x, y, w, h, fill = false) => {
    if (fill) {
      stream += `${x} ${y} ${w} ${h} re f\n`;
    } else {
      stream += `${x} ${y} ${w} ${h} re S\n`;
    }
  };

  const text = (str, x, y, size = 8, font = '/F1') => {
    stream += `BT ${font} ${size} Tf ${x} ${y} Td (${sanitize(str)}) Tj ET\n`;
  };

  const left = 35;
  const right = 560;
  const width = right - left; // 525
  const top = 795;
  const bottom = 270;
  const height = top - bottom; // 525

  setLineWidth(0.8);
  setStrokeColor(0.2, 0.2, 0.2);

  // 1. OUTER BORDER BOX
  rect(left, bottom, width, height);

  // 2. HEADER SECTION
  // Embed Official Company Logo (XObject /Im1): x=48, y=745, width=135, height=39
  stream += `q 135 0 0 39 48 745 cm /Im1 Do Q\n`;

  // Right Header Address
  setFillColor(0.1, 0.1, 0.1);
  text('Technomold IT Solutions Pvt Ltd', 245, 770, 9.5, '/F2');
  setFillColor(0.3, 0.3, 0.3);
  text('Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081', 245, 757, 7.5, '/F1');
  setFillColor(0.45, 0.45, 0.45);
  text('CIN: U72200TG2020PTC145892  |  Email: hr@technomoldit.com', 245, 746, 7, '/F1');

  // Divider line under header
  setStrokeColor(0.3, 0.3, 0.3);
  line(left, 738, right, 738);

  // 3. TITLE: EMPLOYEE PAYSLIP - NOVEMBER 2026
  setFillColor(0.1, 0.1, 0.1);
  const titleStr = `EMPLOYEE PAYSLIP - ${monthUpper}`;
  text(titleStr, 185, 722, 10.5, '/F2');
  line(left, 712, right, 712);

  // 4. EMPLOYEE DETAILS TABLE (8 rows, from y=712 down to y=592, each row 15pt)
  const empCols = [left, 125, 275, 385, right];
  // Vertical column dividers
  line(empCols[1], 712, empCols[1], 592);
  line(empCols[2], 712, empCols[2], 592);
  line(empCols[3], 712, empCols[3], 592);

  const empRows = [
    ['Employee ID', empId, 'Date of Joining', empDoj],
    ['Employee Name', empName, 'Date of Birth', empDob],
    ['Designation', empRole, 'Gender', empGender],
    ['Department', empDept, 'Grade', empGrade],
    ['Bank Name', empBank, 'Location', empLoc],
    ['Bank Account', empAccount, 'PAN', empPan],
    ['PF Number', empPf, 'UAN', empUan],
    ['ESI Number', empEsi, 'Payment Mode', empPaymentMode],
  ];

  let curY = 712;
  empRows.forEach((row) => {
    const textY = curY - 11;
    setFillColor(0.15, 0.15, 0.15);
    text(row[0], empCols[0] + 6, textY, 7.5, '/F2');
    text(row[1], empCols[1] + 6, textY, 7.5, '/F1');
    text(row[2], empCols[2] + 6, textY, 7.5, '/F2');
    text(row[3], empCols[3] + 6, textY, 7.5, '/F1');

    curY -= 15;
    line(left, curY, right, curY);
  });

  // 5. DAYS SUMMARY STRIP (y=592 to 574, height 18pt)
  const daysText = `Standard Days: ${standardDays}   Payable Days: ${payableDays}   LOP Days: ${lopDays}   Arrear Days: ${arrearDays}`;
  setFillColor(0.1, 0.1, 0.1);
  text(daysText, 175, 581, 8, '/F2');
  line(left, 574, right, 574);

  // 6. SALARY BREAKDOWN TABLE
  // Earnings: [left(35), 150(Earnings), 215(Monthly), 280(Current), 335(Arrear), 395(Total)]
  // Deductions: [395, 485(Deductions), right(560)(Total)]
  const salCols = [left, 150, 215, 280, 335, 395, 485, right];

  // Header background: Teal (#daf0ee -> 0.855, 0.941, 0.933)
  setFillColor(0.855, 0.941, 0.933);
  rect(left, 556, width, 18, true);

  // Header vertical lines
  setStrokeColor(0.3, 0.3, 0.3);
  salCols.slice(1, -1).forEach((x) => {
    line(x, 574, x, 556);
  });

  // Header Texts
  setFillColor(0.15, 0.15, 0.15);
  text('EARNINGS', salCols[0] + 6, 563, 7, '/F2');
  text('MONTHLY', salCols[1] + 10, 563, 7, '/F2');
  text('CURRENT', salCols[2] + 10, 563, 7, '/F2');
  text('ARREAR', salCols[3] + 8, 563, 7, '/F2');
  text('TOTAL', salCols[4] + 12, 563, 7, '/F2');
  text('DEDUCTIONS', salCols[5] + 6, 563, 7, '/F2');
  text('TOTAL', salCols[6] + 18, 563, 7, '/F2');

  line(left, 556, right, 556);

  const salaryRows = [
    {
      earnName: 'BASIC SALARY',
      earnMonthly: formatRupees(comp.basic),
      earnCurrent: formatRupees(comp.basic),
      earnArrear: 'Rs. 0.00',
      earnTotal: formatRupees(comp.basic),
      dedName: 'EMPLOYEE EPF',
      dedTotal: formatRupees(comp.epf),
    },
    {
      earnName: 'HOUSE RENT ALLOWANCE',
      earnMonthly: formatRupees(comp.hra),
      earnCurrent: formatRupees(comp.hra),
      earnArrear: 'Rs. 0.00',
      earnTotal: formatRupees(comp.hra),
      dedName: 'PROFESSIONAL TAX',
      dedTotal: formatRupees(comp.pt),
    },
    {
      earnName: 'CONVEYANCE & SPECIAL',
      earnMonthly: formatRupees(comp.conv),
      earnCurrent: formatRupees(comp.conv),
      earnArrear: 'Rs. 0.00',
      earnTotal: formatRupees(comp.conv),
      dedName: 'TDS',
      dedTotal: formatRupees(comp.tds),
    },
    {
      earnName: 'BONUS',
      earnMonthly: formatRupees(comp.bonus),
      earnCurrent: formatRupees(comp.bonus),
      earnArrear: 'Rs. 0.00',
      earnTotal: formatRupees(comp.bonus),
      dedName: 'LEAVE DEDUCTION (LOP)',
      dedTotal: formatRupees(comp.lop),
    },
    {
      earnName: 'OTHER ALLOWANCE',
      earnMonthly: formatRupees(comp.other),
      earnCurrent: formatRupees(comp.other),
      earnArrear: 'Rs. 0.00',
      earnTotal: formatRupees(comp.other),
      dedName: '-',
      dedTotal: '-',
    },
  ];

  let salY = 556;
  const rowHeight = 16;

  salaryRows.forEach((r) => {
    salCols.slice(1, -1).forEach((x) => {
      line(x, salY, x, salY - rowHeight);
    });

    const textY = salY - 11;
    setFillColor(0.2, 0.2, 0.2);
    text(r.earnName, salCols[0] + 6, textY, 6.5, '/F1');
    text(r.earnMonthly, salCols[1] + 6, textY, 6.5, '/F1');
    text(r.earnCurrent, salCols[2] + 6, textY, 6.5, '/F1');
    text(r.earnArrear, salCols[3] + 8, textY, 6.5, '/F1');
    text(r.earnTotal, salCols[4] + 8, textY, 6.5, '/F1');
    text(r.dedName, salCols[5] + 6, textY, 6.5, '/F1');
    text(r.dedTotal, salCols[6] + 10, textY, 6.5, '/F1');

    salY -= rowHeight;
    line(left, salY, right, salY);
  });

  // Summary Row: GROSS EARNINGS | TOTAL DEDUCTIONS
  salCols.slice(1, -1).forEach((x) => {
    line(x, salY, x, salY - rowHeight);
  });
  const grossTextY = salY - 11;
  setFillColor(0.1, 0.1, 0.1);
  text('GROSS EARNINGS', salCols[0] + 6, grossTextY, 7, '/F2');
  text(formatRupees(comp.gross), salCols[1] + 6, grossTextY, 7, '/F2');
  text(formatRupees(comp.gross), salCols[2] + 6, grossTextY, 7, '/F2');
  text('Rs. 0.00', salCols[3] + 8, grossTextY, 7, '/F2');
  text(formatRupees(comp.gross), salCols[4] + 8, grossTextY, 7, '/F2');
  text('TOTAL DEDUCTIONS', salCols[5] + 6, grossTextY, 7, '/F2');
  text(formatRupees(comp.totalDeductions), salCols[6] + 10, grossTextY, 7, '/F2');

  salY -= rowHeight;
  line(left, salY, right, salY);

  // 7. NET PAY STRIP (Teal background, height 22pt)
  const netY = salY;
  setFillColor(0.855, 0.941, 0.933);
  rect(left, netY - 22, width, 22, true);

  setFillColor(0.1, 0.1, 0.1);
  text('NET PAY', left + 14, netY - 15, 10, '/F2');
  text(formatRupees(comp.net), right - 110, netY - 15, 11, '/F2');

  line(left, netY - 22, right, netY - 22);

  // 8. AMOUNT IN WORDS
  const wordsY = netY - 22;
  setFillColor(0.15, 0.15, 0.15);
  text('AMOUNT IN WORDS:', left + 14, wordsY - 14, 7.5, '/F2');
  text(netWords, left + 14, wordsY - 27, 8, '/F1');

  // 9. SIGNATURE SECTION (Bottom Right)
  setFillColor(0.15, 0.15, 0.15);
  text('R. Vinay', 420, bottom + 55, 14, '/F3');
  line(380, bottom + 47, 535, bottom + 47);
  text('Authorized Signatory (R. Vinay)', 395, bottom + 36, 7.5, '/F1');
  text('Technomold IT Solutions Pvt Ltd', 397, bottom + 24, 7.5, '/F1');

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> /XObject << /Im1 8 0 R >> >> >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
  const obj7 = '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n';
  const obj8 = '8 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + LOGO_WIDTH + ' /Height ' + LOGO_HEIGHT + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length ' + LOGO_HEX.length + ' >>\nstream\n' + LOGO_HEX + '\nendstream\nendobj\n';

  let offset = 0;
  const header = '%PDF-1.4\n';
  offset += header.length;
  const offsets = [offset];
  const objects = [obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8];
  for (let i = 0; i < objects.length - 1; i++) {
    offset += objects[i].length;
    offsets.push(offset);
  }
  let xref = 'xref\n0 9\n0000000000 65535 f \n';
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  const trailerOffset = offset + objects[objects.length - 1].length;
  const trailer = 'trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n' + trailerOffset + '\n%%EOF\n';

  const pdfString = header + objects.join('') + xref + trailer;

  // Trigger browser download
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const filename = 'Technomold-Payslip-' + monthUpper.replace(/\s+/g, '-') + '.pdf';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print view replicating the exact official Technomold payslip layout
 */
export function printPayslip(slip = {}, employee = {}) {
  const empName = employee.name || 'Lokesh Kumar';
  const empId = employee.id || 'EMP-1001';
  const empRole = employee.role || 'Engineering Manager';
  const empDept = employee.department || 'Platform Engineering';
  const empPan = employee.pan || 'ABCDE1234F';
  const empUan = employee.uan || '10098452109';
  const empDob = employee.dob || '1992-08-20';
  const empDoj = employee.doj || '2021-02-01';
  const empGender = employee.gender || 'Male';
  const empGrade = employee.grade || 'L2';
  const empLoc = employee.location || 'Hyderabad';
  const empBank = slip.bankName || employee.bankName || (slip.bank ? String(slip.bank).split('(')[0].trim() : 'HDFC Bank');
  const empAccount = slip.bankAccount || employee.bankAccount || (slip.bank && slip.bank.includes('••••') ? '•••• 4892' : 'Not Provided');
  const empPf = employee.pf || 'Not Provided';
  const empEsi = employee.esi || 'Not Applicable';
  const empPaymentMode = employee.paymentMode || 'Bank Transfer';

  const monthUpper = (slip.month || 'NOVEMBER 2026').toUpperCase();

  const standardDays = slip.daysWorked || 30;
  const payableDays = slip.daysWorked || 30;
  const lopDays = slip.lopDays || 0;
  const arrearDays = 0;

  const comp = resolveSalaryComponents(slip);
  const netWords = slip.netInWords || numberToIndianWords(comp.net);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Technomold Payslip - ${monthUpper} - ${empName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
    }
    .sheet {
      border: 1.5px solid #222;
      max-width: 780px;
      margin: 0 auto;
      background: #fff;
    }
    /* Top Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1.5px solid #222;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: #e11d48;
      color: #fff;
      font-weight: 800;
      font-size: 16px;
      padding: 7px 10px;
      border-radius: 4px;
      letter-spacing: -0.5px;
    }
    .brand-title .tech {
      color: #e11d48;
      font-size: 15px;
      font-weight: 800;
      margin: 0;
      line-height: 1.2;
    }
    .brand-title .sub {
      color: #000;
      font-size: 12px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.2px;
    }
    .address {
      text-align: right;
      font-size: 10px;
      color: #333;
    }
    .address .comp-name {
      font-weight: bold;
      color: #000;
      font-size: 11px;
      margin-bottom: 3px;
    }
    /* Title */
    .title {
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 9px 0;
      border-bottom: 1.5px solid #222;
    }
    /* 4-col Table */
    .table-info {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .table-info td {
      border-bottom: 1px solid #333;
      border-right: 1px solid #333;
      padding: 6px 10px;
    }
    .table-info td:last-child {
      border-right: none;
    }
    .table-info tr:last-child td {
      border-bottom: none;
    }
    .table-info .lbl {
      font-weight: 700;
      width: 18%;
      color: #111;
    }
    .table-info .val {
      width: 32%;
      color: #222;
    }
    /* Days Strip */
    .days-strip {
      text-align: center;
      font-weight: 700;
      font-size: 11px;
      padding: 8px 12px;
      border-top: 1.5px solid #222;
      border-bottom: 1px solid #222;
      letter-spacing: 0.3px;
    }
    /* Salary Table */
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .salary-table th {
      background: #daf0ee;
      color: #000;
      font-weight: 800;
      padding: 8px 6px;
      border-bottom: 1px solid #333;
      border-right: 1px solid #333;
      text-align: center;
    }
    .salary-table th:last-child {
      border-right: none;
    }
    .salary-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #333;
      border-right: 1px solid #333;
    }
    .salary-table td:last-child {
      border-right: none;
    }
    .salary-table .amt {
      text-align: right;
      font-family: Arial, sans-serif;
    }
    .salary-table .gross-row td {
      font-weight: 800;
      background: #fff;
      border-top: 1.5px solid #222;
      border-bottom: 1.5px solid #222;
    }
    /* Net Pay Bar */
    .net-pay-bar {
      background: #daf0ee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 800;
      border-bottom: 1.5px solid #222;
    }
    /* Amount in Words */
    .amount-words {
      padding: 12px 18px;
      font-size: 10.5px;
      min-height: 55px;
    }
    .amount-words .lbl {
      font-weight: 800;
      margin-bottom: 4px;
    }
    /* Signature Block */
    .sig-section {
      display: flex;
      justify-content: flex-end;
      padding: 14px 28px 24px 0;
    }
    .sig-box {
      text-align: center;
      min-width: 220px;
    }
    .sig-name {
      font-family: "Courier New", Courier, monospace;
      font-size: 20px;
      font-style: italic;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .sig-line {
      border-top: 1px solid #222;
      margin-bottom: 6px;
    }
    .sig-role {
      font-size: 10px;
      color: #111;
      line-height: 1.3;
    }
    @media print {
      body { padding: 0; background: none; }
      .sheet { border: 1.5px solid #222; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Top Header -->
    <div class="header">
      <div class="brand">
        <img src="${TECHNOMOLD_LOGO_DATA_URL}" alt="Technomold IT Solutions Pvt Ltd" style="height: 44px; max-width: 220px; object-fit: contain;" />
      </div>
      <div class="address">
        <div class="comp-name">Technomold IT Solutions Pvt Ltd</div>
        <div>Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081</div>
        <div style="font-size: 8.5px; color: #555; margin-top: 2px;">CIN: U72200TG2020PTC145892 | Email: hr@technomoldit.com</div>
      </div>
    </div>

    <!-- Title -->
    <div class="title">
      EMPLOYEE PAYSLIP - ${monthUpper}
    </div>

    <!-- 4-Column Employee Info Grid -->
    <table class="table-info">
      <tbody>
        <tr>
          <td class="lbl">Employee ID</td>
          <td class="val">${empId}</td>
          <td class="lbl">Date of Joining</td>
          <td class="val">${empDoj}</td>
        </tr>
        <tr>
          <td class="lbl">Employee Name</td>
          <td class="val">${empName}</td>
          <td class="lbl">Date of Birth</td>
          <td class="val">${empDob}</td>
        </tr>
        <tr>
          <td class="lbl">Designation</td>
          <td class="val">${empRole}</td>
          <td class="lbl">Gender</td>
          <td class="val">${empGender}</td>
        </tr>
        <tr>
          <td class="lbl">Department</td>
          <td class="val">${empDept}</td>
          <td class="lbl">Grade</td>
          <td class="val">${empGrade}</td>
        </tr>
        <tr>
          <td class="lbl">Bank Name</td>
          <td class="val">${empBank}</td>
          <td class="lbl">Location</td>
          <td class="val">${empLoc}</td>
        </tr>
        <tr>
          <td class="lbl">Bank Account</td>
          <td class="val">${empAccount}</td>
          <td class="lbl">PAN</td>
          <td class="val">${empPan}</td>
        </tr>
        <tr>
          <td class="lbl">PF Number</td>
          <td class="val">${empPf}</td>
          <td class="lbl">UAN</td>
          <td class="val">${empUan}</td>
        </tr>
        <tr>
          <td class="lbl">ESI Number</td>
          <td class="val">${empEsi}</td>
          <td class="lbl">Payment Mode</td>
          <td class="val">${empPaymentMode}</td>
        </tr>
      </tbody>
    </table>

    <!-- Days Strip -->
    <div class="days-strip">
      Standard Days: ${standardDays}&nbsp;&nbsp;&nbsp;&nbsp;Payable Days: ${payableDays}&nbsp;&nbsp;&nbsp;&nbsp;LOP Days: ${lopDays}&nbsp;&nbsp;&nbsp;&nbsp;Arrear Days: ${arrearDays}
    </div>

    <!-- Salary Breakdown Table -->
    <table class="salary-table">
      <thead>
        <tr>
          <th style="width:23%;">EARNINGS</th>
          <th style="width:13%;">MONTHLY</th>
          <th style="width:13%;">CURRENT</th>
          <th style="width:11%;">ARREAR</th>
          <th style="width:13%;">TOTAL</th>
          <th style="width:15%;">DEDUCTIONS</th>
          <th style="width:12%;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>BASIC SALARY</td>
          <td class="amt">${formatRupees(comp.basic)}</td>
          <td class="amt">${formatRupees(comp.basic)}</td>
          <td class="amt">Rs. 0.00</td>
          <td class="amt">${formatRupees(comp.basic)}</td>
          <td>EMPLOYEE EPF</td>
          <td class="amt">${formatRupees(comp.epf)}</td>
        </tr>
        <tr>
          <td>HOUSE RENT ALLOWANCE</td>
          <td class="amt">${formatRupees(comp.hra)}</td>
          <td class="amt">${formatRupees(comp.hra)}</td>
          <td class="amt">Rs. 0.00</td>
          <td class="amt">${formatRupees(comp.hra)}</td>
          <td>PROFESSIONAL TAX</td>
          <td class="amt">${formatRupees(comp.pt)}</td>
        </tr>
        <tr>
          <td>CONVEYANCE & SPECIAL</td>
          <td class="amt">${formatRupees(comp.conv)}</td>
          <td class="amt">${formatRupees(comp.conv)}</td>
          <td class="amt">Rs. 0.00</td>
          <td class="amt">${formatRupees(comp.conv)}</td>
          <td>TDS</td>
          <td class="amt">${formatRupees(comp.tds)}</td>
        </tr>
        <tr>
          <td>BONUS</td>
          <td class="amt">${formatRupees(comp.bonus)}</td>
          <td class="amt">${formatRupees(comp.bonus)}</td>
          <td class="amt">Rs. 0.00</td>
          <td class="amt">${formatRupees(comp.bonus)}</td>
          <td>LEAVE DEDUCTION (LOP)</td>
          <td class="amt">${formatRupees(comp.lop)}</td>
        </tr>
        <tr>
          <td>OTHER ALLOWANCE</td>
          <td class="amt">${formatRupees(comp.other)}</td>
          <td class="amt">${formatRupees(comp.other)}</td>
          <td class="amt">Rs. 0.00</td>
          <td class="amt">${formatRupees(comp.other)}</td>
          <td>-</td>
          <td class="amt" style="text-align:center;">-</td>
        </tr>
        <tr class="gross-row">
          <td>GROSS EARNINGS</td>
          <td class="amt">${formatRupees(comp.gross)}</td>
          <td class="amt">${formatRupees(comp.gross)}</td>
          <td class="amt">Rs. 0.00</td>
          <td class="amt">${formatRupees(comp.gross)}</td>
          <td>TOTAL DEDUCTIONS</td>
          <td class="amt">${formatRupees(comp.totalDeductions)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Net Pay Bar -->
    <div class="net-pay-bar">
      <span>NET PAY</span>
      <span>${formatRupees(comp.net)}</span>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words">
      <div class="lbl">AMOUNT IN WORDS:</div>
      <div>${netWords}</div>
    </div>

    <!-- Signature Section -->
    <div class="sig-section">
      <div class="sig-box">
        <div class="sig-name">R. Vinay</div>
        <div class="sig-line"></div>
        <div class="sig-role">
          <strong>Authorized Signatory (R. Vinay)</strong><br>
          Technomold IT Solutions Pvt Ltd
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Downloads itemized salary components and tax details in CSV format
 */
export function downloadPayslipCSV(slip = {}, employee = {}) {
  const monthUpper = (slip.month || 'NOVEMBER 2026').toUpperCase();
  const empName = employee.name || 'Lokesh Kumar';
  const empId = employee.id || 'EMP-1001';
  const comp = resolveSalaryComponents(slip);

  const rows = [
    ['Technomold IT Solutions Pvt Ltd'],
    ['Plot No. 24, Hitech City Road, Madhapur, Hyderabad, Telangana - 500081'],
    [],
    [`EMPLOYEE PAYSLIP - ${monthUpper}`],
    [],
    ['EMPLOYEE INFORMATION'],
    ['Employee ID', empId, 'Date of Joining', employee.doj || '2021-02-01'],
    ['Employee Name', empName, 'Date of Birth', employee.dob || '1992-08-20'],
    ['Designation', employee.role || 'Engineering Manager', 'Gender', employee.gender || 'Male'],
    ['Department', employee.department || 'Platform Engineering', 'Grade', employee.grade || 'L2'],
    ['Bank Name', slip.bankName || 'HDFC Bank', 'Location', employee.location || 'Hyderabad'],
    ['Bank Account', slip.bankAccount || '•••• 4892', 'PAN', employee.pan || 'ABCDE1234F'],
    ['PF Number', employee.pf || 'Not Provided', 'UAN', employee.uan || '10098452109'],
    ['ESI Number', employee.esi || 'Not Applicable', 'Payment Mode', 'Bank Transfer'],
    [],
    ['DAYS SUMMARY'],
    ['Standard Days', slip.daysWorked || 30, 'Payable Days', slip.daysWorked || 30, 'LOP Days', slip.lopDays || 0, 'Arrear Days', 0],
    [],
    ['EARNINGS', 'MONTHLY', 'CURRENT', 'ARREAR', 'TOTAL', 'DEDUCTIONS', 'TOTAL'],
    ['BASIC SALARY', comp.basic, comp.basic, 0, comp.basic, 'EMPLOYEE EPF', comp.epf],
    ['HOUSE RENT ALLOWANCE', comp.hra, comp.hra, 0, comp.hra, 'PROFESSIONAL TAX', comp.pt],
    ['CONVEYANCE & SPECIAL', comp.conv, comp.conv, 0, comp.conv, 'TDS', comp.tds],
    ['BONUS', comp.bonus, comp.bonus, 0, comp.bonus, 'LEAVE DEDUCTION (LOP)', comp.lop],
    ['OTHER ALLOWANCE', comp.other, comp.other, 0, comp.other, '-', '-'],
    ['GROSS EARNINGS', comp.gross, comp.gross, 0, comp.gross, 'TOTAL DEDUCTIONS', comp.totalDeductions],
    [],
    ['NET PAY', comp.net],
    ['AMOUNT IN WORDS', slip.netInWords || numberToIndianWords(comp.net)],
    [],
    ['Authorized Signatory', 'R. Vinay', 'Technomold IT Solutions Pvt Ltd'],
  ];

  downloadCSV(`Technomold-Payslip-${monthUpper.replace(/\s+/g, '-')}.csv`, rows);
}

/**
 * Downloads Form 16 Part A & Part B summary certificate PDF
 */
export function downloadForm16(employee = {}) {
  const sanitize = (str) => String(str || '').replace(/[()\\]/g, '').replace(/₹/g, 'Rs. ');
  const empName = employee.name || 'Lokesh Kumar';
  const empPan = employee.pan || 'ABCDE1234F';

  let stream = '';
  const text = (str, x, y, size = 10, bold = false) => {
    const font = bold ? '/F2' : '/F1';
    stream += 'BT ' + font + ' ' + size + ' Tf ' + x + ' ' + y + ' Td (' + sanitize(str) + ') Tj ET\n';
  };
  const line = (x1, y1, x2, y2) => { stream += x1 + ' ' + y1 + ' m ' + x2 + ' ' + y2 + ' l S\n'; };
  const rect = (x, y, w, h, fill = false, gray = 0.95) => {
    if (fill) { stream += gray + ' g ' + x + ' ' + y + ' ' + w + ' ' + h + ' re f 0 g\n'; }
    else { stream += x + ' ' + y + ' ' + w + ' ' + h + ' re S\n'; }
  };

  rect(40, 40, 515, 760);
  rect(40, 720, 515, 80, true, 0.93);
  text('FORM NO. 16 - PART A & PART B', 60, 770, 14, true);
  text('Certificate under Section 203 of the Income-Tax Act, 1961 for Tax Deducted at Source', 60, 752, 8.5);
  text('Assessment Year: 2027-28  |  Financial Year: 2026-27', 60, 735, 9, true);

  line(40, 710, 555, 710);
  let y = 680;
  text('EMPLOYER DETAILS (DEDUCTOR):', 60, y, 9.5, true);
  y -= 16;
  text('Technomold IT Solutions Pvt Ltd  |  TAN: HYDT10948A  |  PAN: AABCT9982K', 60, y, 8.5);
  y -= 25;
  text('EMPLOYEE DETAILS (DEDUCTEE):', 60, y, 9.5, true);
  y -= 16;
  text('Name: ' + empName + '  |  PAN: ' + empPan + '  |  Employee ID: ' + (employee.id || 'EMP-1001'), 60, y, 8.5);
  y -= 30;

  rect(40, y - 5, 515, 20, true, 0.90);
  text('SUMMARY OF TAX DEDUCTED AND DEPOSITED (QUARTERLY)', 55, y, 9, true);
  y -= 20;
  text('Quarter 1 (Apr - Jun): Gross Rs. 6,30,000 | TDS Rs. 44,250 | Challan: 0019284', 60, y, 8.5);
  y -= 16;
  text('Quarter 2 (Jul - Sep): Gross Rs. 6,30,000 | TDS Rs. 44,250 | Challan: 0024910', 60, y, 8.5);
  y -= 16;
  text('Quarter 3 (Oct - Dec): Gross Rs. 6,30,000 | TDS Rs. 44,250 | Challan: 0031822', 60, y, 8.5);
  y -= 25;

  rect(40, y - 5, 515, 20, true, 0.90);
  text('ANNUAL SALARY & DEDUCTION ASSESSMENT', 55, y, 9, true);
  y -= 20;
  text('1. Gross Salary under Section 17(1): Rs. 25,20,000', 60, y, 8.5);
  y -= 16;
  text('2. Standard Deduction under Section 16(ia): Rs. 75,000', 60, y, 8.5);
  y -= 16;
  text('3. Total Taxable Income: Rs. 24,45,000', 60, y, 8.5);
  y -= 16;
  text('4. Total Tax Payable: Rs. 1,77,000', 60, y, 8.5);
  y -= 16;
  text('5. Total TDS Deducted and Deposited to Central Govt: Rs. 1,77,000', 60, y, 8.5, true);

  y -= 50;
  rect(40, y - 10, 515, 45, true, 0.94);
  text('VERIFICATION CERTIFICATE', 60, y + 16, 9.5, true);
  text('Certified that a sum of Rs. 1,77,000 has been deducted and credited to the Central Government account.', 60, y, 8);

  y -= 60;
  text('Place: Hyderabad, Telangana', 60, y, 8.5);
  text('Date: 31 October 2026', 60, y - 15, 8.5);
  text('For TECHNOMOLD IT SOLUTIONS PVT LTD', 350, y, 8.5, true);
  text('[ Authorized Signatory - Finance & Tax ]', 350, y - 25, 8);

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';

  let offset = 0;
  const header = '%PDF-1.4\n';
  offset += header.length;
  const offsets = [offset];
  const objects = [obj1, obj2, obj3, obj4, obj5, obj6];
  for (let i = 0; i < objects.length - 1; i++) {
    offset += objects[i].length;
    offsets.push(offset);
  }
  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  const trailerOffset = offset + objects[objects.length - 1].length;
  const trailer = 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + trailerOffset + '\n%%EOF\n';

  const pdfString = header + objects.join('') + xref + trailer;
  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const filename = 'Form-16-PartA-PartB-FY26-27.pdf';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
