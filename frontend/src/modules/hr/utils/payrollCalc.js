// src/utils/payrollCalc.js
// Pure functions (no React). Later move the same logic to FastAPI.
// Rates/slabs are policy: confirm with your CA before production.

export const POLICY = {
  basicPercentOfCTC: 0.5,        // Basic = 50% of monthly CTC
  hraPercentOfBasic: 0.4,        // 0.5 if you treat location as metro
  conveyance: 1600,
  pfRate: 0.12,
  pfWageCeiling: 15000,
  gratuityRate: 15 / 26 / 12,    // ~4.81% of basic
  insuranceAnnual: 12000,        // employer group insurance (inside CTC)
  lopDivisor: 30,                // 26 / 30 / actual days: pick one policy
  standardDeduction: 75000,      // new regime
  rebateLimitTaxable: 1200000,   // 87A rebate: tax nil up to this taxable income
  cess: 0.04,
};

const r = (n) => Math.round(Number(n) || 0);

/** LPA -> annual CTC (12 LPA = 12,00,000) */
export const lpaToCTC = (lpa) => r((Number(lpa) || 0) * 100000);

/**
 * CTC -> monthly salary structure.
 * CTC = Gross + Employer PF + Gratuity + Insurance
 * Special allowance is the balancing figure.
 */
export function computeStructure(annualCTC, opts = {}) {
  const p = { ...POLICY, ...opts };
  const monthlyCTC = annualCTC / 12;

  const basic = r(monthlyCTC * p.basicPercentOfCTC);
  const hra = r(basic * p.hraPercentOfBasic);
  const conveyance = p.conveyance;

  const pfWage = p.pfOnActual ? basic : Math.min(basic, p.pfWageCeiling);
  const employerPF = r(pfWage * p.pfRate);
  const gratuity = r(basic * p.gratuityRate);
  const insurance = r(p.insuranceAnnual / 12);

  const specialAllowance = Math.max(
    0,
    r(monthlyCTC) - (basic + hra + conveyance + employerPF + gratuity + insurance)
  );
  const grossMonthly = basic + hra + conveyance + specialAllowance;

  return {
    annualCTC: r(annualCTC),
    monthlyCTC: r(monthlyCTC),
    basic,
    hra,
    conveyance,
    specialAllowance,
    grossMonthly,
    employerPF,
    gratuity,
    insurance,
  };
}

/** Telangana professional tax (verify current slab). */
export function professionalTaxTelangana(monthlyGross) {
  if (monthlyGross <= 15000) return 0;
  if (monthlyGross <= 20000) return 150;
  return 200;
}

/** New-regime annual tax estimate (simplified; no marginal relief). */
export function annualTaxNewRegime(annualGross, p = POLICY) {
  const taxable = Math.max(0, annualGross - p.standardDeduction);
  if (taxable <= p.rebateLimitTaxable) return 0;

  const slabs = [
    [400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15],
    [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3],
  ];
  let tax = 0, prev = 0;
  for (const [upto, rate] of slabs) {
    if (taxable > prev) tax += (Math.min(taxable, upto) - prev) * rate;
    prev = upto;
  }
  return r(tax * (1 + p.cess));
}

/**
 * Monthly payroll for one employee.
 * structure = result of computeStructure()
 */
export function computeMonthlyPayroll(structure, input = {}, opts = {}) {
  const p = { ...POLICY, ...opts };
  const {
    lopDays = 0,
    bonus = 0,
    pfApplicable = true,
    ptApplicable = true,
    pfOnActual = false,
  } = input;

  const fixedGross = structure.grossMonthly;
  const grossSalary = fixedGross + (Number(bonus) || 0);

  // LOP only on fixed pay (not bonus)
  const lopDeduction = r((fixedGross / p.lopDivisor) * lopDays);

  const pfWage = pfOnActual ? structure.basic : Math.min(structure.basic, p.pfWageCeiling);
  const pfDeduction = pfApplicable ? r(pfWage * p.pfRate) : 0;
  const ptDeduction = ptApplicable ? professionalTaxTelangana(fixedGross) : 0;

  const annualProjected = fixedGross * 12 + (Number(bonus) || 0);
  const tdsDeduction = r(annualTaxNewRegime(annualProjected, p) / 12);

  const deductions = lopDeduction + pfDeduction + ptDeduction + tdsDeduction;
  const netPayable = Math.max(0, grossSalary - deductions);

  return {
    grossSalary,
    lopDeduction,
    pfDeduction,
    ptDeduction,
    tdsDeduction,
    deductions,
    netPayable,
  };
}
