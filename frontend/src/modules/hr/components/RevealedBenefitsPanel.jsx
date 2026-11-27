import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icon.jsx';
import { formatCurrency } from '../utils/format.js';
import {
  getCompanyById,
  getComponents,
  getHealthInsurance,
  subscribeCompanyStore
} from '../data/companyStore.js';

const BENEFIT_GROUPS = [
  {
    group: "ALLOWANCES & EARNINGS",
    items: [
      { key: "basic_salary", name: "Basic Salary", hint: "40% of CTC · Mandatory base" },
      { key: "hra", name: "HRA", hint: "50% of Basic" },
      { key: "da", name: "DA (Dearness Allowance)", hint: "% of Basic or fixed" },
      { key: "conveyance_allowance", name: "Conveyance Allowance", hint: "Fixed monthly amount" },
      { key: "medical_allowance", name: "Medical Allowance", hint: "Fixed monthly amount" },
      { key: "special_allowance", name: "Special Allowance", hint: "Balancing figure" },
      { key: "meal_allowance", name: "Meal Allowance", hint: "Tax-free meal coupons" },
      { key: "internet_phone_reimbursement", name: "Internet / Phone Reimbursement", hint: "Fixed monthly amount" },
      { key: "fuel_vehicle_allowance", name: "Fuel / Vehicle Allowance", hint: "Fixed monthly amount" },
      { key: "shift_allowance", name: "Shift Allowance", hint: "Fixed monthly amount" },
      { key: "lta", name: "LTA", hint: "Tax-exempt travel" },
      { key: "education_allowance", name: "Education Allowance", hint: "Fixed monthly amount" },
    ]
  },
  {
    group: "BONUS & INCENTIVES",
    items: [
      { key: "bonus", name: "Bonus", hint: "Annual or performance" },
      { key: "performance_incentive", name: "Performance Incentive", hint: "Variable performance bonus" },
    ]
  },
  {
    group: "BENEFITS",
    items: [
      { key: "group_health_insurance", name: "Group Health Insurance", hint: "Company-paid or shared" },
      { key: "term_life_insurance", name: "Term Life Insurance", hint: "Company-paid life coverage" },
      { key: "accident_cover", name: "Accident Cover", hint: "Accident disability cover" },
      { key: "wellness_gym", name: "Wellness / Gym", hint: "Monthly wellness benefit" },
    ]
  },
  {
    group: "STATUTORY DEDUCTIONS",
    items: [
      { key: "pf", name: "PF", hint: "Statutory (12%)" },
      { key: "esi", name: "ESI", hint: "Statutory" },
      { key: "professional_tax", name: "Professional Tax", hint: "Statutory" },
      { key: "tds", name: "TDS", hint: "Statutory" },
    ]
  }
];

export const RevealedBenefitsPanel = ({ currentUser }) => {
  const companyId = currentUser?.companyId || "NEX-IND";
  const company = getCompanyById(companyId);

  // Store subscription to reflect updates immediately
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeCompanyStore(() => {
      setStoreVersion(v => v + 1);
    });
    return unsubscribe;
  }, [companyId]);

  const components = useMemo(() => getComponents(companyId), [companyId, storeVersion]);
  const healthInsurance = useMemo(() => getHealthInsurance(companyId), [companyId, storeVersion]);

  // Keys of currently saved active components (Basic Salary is always active)
  const activeKeys = useMemo(() => {
    const keys = components.filter(c => c.active).map(c => c.key);
    if (!keys.includes("basic_salary")) {
      keys.unshift("basic_salary");
    }
    return keys;
  }, [components]);

  // Grouped active items
  const activeGroups = useMemo(() => {
    return BENEFIT_GROUPS.map(groupObj => {
      const activeItems = groupObj.items.filter(item => activeKeys.includes(item.key));
      return {
        group: groupObj.group,
        items: activeItems
      };
    }).filter(g => g.items.length > 0);
  }, [activeKeys]);

  const totalActiveCount = activeKeys.length;

  // Format Health Insurance details string
  const formatInsuranceDetails = () => {
    const parts = [];
    if (healthInsurance.provider) {
      parts.push(healthInsurance.provider);
    }
    if (healthInsurance.premiumPaidBy) {
      if (healthInsurance.premiumPaidBy === "Shared") {
        parts.push(`Shared (${healthInsurance.employeeSharePercent || 30}% emp)`);
      } else {
        parts.push(`${healthInsurance.premiumPaidBy}-paid`);
      }
    }
    if (healthInsurance.sumInsured) {
      parts.push(`Sum insured ${formatCurrency(healthInsurance.sumInsured)}`);
    }
    if (Array.isArray(healthInsurance.dependentsCovered) && healthInsurance.dependentsCovered.length > 0) {
      parts.push(`Covers: ${healthInsurance.dependentsCovered.join(", ")}`);
    }
    return parts.length > 0 ? parts.join(" · ") : "Company-paid health insurance coverage";
  };

  return (
    <div className="glass-card !p-5 border border-line shadow-lg transition-all duration-200">
      {/* Panel Header */}
      <div className="flex flex-row items-center justify-between pb-3 border-b border-line mb-3">
        <div>
          <div className="font-display font-bold text-ink text-base">
            Benefits & Allowances provided by {company.name}
          </div>
          <div className="text-xs text-muted">
            Master compensation framework and statutory coverage configured for employees
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold flex-shrink-0">
          {totalActiveCount} items
        </span>
      </div>

      {/* Content */}
      {totalActiveCount <= 1 ? (
        <div className="py-4 text-center text-xs text-muted italic">
          No additional benefits selected yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeGroups.map((g) => (
            <div key={g.group} className="flex flex-col gap-1.5">
              {/* Group Heading */}
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {g.group}
              </div>

              {/* Responsive Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {g.items.map((item) => {
                  const isHealthInsurance = item.key === "group_health_insurance";
                  const detailText = isHealthInsurance ? formatInsuranceDetails() : item.hint;

                  return (
                    <div
                      key={item.key}
                      className="rounded-xl border border-line bg-surface2/40 px-3.5 py-3 flex flex-col gap-1 transition hover:border-line/80"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name="check" className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-ink truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-muted leading-relaxed line-clamp-2">
                        {detailText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
