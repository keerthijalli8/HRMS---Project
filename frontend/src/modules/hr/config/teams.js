/**
 * Teams & Employee Management Configuration & Experience Logic
 */

export const EXPERIENCE_BANDS = {
  fresher: {
    id: "fresher",
    label: "Fresher (0-1)",
    tag: "Fresher",
    min: 0,
    max: 1,
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    dot: "bg-emerald-400"
  },
  junior: {
    id: "junior",
    label: "Junior (1-3)",
    tag: "Junior",
    min: 1,
    max: 3,
    badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    dot: "bg-blue-400"
  },
  mid: {
    id: "mid",
    label: "Mid (3-5)",
    tag: "Mid",
    min: 3,
    max: 5,
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    dot: "bg-cyan-400"
  },
  senior: {
    id: "senior",
    label: "Senior (5-8)",
    tag: "Senior",
    min: 5,
    max: 8,
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    dot: "bg-purple-400"
  },
  lead: {
    id: "lead",
    label: "Lead (8+)",
    tag: "Lead",
    min: 8,
    max: 99,
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    dot: "bg-amber-400"
  }
};

export const SEEDED_DEPARTMENTS = [
  { id: "engineering", name: "Engineering", icon: "code" },
  { id: "human-resources", name: "Human Resources", icon: "users" },
  { id: "finance", name: "Finance", icon: "dollar-sign" },
  { id: "sales", name: "Sales", icon: "trending-up" },
  { id: "marketing", name: "Marketing", icon: "megaphone" },
  { id: "operations", name: "Operations", icon: "briefcase" },
  { id: "design", name: "Design", icon: "layout" },
  { id: "support", name: "Support", icon: "phone" }
];

/**
 * Returns formatted experience string:
 * - "Fresher" if under 1 year with no previous companies
 * - Otherwise "X yrs Y mo experience"
 */
export function formatExperience(totalYears = 0, previousCompanies = []) {
  const yearsNum = Number(totalYears) || 0;
  const hasPrev = Array.isArray(previousCompanies) && previousCompanies.length > 0;

  if (yearsNum < 1 && !hasPrev) {
    return "Fresher";
  }

  const wholeYears = Math.floor(yearsNum);
  const remainingMonths = Math.round((yearsNum - wholeYears) * 12);

  if (wholeYears === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? 'mo' : 'mos'} experience`;
  }

  if (remainingMonths === 0) {
    return `${wholeYears} ${wholeYears === 1 ? 'yr' : 'yrs'} experience`;
  }

  return `${wholeYears} ${wholeYears === 1 ? 'yr' : 'yrs'} ${remainingMonths} mo experience`;
}

/**
 * Returns the matching experience band configuration
 */
export function getExperienceBand(totalYears = 0, previousCompanies = []) {
  const yearsNum = Number(totalYears) || 0;
  const hasPrev = Array.isArray(previousCompanies) && previousCompanies.length > 0;

  if (yearsNum < 1 && !hasPrev) {
    return EXPERIENCE_BANDS.fresher;
  }
  if (yearsNum < 3) return EXPERIENCE_BANDS.junior;
  if (yearsNum < 5) return EXPERIENCE_BANDS.mid;
  if (yearsNum < 8) return EXPERIENCE_BANDS.senior;
  return EXPERIENCE_BANDS.lead;
}

/**
 * Returns tenure at company from joiningDate (Asia/Kolkata)
 */
export function formatTenureAtCompany(joiningDate) {
  if (!joiningDate) return "--";

  try {
    const start = new Date(joiningDate);
    if (Number.isNaN(start.getTime())) return "--";

    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0 && months === 0) {
      return "Just joined";
    }

    if (years === 0) {
      return `${months} ${months === 1 ? 'mo' : 'mos'} at company`;
    }

    if (months === 0) {
      return `${years} ${years === 1 ? 'yr' : 'yrs'} at company`;
    }

    return `${years} ${years === 1 ? 'yr' : 'yrs'} ${months} mo at company`;
  } catch (e) {
    return "--";
  }
}
