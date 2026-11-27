import React from 'react';
import { formatExperience, getExperienceBand } from '../../config/teams.js';

export const ExperienceBadge = ({ totalYears = 0, experienceYears, previousCompanies = [], className = "" }) => {
  const years = experienceYears !== undefined ? experienceYears : totalYears;
  const formatted = formatExperience(years, previousCompanies);
  const band = getExperienceBand(years, previousCompanies);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold font-num ${band.badgeBg} ${className}`}
      title={`${band.tag} level (${band.label})`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${band.dot} shrink-0`} aria-hidden="true" />
      <span>{formatted}</span>
    </span>
  );
};

export default ExperienceBadge;
