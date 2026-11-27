// src/utils/offerLetter.js
// TechnoMold offer letter: salary breakup + PDF generation (jsPDF).
// jsPDF default fonts do not support the rupee symbol, so the PDF uses "INR".
import { jsPDF } from 'jspdf';

export const COMPANY = {
  name: 'TechnoMold IT Solutions PVT LTD',
  phone: '+91 9493945440',
  email: 'info@moldite.com',
  web: 'https://moldite.com',
  address:
    'H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084',
};

export const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString('en-IN');

export const fmtDate = (d) => {
  if (!d) return '';
  const s = String(d);
  const dt = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return isNaN(dt)
    ? s
    : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

// "6.5 LPA" -> 650000, "6,50,000" -> 650000. Returns 0 if it cannot be parsed.
export function parseAnnualCTC(input) {
  if (input === undefined || input === null || input === '') return 0;
  const str = String(input).toLowerCase().replace(/,/g, '').trim();
  const m = str.match(/\d+(\.\d+)?/);
  if (!m) return 0;
  let val = parseFloat(m[0]);
  if (str.includes('lpa') || str.includes('lakh') || str.includes('lac') || val < 100) {
    val = val * 100000;
  }
  return Math.round(val) || 0;
}

// Annexure-1 breakup. rows: [{ label, m, a, bold?, total? }] with numeric m (monthly) and a (annual).
export function calculateSalaryBreakup(input) {
  const annual = parseAnnualCTC(input);
  if (!annual) return { annual: 0, monthly: 0, rows: [], warning: '' };
  const monthly = Math.round(annual / 12);

  const basic = Math.round(annual * 0.268);
  const ca = 18180;
  const hra = Math.round(basic * 0.5);
  const epf = Math.round(basic * 0.12);
  const health = 11340;
  const gratuity = Math.round(basic * 0.048);
  const empEpf = epf;
  const variable = Math.round(annual * 0.2307);

  const fixedSum = basic + ca + hra + epf + health + gratuity + empEpf + variable;
  const otherRaw = annual - fixedSum;
  const other = Math.max(0, otherRaw);
  const warning =
    otherRaw < 0
      ? 'CTC is too low for the fixed components, so the breakup will not add up to the total. Increase the CTC.'
      : '';

  const base = basic + ca + hra + other;
  const gross = base + epf + health + gratuity;
  const mo = (x) => Math.round(x / 12);

  return {
    annual,
    monthly,
    warning,
    rows: [
      { label: 'Basic Salary', m: mo(basic), a: basic },
      { label: 'Conveyance Allowance (CA)', m: mo(ca), a: ca },
      { label: 'House Rent Allowance (HRA)', m: mo(hra), a: hra },
      { label: 'Other Allowances', m: mo(other), a: other },
      { label: 'Base Compensation', m: mo(base), a: base, bold: true },
      { label: 'Employee Provident Fund (EPF)', m: mo(epf), a: epf },
      { label: 'Health Insurance', m: mo(health), a: health },
      { label: 'Gratuity Fund', m: mo(gratuity), a: gratuity },
      { label: 'Gross Compensation', m: mo(gross), a: gross, bold: true },
      { label: 'Employer Provident Fund', m: mo(empEpf), a: empEpf },
      { label: 'Variable Pay', m: mo(variable), a: variable },
      { label: 'Total', m: monthly, a: annual, total: true },
    ],
  };
}

/**
 * Builds the offer letter PDF. `o` is an offer record:
 * { id, candidateName, address, position, department, band, level, salary,
 *   joiningDate, acceptBy, reportingManager, workLocation, reportingTime,
 *   signatoryName, signatoryTitle, generatedOn }
 */
export function buildOfferPDF(o) {
  const b = calculateSalaryBreakup(o.salary);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 50;
  const maxW = W - M * 2;
  const bottom = H - 70;
  let y = M;

  const ensure = (h) => {
    if (y + h > bottom) {
      doc.addPage();
      y = M;
    }
  };

  const para = (str, { size = 10, bold = false, gap = 8, indent = 0, align = 'left' } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lh = size * 1.45;
    doc.splitTextToSize(String(str), maxW - indent).forEach((ln) => {
      ensure(lh);
      doc.text(ln, align === 'right' ? W - M : M + indent, y, { align });
      y += lh;
    });
    y += gap;
  };

  const heading = (str) => {
    ensure(50);
    para(str, { bold: true, size: 11.5, gap: 4 });
  };

  const bullets = (items) => items.forEach((t) => para(`-  ${t}`, { gap: 3, indent: 10 }));

  // ---------- Letter ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY.name, M, y);
  y += 28;

  para('PRIVATE AND CONFIDENTIAL', { size: 9, bold: true, gap: 0, align: 'right' });
  para(`Date: ${fmtDate(o.generatedOn)}`, { size: 9, gap: 0, align: 'right' });
  if (o.id) para(`Ref: ${o.id}`, { size: 9, gap: 14, align: 'right' });

  para(String(o.candidateName || '').toUpperCase(), { bold: true, gap: 0 });
  if (o.address) para(o.address, { gap: 0 });
  y += 8;
  para(`Dear ${o.candidateName},`, { gap: 6 });
  para(`Welcome to ${COMPANY.name}!`, { bold: true, gap: 8 });

  para(
    `It was a pleasure meeting you to explore a career opportunity with ${COMPANY.name}. ` +
      `Based on our discussions, we are pleased to offer you the position of ${o.position}, ` +
      `in ${o.band || 'Band 5'}, ${o.level || 'Level 5'} (${o.department}) with our organization. ` +
      `Your total annual Cost to Company (CTC) will be INR ${fmtNum(b.annual)}/- per annum. ` +
      `The details of the terms and conditions of the offer of employment are detailed in the enclosed annexures.`
  );
  para(
    `${COMPANY.name} is defined by a strong and intrinsic culture that sets us apart. Customer centricity ` +
      `is one of the core tenets that influences everything we do. We strive to understand our customer's ` +
      `needs, staying ahead of the curve to deliver best-in-class service.`
  );
  para(
    `This offer of employment is contingent upon you fulfilling the background verification process that ` +
      `the organization will conduct. We look forward to you joining us at our ${o.workLocation || 'Hyderabad'} ` +
      `office on ${fmtDate(o.joiningDate)}. The reporting time is ${o.reportingTime || '12:00 pm'}.` +
      (o.reportingManager ? ` You will report to ${o.reportingManager}.` : '')
  );
  para(
    o.acceptBy
      ? `Please endorse your acceptance on or before ${fmtDate(o.acceptBy)}. If we do not receive your ` +
          `acceptance by this date, this offer will stand withdrawn.`
      : 'Please endorse your acceptance prior to your scheduled joining date.',
    { bold: true, gap: 16 }
  );

  ensure(100);
  para('Yours sincerely,', { gap: 2 });
  para(`For ${COMPANY.name}`, { bold: true, gap: 30 });
  para(o.signatoryName || 'Authorized Signatory', { bold: true, gap: 0 });
  if (o.signatoryTitle) para(o.signatoryTitle, { gap: 0 });

  // ---------- Annexure 1 ----------
  doc.addPage();
  y = M;
  para('ANNEXURE - 1', { bold: true, size: 12, gap: 6 });
  para(`Name: ${o.candidateName}     Band: ${o.band || 'Band 5'}     Level: ${o.level || 'Level 5'}`, { gap: 0 });
  para(`Designation: ${o.position}`, { gap: 10 });

  const colW = [maxW * 0.52, maxW * 0.24, maxW * 0.24];
  const tRow = (cells, { bold = false, fill = null } = {}) => {
    const rh = 20;
    ensure(rh);
    if (fill) {
      doc.setFillColor(...fill);
      doc.rect(M, y - 14, maxW, rh, 'F');
    }
    doc.setDrawColor(190);
    doc.rect(M, y - 14, maxW, rh);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.text(cells[0], M + 6, y);
    doc.text(cells[1], M + colW[0] + colW[1] - 6, y, { align: 'right' });
    doc.text(cells[2], M + maxW - 6, y, { align: 'right' });
    y += rh;
  };

  tRow(['SALARY COMPONENT', 'MONTHLY (INR)', 'ANNUAL (INR)'], { bold: true, fill: [230, 234, 242] });
  b.rows.forEach((r) =>
    tRow([r.label, fmtNum(r.m), fmtNum(r.a)], {
      bold: !!(r.bold || r.total),
      fill: r.total ? [215, 225, 242] : r.bold ? [243, 244, 247] : null,
    })
  );
  y += 12;
  if (b.warning) para(`Note: ${b.warning}`, { size: 9, gap: 8 });

  heading('Additional Benefits');
  bullets([
    'Additionally, you shall be eligible for gratuity as per the Gratuity Act, subject to 5 years of continuous employment.',
    'Covered under Group Mediclaim Insurance policy including spouse and up to two children.',
    'Covered under Group Personal Accident Insurance and Standard Group Term Life Insurance policies.',
    'Maternity Leave of 26 weeks as per the Maternity Benefit (Amendment) Act, 2017.',
  ]);
  y += 8;

  // ---------- Annexure 2 ----------
  heading('ANNEXURE - 2: TERMS OF EMPLOYMENT');
  para('1) Hours of Work: A working day comprises nine hours across 24x7 shifts if applicable.', { gap: 4 });
  para('2) Place of Employment: Liable to be transferred or deputed to any offices/subsidiaries in India or abroad.', { gap: 4 });
  para('3) Notice Period: Three months prior notice by either side is mandatory upon resignation.', { gap: 4 });
  para('4) Non-Compete: Maintained for a minimum of 1 year post-employment to protect business interests.', { gap: 12 });

  // ---------- Acknowledgement ----------
  ensure(150);
  heading('Acknowledgement and Acceptance');
  para(
    `I, ${o.candidateName}, have read and understood the above terms and conditions governing my employment ` +
      `with the company as ${o.position} and hereby accept the above-mentioned appointment in totality.`,
    { gap: 26 }
  );
  para('Signature: __________________________        Date: _____________________________', { gap: 6 });
  para(`Name: ${o.candidateName}        Place: ${o.workLocation || 'Hyderabad'}`, { gap: 14 });

  // ---------- Annexure 3 ----------
  heading('ANNEXURE - 3: Onboarding Documents');
  bullets([
    'Photograph: White background passport size photo.',
    'Education Documents: Highest degree certificate and semester marks cards.',
    'Identity Proof: Passport / PAN Card / Aadhaar / Driving License.',
    'Employment Details: Last 3 months salary slips and relieving letters.',
    'LOA: Signed scanned copy of Letter of Authorization.',
  ]);

  // ---------- Footer on every page ----------
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(190);
    doc.line(M, H - 58, W - M, H - 58);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110);
    doc.text(`Tel: ${COMPANY.phone}  |  ${COMPANY.email}  |  ${COMPANY.web}`, W / 2, H - 46, { align: 'center' });
    doc.splitTextToSize(COMPANY.address, maxW).forEach((l, k) => {
      doc.text(l, W / 2, H - 35 + k * 9, { align: 'center' });
    });
    doc.text(`Page ${i} of ${n}`, W - M, H - 12, { align: 'right' });
    doc.setTextColor(0);
  }

  return doc;
}

export function offerFileName(o) {
  return `Offer_Letter_${String(o.candidateName || 'Candidate').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
}

export function downloadOfferLetter(o) {
  const name = offerFileName(o);
  buildOfferPDF(o).save(name);
  return name;
}
