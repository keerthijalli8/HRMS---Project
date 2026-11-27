import React from 'react';
import { Icon } from '../Icon.jsx';
import { ExperienceBadge } from './ExperienceBadge.jsx';
import { formatNumber } from '../../utils/format.js';

export const MainTLCard = ({
  mainTl,
  directTLsCount,
  totalSubordinatesCount,
  onViewTLs,
  onViewProfile,
  onViewDetail,
  onViewAllSubordinates,
  isDetailed = true
}) => {
  if (!mainTl) return null;

  const handleProfileClick = onViewProfile || onViewDetail;
  const directCount = directTLsCount ?? mainTl.directTlsCount ?? 3;
  const totalCount = totalSubordinatesCount ?? mainTl.totalEmployeesCount ?? 11;

  const initials = mainTl.name
    ? mainTl.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : "TL";

  return (
    <div className="glass-card !p-5 border border-accent/40 rounded-2xl bg-gradient-to-r from-surface/80 via-surface2/30 to-surface/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {mainTl.avatar ? (
            <img
              src={mainTl.avatar}
              alt={mainTl.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-accent shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-accent/30 to-accent2/30 border-2 border-accent text-accent font-display font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-lg">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-accent text-on-accent text-[9px] font-extrabold uppercase shadow">
            Main TL
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              onClick={handleProfileClick}
              className={`font-display font-extrabold text-lg sm:text-xl text-ink leading-tight ${handleProfileClick ? 'cursor-pointer hover:text-accent transition' : ''}`}
            >
              {mainTl.name}
            </h2>
            <ExperienceBadge
              totalYears={mainTl.totalExperienceYears}
              previousCompanies={mainTl.previousCompanies}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">{mainTl.designation || "Engineering Director"}</span>
            <span>&bull;</span>
            <span>{mainTl.department || mainTl.dept || "Engineering"}</span>
            <span>&bull;</span>
            <span className="font-num font-bold text-accent">{mainTl.id}</span>
          </div>

          {/* Contact Details */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1">
            {mainTl.email && (
              <div className="flex items-center gap-1.5">
                <Icon name="mail" className="w-3.5 h-3.5 text-accent" />
                <span>{mainTl.email}</span>
              </div>
            )}
            {mainTl.phone && mainTl.phone !== "Confidential (Private)" && (
              <div className="flex items-center gap-1.5 font-num">
                <Icon name="phone" className="w-3.5 h-3.5 text-accent" />
                <span>{mainTl.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Counter & Actions */}
      <div className="flex flex-wrap items-center gap-3 self-start md:self-center border-t md:border-t-0 md:border-l border-line/60 pt-3 md:pt-0 md:pl-4">
        <div className="flex items-center gap-3 pr-2">
          <div className="text-center px-3 py-1.5 rounded-xl bg-surface2/60 border border-line">
            <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">Direct TLs</span>
            <span className="font-num font-extrabold text-base sm:text-lg text-accent">
              {formatNumber(directCount)}
            </span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-surface2/60 border border-line">
            <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">Total Team</span>
            <span className="font-num font-extrabold text-base sm:text-lg text-ink">
              {formatNumber(totalCount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {onViewTLs && (
            <button
              type="button"
              onClick={onViewTLs}
              className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>View TLs & Hierarchy</span>
              <Icon name="arrow-right" className="w-3.5 h-3.5 text-on-accent" />
            </button>
          )}

          {handleProfileClick && (
            <button
              type="button"
              onClick={handleProfileClick}
              className="px-3 py-1 text-xs font-semibold text-muted hover:text-ink text-center cursor-pointer"
            >
              View Full Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainTLCard;
