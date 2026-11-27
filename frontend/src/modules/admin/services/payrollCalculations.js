export const EARNING_COMPONENTS = [
  "basic_salary",
  "hra",
  "da",
  "conveyance",
  "medical",
  "special_allowance",
  "bonus",
  "incentives",
];

export const DEDUCTION_COMPONENTS = [
  "pf",
  "esi",
  "professional_tax",
  "tds",
  "loan_advance",
  "other_deductions",
];

export const SALARY_COMPONENT_KEYS = [...EARNING_COMPONENTS, ...DEDUCTION_COMPONENTS];

export const DEFAULT_COMPONENT_BASES = {
  hra: "basic_salary",
  da: "basic_salary",
  conveyance: "basic_salary",
  medical: "basic_salary",
  special_allowance: "basic_salary",
  bonus: "basic_salary",
  incentives: "basic_salary",
  pf: "eligible_pf_wages",
  esi: "gross_salary",
  professional_tax: "gross_salary",
  tds: "gross_salary",
  loan_advance: "gross_salary",
  other_deductions: "gross_salary",
};

const numberPattern = /^(?:0|[0-9]+(?:\.[0-9]+)?)$/;
const percentagePattern = /^(?:0|[0-9]+(?:\.[0-9]+)?)%$/;

export function parseSalaryInput(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value.type === "percentage" ? `${value.value}%` : value.value;
    const parsed = parseSalaryInput(raw);
    return parsed.valid ? { ...parsed, base: value.base } : parsed;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0
      ? { valid: true, value, type: "fixed" }
      : { valid: false, message: "Enter a positive amount or percentage." };
  }
  const input = String(value ?? "").trim();
  if (!input) return { valid: true, value: 0, type: "fixed" };
  if (percentagePattern.test(input)) {
    const percentage = Number(input.slice(0, -1));
    return { valid: true, value: percentage, type: "percentage" };
  }
  if (numberPattern.test(input)) {
    return { valid: true, value: Number(input), type: "fixed" };
  }
  return { valid: false, message: "Use a positive amount such as 5000 or a percentage such as 12%." };
}

export function componentConfiguration(structure = {}, key) {
  const configurations = structure.component_config || structure.salary_component_config || {};
  const stored = configurations[key];
  const parsed = parseSalaryInput(stored ?? structure[key]);
  return {
    ...parsed,
    base: stored?.base || DEFAULT_COMPONENT_BASES[key],
  };
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function baseAmount(base, structure, calculated) {
  if (base === "eligible_pf_wages") return Number(structure.eligible_pf_wages ?? calculated.basic_salary ?? 0) || 0;
  if (base === "reference_salary") return Number(structure.reference_salary ?? 0) || 0;
  return Number(calculated[base] ?? 0) || 0;
}

function amountFor(key, structure, calculated) {
  const configuration = componentConfiguration(structure, key);
  if (!configuration.valid) return { amount: 0, configuration };
  if (configuration.type === "percentage") {
    return { amount: round(baseAmount(configuration.base, structure, calculated) * configuration.value / 100), configuration };
  }
  return { amount: round(configuration.value), configuration };
}

export function calculateSalary(structure = {}, paidDays, workingDays) {
  const calculated = {};
  const errors = {};
  const configurations = {};
  EARNING_COMPONENTS.forEach((key) => {
    const result = amountFor(key, structure, calculated);
    calculated[key] = result.amount;
    configurations[key] = result.configuration;
    if (!result.configuration.valid) errors[key] = result.configuration.message;
  });
  const gross = round(EARNING_COMPONENTS.reduce((sum, key) => sum + calculated[key], 0));
  calculated.gross_salary = gross;
  DEDUCTION_COMPONENTS.forEach((key) => {
    const result = amountFor(key, structure, calculated);
    calculated[key] = result.amount;
    configurations[key] = result.configuration;
    if (!result.configuration.valid) errors[key] = result.configuration.message;
  });
  const totalDeductions = round(DEDUCTION_COMPONENTS.reduce((sum, key) => sum + calculated[key], 0));
  const days = Number(workingDays);
  const paid = Number(paidDays);
  const ratio = Number.isFinite(days) && days > 0 && Number.isFinite(paid) ? Math.max(0, Math.min(paid / days, 1)) : 1;
  const scaledGross = round(gross * ratio);
  const scaledDeductions = round(totalDeductions * ratio);
  const earnings = Object.fromEntries(EARNING_COMPONENTS.map((key) => [key, round(calculated[key] * ratio)]));
  const deductions = Object.fromEntries(DEDUCTION_COMPONENTS.map((key) => [key, round(calculated[key] * ratio)]));
  return {
    gross: scaledGross,
    deductions: scaledDeductions,
    net: round(Math.max(0, scaledGross - scaledDeductions)),
    earnings,
    deductionsBreakdown: deductions,
    componentAmounts: { ...earnings, ...deductions },
    configurations,
    errors,
    ratio,
  };
}

export function validateSalaryStructure(structure = {}) {
  const result = calculateSalary(structure, 1, 1);
  return { valid: Object.keys(result.errors).length === 0, errors: result.errors };
}

export function serializeSalaryStructure(structure = {}) {
  const componentConfig = {};
  const numericValues = {};
  SALARY_COMPONENT_KEYS.forEach((key) => {
    const configuration = componentConfiguration(structure, key);
    componentConfig[key] = {
      value: configuration.value,
      type: configuration.type,
      base: configuration.base || DEFAULT_COMPONENT_BASES[key] || null,
    };
    numericValues[key] = configuration.valid && configuration.type === "fixed" ? round(configuration.value) : 0;
  });
  return { ...structure, component_config: componentConfig, numericValues };
}

