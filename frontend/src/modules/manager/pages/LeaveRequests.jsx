import React, { useState } from 'react';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import Calendar from '../components/Calendar';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import Drawer from '../components/Drawer';
import FormField from '../components/FormField';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import {
  Check,
  X,
  AlertTriangle,
  Calendar as CalendarIcon,
  Info,
  Plus,
  ShieldCheck,
  Clock,
  UserCheck,
  Send,
  User,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Undo2,
} from 'lucide-react';

export default function LeaveRequests({
  pendingLeaves = [],
  approvedLeaves = [],
  rejectedLeaves = [],
  onApproveLeave,
  onRejectLeave,
  calendarDays,
  onSelectEmployee,
  employees = [],
  onTriggerToast,
}) {
  // Primary view: 'team' (Approvals queue) or 'manager' (Manager's own leave & Admin approval)
  const [activeView, setActiveView] = useState('team');

  // Team Queue State
  const [queueTab, setQueueTab] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Manager Personal Leave State
  const [managerLeaves, setManagerLeaves] = useState([
    {
      id: 'MGR-LV-101',
      type: 'Privilege Leave',
      startDate: '2026-11-18',
      endDate: '2026-11-20',
      datesFormatted: '18 Nov 2026 – 20 Nov 2026',
      duration: '3 days',
      dayMode: 'Full Day',
      reason: 'Annual family vacation & technical conference attendance',
      interimLead: 'Sneha Reddy (Lead Engineer)',
      interimLeadRole: 'Lead Engineer',
      status: 'Pending Admin Approval', // 'Pending Admin Approval' | 'Approved by Admin' | 'Rejected by Admin'
      appliedAt: '06 Nov 2026, 10:30 AM',
      routedTo: 'Vikram Malhotra (VP of Engineering & HR Admin)',
      adminNote: '',
      adminReviewedAt: null,
    },
    {
      id: 'MGR-LV-092',
      type: 'Casual Leave',
      startDate: '2026-10-24',
      endDate: '2026-10-24',
      datesFormatted: '24 Oct 2026',
      duration: '1 day',
      dayMode: 'Full Day',
      reason: 'Personal paperwork & domestic errands',
      interimLead: 'Aarav Mehta (Senior Architect)',
      interimLeadRole: 'Senior Architect',
      status: 'Approved by Admin',
      appliedAt: '20 Oct 2026, 04:15 PM',
      routedTo: 'Vikram Malhotra (VP of Engineering & HR Admin)',
      adminNote: 'Approved. Sprint 43 release coverage confirmed with Aarav.',
      adminReviewedAt: '21 Oct 2026, 11:00 AM',
    },
    {
      id: 'MGR-LV-084',
      type: 'Sick Leave',
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      datesFormatted: '15 Sep 2026',
      duration: '1 day',
      dayMode: 'Full Day',
      reason: 'Viral fever recovery',
      interimLead: 'Rahul Verma (QA Lead)',
      interimLeadRole: 'QA Lead',
      status: 'Approved by Admin',
      appliedAt: '15 Sep 2026, 08:30 AM',
      routedTo: 'Pooja Sharma (Head of HR)',
      adminNote: 'Get well soon. Standups delegated to Rahul.',
      adminReviewedAt: '15 Sep 2026, 09:15 AM',
    },
  ]);

  const [managerFilterTab, setManagerFilterTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Apply Leave Drawer State
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    type: 'Privilege Leave',
    startDate: '2026-11-23',
    endDate: '2026-11-25',
    dayMode: 'Full Day',
    interimLead: 'Sneha Reddy',
    reason: '',
    emergencyContact: '+91 98450 12345',
  });

  const notify = (msg, undoFn) => {
    if (onTriggerToast) onTriggerToast(msg, undoFn);
  };

  const getMemberRole = (name) => {
    const emp = employees.find((e) => e.name === name);
    return emp?.orgRole || 'Employee';
  };

  const roleFilterTabs = [
    { id: 'all', label: 'All Roles' },
    { id: 'HR', label: 'HRs' },
    { id: 'Team Lead', label: 'Team Leads' },
    { id: 'Employee', label: 'Employees' },
  ];

  const filterByRole = (list) =>
    roleFilter === 'all' ? list : list.filter((req) => getMemberRole(req.name) === roleFilter);

  const visiblePending = filterByRole(pendingLeaves);
  const visibleApproved = filterByRole(approvedLeaves);
  const visibleRejected = filterByRole(rejectedLeaves);

  const queueTabs = [
    { id: 'pending', label: 'Pending', count: visiblePending.length },
    { id: 'approved', label: 'Approved', count: visibleApproved.length },
    { id: 'rejected', label: 'Rejected', count: visibleRejected.length },
  ];

  const handleStartReject = (reqId) => {
    setRejectingId(reqId);
    setRejectionReason('');
  };

  const handleConfirmReject = (req) => {
    onRejectLeave({ ...req, customReason: rejectionReason || 'Operational constraints' });
    setRejectingId(null);
    setRejectionReason('');
  };

  // ----------------------------------------------------
  // MANAGER LEAVE HANDLERS (ADMIN APPROVAL WORKFLOW)
  // ----------------------------------------------------
  const handleApplySubmit = (e) => {
    e?.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate) {
      notify('Please select start and end dates.');
      return;
    }

    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (end < start) {
      notify('End date cannot be earlier than start date.');
      return;
    }

    // Calculate days count
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const durationStr = applyForm.dayMode === 'Full Day'
      ? `${diffDays} day${diffDays > 1 ? 's' : ''}`
      : `0.5 day (${applyForm.dayMode})`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startFmt = `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
    const endFmt = `${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    const datesFormatted = startFmt === endFmt ? startFmt : `${startFmt} – ${endFmt}`;

    const newRequest = {
      id: `MGR-LV-${Date.now().toString().slice(-4)}`,
      type: applyForm.type,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      datesFormatted,
      duration: durationStr,
      dayMode: applyForm.dayMode,
      reason: applyForm.reason || 'Personal leave request',
      interimLead: `${applyForm.interimLead} (Acting Lead)`,
      interimLeadRole: 'Lead Engineer',
      status: 'Pending Admin Approval',
      appliedAt: 'Just now',
      routedTo: 'Vikram Malhotra (VP of Engineering & HR Admin)',
      adminNote: '',
      adminReviewedAt: null,
    };

    setManagerLeaves([newRequest, ...managerLeaves]);
    setIsApplyDrawerOpen(false);
    setActiveView('manager'); // Switch to Manager view to see newly submitted request

    notify(
      `Leave request submitted for Admin Approval (routed to Vikram Malhotra - VP Eng)`,
      () => setManagerLeaves((prev) => prev.filter((r) => r.id !== newRequest.id))
    );
  };

  // Manager withdraws their pending leave request
  const handleWithdrawRequest = (reqId) => {
    const target = managerLeaves.find((r) => r.id === reqId);
    if (!target) return;
    const prev = [...managerLeaves];
    setManagerLeaves(managerLeaves.filter((r) => r.id !== reqId));
    notify(`Withdrawn leave request (${target.datesFormatted})`, () => setManagerLeaves(prev));
  };

  // Manager leave filter
  const filteredManagerLeaves = managerLeaves.filter((r) => {
    if (managerFilterTab === 'pending') return r.status === 'Pending Admin Approval';
    if (managerFilterTab === 'approved') return r.status === 'Approved by Admin';
    if (managerFilterTab === 'rejected') return r.status === 'Rejected by Admin';
    return true;
  });

  const pendingManagerCount = managerLeaves.filter((r) => r.status === 'Pending Admin Approval').length;

  return (
    <div className="flex flex-col gap-[var(--gap)] w-full">
      {/* ============================================================== */}
      {/* TOP NAVIGATION & SWITCHER STRIP                               */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-line/40">
        <div className="flex items-center gap-1.5 p-1 bg-surface2/70 border border-line rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('team')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold transition-all cursor-pointer ${
              activeView === 'team'
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            <Users size={14} />
            <span>Team Approvals</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeView === 'team'
                  ? 'bg-black/20 text-on-accent'
                  : 'bg-warn/15 text-warn border border-warn/30'
              }`}
            >
              {visiblePending.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('manager')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold transition-all cursor-pointer ${
              activeView === 'manager'
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface2'
            }`}
          >
            <User size={14} />
            <span>My Leave (Manager Portal)</span>
            {pendingManagerCount > 0 ? (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeView === 'manager'
                    ? 'bg-black/20 text-on-accent'
                    : 'bg-warn text-black'
                }`}
              >
                {pendingManagerCount} Pending
              </span>
            ) : (
              <span className="text-[10.5px] opacity-75 font-mono">Admin Approves</span>
            )}
          </button>
        </div>

        {/* Global Action: Manager Apply for Leave */}
        <button
          type="button"
          onClick={() => setIsApplyDrawerOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[12.5px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Apply for Leave (Manager)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VIEW A: TEAM LEAVE APPROVALS QUEUE (MANAGER APPROVES EMPLOYEES) */}
      {/* ============================================================== */}
      {activeView === 'team' && (
        <div className="flex flex-col gap-[var(--gap)] w-full">
          {/* Quick Notice Banner */}
          <div className="p-3 rounded-xl bg-surface2/50 border border-line/60 flex items-center justify-between flex-wrap gap-2 text-[12px]">
            <div className="flex items-center gap-2 text-muted">
              <ShieldCheck size={16} className="text-accent shrink-0" />
              <span>
                You are reviewing leave requests for your team of <strong>24 members</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('manager')}
              className="text-accent hover:underline font-semibold text-[11.5px] flex items-center gap-1 cursor-pointer"
            >
              <span>Need time off yourself? View Manager Leave Portal</span>
              <span>→</span>
            </button>
          </div>

          <Card
            dataW="leaveq"
            title="Leave requests queue"
            subtitle="Manage leaves across HRs, Team Leads & Employees"
            headerAction={
              <Tabs
                tabs={queueTabs}
                activeId={queueTab}
                onChange={setQueueTab}
                size="sm"
              />
            }
          >
            {/* Role Tier Filter Tabs */}
            <div className="pb-2 border-b border-line/40">
              <Tabs
                tabs={roleFilterTabs}
                activeId={roleFilter}
                onChange={setRoleFilter}
                size="sm"
              />
            </div>

            <div className="flex flex-col divide-y divide-dashed divide-line">
              {/* PENDING LIST */}
              {queueTab === 'pending' &&
                visiblePending.map((req) => {
                  const orgRole = getMemberRole(req.name);
                  return (
                    <div
                      key={req.id}
                      className="py-3 flex flex-col gap-2.5 group hover:bg-surface2/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={req.name} size={32} customBg={req.avatarBg} />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[14px] text-ink hover:text-accent transition-colors">
                                {req.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold border ${
                                  orgRole === 'HR'
                                    ? 'bg-accent2/15 text-accent2 border-accent2/40'
                                    : orgRole === 'Team Lead'
                                    ? 'bg-accent/15 text-accent border-accent/40'
                                    : 'bg-surface2 text-muted border-line'
                                }`}
                              >
                                {orgRole}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted truncate">
                              {req.role}
                            </span>
                          </div>
                        </div>
                        <Tag>{req.type || 'Leave'}</Tag>
                      </div>

                      {/* Leave details & overlap warning */}
                      <div className="flex flex-col gap-1 text-[12px] bg-surface2/40 p-2.5 rounded-lg border border-line/40">
                        <div className="flex items-center justify-between">
                          <span className="text-ink font-semibold">{req.dates}</span>
                          <strong className="text-ink font-bold font-mono">{req.days}</strong>
                        </div>

                        <span className="text-muted text-[11.5px]">{req.subDetails}</span>

                        {req.overlapWarning && (
                          <div className="flex items-center gap-1.5 text-warn font-semibold text-[11px] mt-1 pt-1 border-t border-warn/20">
                            <AlertTriangle size={13} />
                            <span>Team overlap: 2+ engineers requested off on 12 Nov</span>
                          </div>
                        )}

                        <div className="text-muted/90 italic text-[11.5px] mt-0.5">
                          "{req.reason}"
                        </div>
                      </div>

                      {/* Rejection reason inline prompt */}
                      {rejectingId === req.id ? (
                        <div className="flex flex-col gap-2 p-2 rounded-lg bg-surface2 border border-bad/40">
                          <label className="text-[11px] text-muted font-medium">
                            Rejection reason (optional for team member):
                          </label>
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Sprint release window coverage needed"
                            className="bg-bg border border-line rounded px-2.5 py-1 text-[12px] text-ink focus:outline-none focus:border-bad"
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="px-2.5 py-1 text-[11px] text-muted hover:text-ink cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmReject(req)}
                              className="px-3 py-1 rounded bg-bad text-black text-[11px] font-bold cursor-pointer"
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => onApproveLeave(req)}
                            aria-label={`Approve leave for ${req.name}`}
                            className="py-1.5 px-3 rounded-xl text-[12px] font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--on-accent)',
                            }}
                          >
                            <Check size={14} strokeWidth={2.5} />
                            <span>Approve Leave</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartReject(req.id)}
                            aria-label={`Reject leave for ${req.name}`}
                            className="py-1.5 px-3 rounded-xl text-[12px] font-semibold bg-surface2 border border-line hover:border-bad/60 hover:text-bad text-muted flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* APPROVED LIST */}
              {queueTab === 'approved' &&
                visibleApproved.map((req) => {
                  const orgRole = getMemberRole(req.name);
                  return (
                    <div key={req.id} className="py-3 flex items-center justify-between px-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={req.name} size={30} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-ink">{req.name}</span>
                            <Tag>{orgRole}</Tag>
                          </div>
                          <span className="text-[11.5px] text-muted">
                            {req.dates} · {req.days}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-accent font-semibold flex items-center gap-1">
                        <Check size={13} />
                        Approved
                      </span>
                    </div>
                  );
                })}

              {/* REJECTED LIST */}
              {queueTab === 'rejected' &&
                visibleRejected.map((req) => {
                  const orgRole = getMemberRole(req.name);
                  return (
                    <div key={req.id} className="py-3 flex items-center justify-between px-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={req.name} size={30} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-ink">{req.name}</span>
                            <Tag>{orgRole}</Tag>
                          </div>
                          <span className="text-[11.5px] text-muted">
                            {req.dates} · Reason: {req.reason}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-bad font-semibold flex items-center gap-1">
                        <X size={13} />
                        Rejected
                      </span>
                    </div>
                  );
                })}

              {/* Empty states */}
              {queueTab === 'pending' && visiblePending.length === 0 && (
                <div className="py-10 text-center text-muted italic text-[13px]">
                  No pending leave requests matching the selected role filter.
                </div>
              )}
              {queueTab === 'approved' && visibleApproved.length === 0 && (
                <div className="py-10 text-center text-muted italic text-[13px]">
                  No approved leave requests matching the selected role filter.
                </div>
              )}
              {queueTab === 'rejected' && visibleRejected.length === 0 && (
                <div className="py-10 text-center text-muted italic text-[13px]">
                  No rejected leave requests matching the selected role filter.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: MANAGER PERSONAL LEAVE (ADMIN APPROVAL WORKFLOW)       */}
      {/* ============================================================== */}
      {activeView === 'manager' && (
        <div className="flex flex-col gap-5 w-full">
          {/* Manager & Admin Hierarchy Info Header */}
          <div className="p-4 rounded-xl bg-surface2/60 border border-line flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                LK
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[15px] text-ink">Lokesh Kumar</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                    Engineering Manager
                  </span>
                </div>
                <p className="text-[12px] text-muted mt-0.5">
                  Reporting To:{' '}
                  <strong className="text-ink font-semibold">
                    Vikram Malhotra
                  </strong>{' '}
                  (VP of Engineering & HR Admin)
                </p>
              </div>
            </div>
          </div>

          {/* Manager Leave Balances Grid (4 Types) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                title: 'Privilege Leave (PL)',
                remaining: 14,
                total: 18,
                used: 4,
                color: 'text-accent',
                border: 'border-accent/30',
                desc: 'Annual paid leave',
              },
              {
                title: 'Casual Leave (CL)',
                remaining: 6,
                total: 12,
                used: 6,
                color: 'text-accent2',
                border: 'border-accent2/30',
                desc: 'Urgent personal work',
              },
              {
                title: 'Sick Leave (SL)',
                remaining: 8,
                total: 10,
                used: 2,
                color: 'text-good',
                border: 'border-good/30',
                desc: 'Medical & health recovery',
              },
              {
                title: 'Comp-Off Balance',
                remaining: 2,
                total: 3,
                used: 1,
                color: 'text-ink',
                border: 'border-line',
                desc: 'Weekend release credit',
              },
            ].map((bal) => (
              <div
                key={bal.title}
                className={`p-3.5 rounded-xl bg-surface2/50 border ${bal.border} flex flex-col justify-between`}
              >
                <div>
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
                    {bal.title}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-[22px] font-bold font-mono ${bal.color}`}>
                      {bal.remaining}
                    </span>
                    <span className="text-[12px] text-muted font-mono">
                      / {bal.total} days
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-line/40 flex items-center justify-between text-[10.5px] text-muted">
                  <span>{bal.desc}</span>
                  <span className="font-mono">{bal.used} used</span>
                </div>
              </div>
            ))}
          </div>

          {/* Manager Leave Applications Queue */}
          <Card
            title="My Leave Requests (Admin Approval Status)"
            subtitle="Track your submitted leaves and review Admin approval decisions"
            action={
              <div className="flex items-center gap-1 bg-surface2 rounded-lg p-0.5 border border-line text-[11px] font-semibold">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending Admin' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setManagerFilterTab(t.id)}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      managerFilterTab === t.id
                        ? 'bg-accent text-on-accent'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="flex flex-col gap-3">
              {filteredManagerLeaves.length === 0 ? (
                <div className="py-10 text-center text-muted italic text-[13px]">
                  No leave requests found in this filter tab.
                </div>
              ) : (
                filteredManagerLeaves.map((req) => {
                  const isPending = req.status === 'Pending Admin Approval';
                  const isApproved = req.status === 'Approved by Admin';
                  const isRejected = req.status === 'Rejected by Admin';

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col gap-3.5 ${
                        isPending
                          ? 'bg-surface2/50 border-warn/40 hover:border-warn'
                          : isApproved
                          ? 'bg-surface2/30 border-line hover:border-accent/50'
                          : 'bg-surface2/20 border-bad/30'
                      }`}
                    >
                      {/* Request Header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-[12px] border ${
                              isPending
                                ? 'bg-warn/15 text-warn border-warn/40'
                                : isApproved
                                ? 'bg-accent/15 text-accent border-accent/40'
                                : 'bg-bad/15 text-bad border-bad/40'
                            }`}
                          >
                            {req.type.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-[14px] text-ink">
                                {req.type}
                              </h4>
                              <Tag variant="default">{req.duration}</Tag>
                              <span className="text-[11px] text-muted font-mono">
                                ({req.dayMode})
                              </span>
                            </div>
                            <span className="text-[12px] text-muted flex items-center gap-1.5 mt-0.5">
                              <CalendarIcon size={12} className="text-accent" />
                              <span className="font-semibold text-ink font-mono">
                                {req.datesFormatted}
                              </span>
                              <span>· Applied {req.appliedAt}</span>
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[11.5px] font-bold flex items-center gap-1.5 border ${
                              isPending
                                ? 'bg-warn/15 text-warn border-warn/50'
                                : isApproved
                                ? 'bg-good/15 text-good border-good/50'
                                : 'bg-bad/15 text-bad border-bad/50'
                            }`}
                          >
                            {isPending && <Clock size={13} className="animate-pulse" />}
                            {isApproved && <CheckCircle2 size={13} />}
                            {isRejected && <XCircle size={13} />}
                            <span>{req.status}</span>
                          </span>

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleWithdrawRequest(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-surface text-muted hover:text-bad border border-line text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Request Details & Interim Lead */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] p-3 rounded-lg bg-surface/60 border border-line/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10.5px] font-mono uppercase text-muted tracking-wider">
                            Reason for Absence:
                          </span>
                          <span className="text-ink italic">"{req.reason}"</span>
                        </div>

                        <div className="flex flex-col gap-1 md:border-l md:border-line/40 md:pl-3">
                          <span className="text-[10.5px] font-mono uppercase text-muted tracking-wider flex items-center gap-1">
                            <UserCheck size={12} className="text-accent" />
                            <span>Interim Acting Lead:</span>
                          </span>
                          <span className="text-ink font-semibold">
                            {req.interimLead}
                          </span>
                          <span className="text-[11px] text-muted">
                            Authorized to unblock team PRs and daily standups
                          </span>
                        </div>
                      </div>

                      {/* Approver Status Section */}
                      <div className="p-3 rounded-xl bg-surface2/40 border border-line/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11.5px] flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-muted">
                            <ShieldCheck size={14} className="text-accent" />
                            <span>
                              Approving Authority:{' '}
                              <strong className="text-ink font-semibold">
                                {req.routedTo}
                              </strong>
                            </span>
                          </div>
                          {req.adminReviewedAt && (
                            <span className="text-[11px] text-muted font-mono">
                              Reviewed: {req.adminReviewedAt}
                            </span>
                          )}
                        </div>

                        {req.adminNote && (
                          <div
                            className={`p-2.5 rounded-lg text-[12px] flex items-start gap-2 border ${
                              isApproved
                                ? 'bg-good/10 text-good border-good/30'
                                : 'bg-bad/10 text-bad border-bad/30'
                            }`}
                          >
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <div>
                              <strong>Admin Remark:</strong> {req.adminNote}
                            </div>
                          </div>
                        )}

                        {/* Awaiting Admin Decision Notice */}
                        {isPending && (
                          <div className="mt-1 pt-2 border-t border-line/40 flex items-center justify-between gap-2 flex-wrap text-[11.5px]">
                            <span className="flex items-center gap-1.5 text-warn/90">
                              <Clock size={12} className="shrink-0 text-warn" />
                              <span>Awaiting review and approval from Admin (Vikram Malhotra).</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-line text-muted font-mono">
                              Admin Authorization Only
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TEAM MASTER CALENDAR (EVENTS, LEAVES & SCHEDULES)           */}
      {/* ============================================================== */}
      <div className="w-full">
        <Card
          dataW="leavecal"
          title="Team Calendar: Department Events, Leaves & Schedules"
          subtitle="Integrated visibility into company events, approved/pending leaves, and shift rotas"
        >
          <Calendar days={calendarDays} selectedDay={6} />

          {/* All leave this month summary */}
          <div className="flex flex-col gap-2 pt-3 border-t border-line/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Active approved leaves this month
              </span>
              <span className="text-[11px] text-accent font-mono font-semibold">
                November 2026
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-surface2/60 border border-line/50">
                <span className="text-[12.5px] font-bold text-ink block">Rahul Verma</span>
                <span className="text-[10.5px] text-muted font-mono block">QA Lead</span>
                <span className="text-[11px] text-accent2">4–6 Nov (3 days)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface2/60 border border-line/50">
                <span className="text-[12.5px] font-bold text-ink block">Divya Menon</span>
                <span className="text-[10.5px] text-muted font-mono block">Design Lead</span>
                <span className="text-[11px] text-accent2">5–6 Nov (2 days)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface2/60 border border-line/50">
                <span className="text-[12.5px] font-bold text-ink block">Sunita Rao</span>
                <span className="text-[10.5px] text-muted font-mono block">HR Partner</span>
                <span className="text-[11px] text-accent2">6 Nov (1 day)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface2/60 border border-accent/40 bg-accent/5">
                <span className="text-[12.5px] font-bold text-ink block flex items-center justify-between">
                  <span>Lokesh Kumar</span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-accent text-on-accent font-bold">Manager</span>
                </span>
                <span className="text-[10.5px] text-muted font-mono block">Engineering Mgr</span>
                <span className="text-[11px] text-accent font-semibold">18–20 Nov (Pending Admin)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* 3. APPLY LEAVE DRAWER (FOR MANAGER)                           */}
      {/* ============================================================== */}
      <Drawer
        isOpen={isApplyDrawerOpen}
        onClose={() => setIsApplyDrawerOpen(false)}
        title="Apply for Personal Leave"
        subtitle="Manager Leave Portal · Routed to Admin for Approval"
        width="500px"
      >
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-4 text-[13px]">
          {/* Leave Type Select */}
          <FormField label="Leave Type" id="mgr-leave-type" required>
            <select
              id="mgr-leave-type"
              value={applyForm.type}
              onChange={(e) => setApplyForm({ ...applyForm, type: e.target.value })}
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none font-sans"
            >
              <option value="Privilege Leave">Privilege Leave (PL) — 14 days remaining</option>
              <option value="Casual Leave">Casual Leave (CL) — 6 days remaining</option>
              <option value="Sick Leave">Sick Leave (SL) — 8 days remaining</option>
              <option value="Comp-Off">Comp-Off — 2 days available</option>
              <option value="Paternity / Family Leave">Paternity / Family Leave</option>
            </select>
          </FormField>

          {/* Day Mode Toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase text-muted tracking-wider font-semibold">
              Duration Mode:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['Full Day', 'First Half', 'Second Half'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setApplyForm({ ...applyForm, dayMode: mode })}
                  className={`py-2 px-3 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer ${
                    applyForm.dayMode === mode
                      ? 'bg-accent text-on-accent border-accent shadow-sm'
                      : 'bg-surface2 text-muted border-line hover:text-ink'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" id="mgr-start-date" required>
              <input
                id="mgr-start-date"
                type="date"
                value={applyForm.startDate}
                min="2026-11-01"
                max="2026-12-31"
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
              />
            </FormField>

            <FormField label="End Date" id="mgr-end-date" required>
              <input
                id="mgr-end-date"
                type="date"
                value={applyForm.endDate}
                min={applyForm.startDate || '2026-11-01'}
                max="2026-12-31"
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
              />
            </FormField>
          </div>

          {/* Interim Acting Lead */}
          <FormField label="Interim Acting Lead (Delegation during absence)" id="mgr-interim-lead" required>
            <select
              id="mgr-interim-lead"
              value={applyForm.interimLead}
              onChange={(e) => setApplyForm({ ...applyForm, interimLead: e.target.value })}
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none font-sans"
            >
              <option value="Sneha Reddy">Sneha Reddy (Lead Engineer — Frontend Guild)</option>
              <option value="Aarav Mehta">Aarav Mehta (Senior Architect — Platform)</option>
              <option value="Rahul Verma">Rahul Verma (QA Lead — Quality Engineering)</option>
              <option value="Divya Menon">Divya Menon (Design Lead — Design System)</option>
            </select>
            <p className="text-[11px] text-muted mt-1">
              The assigned lead will receive delegate permissions to review sprint blockers and standup notes.
            </p>
          </FormField>

          {/* Reason Textarea */}
          <FormField label="Reason for Leave" id="mgr-leave-reason" required>
            <Textarea
              id="mgr-leave-reason"
              rows={3}
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="e.g. Attending annual architecture conference and scheduled family vacation..."
              required
            />
          </FormField>

          {/* Emergency Contact */}
          <FormField label="Emergency Contact Phone" id="mgr-contact">
            <input
              id="mgr-contact"
              type="text"
              value={applyForm.emergencyContact}
              onChange={(e) => setApplyForm({ ...applyForm, emergencyContact: e.target.value })}
              className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
            />
          </FormField>

          {/* Drawer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-2">
            <button
              type="button"
              onClick={() => setIsApplyDrawerOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface2 text-muted hover:text-ink text-[12.5px] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-bold text-[12.5px] shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--on-accent)',
              }}
            >
              <Send size={14} />
              <span>Submit for Admin Approval</span>
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
