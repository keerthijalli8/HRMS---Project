import React, { useMemo, useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { Icon } from '../components/Icon.jsx';
import { SVGSparkChart } from '../components/SVGSparkChart.jsx';
import { GreetingHero } from '../components/dashboard/GreetingHero.jsx';
import { AttendanceProgressCard } from '../components/attendance/AttendanceProgressCard.jsx';
import { MyPerformanceCard } from '../components/MyPerformanceCard.jsx';
import { StatutoryCalendarCard } from '../components/dashboard/StatutoryCalendarCard.jsx';
import { getEmployeePerformance } from '../data/performanceData.js';
import {
  getMyTasks,
  getTaskStats,
  isTaskOverdue,
  getTaskDueNotice,
  subscribeTasks
} from '../services/taskStore.js';
import DashboardMyTeamWidget from '../components/teams/DashboardMyTeamWidget.jsx';

export const OverviewView = ({
  currentUser,
  currentRoute = "overview",
  setCurrentRoute,
  onTriggerToast,
  onNavigateToTasks
}) => {
  const { todayData, historyList } = useAttendance();
  const [tasks, setTasks] = useState(() => getMyTasks(currentUser));

  useEffect(() => {
    const unsubTasks = subscribeTasks(() => {
      setTasks(getMyTasks(currentUser));
    });
    return unsubTasks;
  }, [currentUser]);

  const taskStats = useMemo(() => getTaskStats(tasks), [tasks]);

  const upcomingDeadlines = useMemo(() => {
    return [...tasks]
      .filter(t => t.status !== "Closed")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [tasks]);

  const myPerformanceRecord = useMemo(() => {
    return getEmployeePerformance(currentUser?.employeeId, currentUser);
  }, [currentUser]);

  const isPrivileged = useMemo(() => {
    const r = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    return r.includes("hr") || r.includes("admin") || r.includes("manager");
  }, [currentUser]);

  const handleTaskFilterClick = (status) => {
    if (onNavigateToTasks) {
      onNavigateToTasks(status);
    } else {
      setCurrentRoute("my-tasks");
    }
  };

  const quickShortcuts = [
    { label: "My Attendance", icon: "clock", route: "attendance" },
    { label: "Teams & Org", icon: "users", route: "teams" },
    { label: "My Tasks", icon: "check-square", route: "my-tasks" },
    { label: isPrivileged ? "Run Payroll" : "My Payslips", icon: "dollar-sign", route: "payroll" },
    { label: "Shifts & Roster", icon: "calendar", route: "shifts-roster" },
    { label: "Apply Leave", icon: "briefcase", route: "leave" }
  ];

  const taskPills = [
    { label: "Total", count: taskStats.totalAssigned, status: "All", tone: "text-ink bg-surface2/80 border-line" },
    { label: "Pending", count: taskStats.pending, status: "Pending", tone: "text-muted bg-surface2/60 border-line" },
    { label: "In Progress", count: taskStats.inProgress, status: "In Progress", tone: "text-accent bg-accent/10 border-accent/30" },
    { label: "Completed", count: taskStats.completed, status: "Completed", tone: "text-good bg-good/10 border-good/30" },
    { label: "Overdue", count: taskStats.overdue, status: "Overdue", tone: taskStats.overdue > 0 ? "text-bad bg-bad/10 border-bad/30" : "text-muted bg-surface2/60 border-line" }
  ];

  return (
    <div className="max-w-[1440px] w-full mx-auto flex flex-col gap-6 text-left">
      
      {/* 1. HERO ROW: GREETING HERO (2/3) + TODAY'S ATTENDANCE PROGRESS (1/3) */}
      <section className="grid grid-cols-1 min-[1100px]:[grid-template-columns:2fr_1fr] gap-5 items-stretch w-full">
        <div className="flex flex-col h-full">
          <GreetingHero
            currentUser={currentUser}
            tasks={tasks}
            historyList={historyList}
            todayData={todayData}
            currentRoute={currentRoute}
            onNavigate={setCurrentRoute}
            onNavigateToTasks={handleTaskFilterClick}
            onTriggerToast={onTriggerToast}
          />
        </div>
        <div className="flex flex-col h-full">
          <AttendanceProgressCard
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
            onNavigate={setCurrentRoute}
          />
        </div>
      </section>

      {/* 2. MY PERFORMANCE OVERVIEW */}
      <MyPerformanceCard
        record={myPerformanceRecord}
        onViewFull={() => setCurrentRoute("performance")}
      />

      {/* 3. COMPACT TEAM HIERARCHY STRIP */}
      <DashboardMyTeamWidget
        onNavigate={(path) => {
          setCurrentRoute(path);
        }}
      />

      {/* 4. MASTER 2-COLUMN GRID SECTION (Left: Tasks + Workforce | Right: Calendar) */}
      <section className="grid grid-cols-1 lg:[grid-template-columns:2fr_1fr] gap-5 items-start w-full">
        
        {/* LEFT COLUMN (Tasks & Deadlines + Workforce Distribution) */}
        <div className="flex flex-col gap-5 w-full">
          
          {/* Tasks & Deadlines Card */}
          <div className="glass-card !p-5 border border-line rounded-[20px] flex flex-col gap-3.5 h-fit">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-surface2 text-accent flex items-center justify-center shrink-0 border border-line">
                  <Icon name="check-square" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink text-base leading-tight">
                    My Tasks & Upcoming Deadlines
                  </h3>
                  <p className="text-[11.5px] text-muted mt-0.5">
                    Click any status pill or deliverable to jump to your task board
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTaskFilterClick("All")}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 transition cursor-pointer"
              >
                <span>Open Tasks Desk</span>
                <Icon name="arrow-right" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {taskPills.map(pill => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => handleTaskFilterClick(pill.status)}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between transition hover:opacity-90 cursor-pointer ${pill.tone}`}
                >
                  <span className="text-[11px] font-semibold truncate">{pill.label}</span>
                  <span className="font-data font-extrabold text-sm ml-1.5">{pill.count}</span>
                </button>
              ))}
            </div>

            {/* Deadlines List */}
            <div className="flex flex-col gap-2.5">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-muted text-xs bg-surface2/20 rounded-xl border border-line/40">
                  No active task deadlines. All tasks completed!
                </div>
              ) : (
                upcomingDeadlines.map(t => {
                  const notice = getTaskDueNotice(t);
                  const overdue = isTaskOverdue(t);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTaskFilterClick("All")}
                      className={`px-3.5 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-accent transition ${
                        overdue ? "bg-bad/5 border-bad/30" : "bg-surface2/20 border-line/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            t.priority === "High" ? "bg-bad" : t.priority === "Medium" ? "bg-warn" : "bg-good"
                          }`}
                        />
                        <div className="truncate">
                          <div className="font-semibold text-ink truncate text-[13px]">{t.title}</div>
                          <div className="text-muted text-[11px] truncate mt-0.5">
                            <span className="font-data text-accent font-semibold">{t.id}</span> · Assigned by {t.assignedByName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className={`font-data font-bold text-[11.5px] ${overdue ? "text-bad" : "text-ink"}`}>
                            {t.dueDate}
                          </span>
                          {notice && (
                            <span
                              className={`text-[10px] font-semibold ${
                                notice.type === "bad" ? "text-bad" : notice.type === "warn" ? "text-warn" : "text-muted"
                              }`}
                            >
                              {notice.text}
                            </span>
                          )}
                        </div>
                        <span className="font-num font-semibold text-ink text-xs min-w-[32px] text-right">
                          {t.progress}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Workforce Distribution & Trend */}
          <div className="glass-card !p-5 border border-line rounded-[20px] flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div>
                  <h3 className="font-display font-bold text-ink text-base leading-tight">
                    Workforce Distribution & Trend
                  </h3>
                  <p className="text-[11.5px] text-muted mt-0.5">
                    Monthly additions vs. annualized voluntary attrition
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs text-accent font-data font-semibold bg-surface2 border border-line rounded-lg">
                    1,248 Active
                  </span>
                  <span className="px-2.5 py-0.5 text-xs text-good font-data font-semibold bg-surface2 border border-line rounded-lg">
                    7.2% Attrition
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <SVGSparkChart onTriggerToast={onTriggerToast} />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Statutory Compliance Calendar) */}
        <div className="flex flex-col gap-5 w-full">
          <StatutoryCalendarCard
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
          />
        </div>

      </section>

      {/* 5. FULL WIDTH HORIZONTAL QUICK ACTIONS BAR */}
      <section className="glass-card !p-5 border border-line rounded-[20px] w-full">
        <div className="flex items-center justify-between border-b border-line/60 pb-3 mb-4">
          <h3 className="font-display font-bold text-ink text-base leading-tight">
            Quick Actions
          </h3>
          <span className="text-[11.5px] text-muted font-medium">Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickShortcuts.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => setCurrentRoute(item.route)}
              className="h-[64px] rounded-xl bg-surface2/50 hover:bg-surface2 border border-line/80 hover:border-accent text-ink hover:text-accent font-medium text-xs flex items-center gap-3 transition active:scale-[0.98] cursor-pointer shadow-sm px-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-surface text-accent flex items-center justify-center shrink-0 border border-line/60 group-hover:border-accent/40">
                <Icon
                  name={item.icon}
                  className="w-4 h-4 text-muted group-hover:text-accent transition-colors"
                />
              </div>
              <span className="truncate text-left text-[11.5px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
};