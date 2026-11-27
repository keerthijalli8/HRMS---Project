import { PLAN_PRICING } from "./planPricing";

export const PLAN_STORAGE_KEY = "hrms.superadmin.plans.v2";
export const PLAN_CATALOG_UPDATED_EVENT = "hrms:plan-catalog-updated";

export const PLAN_MODULES = [
  "Dashboard",
  "Employee Management",
  "Payroll",
  "Attendance",
  "Leave Management",
  "Recruitment",
  "Performance",
  "Reports & Analytics",
  "Document Management",
  "API Access",
  "Audit Logs",
];

const STARTER_FEATURES = [
  "Dashboard",
  "Employee Management",
  "Attendance",
  "Leave Management",
];

const PROFESSIONAL_FEATURES = PLAN_MODULES.filter(
  (module) => !["API Access", "Audit Logs"].includes(module)
);

export const DEFAULT_PLAN_RECORDS = [
  {
    id: 1,
    name: "Starter",
    tier: "Starter",
    price: PLAN_PRICING.Starter.monthly,
    annualPrice: PLAN_PRICING.Starter.annual,
    users: 10,
    branches: 1,
    storage: 5,
    status: "Active",
    description: "Essential HR tools for small teams.",
    features: STARTER_FEATURES,
  },
  {
    id: 2,
    name: "Professional",
    tier: "Professional",
    price: PLAN_PRICING.Professional.monthly,
    annualPrice: PLAN_PRICING.Professional.annual,
    users: 50,
    branches: 5,
    storage: 50,
    status: "Active",
    description: "Advanced HR tools for growing businesses.",
    features: PROFESSIONAL_FEATURES,
  },
  {
    id: 3,
    name: "Enterprise",
    tier: "Enterprise",
    price: PLAN_PRICING.Enterprise.monthly,
    annualPrice: PLAN_PRICING.Enterprise.annual,
    users: 250,
    branches: 25,
    storage: 250,
    status: "Active",
    description: "Complete HR management with advanced access.",
    features: [...PLAN_MODULES],
  },
];

export function readPlanRecords() {
  try {
    const saved = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!saved) return DEFAULT_PLAN_RECORDS;

    const data = JSON.parse(saved);
    if (!Array.isArray(data)) return DEFAULT_PLAN_RECORDS;

    return data.map((plan) => {
      const tier = plan.tier || plan.name;
      const standardPricing = PLAN_PRICING[tier];

      return {
        ...plan,
        tier,
        price: standardPricing?.monthly ?? Number(plan.price || 0),
        annualPrice:
          standardPricing?.annual ??
          Number(plan.annualPrice ?? Number(plan.price || 0) * 10),
        users: plan.users ?? 10,
        branches: plan.branches ?? 1,
        storage: plan.storage ?? 5,
        description: plan.description || "",
        features: Array.isArray(plan.features) ? plan.features : ["Dashboard"],
        customFeatures: Array.isArray(plan.customFeatures)
          ? plan.customFeatures.map((feature, index) => ({
              id: feature.id || `CF-${plan.id}-${index + 1}`,
              name: feature.name || String(feature),
              description: feature.description || "",
              enabled: feature.enabled !== false,
            }))
          : [],
      };
    });
  } catch {
    return DEFAULT_PLAN_RECORDS;
  }
}
