import React, { useMemo } from "react";
import Icon from "../Icon";
import { getMainTLs, getDirectReports } from "../../services/teamService";

export default function DashboardMyTeamWidget({ onNavigate }) {
  // Get Main TL
  const mainTls = useMemo(() => getMainTLs(), []);
  const mainTl = mainTls[0] || null;

  // Get direct TLs reporting to Main TL
  const directTLs = useMemo(() => {
    if (!mainTl) return [];
    const res = getDirectReports(mainTl.id);
    return Array.isArray(res) ? res : (res?.subTls || res?.directReports || []);
  }, [mainTl]);

  // Count total subordinates
  const totalEmployeesCount = useMemo(() => {
    let count = 0;
    if (Array.isArray(directTLs)) {
      directTLs.forEach((tl) => {
        const subs = Array.isArray(tl.subordinates)
          ? tl.subordinates.length
          : (tl.teamSize ?? tl.subordinateCount ?? 0);
        count += subs > 0 ? subs : 1;
      });
    }
    return count;
  }, [directTLs]);

  if (!mainTl) return null;

  const mainInitials = (mainTl.name || "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleMainTLClick = () => {
    if (onNavigate) {
      onNavigate(`/hr/teams/my-team/tl/${mainTl.id}`);
    } else {
      window.history.pushState({}, "", `/hr/teams/my-team/tl/${mainTl.id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleTLClick = (tlId) => {
    if (onNavigate) {
      onNavigate(`/hr/teams/my-team/tl/${tlId}/employees`);
    } else {
      window.history.pushState({}, "", `/hr/teams/my-team/tl/${tlId}/employees`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleViewAll = () => {
    if (onNavigate) {
      onNavigate("/hr/teams?tab=my-team");
    } else {
      window.history.pushState({}, "", "/hr/teams?tab=my-team");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line glass-card !p-4 shadow-md transition-all duration-300 hover:border-accent/40 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Main TL & Hierarchy Snapshot */}
        <div className="flex items-center gap-3.5">
          <div
            onClick={handleMainTLClick}
            className="group relative cursor-pointer shrink-0"
            title={`View ${mainTl.name}'s Hierarchy`}
          >
            {mainTl.avatar ? (
              <img
                src={mainTl.avatar}
                alt={mainTl.name}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-accent/40 transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 font-bold text-accent ring-2 ring-accent/40 transition-transform group-hover:scale-105">
                {mainInitials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg bg-good" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/25">
                My Team Hierarchy
              </span>
              <span className="font-mono text-[11px] text-muted">{mainTl.id}</span>
            </div>
            <h4
              onClick={handleMainTLClick}
              className="cursor-pointer text-sm font-bold text-ink transition-colors hover:text-accent"
            >
              {mainTl.name}{" "}
              <span className="text-xs font-normal text-muted">({mainTl.designation})</span>
            </h4>
            <p className="mt-0.5 text-xs text-muted">
              <span className="font-mono font-semibold text-ink">{directTLs.length}</span> TLs
              {" "}&bull;{" "}
              <span className="font-mono font-semibold text-ink">{totalEmployeesCount}</span>{" "}
              Employees reporting
            </p>
          </div>
        </div>

        {/* Right: Team Leads mini avatar stack + View All */}
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {/* Avatar Stack of TLs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted hidden md:inline">Team Leads:</span>
            <div className="flex -space-x-2 overflow-hidden">
              {directTLs.map((tl) => {
                const tlInit = (tl.name || "")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <button
                    key={tl.id}
                    onClick={() => handleTLClick(tl.id)}
                    title={`${tl.name} (${tl.designation}) - View Team`}
                    className="relative inline-block h-8 w-8 rounded-full ring-2 ring-bg transition-transform hover:z-10 hover:scale-110"
                  >
                    {tl.avatar ? (
                      <img
                        src={tl.avatar}
                        alt={tl.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                        {tlInit}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* View All Button */}
          <button
            onClick={handleViewAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface2/70 px-3.5 py-1.5 text-xs font-semibold text-ink transition-all hover:border-accent hover:bg-surface2 hover:text-accent"
          >
            <span>View All</span>
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
