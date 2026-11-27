/**
 * Company Store & Configuration Data Layer
 * Key: "hrms_company_config_v1"
 * Supports multi-tenant company-wise benefits, allowances, health insurance, and employee structures.
 * Canonical Company: Nexora Technologies (NEX-IND / NEX-HQ-HYD) in Hyderabad, Telangana
 */

const STORAGE_KEY = "hrms_company_config_v1";

// Seed Companies - Single Primary: Nexora Technologies (Hyderabad, Telangana)
export const SEED_COMPANIES = [
  { id: "NEX-IND", code: "NEX-HQ-HYD", name: "Nexora Technologies", state: "Telangana", city: "Hyderabad" }
];

// Preset Component Library
export const PRESET_COMPONENT_LIBRARY = [
  // Earnings
  { key: "basic_salary", name: "Basic Salary", category: "Earning", calcType: "% of Gross", defaultValue: "40%", frequency: "Monthly", taxable: true, eligibility: "All employees" },
  { key: "hra", name: "HRA", category: "Earning", calcType: "% of Basic", defaultValue: "50%", frequency: "Monthly", taxable: true, eligibility: "All employees" },
  { key: "da", name: "DA (Dearness Allowance)", category: "Earning", calcType: "% of Basic", defaultValue: "10%", frequency: "Monthly", taxable: true, eligibility: "All employees" },
  { key: "conveyance_allowance", name: "Conveyance Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "1600", frequency: "Monthly", taxable: false, eligibility: "All employees" },
  { key: "medical_allowance", name: "Medical Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "1250", frequency: "Monthly", taxable: true, eligibility: "All employees" },
  { key: "special_allowance", name: "Special Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "Balancing figure", frequency: "Monthly", taxable: true, eligibility: "All employees" },
  { key: "bonus", name: "Bonus", category: "Earning", calcType: "% of Gross", defaultValue: "8%", frequency: "Annual", taxable: true, eligibility: "After 6 months of service" },
  { key: "performance_incentive", name: "Performance Incentive", category: "Earning", calcType: "Fixed amount", defaultValue: "Variable performance bonus", frequency: "Annual", taxable: true, eligibility: "After 6 months of service" },
  { key: "meal_allowance", name: "Meal Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "2200", frequency: "Monthly", taxable: false, eligibility: "All employees" },
  { key: "internet_phone_reimbursement", name: "Internet/Phone Reimbursement", category: "Earning", calcType: "Fixed amount", defaultValue: "1000", frequency: "Monthly", taxable: false, eligibility: "All employees" },
  { key: "fuel_vehicle_allowance", name: "Fuel/Vehicle Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "3000", frequency: "Monthly", taxable: false, eligibility: "All employees" },
  { key: "shift_allowance", name: "Shift Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "2000", frequency: "Monthly", taxable: true, eligibility: "All employees" },
  { key: "lta", name: "LTA (Leave Travel Allowance)", category: "Earning", calcType: "Fixed amount", defaultValue: "50000", frequency: "Annual", taxable: false, eligibility: "After 12 months of service" },
  { key: "education_allowance", name: "Education Allowance", category: "Earning", calcType: "Fixed amount", defaultValue: "1000", frequency: "Monthly", taxable: false, eligibility: "All employees" },

  // Benefits
  { key: "group_health_insurance", name: "Group Health Insurance", category: "Benefit", calcType: "Fixed amount", defaultValue: "Sum Insured ₹5,00,000", frequency: "Annual", taxable: false, eligibility: "All employees" },
  { key: "term_life_insurance", name: "Term Life Insurance", category: "Benefit", calcType: "Fixed amount", defaultValue: "Sum Insured ₹25,00,000", frequency: "Annual", taxable: false, eligibility: "All employees" },
  { key: "accident_cover", name: "Accident Cover", category: "Benefit", calcType: "Fixed amount", defaultValue: "Sum Insured ₹10,00,000", frequency: "Annual", taxable: false, eligibility: "All employees" },
  { key: "wellness_gym", name: "Wellness/Gym Reimbursement", category: "Benefit", calcType: "Fixed amount", defaultValue: "1500", frequency: "Monthly", taxable: false, eligibility: "After 3 months of service" },

  // Deductions (Statutory - Telangana Slab)
  { key: "pf", name: "PF (Provident Fund)", category: "Deduction", calcType: "Statutory", defaultValue: "12% of Basic", frequency: "Monthly", taxable: false, eligibility: "All employees", note: "Employee 12% + Employer matching" },
  { key: "esi", name: "ESI (Employee State Insurance)", category: "Deduction", calcType: "Statutory", defaultValue: "0.75%", frequency: "Monthly", taxable: false, eligibility: "Employees with gross <= ₹21,000", note: "Statutory ESIC rate" },
  { key: "professional_tax", name: "Professional Tax (Telangana)", category: "Deduction", calcType: "Statutory", defaultValue: "₹200", frequency: "Monthly", taxable: false, eligibility: "Salary > ₹20,000", note: "Telangana PT slab: ₹200/mo (>₹20k), ₹150/mo (₹15k-₹20k)" },
  { key: "tds", name: "TDS (Tax Deducted at Source)", category: "Deduction", calcType: "Statutory", defaultValue: "As per IT Slab", frequency: "Monthly", taxable: false, eligibility: "All employees", note: "Computed under New Tax Regime FY26-27" }
];

// Helper to build initial seed state
const buildInitialSeed = () => {
  return {
    "NEX-IND": {
      components: [
        { id: "nex-1", key: "basic_salary", name: "Basic Salary", category: "Earning", calcType: "% of Gross", value: "40%", frequency: "Monthly", taxable: true, eligibility: "All employees", active: true },
        { id: "nex-2", key: "hra", name: "HRA", category: "Earning", calcType: "% of Basic", value: "50%", frequency: "Monthly", taxable: true, eligibility: "All employees", active: true },
        { id: "nex-3", key: "conveyance_allowance", name: "Conveyance Allowance", category: "Earning", calcType: "Fixed amount", value: "1600", frequency: "Monthly", taxable: false, eligibility: "All employees", active: true },
        { id: "nex-4", key: "medical_allowance", name: "Medical Allowance", category: "Earning", calcType: "Fixed amount", value: "1250", frequency: "Monthly", taxable: true, eligibility: "All employees", active: true },
        { id: "nex-5", key: "special_allowance", name: "Special Allowance", category: "Earning", calcType: "Fixed amount", value: "Balancing figure", frequency: "Monthly", taxable: true, eligibility: "All employees", active: true },
        { id: "nex-6", key: "bonus", name: "Bonus", category: "Earning", calcType: "% of Gross", value: "8%", frequency: "Annual", taxable: true, eligibility: "After 6 months of service", active: true },
        { id: "nex-7", key: "meal_allowance", name: "Meal Allowance", category: "Earning", calcType: "Fixed amount", value: "2200", frequency: "Monthly", taxable: false, eligibility: "All employees", active: true },
        { id: "nex-8", key: "internet_phone_reimbursement", name: "Internet/Phone Reimbursement", category: "Earning", calcType: "Fixed amount", value: "1000", frequency: "Monthly", taxable: false, eligibility: "All employees", active: true },
        { id: "nex-9", key: "group_health_insurance", name: "Group Health Insurance", category: "Benefit", calcType: "Fixed amount", value: "Sum Insured ₹5,00,000", frequency: "Annual", taxable: false, eligibility: "All employees", active: true },
        { id: "nex-10", key: "term_life_insurance", name: "Term Life Insurance", category: "Benefit", calcType: "Fixed amount", value: "Sum Insured ₹25,00,000", frequency: "Annual", taxable: false, eligibility: "All employees", active: true },
        { id: "nex-11", key: "pf", name: "PF (Provident Fund)", category: "Deduction", calcType: "Statutory", value: "₹1,800", frequency: "Monthly", taxable: false, eligibility: "All employees", active: true, note: "Rates and calculation are handled by the payroll team" },
        { id: "nex-12", key: "professional_tax", name: "Professional Tax (Telangana)", category: "Deduction", calcType: "Statutory", value: "₹200", frequency: "Monthly", taxable: false, eligibility: "All employees", active: true, note: "Telangana PT slab: ₹200/mo (Salary > ₹20,000)" }
      ],
      healthInsurance: {
        enabled: true,
        provider: "Star Health & Allied Insurance",
        policyNumber: "STAR-POL-883912",
        sumInsured: 500000,
        premiumPaidBy: "Company",
        employeeSharePercent: 0,
        dependentsCovered: ["Self", "Spouse", "Children", "Parents"],
        eligibility: "From joining date",
        policyStartDate: "2026-04-01",
        policyEndDate: "2027-03-31"
      },
      enrollments: {
        "EMP-1088": {
          enrolled: true,
          cardNumber: "HI-NEX-EMP-1088",
          enrolledAt: "2026-04-02",
          dependents: [
            { name: "Pooja Patel", relation: "Self", age: 30 },
            { name: "Kiran Patel", relation: "Brother", age: 26 }
          ]
        },
        "EMP-1042": {
          enrolled: true,
          cardNumber: "HI-NEX-EMP-1042",
          enrolledAt: "2026-04-02",
          dependents: [
            { name: "Aarav Sharma", relation: "Self", age: 35 },
            { name: "Pooja Sharma", relation: "Spouse", age: 32 }
          ]
        }
      },
      employeeStructures: {
        "EMP-1088": [
          { componentKey: "basic_salary", enabled: true, overrideValue: "" },
          { componentKey: "hra", enabled: true, overrideValue: "" },
          { componentKey: "conveyance_allowance", enabled: true, overrideValue: "2000" },
          { componentKey: "medical_allowance", enabled: true, overrideValue: "" },
          { componentKey: "special_allowance", enabled: true, overrideValue: "" },
          { componentKey: "group_health_insurance", enabled: true, overrideValue: "" }
        ],
        "EMP-1042": [
          { componentKey: "basic_salary", enabled: true, overrideValue: "" },
          { componentKey: "hra", enabled: true, overrideValue: "" },
          { componentKey: "conveyance_allowance", enabled: true, overrideValue: "" },
          { componentKey: "internet_phone_reimbursement", enabled: true, overrideValue: "1500" }
        ]
      },
      changeHistory: [
        { id: "ch-nex-1", who: "System", what: "Nexora Technologies Benefits & Allowances initialized with standard Telangana IT compensation framework", when: "2026-04-01 09:00:00" }
      ]
    }
  };
};

// Normalize any legacy company IDs to NEX-IND
export const normalizeCompanyId = (id) => {
  if (!id) return "NEX-IND";
  const clean = String(id).toUpperCase().trim();
  if (clean === "COMP-X" || clean === "COMP-Y" || clean === "COMP-Z" || clean === "TECHCORP") {
    return "NEX-IND";
  }
  return clean || "NEX-IND";
};

// Internal store loader with localStorage persistence and self-healing shape validation
const loadStore = () => {
  let store = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        store = parsed;
      }
    }
  } catch (err) {
    console.warn("companyStore: failed to load from localStorage, initializing seed:", err);
  }

  const seed = buildInitialSeed();
  if (!store || !store["NEX-IND"]) {
    // If older store has COMP-X, migrate components to NEX-IND
    if (store && store["COMP-X"] && !store["NEX-IND"]) {
      store["NEX-IND"] = store["COMP-X"];
    } else {
      store = seed;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {}
    return store;
  }

  return store;
};

const saveStore = (store, companyId = "NEX-IND") => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hrms-company-config-updated", { detail: { companyId } }));
    }
  } catch (err) {
    console.error("companyStore: failed to persist to localStorage:", err);
  }
};

// --- Exported Store API ---

export const subscribeCompanyStore = (callback) => {
  if (typeof window === "undefined" || typeof callback !== "function") return () => {};
  const handler = (e) => callback(e?.detail);
  window.addEventListener("hrms-company-config-updated", handler);
  return () => window.removeEventListener("hrms-company-config-updated", handler);
};

export const getCompanies = () => {
  return SEED_COMPANIES;
};

export const getCompanyById = (companyId) => {
  const norm = normalizeCompanyId(companyId);
  return SEED_COMPANIES.find(c => c.id === norm) || SEED_COMPANIES[0];
};

export const getPresetLibrary = () => {
  return PRESET_COMPONENT_LIBRARY;
};

export const getCompanyConfig = (companyId = "NEX-IND") => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm] || !Array.isArray(store[norm].components)) {
    const seed = buildInitialSeed();
    store[norm] = seed[norm] || seed["NEX-IND"];
    saveStore(store, norm);
  }
  return store[norm];
};

export const getComponents = (companyId = "NEX-IND") => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  if (!config || !Array.isArray(config.components) || config.components.length === 0) {
    const seed = buildInitialSeed();
    return seed["NEX-IND"]?.components || [];
  }
  return config.components;
};

export const addComponent = (companyId, componentData, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  try {
    const store = loadStore();
    if (!store[norm]) store[norm] = buildInitialSeed()["NEX-IND"] || {};
    if (!store[norm].components) store[norm].components = [];

    const newComponent = {
      id: `${norm.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key: componentData.key || componentData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: componentData.name,
      category: componentData.category || "Earning",
      calcType: componentData.calcType || "Fixed amount",
      value: componentData.value || "0",
      frequency: componentData.frequency || "Monthly",
      taxable: Boolean(componentData.taxable),
      eligibility: componentData.eligibility || "All employees",
      active: componentData.active !== undefined ? Boolean(componentData.active) : true,
      note: componentData.note || ""
    };

    store[norm].components.push(newComponent);

    if (!store[norm].changeHistory) store[norm].changeHistory = [];
    store[norm].changeHistory.unshift({
      id: `ch-${Date.now()}`,
      who: `${user.name || "HR"} (${user.role || user.systemRole || "HR"})`,
      what: `Added component "${newComponent.name}" (${newComponent.category}, ${newComponent.calcType})`,
      when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    });

    saveStore(store, norm);
    return newComponent;
  } catch (e) {
    console.error("addComponent failed:", e);
    return null;
  }
};

export const updateComponent = (companyId, componentId, updates, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm] || !Array.isArray(store[norm].components)) return false;

  const idx = store[norm].components.findIndex(c => c.id === componentId);
  if (idx === -1) return false;

  const old = store[norm].components[idx];
  store[norm].components[idx] = { ...old, ...updates };

  if (!store[norm].changeHistory) store[norm].changeHistory = [];
  store[norm].changeHistory.unshift({
    id: `ch-${Date.now()}`,
    who: `${user.name || "HR"} (${user.role || user.systemRole || "HR"})`,
    what: `Updated component "${old.name}"`,
    when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  });

  saveStore(store, norm);
  return true;
};

export const toggleComponent = (companyId, componentId, active, user = { name: "HR", role: "HR" }) => {
  return updateComponent(companyId, componentId, { active }, user);
};
export const toggleComponentStatus = toggleComponent;

export const isComponentAssigned = (companyId, componentId) => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  const structures = config?.employeeStructures || {};
  return Object.values(structures).some(arr => Array.isArray(arr) && arr.some(c => c.id === componentId || c.componentId === componentId));
};

export const saveBenefitSelection = (companyId, selectedKeys, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm]) store[norm] = {};
  if (!Array.isArray(store[norm].components)) {
    store[norm].components = PRESET_COMPONENT_LIBRARY.map(p => ({ ...p }));
  }
  store[norm].components.forEach(comp => {
    comp.active = selectedKeys.includes(comp.id);
  });
  saveStore(store, norm);
  return true;
};

export const deleteComponent = (companyId, componentId, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm] || !Array.isArray(store[norm].components)) return false;

  const idx = store[norm].components.findIndex(c => c.id === componentId);
  if (idx === -1) return false;

  const removed = store[norm].components[idx];
  store[norm].components.splice(idx, 1);

  if (!store[norm].changeHistory) store[norm].changeHistory = [];
  store[norm].changeHistory.unshift({
    id: `ch-${Date.now()}`,
    who: `${user.name || "HR"} (${user.role || user.systemRole || "HR"})`,
    what: `Deleted component "${removed.name}"`,
    when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  });

  saveStore(store, norm);
  return true;
};

export const getHealthInsuranceConfig = (companyId = "NEX-IND") => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  return config?.healthInsurance || {
    enabled: true,
    provider: "Star Health & Allied Insurance",
    policyNumber: "STAR-POL-883912",
    sumInsured: 500000,
    premiumPaidBy: "Company",
    employeeSharePercent: 0,
    dependentsCovered: ["Self", "Spouse", "Children", "Parents"],
    eligibility: "From joining date",
    policyStartDate: "2026-04-01",
    policyEndDate: "2027-03-31"
  };
};
export const getHealthInsurance = getHealthInsuranceConfig;

export const updateHealthInsuranceConfig = (companyId, hiConfig, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm]) store[norm] = buildInitialSeed()["NEX-IND"];

  store[norm].healthInsurance = { ...store[norm].healthInsurance, ...hiConfig };

  if (!store[norm].changeHistory) store[norm].changeHistory = [];
  store[norm].changeHistory.unshift({
    id: `ch-${Date.now()}`,
    who: `${user.name || "HR"} (${user.role || user.systemRole || "HR"})`,
    what: `Updated Health Insurance policy (${hiConfig.provider || "Updated"})`,
    when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  });

  saveStore(store, norm);
  return true;
};
export const updateHealthInsurance = updateHealthInsuranceConfig;

export const getEnrollments = (companyId = "NEX-IND") => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  return config?.enrollments || {};
};

export const getEmployeeEnrollment = (companyId = "NEX-IND", employeeId) => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  return config?.enrollments?.[employeeId] || null;
};

export const updateEmployeeEnrollment = (companyId, employeeId, enrollmentData, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm]) store[norm] = buildInitialSeed()["NEX-IND"];
  if (!store[norm].enrollments) store[norm].enrollments = {};

  store[norm].enrollments[employeeId] = {
    ...enrollmentData,
    enrolledAt: enrollmentData.enrolledAt || new Date().toISOString().split('T')[0]
  };

  saveStore(store, norm);
  return true;
};

export const enrollEmployee = (companyId, employeeId, enrollmentData, user = { name: "HR", role: "HR" }) => {
  return updateEmployeeEnrollment(companyId, employeeId, { ...enrollmentData, enrolled: true }, user);
};

export const unenrollEmployee = (companyId, employeeId, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (store[norm]?.enrollments?.[employeeId]) {
    delete store[norm].enrollments[employeeId];
    saveStore(store, norm);
  }
  return true;
};

export const getEmployeeStructures = (companyId = "NEX-IND") => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  return config?.employeeStructures || {};
};

export const getEmployeeStructure = (companyId = "NEX-IND", employeeId) => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  return config?.employeeStructures?.[employeeId] || [];
};

export const saveEmployeeStructure = (companyId, employeeId, assignments, user = { name: "HR", role: "HR" }) => {
  const norm = normalizeCompanyId(companyId);
  const store = loadStore();
  if (!store[norm]) store[norm] = buildInitialSeed()["NEX-IND"];
  if (!store[norm].employeeStructures) store[norm].employeeStructures = {};

  store[norm].employeeStructures[employeeId] = assignments;

  if (!store[norm].changeHistory) store[norm].changeHistory = [];
  store[norm].changeHistory.unshift({
    id: `ch-${Date.now()}`,
    who: `${user.name || "HR"} (${user.role || user.systemRole || "HR"})`,
    what: `Customized compensation structure for employee ${employeeId}`,
    when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  });

  saveStore(store, norm);
  return true;
};

export const getChangeHistory = (companyId = "NEX-IND") => {
  const norm = normalizeCompanyId(companyId);
  const config = getCompanyConfig(norm);
  return config?.changeHistory || [];
};
