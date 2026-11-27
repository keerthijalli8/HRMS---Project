import React, { useState, useMemo } from 'react';
import Card from './Card';
import Tabs from './Tabs';
import Avatar from './Avatar';
import StatusPill from './StatusPill';
import Progress from './Progress';
import Tag from './Tag';
import {
  Users,
  ShieldCheck,
  Award,
  Clock,
  Calendar,
  TrendingUp,
  MapPin,
  Check,
  X,
  ArrowUpRight,
  Star,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

const ROLE_TIERS = [
  {
    id: 'HR',
    label: 'HRs',
    fullTitle: 'HRs (People Ops)',
    description: 'Attendance governance, leave policies & appraisal ops',
    icon: ShieldCheck,
    badgeColor: 'var(--accent2)',
  },
  {
    id: 'Team Lead',
    label: 'Team Leads',
    fullTitle: 'Team Leads',
    description: 'Pod leads managing QA, Design, DevOps, Data, Frontend & Backend',
    icon: Award,
    badgeColor: 'var(--accent)',
  },
  {
    id: 'Employee',
    label: 'Employees',
    fullTitle: 'Employees',
    description: 'Individual contributors across engineering, QA & data',
    icon: Users,
    badgeColor: 'var(--good)',
  },
];

export default function OrgHierarchyPanel({
  employees = [],
  pendingRequests = [],
  approvedRequests = [],
  onApprove,
  onReject,
  onSelectEmployee,
  onNavigate,
  managerName = 'Lokesh Kumar',
  dataW = 'roles',
}) {
  const [selectedTier, setSelectedTier] = useState('HR');

  // Filter out the manager when summarizing subordinates under Manager
  const teamMembers = useMemo(() => {
    return employees.filter((e) => e.orgRole !== 'Manager');
  }, [employees]);

  // Pre-index leave requests by member name for fast lookup
  const leavesByMember = useMemo(() => {
    const map = {};
    pendingRequests
      .filter((r) => r.type === 'Leave' || r.badgeType === 'leave')
      .forEach((req) => {
        if (!map[req.name]) map[req.name] = { pending: [], approved: [] };
        map[req.name].pending.push(req);
      });
    approvedRequests
      .filter((r) => r.type === 'Leave')
      .forEach((req) => {
        if (!map[req.name]) map[req.name] = { pending: [], approved: [] };
        map[req.name].approved.push(req);
      });
    return map;
  }, [pendingRequests, approvedRequests]);

  // Compute live Attendance, Leave Requests & Performance summary per tier
  const tierStats = useMemo(() => {
    return ROLE_TIERS.map((tier) => {
      const members = teamMembers.filter((m) => m.orgRole === tier.id);
      const present = members.filter((m) => m.status === 'in-office' || m.status === 'remote').length;
      const onLeave = members.filter((m) => m.status === 'on-leave').length;
      const notPunched = members.filter((m) => m.status === 'not-punched').length;

      let pendingLeavesCount = 0;
      let approvedLeavesCount = 0;
      members.forEach((m) => {
        const entry = leavesByMember[m.name];
        if (entry) {
          pendingLeavesCount += entry.pending.length;
          approvedLeavesCount += entry.approved.length;
        }
      });

      const avgGoals =
        members.length > 0
          ? Math.round(members.reduce((sum, m) => sum + (m.goalsProgress || 0), 0) / members.length)
          : 0;
      const avgRating =
        members.length > 0
          ? (
              members.reduce((sum, m) => sum + (m.performanceRating || 4.2), 0) / members.length
            ).toFixed(1)
          : '0.0';

      return {
        ...tier,
        members,
        count: members.length,
        present,
        onLeave,
        notPunched,
        pendingLeavesCount,
        approvedLeavesCount,
        avgGoals,
        avgRating,
      };
    });
  }, [teamMembers, leavesByMember]);

  const activeMembers = useMemo(() => {
    if (selectedTier === 'All') return teamMembers;
    return teamMembers.filter((m) => m.orgRole === selectedTier);
  }, [teamMembers, selectedTier]);

  const filterTabs = [
    { id: 'HR', label: 'HRs', count: tierStats[0]?.count || 0 },
    { id: 'Team Lead', label: 'Team Leads', count: tierStats[1]?.count || 0 },
    { id: 'Employee', label: 'Employees', count: tierStats[2]?.count || 0 },
    { id: 'All', label: 'All Under Manager', count: teamMembers.length },
  ];

  const managerRecord = employees.find((e) => e.orgRole === 'Manager') || employees[0];

  return (
    <Card
      dataW={dataW}
      title="Under Manager · HRs, Team Leads & Employees"
      subtitle={`Reporting hierarchy under ${managerName} (${managerRecord?.role || 'Engineering Manager'}) · Attendance, Leave Requests & Performance`}
      headerAction={
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="px-2.5 py-1 rounded-lg bg-surface2 border border-line hover:border-accent text-[11.5px] font-semibold text-ink flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Clock size={12} className="text-accent" />
                <span>Attendance</span>
                <ArrowUpRight size={11} className="text-muted" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('leave')}
                className="px-2.5 py-1 rounded-lg bg-surface2 border border-line hover:border-accent text-[11.5px] font-semibold text-ink flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Calendar size={12} className="text-accent2" />
                <span>Leave Requests</span>
                <ArrowUpRight size={11} className="text-muted" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('performance')}
                className="px-2.5 py-1 rounded-lg bg-surface2 border border-line hover:border-accent text-[11.5px] font-semibold text-ink flex items-center gap-1 cursor-pointer transition-colors"
              >
                <TrendingUp size={12} className="text-good" />
                <span>Performance</span>
                <ArrowUpRight size={11} className="text-muted" />
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 w-full">
        {/* 1. Three Interactive Hierarchy Tier Summary Cards (HRs · Team Leads · Employees) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tierStats.map((tier) => {
            const Icon = tier.icon;
            const isSelected = selectedTier === tier.id;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTier(tier.id)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-surface2 border-accent shadow-md'
                    : 'bg-surface2/35 border-line hover:border-accent/50 hover:bg-surface2/60'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border border-line bg-surface shrink-0"
                      style={{ color: tier.badgeColor }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-display font-bold text-[15px] text-ink truncate">
                        {tier.fullTitle}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {tier.count} {tier.count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                      isSelected
                        ? 'bg-accent text-on-accent'
                        : 'bg-surface text-muted border border-line'
                    }`}
                  >
                    {isSelected ? 'Viewing' : 'View'}
                  </span>
                </div>

                {/* 3 Metrics Row: Attendance | Leave | Performance */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/50 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-muted text-[10px] uppercase font-mono">Attendance</span>
                    <span className="font-bold text-ink font-mono tabular-nums mt-0.5">
                      {tier.present}/{tier.count} Active
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      {tier.onLeave > 0
                        ? `${tier.onLeave} on leave`
                        : tier.notPunched > 0
                        ? `${tier.notPunched} not punched`
                        : 'All punched'}
                    </span>
                  </div>

                  <div className="flex flex-col border-l border-line/40 pl-2">
                    <span className="text-muted text-[10px] uppercase font-mono">Leave Req</span>
                    <span
                      className={`font-bold font-mono tabular-nums mt-0.5 ${
                        tier.pendingLeavesCount > 0 ? 'text-warn' : 'text-ink'
                      }`}
                    >
                      {tier.pendingLeavesCount} Pending
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      {tier.approvedLeavesCount} approved
                    </span>
                  </div>

                  <div className="flex flex-col border-l border-line/40 pl-2">
                    <span className="text-muted text-[10px] uppercase font-mono">Performance</span>
                    <span className="font-bold text-good font-mono tabular-nums mt-0.5">
                      {tier.avgGoals}% Goals
                    </span>
                    <span className="text-[10px] text-muted flex items-center gap-0.5">
                      <Star size={10} className="text-accent fill-accent" />
                      <span>{tier.avgRating} / 5</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Role Tier Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Tabs
            tabs={filterTabs}
            activeId={selectedTier}
            onChange={setSelectedTier}
            size="sm"
          />
          <span className="text-[11.5px] text-muted font-mono">
            Showing {activeMembers.length} {selectedTier === 'All' ? 'team members' : `${selectedTier}s`}
          </span>
        </div>

        {/* 3. Detailed Members Table: Attendance + Leave Requests + Performance */}
        <div className="overflow-x-auto rounded-xl border border-line/60 bg-surface2/20">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="border-b border-line/60 bg-surface2/50 text-[11px] font-mono uppercase tracking-wider text-muted">
                <th className="py-2.5 px-3.5">Member & Role Tier</th>
                <th className="py-2.5 px-3.5">Attendance (Today)</th>
                <th className="py-2.5 px-3.5">Leave Requests & Balance</th>
                <th className="py-2.5 px-3.5">Performance (Q3)</th>
                <th className="py-2.5 px-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-line/60 text-[12.5px]">
              {activeMembers.map((emp) => {
                const memberLeaves = leavesByMember[emp.name] || { pending: [], approved: [] };
                const pendingLeave = memberLeaves.pending[0];
                const approvedLeave = memberLeaves.approved[0];
                const isInsideGps = emp.punchInGps?.geofence?.isInside;

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-surface2/40 transition-colors group"
                  >
                    {/* 1. Member & Role Tier */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} size={34} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onSelectEmployee?.(emp)}
                              className="font-bold text-ink hover:text-accent transition-colors text-left cursor-pointer"
                            >
                              {emp.name}
                            </button>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                emp.orgRole === 'HR'
                                  ? 'bg-accent2/15 text-accent2 border-accent2/40'
                                  : emp.orgRole === 'Team Lead'
                                  ? 'bg-accent/15 text-accent border-accent/40'
                                  : 'bg-surface2 text-muted border-line'
                              }`}
                            >
                              {emp.orgRole}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted truncate">
                            {emp.role} · {emp.location} ({emp.reporting})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Attendance Today */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <StatusPill status={emp.status} />
                          {emp.punchIn && emp.punchIn !== '—' && (
                            <span className="font-mono text-[11.5px] text-ink tabular-nums">
                              In {emp.punchIn} · {emp.hoursWorked}
                            </span>
                          )}
                        </div>
                        {emp.punchInGps && (
                          <span className="text-[10.5px] font-mono text-muted flex items-center gap-1">
                            <MapPin
                              size={10}
                              className={isInsideGps ? 'text-good' : 'text-accent'}
                            />
                            <span>
                              {isInsideGps
                                ? `HQ Geofence (${emp.punchInGps.geofence?.distanceMeters}m)`
                                : emp.punchInGps.address}
                            </span>
                          </span>
                        )}
                        {emp.status === 'not-punched' && (
                          <span className="text-[10.5px] text-bad flex items-center gap-1">
                            <AlertCircle size={10} />
                            <span>No punch recorded yet</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Leave Requests & Balance */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col gap-1">
                        {pendingLeave ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-warn/15 border border-warn/40 text-warn text-[10.5px] font-semibold">
                              Pending: {pendingLeave.dates} ({pendingLeave.days})
                            </span>
                            {onApprove && onReject && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onApprove(pendingLeave)}
                                  title="Approve Leave"
                                  className="p-1 rounded bg-good/20 hover:bg-good/30 text-good border border-good/40 cursor-pointer transition-colors"
                                  aria-label={`Approve leave for ${emp.name}`}
                                >
                                  <Check size={11} strokeWidth={2.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onReject(pendingLeave)}
                                  title="Reject Leave"
                                  className="p-1 rounded bg-bad/20 hover:bg-bad/30 text-bad border border-bad/40 cursor-pointer transition-colors"
                                  aria-label={`Reject leave for ${emp.name}`}
                                >
                                  <X size={11} strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : approvedLeave ? (
                          <span className="text-[11px] font-semibold text-good flex items-center gap-1">
                            <Check size={11} />
                            <span>Approved: {approvedLeave.dates}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">No pending leave</span>
                        )}

                        {emp.leaveBalance && (
                          <span className="text-[10.5px] font-mono text-muted/80 tabular-nums">
                            Balance: CL {emp.leaveBalance.casual} · SL {emp.leaveBalance.sick} · EL{' '}
                            {emp.leaveBalance.earned}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Performance (Goals + Rating + Last 1:1) */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col gap-1.5 max-w-[190px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-ink tabular-nums">
                            {emp.goalsProgress}% Goals
                          </span>
                          <span className="flex items-center gap-0.5 font-mono font-semibold text-accent">
                            <Star size={11} className="fill-accent text-accent" />
                            <span>{emp.performanceRating}</span>
                          </span>
                        </div>
                        <Progress
                          value={emp.goalsProgress || 0}
                          max={100}
                          variant={emp.goalsProgress < 75 ? 'warn' : 'normal'}
                          height={5}
                        />
                        <span className="text-[10px] text-muted">
                          Last 1:1: {emp.last1on1 || '—'}
                        </span>
                      </div>
                    </td>

                    {/* 5. Action */}
                    <td className="py-3 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEmployee?.(emp)}
                        className="px-2.5 py-1 rounded-lg bg-surface2 border border-line hover:border-accent text-[11.5px] font-semibold text-ink hover:text-accent transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

