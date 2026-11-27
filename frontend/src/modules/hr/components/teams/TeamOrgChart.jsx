import React, { useState } from "react";
import Icon from "../Icon";
import ExperienceBadge from "./ExperienceBadge";

export default function TeamOrgChart({ tree, onSelectEmployee, onSelectTL }) {
  const [expandedNodes, setExpandedNodes] = useState(() => {
    // By default expand top level and TLs
    const init = {};
    if (tree?.id) {
      init[tree.id] = true;
      if (Array.isArray(tree.children)) {
        tree.children.forEach((c) => {
          init[c.id] = true;
        });
      }
    }
    return init;
  });

  const [searchTerm, setSearchTerm] = useState("");

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    const traverse = (node) => {
      if (!node) return;
      all[node.id] = true;
      if (Array.isArray(node.children)) node.children.forEach(traverse);
    };
    traverse(tree);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  if (!tree) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/50">
        <Icon name="network" className="mb-2 h-8 w-8 text-white/30" />
        <p>No organizational hierarchy data available.</p>
      </div>
    );
  }

  // Helper to render an employee node
  const renderNode = (node, depth = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isMainTL = depth === 0;
    const isTL = depth === 1;

    const matchesSearch =
      !searchTerm ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.designation || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const initials = (node.name || "")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          className={`relative group flex flex-col items-center rounded-2xl border transition-all duration-300 ${
            isMainTL
              ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-white/[0.03] p-4 shadow-xl shadow-emerald-500/10 min-w-[260px]"
              : isTL
              ? "border-teal-500/30 bg-gradient-to-b from-teal-500/10 to-white/[0.02] p-3.5 shadow-lg shadow-teal-500/5 min-w-[240px]"
              : "border-white/10 bg-white/[0.03] p-3 hover:border-white/20 min-w-[210px]"
          } ${matchesSearch ? "ring-1 ring-emerald-400/50" : "opacity-90 hover:opacity-100"}`}
        >
          {/* Top role badge */}
          <div className="mb-2 flex items-center justify-between w-full gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                isMainTL
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : isTL
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-white/5 text-white/60 border border-white/5"
              }`}
            >
              {isMainTL ? "Main Team Lead" : isTL ? "Team Lead" : "Team Member"}
            </span>
            <span className="font-mono text-[11px] text-white/50">{node.id}</span>
          </div>

          {/* Avatar + Info */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative shrink-0">
              {node.avatar ? (
                <img
                  src={node.avatar}
                  alt={node.name}
                  className={`rounded-full object-cover ring-2 ${
                    isMainTL
                      ? "h-12 w-12 ring-emerald-400/50"
                      : isTL
                      ? "h-11 w-11 ring-teal-400/40"
                      : "h-9 w-9 ring-white/20"
                  }`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full font-semibold ring-2 ${
                    isMainTL
                      ? "h-12 w-12 bg-emerald-500/20 text-emerald-300 ring-emerald-400/50 text-sm"
                      : isTL
                      ? "h-11 w-11 bg-teal-500/20 text-teal-300 ring-teal-400/40 text-xs"
                      : "h-9 w-9 bg-white/10 text-white/70 ring-white/20 text-xs"
                  }`}
                >
                  {initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4
                onClick={() => onSelectEmployee && onSelectEmployee(node.id)}
                className="cursor-pointer truncate text-sm font-semibold text-white transition-colors hover:text-emerald-300"
              >
                {node.name}
              </h4>
              <p className="truncate text-xs text-white/70">{node.designation}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[10px] text-white/50 truncate max-w-[80px]">
                  {node.department}
                </span>
                <ExperienceBadge experienceYears={node.totalExperienceYears} previousCompanies={node.previousCompanies} />
              </div>
            </div>
          </div>

          {/* Card footer / Action button */}
          <div className="mt-3 flex w-full items-center justify-between border-t border-white/5 pt-2 text-xs">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Icon
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  className="h-3 w-3"
                />
                <span>
                  {node.children.length} {node.children.length === 1 ? "report" : "reports"}
                </span>
              </button>
            ) : (
              <span className="text-[11px] text-white/30">Direct member</span>
            )}

            <button
              onClick={() => {
                if (isTL && onSelectTL) {
                  onSelectTL(node.id);
                } else if (onSelectEmployee) {
                  onSelectEmployee(node.id);
                }
              }}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {isTL ? "View Team →" : "View Profile →"}
            </button>
          </div>
        </div>

        {/* Child connection lines & children container */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center">
            {/* Vertical stem from parent */}
            <div className="h-6 w-px bg-white/20" />

            {/* Horizontal connector row if multiple children */}
            <div className="relative flex items-start gap-6 pt-2">
              {node.children.length > 1 && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-white/20"
                  style={{
                    width: `calc(100% - ${100 / node.children.length}%)`,
                  }}
                />
              )}

              {node.children.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical branch to child */}
                  <div className="h-4 w-px bg-white/20 -mt-2 mb-2" />
                  {renderNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
      {/* Org Chart Top Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Hierarchical Org Chart</h3>
          <p className="text-xs text-white/60">
            Interactive reporting structure from Main Team Lead to Team Leads and Members
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search in chart */}
          <div className="relative w-48">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in chart..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 focus:border-emerald-500/50 focus:outline-none"
            />
            <Icon
              name="search"
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40"
            />
          </div>

          <button
            onClick={expandAll}
            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Interactive Org Chart Canvas */}
      <div className="overflow-x-auto pb-8 pt-2">
        <div className="inline-block min-w-full text-center">
          {renderNode(tree, 0)}
        </div>
      </div>
    </div>
  );
}
