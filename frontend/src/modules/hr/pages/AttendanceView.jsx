import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { AttendanceTabs } from '../components/attendance/AttendanceTabs.jsx';
import { TodayAttendanceCard } from '../components/attendance/TodayAttendanceCard.jsx';
import { MonthlySummaryCards } from '../components/attendance/MonthlySummaryCards.jsx';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar.jsx';
import { AttendanceHistoryTable } from '../components/attendance/AttendanceHistoryTable.jsx';
import { RegularizationModal } from '../components/attendance/RegularizationModal.jsx';
import { MyRegularizationRequests } from '../components/attendance/MyRegularizationRequests.jsx';
import { TeamDepartmentsPage } from '../components/attendance/TeamDepartmentsPage.jsx';
import {
  getMyAttendance,
  getKolkataDateKey,
  subscribeAttendanceService
} from '../services/attendanceService.js';
import { formatDisplayDate } from '../services/attendanceLog.js';
import { Icon } from '../components/Icon.jsx';

// Lazy load Level 2 Department Attendance Page for optimal performance
const DepartmentAttendancePage = lazy(() =>
  import('../components/attendance/DepartmentAttendancePage.jsx')
);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Skeleton loader for Level 2 page
const DepartmentAttendanceSkeleton = () => (
  <div className="flex flex-col gap-4 w-full animate-pulse">
    <div className="h-24 bg-surface2/40 rounded-2xl border border-line" />
    <div className="h-12 bg-surface2/30 rounded-2xl border border-line" />
    <div className="h-20 bg-surface2/30 rounded-2xl border border-line" />
    <div className="h-72 bg-surface2/20 rounded-2xl border border-line" />
  </div>
);

export const AttendanceView = ({ currentUser, onTriggerToast }) => {
  const {
    attendanceTab,
    setAttendanceTab,
    canAccessTeam,
    pendingApprovalsCount
  } = useAttendance();

  const todayKey = useMemo(() => getKolkataDateKey(), []);
  const todayFormatted = useMemo(() => formatDisplayDate(todayKey), [todayKey]);

  const [dataVersion, setDataVersion] = useState(0);

  // ------------------- TAB 1: MY ATTENDANCE STATE -------------------
  const [myYear, setMyYear] = useState(() => new Date().getFullYear());
  const [myMonth, setMyMonth] = useState(() => new Date().getMonth() + 1);
  const [regularizationModalOpen, setRegularizationModalOpen] = useState(false);
  const [regPreselectedDate, setRegPreselectedDate] = useState("");

  const myAttendanceData = useMemo(() => {
    return getMyAttendance({
      year: myYear,
      month: myMonth,
      user: currentUser
    });
  }, [myYear, myMonth, currentUser, dataVersion]);

  const handlePrevMonth = () => {
    if (myMonth === 1) {
      setMyMonth(12);
      setMyYear(y => y - 1);
    } else {
      setMyMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (myMonth === 12) {
      setMyMonth(1);
      setMyYear(y => y + 1);
    } else {
      setMyMonth(m => m + 1);
    }
  };

  const handleTodayMonth = () => {
    const d = new Date();
    setMyYear(d.getFullYear());
    setMyMonth(d.getMonth() + 1);
  };

  // ------------------- TAB 2: 2-LEVEL DRILL DOWN SUB-ROUTING -------------------
  const getSubRouteFromLocation = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const match = path.match(/\/attendance\/team\/([^/?#]+)/);
        if (match && match[1]) {
          return { level: 2, departmentId: decodeURIComponent(match[1]) };
        }
        const urlParams = new URLSearchParams(window.location.search);
        const deptParam = urlParams.get("dept") || urlParams.get("department");
        if (deptParam) {
          return { level: 2, departmentId: deptParam };
        }
      }
    } catch (e) {}
    return { level: 1, departmentId: null };
  }, []);

  const [subRoute, setSubRoute] = useState(getSubRouteFromLocation);

  const [selectedTeamDate, setSelectedTeamDate] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get("date");
        if (dateParam) return dateParam;
      }
      const stored = localStorage.getItem("hrms_team_attendance_date");
      if (stored) return stored;
    } catch (e) {}
    return getKolkataDateKey();
  });

  const handleTeamDateChange = useCallback((newDate) => {
    setSelectedTeamDate(newDate);
    try {
      localStorage.setItem("hrms_team_attendance_date", newDate);
      const url = new URL(window.location.href);
      url.searchParams.set("date", newDate);
      window.history.replaceState({}, "", url.toString());
    } catch (e) {}
  }, []);

  const handleSelectDepartment = useCallback((deptId) => {
    try {
      const url = new URL(window.location.href);
      url.pathname = `/hr/attendance/team/${encodeURIComponent(deptId)}`;
      url.searchParams.set("date", selectedTeamDate);
      url.searchParams.delete("tab");
      window.history.pushState({}, "", url.toString());
    } catch (e) {}
    setSubRoute({ level: 2, departmentId: deptId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedTeamDate]);

  const handleBackToDepartments = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      url.pathname = "/hr/attendance";
      url.searchParams.set("tab", "team");
      url.searchParams.set("date", selectedTeamDate);
      window.history.pushState({}, "", url.toString());
    } catch (e) {}
    setSubRoute({ level: 1, departmentId: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedTeamDate]);

  const handleNavigateAttendance = useCallback((tab) => {
    if (tab === "my") {
      setAttendanceTab("my");
      try {
        const url = new URL(window.location.href);
        url.pathname = "/hr/attendance";
        url.searchParams.set("tab", "my");
        window.history.pushState({}, "", url.toString());
      } catch (e) {}
      setSubRoute({ level: 1, departmentId: null });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleBackToDepartments();
    }
  }, [setAttendanceTab, handleBackToDepartments]);

  useEffect(() => {
    const handlePopState = () => {
      const current = getSubRouteFromLocation();
      setSubRoute(current);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get("date");
        if (dateParam) setSelectedTeamDate(dateParam);
        const tabParam = urlParams.get("tab");
        if (tabParam === "my" || tabParam === "team") {
          setAttendanceTab(tabParam);
        }
      } catch (e) {}
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getSubRouteFromLocation, setAttendanceTab]);

  const handleTabChange = useCallback((newTab) => {
    setAttendanceTab(newTab);
    try {
      const url = new URL(window.location.href);
      url.pathname = "/hr/attendance";
      url.searchParams.set("tab", newTab === "team" ? "team" : "my");
      if (newTab === "team") {
        url.searchParams.set("date", selectedTeamDate);
      }
      window.history.pushState({}, "", url.toString());
    } catch (e) {}
    setSubRoute({ level: 1, departmentId: null });
  }, [selectedTeamDate, setAttendanceTab]);

  useEffect(() => {
    const unsub = subscribeAttendanceService(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const isNextMonthDisabled =
    myYear > new Date().getFullYear() ||
    (myYear === new Date().getFullYear() && myMonth >= new Date().getMonth() + 1);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ================= SLIM UNIFIED PAGE HEADER ================= */}
      <div className="glass-card !p-4 border border-line/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Icon name="clock" className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-ink leading-tight">
              Attendance & Punches
            </h2>
            <div className="text-[11.5px] text-muted font-medium mt-0.5">
              {todayFormatted} • IST (Asia/Kolkata)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {attendanceTab === "my" && (
            <button
              type="button"
              onClick={() => {
                setRegPreselectedDate(todayKey);
                setRegularizationModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-ink text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="edit-3" className="w-3.5 h-3.5 text-accent" />
              <span>Regularize</span>
            </button>
          )}

          {canAccessTeam && (
            <AttendanceTabs
              activeTab={attendanceTab}
              onTabChange={handleTabChange}
              canAccessTeam={canAccessTeam}
              pendingApprovalsCount={pendingApprovalsCount}
            />
          )}
        </div>
      </div>

      {/* ================= TAB 1: MY ATTENDANCE ================= */}
      {attendanceTab === "my" && (
        <div
          role="tabpanel"
          id="attendance-tabpanel-my"
          aria-labelledby="attendance-tab-my"
          className="flex flex-col gap-4 animate-fadeIn"
        >
          {/* 1. Today's Attendance Card */}
          <TodayAttendanceCard
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
          />

          {/* 2. Monthly Summary Cards */}
          <MonthlySummaryCards
            summary={myAttendanceData.summaryCards}
            monthName={MONTH_NAMES[myMonth - 1]}
            year={myYear}
            onCardClick={() => {
              const el = document.getElementById("my-attendance-history-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* 3. Balanced 2-Column Grid: Monthly Calendar (2/3) + Regularization Requests (1/3) */}
          <div className="grid grid-cols-1 xl:[grid-template-columns:2fr_1fr] gap-4 items-start">
            <div className="glass-card !p-4 sm:!p-5 border border-line/80 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-line/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <Icon name="calendar" className="w-4 h-4 text-accent" />
                  <h3 className="font-display font-semibold text-sm sm:text-base text-ink">
                    Monthly Attendance Calendar
                  </h3>
                </div>
                <span className="text-xs text-muted font-semibold">
                  {MONTH_NAMES[myMonth - 1]} {myYear}
                </span>
              </div>

              <AttendanceCalendar
                monthDays={myAttendanceData.monthDays}
                monthTitle={`${MONTH_NAMES[myMonth - 1]} ${myYear}`}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleTodayMonth}
                isNextDisabled={isNextMonthDisabled}
                onRequestRegularization={(dateKey) => {
                  setRegPreselectedDate(dateKey);
                  setRegularizationModalOpen(true);
                }}
              />
            </div>

            <MyRegularizationRequests
              requests={myAttendanceData.myRequests}
              onNewRequest={() => {
                setRegPreselectedDate(todayKey);
                setRegularizationModalOpen(true);
              }}
            />
          </div>

          {/* 4. History Table Section */}
          <div id="my-attendance-history-section" className="glass-card !p-4 sm:!p-5 border border-line/80 rounded-2xl">
            <AttendanceHistoryTable
              historyData={myAttendanceData.historyTable}
              title="Attendance History & Punches"
              onRequestRegularization={(dateKey) => {
                setRegPreselectedDate(dateKey);
                setRegularizationModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ================= TAB 2: TEAM ATTENDANCE (2-LEVEL DRILL-DOWN) ================= */}
      {attendanceTab === "team" && canAccessTeam && (
        <div
          role="tabpanel"
          id="attendance-tabpanel-team"
          aria-labelledby="attendance-tab-team"
          className="flex flex-col gap-4 w-full"
        >
          {subRoute.level === 2 && subRoute.departmentId ? (
            <Suspense fallback={<DepartmentAttendanceSkeleton />}>
              <DepartmentAttendancePage
                departmentId={subRoute.departmentId}
                selectedDate={selectedTeamDate}
                onDateChange={handleTeamDateChange}
                onBack={handleBackToDepartments}
                onNavigateAttendance={handleNavigateAttendance}
                currentUser={currentUser}
                onTriggerToast={onTriggerToast}
              />
            </Suspense>
          ) : (
            <TeamDepartmentsPage
              selectedDate={selectedTeamDate}
              onDateChange={handleTeamDateChange}
              onSelectDepartment={handleSelectDepartment}
              currentUser={currentUser}
              onTriggerToast={onTriggerToast}
            />
          )}
        </div>
      )}

      {/* ================= MODAL: REGULARIZATION REQUEST ================= */}
      <RegularizationModal
        isOpen={regularizationModalOpen}
        onClose={() => setRegularizationModalOpen(false)}
        initialDateKey={regPreselectedDate}
        currentUser={currentUser}
        onSuccessToast={onTriggerToast}
      />
    </div>
  );
};