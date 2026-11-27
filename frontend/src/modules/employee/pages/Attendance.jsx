// src/pages/Attendance.jsx
// Complete attendance module with live engine evaluation, history table/calendar, breaks management, and regularisation.

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Navigation,
  Compass,
  Radio,
  Building2,
  Crosshair,
  Coffee
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { KpiTile } from '../components/Kpi.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Progress } from '../components/Progress.jsx';
import { Table } from '../components/Table.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { BarChart } from '../components/Charts.jsx';
import { Calendar as MonthCalendar } from '../components/Calendar.jsx';
import { LocationMap } from '../components/LocationMap.jsx';
import { CheckOutDrawer } from '../components/CheckOutDrawer.jsx';
import { ATTENDANCE_RULES } from '../config/attendanceRules.js';
import { attendanceService } from '../services/attendanceService.js';
import { timeToMinutes, timeToSeconds } from '../utils/attendanceEngine.js';
import { formatDuration, formatDurationWithSeconds, formatTime12, formatDate } from '../utils/format.js';
import { formatCoordinates, formatDistance, getDeviceGPSLocation, openPunchInGoogleMaps } from '../utils/geo.js';
import { INITIAL_HOLIDAYS, INITIAL_LEAVE_REQUESTS } from '../data/employee.js';
import { MOCK_LEAVE_REQUESTS } from '../data/mockLeaves.js';

export function Attendance() {
  const {
    todayData,
    evaluation,
    activeBreak,
    nowDate,
    startBreak,
    endBreak,
    setWorkMode,
    updateTodayLocation
  } = useAttendance();

  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history' | 'breaks' | 'summary' | 'policy'
  const [historyView, setHistoryView] = useState('table'); // 'table' | 'calendar'
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);
  const [regularisations, setRegularisations] = useState([]);

  // Regularisation form drawer state
  const [regDrawerOpen, setRegDrawerOpen] = useState(false);
  const [regDate, setRegDate] = useState('2026-11-04');
  const [regIssueType, setRegIssueType] = useState('Biometric Scanner Failure');
  const [regCheckIn, setRegCheckIn] = useState('09:30:00');
  const [regCheckOut, setRegCheckOut] = useState('18:30:00');
  const [regReason, setRegReason] = useState('');
  const [regError, setRegError] = useState('');

  // Work mode modal/select state
  const [workMode, setLocalWorkMode] = useState(todayData?.workMode || 'Office');
  const [workModeNote, setLocalWorkModeNote] = useState(todayData?.workModeNote || '');

  // GPS Location mapping state
  const [selectedHistoryLocation, setSelectedHistoryLocation] = useState(null);
  const [isCalibratingGPS, setIsCalibratingGPS] = useState(false);
  const [checkOutDrawerOpen, setCheckOutDrawerOpen] = useState(false);

  const handleRecalibrateGPS = async () => {
    setIsCalibratingGPS(true);
    try {
      const loc = await getDeviceGPSLocation({ workMode });
      await updateTodayLocation(loc);
      showToast(
        loc.isSimulated
          ? `Fallback GPS set (${formatCoordinates(loc.latitude, loc.longitude)}). Allow browser Location access for exact device GPS.`
          : `Exact GPS updated: ${formatCoordinates(loc.latitude, loc.longitude)} (±${loc.accuracy}m)`
      );
    } catch (err) {
      showToast('Could not recalibrate GPS: ' + err.message);
    } finally {
      setIsCalibratingGPS(false);
    }
  };

  useEffect(() => {
    attendanceService.getHistory().then(setHistoryData);
    attendanceService.getRegularisations().then(setRegularisations);
  }, [todayData]);

  const handleWorkModeChange = async (mode) => {
    setLocalWorkMode(mode);
    await setWorkMode(mode, workModeNote);
    // Re-capture GPS if today's punch currently holds simulated fallback coords from another mode
    if (todayData?.checkInLocation?.isSimulated) {
      const refreshed = await getDeviceGPSLocation({ workMode: mode });
      await updateTodayLocation(refreshed);
    }
    showToast(`Work mode set to ${mode}`);
  };

  const handleExportCSV = () => {
    const headers = 'Date,Check-In,Check-Out,Break Duration,Gross Hours,Net Hours,Work Mode,Status,Flags,Check-Out Reason\n';
    const rows = historyData.map(h => 
      `${h.date},${h.checkIn ? formatTime12(h.checkIn) : '--:--:--'},${h.checkOut ? formatTime12(h.checkOut) : '--:--:--'},${h.evaluation.breakSeconds ? formatDurationWithSeconds(h.evaluation.breakSeconds) : '--'},${h.evaluation.grossSeconds ? formatDurationWithSeconds(h.evaluation.grossSeconds) : '--'},${formatDurationWithSeconds(h.evaluation.netSeconds)},${h.workMode || 'Office'},${h.evaluation.label},"${h.evaluation.flags.join('; ')}","${(h.earlyCheckOutReason || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFileName = (user?.name || 'Aarav Mehta').trim().replace(/\s+/g, '_');
    link.download = `Attendance_History_${safeFileName}_Nov2026.csv`;
    link.click();
    showToast('Exported attendance history CSV');
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regReason.trim().length < 10) {
      setRegError('Reason must be at least 10 characters long.');
      return;
    }

    try {
      const newReq = await attendanceService.submitRegularisation({
        date: regDate,
        issueType: regIssueType,
        correctedCheckIn: regCheckIn,
        correctedCheckOut: regCheckOut,
        reason: regReason
      });

      setRegularisations(prev => [newReq, ...prev]);
      setRegDrawerOpen(false);
      setRegReason('');
      showToast(`Regularisation request ${newReq.id} submitted to Priya Nair.`, {
        undoLabel: 'Withdraw',
        onUndo: async () => {
          await attendanceService.withdrawRegularisation(newReq.id);
          setRegularisations(prev => prev.filter(r => r.id !== newReq.id));
          showToast(`Withdrew request ${newReq.id}`);
        }
      });
    } catch (err) {
      setRegError(err.message || 'Submission failed');
    }
  };

  // Filter history rows
  const filteredHistory = historyData.filter(h => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'late') return h.evaluation.isLate;
    if (historyFilter === 'early') return h.evaluation.isEarly;
    if (historyFilter === 'short') return h.evaluation.status === 'half_day';
    if (historyFilter === 'absent') return h.evaluation.status === 'absent';
    if (historyFilter === 'leave') return h.evaluation.status === 'leave';
    if (historyFilter === 'reg') return h.evaluation.flags.includes('REGULARISATION_REQUIRED');
    return true;
  });

  // Daily hours bar chart data (last 7 recorded days)
  const chartData = historyData.slice(0, 10).reverse().map(h => ({
    label: formatDate(h.date).split(' ').slice(0, 2).join(' '),
    hours: parseFloat((h.evaluation.netMinutes / 60).toFixed(1))
  }));

  // Today breaks calculations (including live active break ticking in seconds)
  const todayBreaks = todayData?.breaks || [];
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const nowSeconds = nowMinutes * 60 + nowDate.getSeconds();

  const getBreakItemDuration = (b) => {
    if (b.start && !b.end) {
      const s = timeToMinutes(b.start);
      return s !== null && nowMinutes >= s ? nowMinutes - s : 0;
    }
    if (b.duration) return b.duration;
    if (b.start && b.end) {
      const s = timeToMinutes(b.start);
      const e = timeToMinutes(b.end);
      return e >= s ? e - s : 0;
    }
    return 0;
  };

  const getBreakItemDurationSeconds = (b) => {
    if (b.start && !b.end) {
      const s = timeToSeconds(b.start);
      return s !== null && nowSeconds >= s ? nowSeconds - s : 0;
    }
    if (typeof b.durationSeconds === 'number' && b.end) return b.durationSeconds;
    if (b.start && b.end) {
      const s = timeToSeconds(b.start);
      const e = timeToSeconds(b.end);
      return e >= s ? e - s : 0;
    }
    if (b.duration) return b.duration * 60;
    return 0;
  };

  const totalBreakMins = todayBreaks.reduce((sum, b) => sum + getBreakItemDuration(b), 0);
  const totalBreakSeconds = todayBreaks.reduce((sum, b) => sum + getBreakItemDurationSeconds(b), 0);
  const activeBreakElapsed = activeBreak ? getBreakItemDuration(activeBreak) : 0;
  const activeBreakElapsedSeconds = activeBreak ? getBreakItemDurationSeconds(activeBreak) : 0;

  // Monthly break metrics for summary
  const workDaysWithBreak = historyData.filter(h => h.type === 'work' && h.evaluation?.breakMinutes > 0);
  const totalMonthBreakMinutes = workDaysWithBreak.reduce((sum, h) => sum + (h.evaluation?.breakMinutes || 0), 0);
  const totalMonthBreakSeconds = workDaysWithBreak.reduce(
    (sum, h) => sum + (h.evaluation?.breakSeconds ?? (h.evaluation?.breakMinutes || 0) * 60),
    0
  );
  const avgBreakMinutes = workDaysWithBreak.length > 0
    ? Math.round(totalMonthBreakMinutes / workDaysWithBreak.length)
    : 60;
  const avgBreakSeconds = workDaysWithBreak.length > 0
    ? Math.round(totalMonthBreakSeconds / workDaysWithBreak.length)
    : 3600;

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-line/40 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface2/60 border border-line">
          {[
            { id: 'today', label: "Today's Punch" },
            { id: 'breaks', label: `Breaks (${todayBreaks.length})` },
            { id: 'summary', label: 'Month Summary' },
            { id: 'history', label: 'History & Logs' },
            { id: 'policy', label: 'Rules & Policy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-[12px] font-medium rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-on-accent font-semibold shadow-sm'
                  : 'text-muted hover:text-ink hover:bg-surface2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SecondaryButton
            size="sm"
            onClick={() => setRegDrawerOpen(true)}
            className="text-accent border-accent/40"
          >
            <Plus className="w-3.5 h-3.5" /> Request Regularisation
          </SecondaryButton>
        </div>
      </div>

      {/* TAB 1: TODAY'S PUNCH */}
      {activeTab === 'today' && (
        <div className="module-grid">
          {/* Main Today Punch Card (col-span-full) */}
          <div className="col-span-full glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-line/40 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted block font-mono">
                  ACTIVE SHIFT · GENERAL (9:30 AM – 6:30 PM IST)
                </span>
                <h2 className="font-display font-bold text-2xl text-ink mt-0.5">
                  {formatDate(nowDate, { includeWeekday: true })}
                </h2>
              </div>

              {/* Work Mode Selector */}
              <div className="flex items-center gap-2 bg-surface2/70 p-1.5 rounded-tpl border border-line">
                <span className="text-[12px] text-muted px-2 font-medium">Mode:</span>
                {ATTENDANCE_RULES.workModes.map(m => (
                  <button
                    key={m}
                    onClick={() => handleWorkModeChange(m)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                      workMode === m
                        ? 'bg-accent text-on-accent font-semibold shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Clock & Working Hours Hero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-tpl bg-surface2/40 border border-line">
              <div className="space-y-1">
                <span className="text-[12px] text-muted block">Live System Time</span>
                <div className="font-display font-bold text-3xl text-ink tabular-nums tracking-tight">
                  {formatTime12(nowDate)}
                </div>
                <span className="text-[11px] text-muted/80 font-mono">
                  Device synchronized · IST
                </span>
              </div>

              <div className="space-y-1 text-center md:border-x md:border-line/40 px-4">
                <span className="text-[12px] text-muted block">
                  {activeBreak ? 'Net Working Hours Today (Paused)' : 'Net Working Hours Today'}
                </span>
                <div className={`font-display font-bold text-3xl lg:text-4xl font-mono tabular-nums tracking-tight ${activeBreak ? 'text-warn' : 'text-accent'}`}>
                  {formatDurationWithSeconds(evaluation.netSeconds)}
                </div>
                <StatusPill status={evaluation.statusColor} label={evaluation.label} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">Target (8h)</span>
                  <span className="text-ink font-mono font-medium">
                    {Math.min(100, Math.round((evaluation.netMinutes / 480) * 100))}%
                  </span>
                </div>
                <Progress
                  value={evaluation.netMinutes}
                  max={480}
                  height={10}
                  variant={evaluation.netMinutes >= 480 ? 'good' : 'accent'}
                />
                <div className="flex justify-between text-[11px] text-muted font-mono">
                  <span>In: {todayData?.checkIn ? formatTime12(todayData.checkIn) : '--:--:--'}</span>
                  <span>Out: {todayData?.checkOut ? formatTime12(todayData.checkOut) : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Detailed Hours Breakdown Strip: Check-in, Gross, Break Duration, Net */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-tpl bg-surface2/30 border border-line flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">Check-In</span>
                <span className="font-mono text-ink text-[15px] font-bold tabular-nums">
                  {todayData?.checkIn ? formatTime12(todayData.checkIn) : '--:--:--'}
                </span>
                <span className="text-[11px] text-muted">{todayData?.workMode || 'Office'}</span>
              </div>

              <div className="p-3.5 rounded-tpl bg-surface2/30 border border-line flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">Gross Hours</span>
                <span className="font-mono text-ink text-[15px] font-bold tabular-nums">
                  {formatDurationWithSeconds(evaluation.grossSeconds)}
                </span>
                <span className="text-[11px] text-muted">Elapsed shift window</span>
              </div>

              <div
                onClick={() => setActiveTab('breaks')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab('breaks')}
                className={`p-3.5 rounded-tpl border flex flex-col gap-0.5 cursor-pointer transition-colors ${
                  activeBreak
                    ? 'bg-warn/10 border-warn/50'
                    : 'bg-surface2/30 border-line hover:border-accent/50'
                }`}
                title="Click to manage breaks"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-warn" /> Break Duration
                  </span>
                  {activeBreak && (
                    <span className="w-2 h-2 rounded-full bg-warn animate-pulse" title="Break Active" />
                  )}
                </div>
                <span className={`font-mono text-[15px] font-bold tabular-nums ${activeBreak ? 'text-warn' : 'text-ink'}`}>
                  {formatDurationWithSeconds(totalBreakSeconds)}
                </span>
                <span className="text-[11px] text-muted font-mono tabular-nums">
                  {activeBreak
                    ? `${activeBreak.type}: ${formatDurationWithSeconds(activeBreakElapsedSeconds)} live`
                    : `${formatDurationWithSeconds(totalBreakSeconds)} / 1h 00m 00s (${todayBreaks.length})`}
                </span>
              </div>

              <div className="p-3.5 rounded-tpl bg-surface2/30 border border-line flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                  {activeBreak ? 'Net Working (Paused)' : 'Net Working'}
                </span>
                <span className={`font-mono text-[15px] font-bold tabular-nums ${activeBreak ? 'text-warn' : 'text-accent'}`}>
                  {formatDurationWithSeconds(evaluation.netSeconds)}
                </span>
                <span className="text-[11px] text-muted">
                  {activeBreak
                    ? 'Timer paused until break ends'
                    : evaluation.flags?.includes('AUTO_BREAK_DEDUCTED')
                    ? '60m auto-deducted'
                    : 'Gross minus breaks'}
                </span>
              </div>
            </div>

            {/* Action Buttons Strip */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              {!todayData?.checkIn ? (
                <div className="w-full py-3 px-4 bg-surface2/40 border border-line rounded-tpl text-muted text-xs font-mono">
                  Ready for General Shift ({workMode}) · Use <strong className="text-ink">Check in</strong> in the top header bar to record shift start &amp; GPS.
                </div>
              ) : !todayData?.checkOut ? (
                <>
                  {activeBreak ? (
                    <SecondaryButton
                      onClick={endBreak}
                      className="flex-1 py-3 text-sm text-warn border-warn/40 bg-warn/10 font-mono tabular-nums"
                    >
                      End Break ({activeBreak.type} · {formatDurationWithSeconds(activeBreakElapsedSeconds)} active)
                    </SecondaryButton>
                  ) : (
                    <SecondaryButton
                      onClick={() => startBreak('Lunch')}
                      className="flex-1 py-3 text-sm"
                    >
                      Start Lunch Break
                    </SecondaryButton>
                  )}
                  <PrimaryButton onClick={() => setCheckOutDrawerOpen(true)} className="flex-1 py-3 text-sm">
                    Check Out Today
                  </PrimaryButton>
                </>
              ) : (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 bg-surface2/40 border border-line rounded-tpl text-muted text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="block">✓ Checked out at {formatTime12(todayData.checkOut)}. 1 check-in/day policy completed (re-check-in locked today).</span>
                    {todayData.earlyCheckOutReason && (
                      <span className="block text-warn font-sans text-[11px]">
                        Early Check-Out Reason: <strong className="text-ink">{todayData.earlyCheckOutReason}</strong>
                      </span>
                    )}
                  </div>
                  <SecondaryButton
                    onClick={() => {
                      setRegIssueType('Accidental Check-Out');
                      setRegDate(todayData?.date || '2026-11-06');
                      setRegCheckIn(todayData?.checkIn || '09:30:00');
                      setRegCheckOut('18:30:00');
                      setRegDrawerOpen(true);
                    }}
                    size="sm"
                  >
                    Regularise Accidental Check-Out
                  </SecondaryButton>
                </div>
              )}
            </div>

            {/* Alerts & Policy Strip */}
            {evaluation.isLate && (
              <div className="p-3.5 rounded-tpl bg-warn/10 border border-warn/40 text-warn text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Late check-in recorded (after 9:45 AM grace). This is your 1st late mark for November (3 free per month).
                </span>
              </div>
            )}

            {/* Punch Timeline SVG */}
            <div className="pt-4 border-t border-line/40 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[12px] font-semibold text-muted block uppercase tracking-wider font-mono">
                  Today's Timeline (09:00 to 19:00)
                </span>
                <span className="text-[11px] font-mono text-warn font-medium tabular-nums">
                  Breaks: {todayBreaks.length} · Total Break Duration: {formatDurationWithSeconds(totalBreakSeconds)}
                </span>
              </div>
              <div className="h-6 w-full rounded-full bg-surface2 border border-line relative overflow-hidden flex items-center">
                {/* Checkin marker */}
                {todayData?.checkIn && (
                  <div
                    style={{ left: '10%' }}
                    className="absolute h-full w-2 bg-good rounded-sm"
                    title={`Check-in: ${formatTime12(todayData.checkIn)}`}
                  />
                )}
                {/* Break marker */}
                {todayBreaks.map((b, idx) => {
                  const durSec = getBreakItemDurationSeconds(b);
                  return (
                    <div
                      key={idx}
                      style={{ left: `${30 + idx * 15}%`, width: '8%' }}
                      className="absolute h-full bg-warn/80 rounded-sm"
                      title={`Break: ${b.type} (${formatDurationWithSeconds(durSec)} · ${formatTime12(b.start)}–${b.end ? formatTime12(b.end) : 'Active'})`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>09:00 AM</span>
                <span>12:00 PM</span>
                <span>03:00 PM</span>
                <span>06:30 PM (End)</span>
              </div>
            </div>
          </div>

          {/* PUNCH GPS LOCATION & GEOFENCE MAPPING CARD */}
          <div className="col-span-full glass-card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-line/40 pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  GPS Check-In & Check-Out Location Mapping
                </h3>
                <p className="text-muted text-xs">
                  Real-time device coordinates verified against the Hyderabad 300m campus geofence
                </p>
              </div>

              <div className="flex items-center gap-2">
                <SecondaryButton
                  size="sm"
                  onClick={handleRecalibrateGPS}
                  disabled={isCalibratingGPS}
                >
                  <Crosshair className={`w-3.5 h-3.5 text-accent ${isCalibratingGPS ? 'animate-spin' : ''}`} />
                  {isCalibratingGPS ? 'Calibrating...' : 'Recalibrate GPS'}
                </SecondaryButton>
              </div>
            </div>

            {/* Check-In and Check-Out Location Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check In Location Box */}
              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-ink text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-good" /> Check-In GPS Location
                  </span>
                  {todayData?.checkInLocation && (
                    <Tag color={todayData.checkInLocation.inGeofence ? 'good' : 'warn'}>
                      {todayData.checkInLocation.inGeofence ? 'Campus Geofenced' : 'Remote Geotag'}
                    </Tag>
                  )}
                </div>

                {todayData?.checkInLocation ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-mono text-ink text-sm font-semibold">
                      {formatCoordinates(todayData.checkInLocation.latitude, todayData.checkInLocation.longitude)}
                    </div>
                    <p className="text-muted text-[11px] truncate">
                      {todayData.checkInLocation.address}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/30 font-mono">
                      <span>Punched: {formatTime12(todayData.checkIn)}</span>
                      <span>Distance: {formatDistance(todayData.checkInLocation.distanceMeters)} from Tower B</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-xs py-2">
                    Not checked in yet. GPS location will be captured automatically upon check-in.
                  </p>
                )}
              </div>

              {/* Check Out Location Box */}
              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-ink text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent2" /> Check-Out GPS Location
                  </span>
                  {todayData?.checkOutLocation && (
                    <Tag color={todayData.checkOutLocation.inGeofence ? 'good' : 'warn'}>
                      {todayData.checkOutLocation.inGeofence ? 'Campus Geofenced' : 'Remote Geotag'}
                    </Tag>
                  )}
                </div>

                {todayData?.checkOutLocation ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-mono text-ink text-sm font-semibold">
                      {formatCoordinates(todayData.checkOutLocation.latitude, todayData.checkOutLocation.longitude)}
                    </div>
                    <p className="text-muted text-[11px] truncate">
                      {todayData.checkOutLocation.address}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/30 font-mono">
                      <span>Punched: {formatTime12(todayData.checkOut)}</span>
                      <span>Distance: {formatDistance(todayData.checkOutLocation.distanceMeters)} from Tower B</span>
                    </div>
                    {todayData.earlyCheckOutReason && (
                      <p className="text-[11px] text-warn/90 pt-1">
                        Early Reason: <span className="text-ink">{todayData.earlyCheckOutReason}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted text-xs py-2">
                    {todayData?.checkIn ? 'Currently on site / Active shift. Check-out GPS recorded upon departure.' : 'Awaiting check-in.'}
                  </p>
                )}
              </div>
            </div>

            {/* Embedded Interactive Google Maps Geofence View */}
            <LocationMap
              checkInLocation={todayData?.checkInLocation}
              checkOutLocation={todayData?.checkOutLocation}
              checkInTime={todayData?.checkIn}
              checkOutTime={todayData?.checkOut}
              workMode={todayData?.workMode}
              height={300}
            />
          </div>
        </div>
      )}

      {/* TAB 2: BREAKS */}
      {activeTab === 'breaks' && (
        <div className="module-grid">
          <Card
            title="Today's Recorded Breaks"
            subtext="Policy: 60 min standard allowance (max 75 min)"
            className="col-span-full"
            action={
              activeBreak ? (
                <SecondaryButton
                  size="sm"
                  onClick={endBreak}
                  className="text-warn border-warn/40 bg-warn/10 font-mono tabular-nums"
                >
                  End {activeBreak.type} Break ({formatDurationWithSeconds(activeBreakElapsedSeconds)})
                </SecondaryButton>
              ) : (
                <div className="flex items-center gap-2">
                  <SecondaryButton
                    size="sm"
                    onClick={() => startBreak('Tea')}
                    disabled={!todayData?.checkIn || !!todayData?.checkOut}
                  >
                    + Tea Break
                  </SecondaryButton>
                  <PrimaryButton
                    size="sm"
                    onClick={() => startBreak('Lunch')}
                    disabled={!todayData?.checkIn || !!todayData?.checkOut}
                  >
                    + Lunch Break
                  </PrimaryButton>
                </div>
              )
            }
          >
            <div className="space-y-4">
              {/* Break Duration Summary Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block">
                    Total Break Duration
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`font-display font-bold text-xl font-mono tabular-nums ${totalBreakMins > 75 ? 'text-bad' : activeBreak ? 'text-warn' : 'text-ink'}`}>
                      {formatDurationWithSeconds(totalBreakSeconds)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block">
                    Allowance Remaining
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`font-display font-bold text-xl font-mono tabular-nums ${totalBreakSeconds > 3600 ? 'text-warn' : 'text-good'}`}>
                      {totalBreakSeconds > 3600 ? '0h 00m 00s' : formatDurationWithSeconds(3600 - totalBreakSeconds)}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      {totalBreakSeconds > 3600 ? `(+${formatDurationWithSeconds(totalBreakSeconds - 3600)} over)` : 'of 1h 00m 00s'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block">
                    Break Sessions
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display font-bold text-xl text-ink">
                      {todayBreaks.length}
                    </span>
                    <span className="text-xs text-muted font-mono tabular-nums">
                      {activeBreak ? `${activeBreak.type}: ${formatDurationWithSeconds(activeBreakElapsedSeconds)}` : 'Completed today'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allowance Bar */}
              <div className="p-4 rounded-tpl bg-surface2/50 border border-line space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">Total Break Duration Taken Today</span>
                  <span className="font-mono text-ink font-semibold tabular-nums">
                    {formatDurationWithSeconds(totalBreakSeconds)} of 1h 00m 00s
                  </span>
                </div>
                <Progress
                  value={totalBreakSeconds}
                  max={3600}
                  height={8}
                  variant={totalBreakMins > 75 ? 'bad' : totalBreakMins > 60 ? 'warn' : 'accent'}
                />
                {totalBreakMins > 75 && (
                  <span className="text-[11px] text-bad block font-medium">
                    ⚠️ Break duration exceeded allowable limit (75 min).
                  </span>
                )}
              </div>

              {/* Breaks List */}
              <div className="space-y-2">
                {todayBreaks.length === 0 ? (
                  <p className="py-6 text-center text-muted text-[13px]">
                    No breaks recorded yet today. If no breaks are logged by end of shift, 60 min mandatory lunch is auto-deducted.
                  </p>
                ) : (
                  todayBreaks.map((b, idx) => {
                    const durSec = getBreakItemDurationSeconds(b);
                    const isActive = !b.end;
                    return (
                      <div
                        key={b.id || idx}
                        className={`p-3.5 rounded-tpl border flex items-center justify-between text-[13px] ${
                          isActive ? 'border-warn/50 bg-warn/10' : 'border-line bg-surface2/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <Tag color={b.type === 'Lunch' ? 'accent' : 'warn'}>{b.type}</Tag>
                          <span className="font-medium text-ink font-mono tabular-nums">
                            {formatTime12(b.start)} – {b.end ? formatTime12(b.end) : 'In progress'}
                          </span>
                          {isActive && (
                            <span className="text-[11px] text-warn font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
                              Active now
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className={`font-semibold text-[13px] ${isActive ? 'text-warn' : 'text-ink'}`}>
                            {formatDurationWithSeconds(durSec)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Recent Break Duration Logs across last working days */}
          <Card
            title="Recent Break Duration Logs"
            subtext="Break duration history across your recent working days"
            className="col-span-full"
          >
            <div className="space-y-2">
              {historyData
                .filter(h => h.type === 'work' && h.checkIn)
                .slice(0, 7)
                .map((h) => {
                  const breakSec = h.evaluation?.breakSeconds ?? ((h.evaluation?.breakMinutes || 0) * 60);
                  const isAuto = h.evaluation?.flags?.includes('AUTO_BREAK_DEDUCTED');
                  const isExceeded = h.evaluation?.flags?.includes('BREAK_EXCEEDED');
                  const slotLabels = Array.isArray(h.breaks) && h.breaks.length > 0
                    ? h.breaks.map(b => `${b.type || 'Lunch'}: ${formatTime12(b.start)} – ${formatTime12(b.end)}`).join(' · ')
                    : 'No manual punches (60m mandatory deduction)';

                  return (
                    <div
                      key={h.date}
                      className="p-3 rounded-tpl bg-surface2/25 border border-line/60 flex items-center justify-between gap-3 flex-wrap text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-ink block">
                          {formatDate(h.date, { includeWeekday: true })}
                        </span>
                        <span className="text-muted text-[11px] font-mono block tabular-nums">
                          {slotLabels}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className={`font-semibold text-sm ${isExceeded ? 'text-bad' : 'text-ink'}`}>
                          {formatDurationWithSeconds(breakSec)}
                        </span>
                        <Tag color={isExceeded ? 'bad' : isAuto ? 'info' : 'good'}>
                          {isExceeded ? 'Exceeded' : isAuto ? 'Auto 60m' : 'Within Policy'}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: MONTH SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[var(--gap)]">
            <KpiTile label="Present Days" value="16" delta="On track" isPositive={true} subtext="out of 22" />
            <KpiTile label="Absent Days" value="0" delta="0.0%" isPositive={true} subtext="perfect rate" />
            <KpiTile label="Late Marks" value="1 / 3" delta="2 free left" isPositive={true} subtext="Nov 3 (09:52:40 AM)" />
            <KpiTile
              label="Avg Break / Day"
              value={
                <span className="inline-flex flex-wrap items-baseline gap-x-1 leading-tight">
                  <span>{Math.floor(avgBreakSeconds / 60)}m</span>
                  <span className="text-[13px] text-muted font-mono">{String(avgBreakSeconds % 60).padStart(2, '0')}s</span>
                </span>
              }
              delta={formatDurationWithSeconds(totalMonthBreakSeconds)}
              isPositive={avgBreakMinutes <= 60}
              subtext="60m std allowance"
            />
            <KpiTile label="Short Hours" value="0" delta="None" isPositive={true} subtext="min 4.5h met" />
            <KpiTile
              label="Overtime"
              value={
                <span className="inline-flex flex-wrap items-baseline gap-x-1 leading-tight">
                  <span>2h 30m</span>
                  <span className="text-[13px] text-muted font-mono">00s</span>
                </span>
              }
              delta="+2h 30m 00s logged"
              subtext="informational"
            />
            <KpiTile label="Regularised" value="1" delta="Approved" subtext="REG-2026-041" />
          </div>

          <Card
            title="Daily Working Hours Trend"
            subtext="Target goal is 8 hours net per business day"
            className="col-span-full"
          >
            <BarChart data={chartData} targetLine={8} height={170} />
          </Card>
        </div>
      )}

      {/* TAB 4: HISTORY & LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar & View Toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'all', label: 'All Days' },
                { id: 'late', label: 'Late' },
                { id: 'early', label: 'Early' },
                { id: 'short', label: 'Short Hours' },
                { id: 'absent', label: 'Absent' },
                { id: 'leave', label: 'Leave' },
                { id: 'reg', label: 'Needs Regularisation' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id)}
                  className={`px-2.5 py-1 rounded-full border transition-all ${
                    historyFilter === f.id
                      ? 'bg-accent text-on-accent border-accent font-semibold'
                      : 'border-line text-muted hover:text-ink bg-surface2/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-line bg-surface2/60 p-0.5 text-[11px]">
                <button
                  onClick={() => setHistoryView('table')}
                  className={`px-3 py-1 rounded-full font-medium ${
                    historyView === 'table' ? 'bg-accent text-on-accent' : 'text-muted'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setHistoryView('calendar')}
                  className={`px-3 py-1 rounded-full font-medium ${
                    historyView === 'calendar' ? 'bg-accent text-on-accent' : 'text-muted'
                  }`}
                >
                  Calendar
                </button>
              </div>

              <SecondaryButton size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
              </SecondaryButton>
            </div>
          </div>

          {/* Table View */}
          {historyView === 'table' ? (
            <Card title="Attendance Record · November 2026">
              <Table
                keyField="date"
                columns={[
                  {
                    header: 'Date',
                    key: 'date',
                    render: (d) => (
                      <span className="font-semibold text-ink whitespace-nowrap">
                        {formatDate(d, { includeWeekday: true })}
                      </span>
                    )
                  },
                  {
                    header: 'Check-In',
                    key: 'checkIn',
                    render: (val, row) => (
                      <div className="flex items-center gap-2 font-mono tabular-nums whitespace-nowrap">
                        <span>{val ? formatTime12(val) : '--:--:--'}</span>
                        {row.evaluation.isLate && <Tag color="warn">Late</Tag>}
                      </div>
                    )
                  },
                  {
                    header: 'Check-Out',
                    key: 'checkOut',
                    render: (val, row) => (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 font-mono tabular-nums whitespace-nowrap">
                          <span>{val ? formatTime12(val) : '--:--:--'}</span>
                          {row.evaluation.isEarly && <Tag color="warn">Early</Tag>}
                        </div>
                        {row.earlyCheckOutReason && (
                          <span
                            className="text-[10px] text-muted truncate max-w-[165px]"
                            title={`Early Check-Out Reason: ${row.earlyCheckOutReason}`}
                          >
                            Reason: {row.earlyCheckOutReason}
                          </span>
                        )}
                      </div>
                    )
                  },
                  {
                    header: 'Break Duration',
                    key: 'breaks',
                    render: (breaksList, row) => {
                      if (row.type === 'holiday' || row.type === 'weekly_off' || row.type === 'leave' || !row.checkIn) {
                        return <span className="text-muted text-xs">--</span>;
                      }
                      const breakSec = row.evaluation?.breakSeconds ?? ((row.evaluation?.breakMinutes ?? 0) * 60);
                      const isAuto = row.evaluation?.flags?.includes('AUTO_BREAK_DEDUCTED');
                      const isExceeded = row.evaluation?.flags?.includes('BREAK_EXCEEDED');
                      const breakSlots = Array.isArray(breaksList) && breaksList.length > 0
                        ? breaksList.map(b => `${formatTime12(b.start)}–${b.end ? formatTime12(b.end) : 'Active'}`).join(', ')
                        : null;

                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums whitespace-nowrap">
                            <span className={`font-medium ${isExceeded ? 'text-bad' : 'text-ink'}`}>
                              {formatDurationWithSeconds(breakSec)}
                            </span>
                            {isAuto && <Tag color="info">Auto</Tag>}
                            {isExceeded && <Tag color="bad">&gt;75m</Tag>}
                          </div>
                          {breakSlots && (
                            <span className="text-[10px] text-muted/80 font-mono truncate max-w-[175px]" title={breakSlots}>
                              {breakSlots}
                            </span>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    header: 'Net Hours',
                    key: 'evaluation',
                    render: (ev) => (
                      <span className="font-mono font-medium tabular-nums whitespace-nowrap">
                        {formatDurationWithSeconds(ev.netSeconds ?? (ev.netMinutes * 60))}
                      </span>
                    )
                  },
                  {
                    header: 'Work Mode',
                    key: 'workMode',
                    render: (mode) => <Tag>{mode || 'Office'}</Tag>
                  },
                  {
                    header: 'GPS Location',
                    key: 'checkInLocation',
                    render: (loc, row) => {
                      if (!row.checkIn) return <span className="text-muted text-xs">--</span>;
                      const mode = row.workMode || 'Office';
                      const isRemoteMode = mode === 'Remote' || mode === 'Work from home';
                      const hasGeofence = loc?.inGeofence ?? (mode === 'Office');
                      const tagColor = isRemoteMode ? 'info' : hasGeofence ? 'good' : 'warn';
                      const tagLabel =
                        mode === 'Remote'
                          ? 'Remote GPS'
                          : mode === 'Work from home'
                            ? 'WFH GPS'
                            : hasGeofence
                              ? 'Campus GPS'
                              : 'Outside Zone';
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Tag color={tagColor}>{tagLabel}</Tag>
                            <button
                              type="button"
                              onClick={() => {
                                openPunchInGoogleMaps(row.checkInLocation, row.checkOutLocation);
                                setSelectedHistoryLocation(row);
                              }}
                              className="text-accent hover:underline text-xs flex items-center gap-1 font-semibold"
                              title="Open exact location in Google Maps & view GPS details"
                            >
                              <Compass className="w-3 h-3" /> Map
                            </button>
                          </div>
                          {loc && (
                            <span className="text-[10px] text-muted font-mono whitespace-nowrap">
                              In: {formatCoordinates(loc.latitude, loc.longitude)}
                            </span>
                          )}
                          {row.checkOutLocation && (
                            <span className="text-[10px] text-muted font-mono whitespace-nowrap">
                              Out: {formatCoordinates(row.checkOutLocation.latitude, row.checkOutLocation.longitude)}
                            </span>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    header: 'Status',
                    key: 'status',
                    render: (_, row) => (
                      <StatusPill status={row.evaluation.statusColor} label={row.evaluation.label} />
                    )
                  }
                ]}
                data={filteredHistory}
              />
            </Card>
          ) : (
            <Card
              title="Attendance & Leave Calendar"
              subtext="Navigate across months to inspect daily attendance, holidays, leaves, reasons, and approvers"
            >
              <MonthCalendar
                year={2026}
                month={10}
                holidays={INITIAL_HOLIDAYS}
                leaveEntries={MOCK_LEAVE_REQUESTS || INITIAL_LEAVE_REQUESTS}
              />
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: RULES & POLICY */}
      {activeTab === 'policy' && (
        <div className="module-grid">
          <Card
            title="HRMS Attendance Policy & Rules"
            subtext="Configurable example rules, to be validated by HR"
            className="col-span-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2">
                <h3 className="font-display font-bold text-ink">Shift & Grace Rules</h3>
                <p className="text-muted leading-relaxed">
                  • <strong>General Shift:</strong> 9:30 AM to 6:30 PM (9.0 hour window).<br />
                  • <strong>One Check-In Per Day Policy:</strong> Only 1 check-in is allowed per day. Once checked out, you cannot check in again on the same day; submit Regularisation if checked out accidentally.<br />
                  • <strong>Grace Period:</strong> 15 minutes. Check-in between 9:31 AM and 9:45 AM is allowed. Punch after 9:45 AM is marked <em>Late</em>.<br />
                  • <strong>Free Late Marks:</strong> 3 free occurrences per calendar month. Starting from the 4th, an informational warning banner is displayed.
                </p>
              </div>

              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2">
                <h3 className="font-display font-bold text-ink">Work Hours Thresholds</h3>
                <p className="text-muted leading-relaxed">
                  • <strong>Full Day (Present):</strong> Net working hours ≥ 8h 00m.<br />
                  • <strong>Half Day / Short:</strong> Net working hours between 4h 30m and 8h 00m.<br />
                  • <strong>Absent:</strong> Net hours &lt; 4h 30m or missing punches without approved leave.
                </p>
              </div>

              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2">
                <h3 className="font-display font-bold text-ink">Mandatory Breaks & Overtime</h3>
                <p className="text-muted leading-relaxed">
                  • <strong>Breaks:</strong> Standard allowance is 60 minutes. If no break is recorded, 60 minutes are auto-deducted. Breaks exceeding 75 minutes are flagged.<br />
                  • <strong>Overtime:</strong> Net hours exceeding 9 hours in a single business day are logged as overtime.
                </p>
              </div>

              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2">
                <h3 className="font-display font-bold text-ink">Regularisation Guidelines</h3>
                <p className="text-muted leading-relaxed">
                  • Requests must be submitted within <strong>3 calendar days</strong> of the incident.<br />
                  • Maximum of <strong>3 regularisation requests</strong> permitted per employee per month.<br />
                  • Approvals are reviewed directly by reporting manager Priya Nair.
                </p>
              </div>

              <div className="p-4 rounded-tpl bg-surface2/30 border border-line space-y-2 col-span-1 md:col-span-2">
                <h3 className="font-display font-bold text-ink flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  GPS Geofencing & Worksite Location Policy
                </h3>
                <p className="text-muted leading-relaxed">
                  • <strong>Campus Geofence:</strong> Hyderabad Engineering Hub (Tower B, Level 4) at <code>17.4435° N, 78.3772° E</code> with a calibrated 300-meter radial perimeter.<br />
                  • <strong>Office Verification:</strong> Check-in and check-out punches captured within the 300m radius automatically verify physical presence in office without requiring secondary manual regularisation.<br />
                  • <strong>Remote & WFH Tracking:</strong> Punches initiated outside the 300m perimeter are logged with device GPS coordinates and tagged as <em>Remote GPS</em>, requiring a work mode note.<br />
                  • <strong>Data Privacy:</strong> Device GPS coordinates are captured strictly at the instant of check-in and check-out to verify worksite presence. Background location tracking is never performed.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Historical GPS Location Mapping Drawer */}
      <Drawer
        isOpen={!!selectedHistoryLocation}
        onClose={() => setSelectedHistoryLocation(null)}
        title={selectedHistoryLocation ? `GPS Mapping: ${formatDate(selectedHistoryLocation.date)}` : ''}
        maxWidth="max-w-[540px]"
      >
        {selectedHistoryLocation && (
          <div className="space-y-4">
            <LocationMap
              checkInLocation={selectedHistoryLocation.checkInLocation}
              checkOutLocation={selectedHistoryLocation.checkOutLocation}
              checkInTime={selectedHistoryLocation.checkIn}
              checkOutTime={selectedHistoryLocation.checkOut}
              workMode={selectedHistoryLocation.workMode}
              height={320}
            />
            <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line space-y-1.5 text-xs">
              <span className="font-semibold text-ink block">Attendance & Break Summary</span>
              <p className="text-muted font-mono tabular-nums">
                {selectedHistoryLocation.evaluation?.label} · In: {selectedHistoryLocation.checkIn ? formatTime12(selectedHistoryLocation.checkIn) : '--:--:--'} · Out: {selectedHistoryLocation.checkOut ? formatTime12(selectedHistoryLocation.checkOut) : '--:--:--'}
              </p>
              <p className="text-muted font-mono tabular-nums">
                Break Duration: <span className="text-ink font-semibold">{formatDurationWithSeconds(selectedHistoryLocation.evaluation?.breakSeconds ?? ((selectedHistoryLocation.evaluation?.breakMinutes || 0) * 60))}</span> · Net: <span className="text-accent font-semibold">{formatDurationWithSeconds(selectedHistoryLocation.evaluation?.netSeconds ?? ((selectedHistoryLocation.evaluation?.netMinutes || 0) * 60))}</span>
              </p>
              {selectedHistoryLocation.earlyCheckOutReason && (
                <p className="text-[11px] text-warn pt-1 border-t border-line/30">
                  Early Check-Out Reason: <strong className="text-ink">{selectedHistoryLocation.earlyCheckOutReason}</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Check-Out Confirmation, Reason & GPS Tracking Drawer */}
      <CheckOutDrawer
        isOpen={checkOutDrawerOpen}
        onClose={() => setCheckOutDrawerOpen(false)}
      />

      {/* Regularisation Request Drawer (Section 12) */}
      <Drawer
        isOpen={regDrawerOpen}
        onClose={() => setRegDrawerOpen(false)}
        title="Request Attendance Regularisation"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setRegDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleRegSubmit}>
              Submit Request
            </PrimaryButton>
          </div>
        }
      >
        <form onSubmit={handleRegSubmit} className="space-y-4 text-[13px]">
          <p className="text-muted leading-relaxed">
            Submit a regularisation request for missed punches, biometric reader errors, or outdoor on-duty travel.
          </p>

          {regError && (
            <div className="p-2.5 rounded-tpl bg-bad/10 border border-bad/40 text-bad text-xs">
              {regError}
            </div>
          )}

          <div>
            <label className="block text-muted text-xs mb-1 font-medium">Date *</label>
            <input
              type="date"
              required
              value={regDate}
              onChange={(e) => setRegDate(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-muted text-xs mb-1 font-medium">Issue Type *</label>
            <select
              value={regIssueType}
              onChange={(e) => setRegIssueType(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Biometric Scanner Failure">Biometric Scanner Failure</option>
              <option value="Accidental Check-Out">Accidental Check-Out</option>
              <option value="Missed Check-Out">Missed Check-Out</option>
              <option value="On Duty / Client Meeting">On Duty / Client Meeting</option>
              <option value="Work From Home Without Punch">Work From Home Without Punch</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted text-xs mb-1 font-medium">Corrected In (HH:MM:SS)</label>
              <input
                type="time"
                step="1"
                required
                value={regCheckIn}
                onChange={(e) => setRegCheckIn(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-muted text-xs mb-1 font-medium">Corrected Out (HH:MM:SS)</label>
              <input
                type="time"
                step="1"
                required
                value={regCheckOut}
                onChange={(e) => setRegCheckOut(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted text-xs mb-1 font-medium">
              Reason (min 10 characters) *
            </label>
            <textarea
              required
              rows={3}
              value={regReason}
              onChange={(e) => setRegReason(e.target.value)}
              placeholder="Explain the reason for discrepancy..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-xs text-muted">
            ℹ️ Approver: <strong>Priya Nair</strong> (Engineering Manager). Max 3 regularisations permitted per month.
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default Attendance;

