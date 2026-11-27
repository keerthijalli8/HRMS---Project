import React from "react";
import Icon from "../Icon";
import ExperienceBadge from "./ExperienceBadge";
import { formatExperience } from "../../config/teams";

export default function TLCard({ tl, onSelect, onViewEmployees, onViewDetail, onEdit }) {
  if (!tl) return null;

  const initials = (tl.name || "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const teamSize = Array.isArray(tl.subordinates)
    ? tl.subordinates.length
    : (tl.teamSize ?? tl.subordinateCount ?? 0);

  // Present/absent mock snapshot
  const presentCount = tl.presentCount ?? Math.max(1, Math.round(teamSize * 0.85));
  const absentCount = tl.absentCount ?? Math.max(0, teamSize - presentCount);

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/40 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-emerald-500/5">
      {/* Top Header: Avatar + Meta + Quick Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {tl.avatar ? (
              <img
                src={tl.avatar}
                alt={tl.name}
                className="h-13 w-13 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-sky-500/20 text-base font-semibold text-emerald-300 ring-2 ring-emerald-500/30">
                {initials}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0c121d] ${
                tl.status === "On Leave"
                  ? "bg-amber-400"
                  : tl.status === "Inactive"
                  ? "bg-rose-500"
                  : "bg-emerald-400"
              }`}
              title={tl.status || "Active"}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3
                onClick={() => onViewDetail && onViewDetail(tl.id)}
                className="cursor-pointer text-base font-semibold text-white transition-colors hover:text-emerald-300"
              >
                {tl.name}
              </h3>
              <span className="font-mono text-xs text-white/50">{tl.id}</span>
            </div>
            <p className="text-xs text-white/70">{tl.designation}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/80">
                {tl.department}
              </span>
              <ExperienceBadge experienceYears={tl.totalExperienceYears} previousCompanies={tl.previousCompanies} />
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(tl)}
              title="Edit TL"
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <Icon name="edit" className="h-4 w-4" />
            </button>
          )}
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(tl.id)}
              title="View full profile"
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <Icon name="info" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-black/20 p-2.5">
        <div>
          <span className="text-[11px] font-medium text-white/50">Team Size</span>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-white">{teamSize}</span>
            <span className="text-[11px] text-white/40">members</span>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-white/50">Today's Attendance</span>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-emerald-400">
              {presentCount} <span className="text-[10px] text-emerald-400/70">present</span>
            </span>
            <span className="font-mono text-xs font-semibold text-rose-400">
              {absentCount} <span className="text-[10px] text-rose-400/70">absent</span>
            </span>
          </div>
        </div>
      </div>

      {/* Skills / Meta */}
      {Array.isArray(tl.skills) && tl.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {tl.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="rounded-md border border-white/5 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/60"
            >
              {skill}
            </span>
          ))}
          {tl.skills.length > 3 && (
            <span className="text-[10px] text-white/40">+{tl.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: View Team Button */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-[11px] text-white/50">
          Joined <span className="font-mono text-white/70">{tl.joiningDate || "2023"}</span>
        </span>
        <button
          onClick={() => {
            if (onViewEmployees) onViewEmployees(tl.id);
            else if (onSelect) onSelect(tl.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200"
        >
          <span>View Team</span>
          <Icon name="arrow-right" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
