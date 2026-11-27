import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import Kpi from '../components/Kpi';
import Drawer from '../components/Drawer';
import FormField from '../components/FormField';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import MonthSummary from '../components/attendance/MonthSummary.jsx';
import HistoryCalendar from '../components/attendance/HistoryCalendar.jsx';
import HistoryTable from '../components/attendance/HistoryTable.jsx';
import RegularisationDrawer from '../components/attendance/RegularisationDrawer.jsx';
import { useAttendance } from '../context/AttendanceContext';
import { evaluateDay, formatLiveTimer } from '../utils/attendanceEngine';
import { downloadCSV } from '../utils/exportUtils';
import {
  Calendar,
  Clock,
  Plus,
  ShieldCheck,
  Send,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CalendarDays,
  ArrowRight,
  Info,
  Building,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Filter,
} from 'lucide-react';

const INITIAL_MANAGER_LEAVES = [
  {
    id: 'MGR-LV-101',
    type: 'Privilege Leave',
    startDate: '2026-11-18',
    endDate: '2026-11-20',
    datesFormatted: '18 Nov 2026 – 20 Nov 2026',
    duration: '3 days',
    dayMode: 'Full Day',
    reason: 'Annual family vacation & technical conference attendance',
    interimLead: 'Sneha Reddy (Lead Engineer — Frontend Guild)',
    status: 'Pending Admin Approval',
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
    reason: 'Personal paperwork & domestic bank errands',
    interimLead: 'Aarav Mehta (Senior Architect — Platform)',
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
    interimLead: 'Rahul Verma (QA Lead — Quality Engineering)',
    status: 'Approved by Admin',
    appliedAt: '15 Sep 2026, 08:30 AM',
    routedTo: 'Pooja Sharma (Head of HR)',
    adminNote: 'Get well soon. Standups delegated to Rahul.',
    adminReviewedAt: '15 Sep 2026, 09:15 AM',
  },
];

const HISTORY_FILTER_PILLS = [
  'All',
  'Late',
  'Early departure',
  'Short hours',
  'Absent',
  'Leave',
  'Overtime',
  'Needs regularisation',
];

export default function MyLeaveAttendance({ onTriggerToast }) {
  const {
    today,
    isCheckedIn,
    isCheckedOut,
    evaluatedToday,
    liveNetMs,
    history = [],
    attendanceRules,
  } = useAttendance();

  const [managerLeaves, setManagerLeaves] = useState(INITIAL_MANAGER_LEAVES);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false);

  // Month history states
  const [selectedMonth, setSelectedMonth] = useState({ year: 2026, month: 11, label: 'November 2026' });
  const [historyViewMode, setHistoryViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [historyFilter, setHistoryFilter] = useState('All');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [regDrawerTarget, setRegDrawerTarget] = useState(null);

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

  // Full calendar days for the selected month
  const monthDays = useMemo(() => {
    const list = [];
    const isNov = selectedMonth.month === 11;
    const totalDays = isNov ? 30 : 31;
    const monthIndex = isNov ? 10 : 9; // 0-indexed for Date
    const monthShort = isNov ? 'Nov' : 'Oct';
    const monthKey = isNov ? '2026-11' : '2026-10';

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateKey = `${monthKey}-${String(dayNum).padStart(2, '0')}`;
      const dateStr = `${dayNum} ${monthShort} 2026`;
      const dateObj = new Date(2026, monthIndex, dayNum);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[dateObj.getDay()];
      const isPast = isNov ? dayNum <= 6 : true;

      // Holidays
      let isHoliday = false;
      let holidayName = null;
      if (isNov) {
        if (dayNum === 1) { isHoliday = true; holidayName = 'Karnataka Rajyotsava'; }
        else if (dayNum === 8) { isHoliday = true; holidayName = 'Diwali Eve'; }
        else if (dayNum === 9) { isHoliday = true; holidayName = 'Deepavali'; }
        else if (dayNum === 10) { isHoliday = true; holidayName = 'Bhai Dooj'; }
        else if (dayNum === 15) { isHoliday = true; holidayName = 'Guru Nanak Jayanti'; }
      } else {
        if (dayNum === 2) { isHoliday = true; holidayName = 'Gandhi Jayanti'; }
        else if (dayNum === 20) { isHoliday = true; holidayName = 'Maha Navami'; }
        else if (dayNum === 21) { isHoliday = true; holidayName = 'Vijaya Dashami'; }
      }

      const isWeeklyOff = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const record = history.find((h) => h.dateKey === dateKey);

      list.push({
        dayNumber: dayNum,
        dateKey,
        dateStr,
        dayOfWeek,
        isPast,
        isHoliday,
        holidayName,
        record: record || (isHoliday ? { isHoliday: true, holidayName, dateKey, date: dateStr } : isWeeklyOff ? { isWeeklyOff: true, dateKey, date: dateStr } : null),
      });
    }
    return list;
  }, [history, selectedMonth]);

  // Filtered records for Table view
  const filteredMonthRecords = useMemo(() => {
    const isNov = selectedMonth.month === 11;
    const prefix = isNov ? '2026-11' : '2026-10';
    const monthRecs = history.filter((r) => r.dateKey?.startsWith(prefix));

    return monthRecs.filter((rec) => {
      if (historyFilter === 'All') return true;
      const evalRes = evaluateDay(rec, attendanceRules, { isPastDay: true });
      if (historyFilter === 'Late') return evalRes.lateMin > 0;
      if (historyFilter === 'Early departure') return evalRes.earlyMin > 0;
      if (historyFilter === 'Short hours') return evalRes.status === 'Short hours';
      if (historyFilter === 'Absent') return evalRes.status === 'Absent';
      if (historyFilter === 'Leave') return evalRes.status === 'On leave' || rec.leaveApplied;
      if (historyFilter === 'Overtime') return evalRes.overtimeMin > 0;
      if (historyFilter === 'Needs regularisation') return rec.isMissedCheckout || evalRes.status === 'Short hours';
      return true;
    });
  }, [history, selectedMonth, historyFilter, attendanceRules]);

  // Export CSV
  const handleExportPersonalCsv = () => {
    const rows = [
      ['Date', 'Day', 'Shift', 'Check In', 'Check Out', 'Net Hours', 'Status'],
      ...filteredMonthRecords.map((r) => [
        r.date,
        r.dayOfWeek,
        r.shift?.name || 'General',
        r.checkIn || '—',
        r.checkOut || '—',
        r.checkIn && r.checkOut ? '8h' : '—',
        r.isHoliday ? 'Holiday' : r.isWeeklyOff ? 'Weekly Off' : 'Present',
      ]),
    ];
    downloadCSV(`personal-attendance-${selectedMonth.label.toLowerCase().replace(' ', '-')}.csv`, rows);
    notify(`Exported ${selectedMonth.label} attendance CSV`);
  };

  // Leave application submit
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

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const durationStr = applyForm.dayMode === 'Full Day'
      ? `${diffDays} day${diffDays > 1 ? 's' : ''}`
      : `${diffDays * 0.5} day (Half Day)`;

    const newLeaveReq = {
      id: `MGR-LV-${Date.now().toString().slice(-3)}`,
      type: applyForm.type,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      datesFormatted: `${applyForm.startDate} – ${applyForm.endDate}`,
      duration: durationStr,
      dayMode: applyForm.dayMode,
      reason: applyForm.reason || 'Personal leave request',
      interimLead: `${applyForm.interimLead} (Acting Lead)`,
      status: 'Pending Admin Approval',
      appliedAt: 'Just now',
      routedTo: 'Vikram Malhotra (VP of Engineering & HR Admin)',
      adminNote: '',
      adminReviewedAt: null,
    };

    const prev = [...managerLeaves];
    setManagerLeaves([newLeaveReq, ...managerLeaves]);
    setIsApplyDrawerOpen(false);
    setApplyForm({
      type: 'Privilege Leave',
      startDate: '2026-11-23',
      endDate: '2026-11-25',
      dayMode: 'Full Day',
      interimLead: 'Sneha Reddy',
      reason: '',
      emergencyContact: '+91 98450 12345',
    });

    notify(
      `Leave request submitted for Admin Approval (routed to Vikram Malhotra)`,
      () => setManagerLeaves(prev)
    );
  };

  const filteredLeaves = managerLeaves.filter((r) => {
    if (filterTab === 'pending') return r.status === 'Pending Admin Approval';
    if (filterTab === 'approved') return r.status === 'Approved by Admin';
    if (filterTab === 'rejected') return r.status === 'Rejected by Admin';
    return true;
  });

  const pendingAdminCount = managerLeaves.filter((r) => r.status === 'Pending Admin Approval').length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-display font-bold text-ink">My Leave & Attendance</h2>
          <p className="text-[12.5px] text-muted">
            Personal attendance punches, working hours, leave balances, and Admin approval workflow
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsApplyDrawerOpen(true)}
          className="px-4 py-2 rounded-xl font-bold text-[12.5px] flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
          }}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Apply for Personal Leave</span>
        </button>
      </div>

      {/* Manager Profile & Reporting Hierarchy Card */}
      <div className="p-4 rounded-xl bg-surface2/60 border border-line flex items-center justify-between gap-4 flex-wrap">
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
              Reporting To: <strong className="text-ink font-semibold">Vikram Malhotra</strong> (VP of Engineering & HR Admin)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-surface border border-line text-muted">
            Campus: Bengaluru HQ
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-good/15 text-good border border-good/30 font-semibold flex items-center gap-1">
            <MapPin size={12} /> Geofence Verified (200m)
          </span>
        </div>
      </div>

      {/* Leave Balances Grid (4 Types) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            title: 'Privilege Leave (PL)',
            remaining: 14,
            total: 18,
            used: 4,
            color: 'text-accent',
            border: 'border-accent/30',
            desc: 'Annual paid vacation',
          },
          {
            title: 'Casual Leave (CL)',
            remaining: 6,
            total: 12,
            used: 6,
            color: 'text-accent2',
            border: 'border-accent2/30',
            desc: 'Urgent personal affairs',
          },
          {
            title: 'Sick Leave (SL)',
            remaining: 8,
            total: 10,
            used: 2,
            color: 'text-good',
            border: 'border-good/30',
            desc: 'Medical & recuperation',
          },
          {
            title: 'Comp-Off Credit',
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
              <span className="text-[10.5px] font-mono text-muted uppercase tracking-wider block">
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

      {/* Today's Punch & Attendance Status Card */}
      <Card
        title="Today's Attendance Status"
        subtitle="Shift: General Shift (09:30 AM – 06:30 PM · 8h Work Goal)"
        action={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted">
              Grace Limit: 09:45 AM
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px]">
          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col justify-between">
            <span className="text-[11px] text-muted font-mono uppercase">Check-in Punch</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[18px] font-mono font-bold text-ink">
                {today?.checkIn ? today.checkIn : '09:28 AM'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-good/15 text-good border border-good/30">
                On Time
              </span>
            </div>
            <span className="text-[11px] text-muted mt-2">Logged via Web / Biometric Reader</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col justify-between">
            <span className="text-[11px] text-muted font-mono uppercase">Check-out Punch</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[18px] font-mono font-bold text-ink">
                {today?.checkOut ? today.checkOut : '21:15 PM'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface2 text-muted border border-line">
                Checked Out
              </span>
            </div>
            <span className="text-[11px] text-muted mt-2">
              Reason: Client / on-site visit
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col justify-between">
            <span className="text-[11px] text-muted font-mono uppercase">Daily Net Hours</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[18px] font-mono font-bold text-accent">
                11h 47m
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                Overtime +2h 47m
              </span>
            </div>
            <span className="text-[11px] text-muted mt-2">Eligible for Comp-Off conversion</span>
          </div>
        </div>
      </Card>

      {/* Manager Personal Leave Applications Queue (Admin Routed) */}
      <Card
        title="My Leave Requests (Admin Approval Status)"
        subtitle="Track your submitted leaves and review decisions from Vikram Malhotra (VP Eng & HR Admin)"
        action={
          <div className="flex items-center gap-1 bg-surface2 rounded-lg p-0.5 border border-line text-[11px] font-semibold">
            {[
              { id: 'all', label: `All (${managerLeaves.length})` },
              { id: 'pending', label: `Pending Admin (${pendingAdminCount})` },
              { id: 'approved', label: 'Approved' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-accent text-on-accent font-bold shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {filteredLeaves.length === 0 ? (
            <div className="py-10 text-center text-muted text-[13px]">
              No leave requests found in this category.
            </div>
          ) : (
            filteredLeaves.map((req) => {
              const isPending = req.status === 'Pending Admin Approval';
              const isApproved = req.status === 'Approved by Admin';

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-surface2/30 border border-line flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-accent">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[14px] text-ink">{req.type}</strong>
                          <span className="text-[11px] font-mono text-muted">({req.id})</span>
                        </div>
                        <span className="text-[12px] text-muted font-mono">
                          {req.datesFormatted} · <strong>{req.duration}</strong> ({req.dayMode})
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-good/15 text-good border-good/30'
                          : isPending
                          ? 'bg-warn/15 text-warn border-warn/30'
                          : 'bg-bad/15 text-bad border-bad/30'
                      }`}
                    >
                      {isApproved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      <span>{req.status}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface/40 border border-line/60 text-[12px] flex flex-col gap-1.5">
                    <div>
                      <strong className="text-ink">Reason:</strong>{' '}
                      <span className="text-muted">{req.reason}</span>
                    </div>
                    <div>
                      <strong className="text-ink">Interim Acting Lead:</strong>{' '}
                      <span className="text-accent font-semibold">{req.interimLead}</span>
                    </div>

                    {req.adminNote && (
                      <div className="mt-1 pt-1.5 border-t border-line/50 text-[11.5px] text-good flex items-start gap-1.5">
                        <Info size={13} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>Admin Remark ({req.adminReviewedAt}):</strong> {req.adminNote}
                        </div>
                      </div>
                    )}

                    {isPending && (
                      <div className="mt-1 pt-1.5 border-t border-line/50 text-[11.5px] text-warn/90 flex items-center gap-1.5 font-mono">
                        <Clock size={12} className="shrink-0 text-warn" />
                        <span>Awaiting decision from Admin Vikram Malhotra (VP of Engineering).</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ================================================================ */}
      {/* 5. COMPLETE MONTHLY ATTENDANCE HISTORY & ANALYTICS SECTION       */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4">
        {/* Monthly Summary Statistics Strip */}
        <MonthSummary />

        {/* Master Monthly History Card (Calendar & Table View) */}
        <Card
          id="personal-monthly-history"
          title={`Personal Attendance Monthly History · ${selectedMonth.label}`}
          subtitle="Complete daily punch records, shift compliance, working duration, and holiday reasons"
          headerAction={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Month Selector */}
              <div className="flex items-center bg-surface2 rounded-xl border border-line p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth({ year: 2026, month: 10, label: 'October 2026' });
                    notify('Switched to October 2026 attendance view');
                  }}
                  className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface cursor-pointer"
                  title="October 2026"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="px-2.5 text-[12px] font-semibold text-ink font-mono select-none">
                  {selectedMonth.label}
                </span>

                <button
                  type="button"
                  disabled={selectedMonth.month === 11}
                  onClick={() => {
                    setSelectedMonth({ year: 2026, month: 11, label: 'November 2026' });
                    notify('Switched to November 2026 attendance view');
                  }}
                  className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="November 2026"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-surface2 rounded-xl border border-line p-0.5 text-[12px]">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    historyViewMode === 'calendar'
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    historyViewMode === 'table'
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <TableIcon size={13} />
                  <span>Table Log</span>
                </button>
              </div>

              {/* Export CSV & Print */}
              <button
                type="button"
                onClick={handleExportPersonalCsv}
                className="p-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-muted hover:text-ink transition-colors cursor-pointer"
                title="Export Monthly CSV"
              >
                <Download size={14} />
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-muted hover:text-ink transition-colors cursor-pointer"
                title="Print History"
              >
                <Printer size={14} />
              </button>
            </div>
          }
        >
          {/* Filter Pills for Monthly Records */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 border-b border-line/50 mb-4 text-[11px] font-semibold no-scrollbar">
            {HISTORY_FILTER_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setHistoryFilter(pill)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer border ${
                  historyFilter === pill
                    ? 'bg-accent text-on-accent border-accent font-bold shadow-xs'
                    : 'bg-surface2/60 text-muted border-line hover:text-ink hover:bg-surface2'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Conditional View: 7-column Calendar Grid vs Tabular Daily Log */}
          {historyViewMode === 'calendar' ? (
            <HistoryCalendar
              days={monthDays}
              selectedDay={selectedCalendarDay}
              onSelectDay={setSelectedCalendarDay}
              onOpenRegularise={(dateStr, dateKey) => setRegDrawerTarget({ dateStr, dateKey })}
            />
          ) : (
            <HistoryTable
              records={filteredMonthRecords}
              onOpenRegularise={(dateStr, dateKey) => setRegDrawerTarget({ dateStr, dateKey })}
            />
          )}
        </Card>
      </div>

      {/* Apply Leave Drawer */}
      <Drawer
        isOpen={isApplyDrawerOpen}
        onClose={() => setIsApplyDrawerOpen(false)}
        title="Apply for Personal Leave"
        subtitle="Manager Leave Portal · Routed to Admin for Approval"
        width="480px"
      >
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-4 text-[13px]">
          <FormField label="Leave Type" id="myla-type" required>
            <select
              id="myla-type"
              value={applyForm.type}
              onChange={(e) => setApplyForm({ ...applyForm, type: e.target.value })}
              className="w-full bg-[#0a222b] text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="Privilege Leave">Privilege Leave (PL) — 14 days remaining</option>
              <option value="Casual Leave">Casual Leave (CL) — 6 days remaining</option>
              <option value="Sick Leave">Sick Leave (SL) — 8 days remaining</option>
              <option value="Comp-Off">Comp-Off — 2 days available</option>
              <option value="Paternity / Family Leave">Paternity / Family Leave</option>
            </select>
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase text-muted tracking-wider font-semibold">
              Duration Mode:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {['Full Day', 'Half Day'].map((mode) => (
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

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" id="myla-start" required>
              <input
                id="myla-start"
                type="date"
                value={applyForm.startDate}
                min="2026-11-01"
                max="2026-12-31"
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
                required
              />
            </FormField>

            <FormField label="End Date" id="myla-end" required>
              <input
                id="myla-end"
                type="date"
                value={applyForm.endDate}
                min={applyForm.startDate || '2026-11-01'}
                max="2026-12-31"
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
                required
              />
            </FormField>
          </div>

          <FormField label="Interim Acting Lead (Delegation during absence)" id="myla-lead" required>
            <select
              id="myla-lead"
              value={applyForm.interimLead}
              onChange={(e) => setApplyForm({ ...applyForm, interimLead: e.target.value })}
              className="w-full bg-[#0a222b] text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="Sneha Reddy">Sneha Reddy (Lead Engineer — Frontend Guild)</option>
              <option value="Aarav Mehta">Aarav Mehta (Senior Architect — Platform)</option>
              <option value="Rahul Verma">Rahul Verma (QA Lead — Quality Engineering)</option>
              <option value="Divya Menon">Divya Menon (Design Lead — Design System)</option>
            </select>
          </FormField>

          <FormField label="Reason for Leave" id="myla-reason" required>
            <Textarea
              id="myla-reason"
              rows={3}
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="e.g. Attending annual architecture summit and personal family vacation..."
              required
            />
          </FormField>

          <FormField label="Emergency Contact Phone" id="myla-phone">
            <input
              id="myla-phone"
              type="text"
              value={applyForm.emergencyContact}
              onChange={(e) => setApplyForm({ ...applyForm, emergencyContact: e.target.value })}
              className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
            />
          </FormField>

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

      {/* Regularisation Drawer for Punch Corrections */}
      <RegularisationDrawer
        isOpen={Boolean(regDrawerTarget)}
        onClose={() => setRegDrawerTarget(null)}
        initialDate={regDrawerTarget?.dateStr}
        initialDateKey={regDrawerTarget?.dateKey}
        onTriggerToast={notify}
      />
    </div>
  );
}
