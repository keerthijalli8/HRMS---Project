// src/pages/Overview.jsx
// Overview dashboard page with the exact 3-column Monsoon Glass grid areas:
// "hello hello hello" / "kpis kpis kpis" / "punch mytasks leavebal" / "ann ann hol".

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  FileCheck2,
  CheckSquare,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { KpiTile } from '../components/Kpi.jsx';
import { SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Progress } from '../components/Progress.jsx';
import { SegBar } from '../components/SegBar.jsx';
import { PunchControl } from '../components/PunchControl.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { LocationMap } from '../components/LocationMap.jsx';
import {
  INITIAL_TASKS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_HOLIDAYS
} from '../data/employee.js';
import { formatTime12, formatDuration, formatDate, getGreeting } from '../utils/format.js';
import { formatCoordinates, formatDistance } from '../utils/geo.js';

export function Overview() {
  const { user } = useAuth();
  const { todayData, nowDate } = useAttendance();
  const { announcements, markAnnouncementRead } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [heroMapOpen, setHeroMapOpen] = useState(false);

  // Top 4 tasks due soon
  const dueSoonTasks = INITIAL_TASKS.slice(0, 4);

  // Next 3 holidays
  const upcomingHolidays = INITIAL_HOLIDAYS.slice(0, 3);

  // Month attendance breakdown segments
  const monthSegments = [
    { label: 'Present', value: 16, color: 'var(--good)' },
    { label: 'Leave', value: 1, color: 'var(--accent2)' },
    { label: 'Absent', value: 0, color: 'var(--bad)' },
    { label: 'Holiday & Off', value: 6, color: 'var(--muted)' }
  ];

  return (
    <>
    <div className="overview-grid">
      {/* 1. HERO WIDGET (data-w="hello") */}
      <section
        data-w="hello"
        className="glass-card p-4 sm:p-5 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-5 items-center">
          {/* Left Hero Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-accent font-mono">
                OVERVIEW · {formatDate(nowDate, { includeWeekday: true }).toUpperCase()}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11.5px] text-muted font-mono tabular-nums">
                {formatTime12(nowDate)} IST
              </span>
            </div>

            <h2 className="font-display font-bold text-[clamp(21px,2.4vw,29px)] text-ink leading-tight tracking-tight">
              {getGreeting(nowDate)}, {user?.preferredName || user?.name?.split(/\s+/)[0] || 'Aarav'}!
            </h2>

            <p className="text-[13px] text-muted leading-relaxed">
              2 tasks due this week, 1 leave pending review, payslip for Oct is ready.
            </p>

            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <Tag color="accent">{user?.department || 'Engineering'}</Tag>
              <Tag>{user?.shift || 'General 9:30 AM – 6:30 PM'}</Tag>
              <Tag>Reports to Priya Nair</Tag>
            </div>
          </div>

          {/* Right Hero Breakdown & Quick Actions */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="font-semibold text-ink">November Attendance Progress</span>
              <span className="text-muted font-mono">16 of 22 Working Days</span>
            </div>

            <SegBar segments={monthSegments} height={8} label="Monthly attendance breakdown" />

            <div className="flex items-center justify-between text-[10.5px] text-muted flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-good" /> 16 Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent2" /> 1 Leave
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-bad" /> 0 Absent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted" /> 6 Holidays / Off
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <SecondaryButton
                onClick={() => navigate('/employee/attendance')}
                className="flex-1 py-1.5 px-3 text-[12px] h-8 font-medium"
              >
                {todayData?.checkOut ? 'Checked Out · View' : 'View Attendance'}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => navigate('/employee/leave')}
                className="flex-1 py-1.5 px-3 text-[12px] h-8 font-medium"
              >
                Apply Leave
              </SecondaryButton>
            </div>

            {todayData?.checkInLocation && (
              <button
                type="button"
                onClick={() => setHeroMapOpen(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-surface2/60 border border-line/80 hover:border-accent/60 transition-colors flex flex-wrap items-center justify-between gap-1.5 text-[10.5px] font-mono"
                title="Click to inspect recorded Check-In & Check-Out GPS on the map"
              >
                <span className="flex items-center gap-1.5 text-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0" />
                  <span>
                    In ({formatTime12(todayData.checkIn)}):{' '}
                    {formatCoordinates(todayData.checkInLocation.latitude, todayData.checkInLocation.longitude)}
                  </span>
                </span>
                {todayData?.checkOutLocation ? (
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent2 shrink-0" />
                    <span>
                      Out ({formatTime12(todayData.checkOut)}):{' '}
                      {formatCoordinates(todayData.checkOutLocation.latitude, todayData.checkOutLocation.longitude)}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-accent" />
                    {formatDistance(todayData.checkInLocation.distanceMeters)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. KPIS TILES (data-w="kpis") */}
      <div
        data-w="kpis"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-[var(--gap)]"
      >
        <KpiTile
          label="Present Days"
          value="16"
          delta="+2 days"
          isPositive={true}
          subtext="this month"
          icon={CheckCircle2}
          to="/employee/attendance"
          onClick={() => navigate('/employee/attendance')}
        />
        <KpiTile
          label="Absent Days"
          value="0"
          delta="0.0%"
          isPositive={true}
          subtext="clean record"
          icon={Calendar}
          to="/employee/attendance"
          onClick={() => navigate('/employee/attendance')}
        />
        <KpiTile
          label="Leave Balance"
          value="26.5"
          delta="Days total"
          subtext="7 CL, 8 SL, 12 EL"
          icon={CalendarDays}
          to="/employee/leave"
          onClick={() => navigate('/employee/leave')}
        />
        <KpiTile
          label="Pending Tasks"
          value="5"
          delta="2 due soon"
          isPositive={false}
          subtext="1 in review"
          icon={CheckSquare}
          to="/employee/tasks"
          onClick={() => navigate('/employee/tasks')}
        />
        <KpiTile
          label="Late Marks"
          value="1 / 3"
          delta="2 free left"
          isPositive={true}
          subtext="grace active"
          icon={AlertTriangle}
          to="/employee/attendance"
          onClick={() => navigate('/employee/attendance')}
        />
        <KpiTile
          label="Avg Work Hours"
          valueClassName="text-[clamp(15px,1.2vw,19px)]"
          value={
            <span className="inline-flex flex-wrap items-baseline gap-x-1 leading-tight">
              <span>8h 24m</span>
              <span className="text-[11px] xl:text-[12px] text-muted font-mono font-semibold">18s</span>
            </span>
          }
          delta="+24m 18s"
          isPositive={true}
          subtext="daily target 8h"
          icon={Clock}
          to="/employee/attendance"
          onClick={() => navigate('/employee/attendance')}
        />
      </div>

      {/* 3. PUNCH WIDGET (data-w="punch") */}
      <Card
        data-w="punch"
        title="Today's Attendance"
        subtext="Live IST punch tracker"
        action={
          <button
            onClick={() => navigate('/employee/attendance')}
            className="text-[12px] text-accent hover:underline flex items-center gap-1"
          >
            Details <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <PunchControl />
      </Card>

      {/* 4. MY TASKS WIDGET (data-w="mytasks") */}
      <Card
        data-w="mytasks"
        title="My Tasks"
        subtext="Due soon and in progress"
        action={
          <button
            onClick={() => navigate('/employee/tasks')}
            className="text-[12px] text-accent hover:underline flex items-center gap-1"
          >
            View all tasks <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-3">
          {dueSoonTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate('/employee/tasks')}
              className="p-3 rounded-tpl border border-line bg-surface2/40 hover:bg-surface2 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[13px] text-ink leading-snug line-clamp-1">
                  {task.title}
                </span>
                <StatusPill status={task.status} label={task.status} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>{task.dueNote}</span>
                <span className="font-mono">{task.progress}%</span>
              </div>
              <Progress value={task.progress} max={100} height={5} />
            </div>
          ))}
        </div>
      </Card>

      {/* 5. LEAVE BALANCE WIDGET (data-w="leavebal") */}
      <Card
        data-w="leavebal"
        title="Leave Balances"
        subtext="Available quota FY 2026–27"
        action={
          <button
            onClick={() => navigate('/employee/leave')}
            className="text-[12px] text-accent hover:underline flex items-center gap-1"
          >
            Apply <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-ink font-medium">Casual Leave (CL)</span>
              <span className="text-muted font-mono">
                {INITIAL_LEAVE_BALANCES.casual.available} of {INITIAL_LEAVE_BALANCES.casual.total} left
              </span>
            </div>
            <Progress
              value={INITIAL_LEAVE_BALANCES.casual.available}
              max={INITIAL_LEAVE_BALANCES.casual.total}
              height={6}
            />
          </div>

          <div>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-ink font-medium">Sick Leave (SL)</span>
              <span className="text-muted font-mono">
                {INITIAL_LEAVE_BALANCES.sick.available} of {INITIAL_LEAVE_BALANCES.sick.total} left
              </span>
            </div>
            <Progress
              value={INITIAL_LEAVE_BALANCES.sick.available}
              max={INITIAL_LEAVE_BALANCES.sick.total}
              height={6}
            />
          </div>

          <div>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-ink font-medium">Earned Leave (EL)</span>
              <span className="text-muted font-mono">
                {INITIAL_LEAVE_BALANCES.earned.available} of {INITIAL_LEAVE_BALANCES.earned.total} left
              </span>
            </div>
            <Progress
              value={INITIAL_LEAVE_BALANCES.earned.available}
              max={INITIAL_LEAVE_BALANCES.earned.total}
              height={6}
            />
          </div>

          <div>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-ink font-medium">Comp-off (CO)</span>
              <span className="text-muted font-mono">
                {INITIAL_LEAVE_BALANCES.compoff.available} days
              </span>
            </div>
            <Progress
              value={INITIAL_LEAVE_BALANCES.compoff.available}
              max={2}
              height={6}
            />
          </div>

          <div className="pt-2 border-t border-line/40 flex justify-between items-center text-[11px] text-muted">
            <span>Next accrual: 1 Dec 2026 (+1.5 EL)</span>
            <button
              onClick={() => navigate('/employee/leave')}
              className="text-accent hover:underline font-semibold"
            >
              Manage Leave
            </button>
          </div>
        </div>
      </Card>

      {/* 6. ANNOUNCEMENTS WIDGET (data-w="ann") */}
      <Card
        data-w="ann"
        title="Company Announcements"
        subtext="Official notices from HR"
        action={
          <button
            onClick={() => navigate('/employee/notifications')}
            className="text-[12px] text-accent hover:underline flex items-center gap-1"
          >
            All <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-3">
          {announcements.slice(0, 3).map((ann) => (
            <div
              key={ann.id}
              className={`p-3 rounded-tpl border transition-all ${
                ann.isRead
                  ? 'bg-surface2/30 border-line/40 text-muted'
                  : 'bg-surface2/60 border-line text-ink'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ann.isImportant && <Tag color="warn">Important</Tag>}
                  <span className="font-semibold text-[13px] leading-snug">
                    {ann.title}
                  </span>
                </div>
                <span className="text-[11px] text-muted shrink-0 font-mono">
                  {ann.date}
                </span>
              </div>
              <p className="text-[12px] text-muted mt-1 leading-relaxed">
                {ann.content}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/30">
                <span className="text-[11px] text-muted uppercase tracking-wider font-mono">
                  {ann.category}
                </span>
                {!ann.isRead && (
                  <button
                    onClick={() => {
                      markAnnouncementRead(ann.id);
                      showToast('Marked announcement as read');
                    }}
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. HOLIDAYS WIDGET (data-w="hol") */}
      <Card
        data-w="hol"
        title="Upcoming Holidays"
        subtext="Next official breaks"
        action={
          <button
            onClick={() => navigate('/employee/holidays')}
            className="text-[12px] text-accent hover:underline flex items-center gap-1"
          >
            Calendar <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-3">
          {upcomingHolidays.map((hol) => (
            <div
              key={hol.id}
              className="p-3 rounded-tpl border border-line bg-surface2/40 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13px] text-ink flex items-center gap-1.5">
                    <span>🎉</span>
                    <span>{hol.festivalName || hol.name}</span>
                  </span>
                  <Tag color={hol.type === 'Company' ? 'accent2' : hol.type === 'Optional' ? 'warn' : 'accent'}>
                    {hol.type}
                  </Tag>
                </div>
                <div className="text-[11px] text-muted">
                  {hol.day}, {hol.date} {hol.festival && hol.festival !== (hol.festivalName || hol.name) ? `· ${hol.festival}` : ''}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display font-bold text-accent text-base tabular-nums">
                  {hol.daysRemaining}
                </span>
                <span className="text-[10.5px] text-muted block leading-none">days left</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    <Drawer
      isOpen={heroMapOpen}
      onClose={() => setHeroMapOpen(false)}
      title="Today's Recorded Check-In & Check-Out GPS"
      maxWidth="max-w-[540px]"
    >
      <LocationMap
        checkInLocation={todayData?.checkInLocation}
        checkOutLocation={todayData?.checkOutLocation}
        checkInTime={todayData?.checkIn}
        checkOutTime={todayData?.checkOut}
        workMode={todayData?.workMode}
        height={300}
      />
    </Drawer>
    </>
  );
}

export default Overview;

