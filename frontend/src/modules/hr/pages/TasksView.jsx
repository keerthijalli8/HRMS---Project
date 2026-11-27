import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { PrimaryButton } from '../components/Buttons.jsx';
import { Select } from '../components/Select.jsx';
import { formatDate, formatPercent } from '../utils/format.js';
import {
  getMyTasks,
  getTeamTasks,
  getTaskStats,
  canUserAssignTasks,
  isTaskOverdue,
  getTaskDueNotice,
  subscribeTasks,
  startTask
} from '../services/taskStore.js';
import {
  TaskDetailModal,
  AssignTaskModal,
  UpdateProgressModal,
  CompleteTaskModal,
  ReassignTaskModal,
  ChangeDueDateModal,
  VerifyCloseModal
} from '../components/TaskModals.jsx';

export const TasksView = ({
  currentUser,
  initialFilter = "All",
  onTriggerToast
}) => {
  // Supervisor check with robust fallback for roles
  const isSupervisor = useMemo(() => {
    if (!currentUser) return false;
    const roleStr = (currentUser.systemRole || currentUser.role || "").toLowerCase();
    return canUserAssignTasks(currentUser) || roleStr.includes("hr") || roleStr.includes("admin") || roleStr.includes("manager");
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState("my_tasks");
  const [viewMode, setViewMode] = useState("list");
  const taskListRef = useRef(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState(initialFilter || "All");
  const [sortBy, setSortBy] = useState("due_soon");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = subscribeTasks(() => {
      setRefreshKey(prev => prev + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  const myTasks = useMemo(() => getMyTasks(currentUser), [currentUser, refreshKey]);
  const teamTasks = useMemo(() => getTeamTasks(currentUser), [currentUser, refreshKey]);
  const scopedTasks = activeTab === "team_tasks" ? teamTasks : myTasks;
  const stats = useMemo(() => getTaskStats(scopedTasks), [scopedTasks]);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [progressTask, setProgressTask] = useState(null);
  const [completeTaskItem, setCompleteTaskItem] = useState(null);
  const [reassignTaskItem, setReassignTaskItem] = useState(null);
  const [changeDueTaskItem, setChangeDueTaskItem] = useState(null);
  const [verifyCloseTaskItem, setVerifyCloseTaskItem] = useState(null);

  const hasActiveFilters = searchTerm.trim() !== "" || priorityFilter !== "All" || statusFilter !== "All";

  const resetFilters = () => {
    setSearchTerm("");
    setPriorityFilter("All");
    setStatusFilter("All");
    setSortBy("due_soon");
  };

  const handleStatusCardClick = (statusId) => {
    setStatusFilter(statusId);
    requestAnimationFrame(() => {
      taskListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return scopedTasks.filter(task => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          task.id.toLowerCase().includes(q) ||
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.assigneeName.toLowerCase().includes(q) ||
          task.assignedByName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (priorityFilter !== "All" && task.priority !== priorityFilter) {
        return false;
      }

      if (statusFilter === "Overdue") {
        if (!isTaskOverdue(task)) return false;
      } else if (statusFilter !== "All") {
        if (statusFilter === "Completed") {
          if (task.status !== "Completed" && task.status !== "Closed") return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "due_soon") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === "due_late") return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sortBy === "recent") return (b.id || "").localeCompare(a.id || "");
      return 0;
    });
  }, [scopedTasks, searchTerm, priorityFilter, statusFilter, sortBy]);

  const kanbanColumns = useMemo(() => {
    return {
      Pending: filteredTasks.filter(t => t.status === "Pending"),
      "In Progress": filteredTasks.filter(t => t.status === "In Progress"),
      "On Hold": filteredTasks.filter(t => t.status === "On Hold"),
      "Completed & Closed": filteredTasks.filter(t => t.status === "Completed" || t.status === "Closed")
    };
  }, [filteredTasks]);

  const kpiItems = [
    { id: "All", label: "Total", count: stats.totalAssigned, icon: "check-square" },
    { id: "Pending", label: "Pending", count: stats.pending, icon: "clock" },
    { id: "In Progress", label: "In Progress", count: stats.inProgress, icon: "trending-up" },
    { id: "Completed", label: "Completed", count: stats.completed, icon: "check-circle" },
    { id: "Overdue", label: "Overdue", count: stats.overdue, icon: "alert-triangle", isBad: stats.overdue > 0 }
  ];

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. Unified Title + Scope Switcher */}
      <section className="glass-card !p-5 border border-line/80 rounded-[20px] flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-bold text-ink text-lg md:text-xl leading-tight">
                {activeTab === "team_tasks" ? "Team & Delegated Tasks" : "My Assigned Tasks"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/12 text-accent border border-accent/25">
                {activeTab === "team_tasks" ? "Delegated" : "Personal"}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {activeTab === "team_tasks"
                ? "Monitor deliverables delegated to team members and verify completion."
                : "Track your deliverables, update execution progress, and meet SLAs."}
            </p>
          </div>
        </div>

        {/* Scope Tabs integrated cleanly */}
        {isSupervisor && (
          <div className="flex items-center gap-2 pt-3 border-t border-line/60">
            <button
              type="button"
              onClick={() => { setActiveTab("my_tasks"); setStatusFilter("All"); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "my_tasks"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2/70"
              }`}
            >
              <Icon name="user" className="w-3.5 h-3.5" />
              My Assigned Tasks
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold font-data ${
                activeTab === "my_tasks" ? "bg-black/20 text-on-accent" : "bg-surface2 border border-line text-muted"
              }`}>
                {myTasks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("team_tasks"); setStatusFilter("All"); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "team_tasks"
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2/70"
              }`}
            >
              <Icon name="users" className="w-3.5 h-3.5" />
              Team & Assigned by Me
              <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold font-data ${
                activeTab === "team_tasks" ? "bg-black/20 text-on-accent" : "bg-surface2 border border-line text-muted"
              }`}>
                {teamTasks.length}
              </span>
            </button>
          </div>
        )}

        {/* 2. Sleek Compact Clickable Switcher Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {kpiItems.map(item => {
            const isSelected = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleStatusCardClick(item.id)}
                className={`px-3.5 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border text-left ${
                  isSelected
                    ? "bg-accent/15 border-accent text-ink shadow-sm"
                    : "bg-surface2/40 border-line/60 hover:border-line hover:bg-surface2/70 text-muted hover:text-ink"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      {item.label}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-accent text-on-accent flex items-center justify-center shrink-0">
                        <Icon name="eye" className="w-2.5 h-2.5 text-on-accent" />
                      </span>
                    )}
                  </div>
                  <span className={`font-num font-extrabold text-base ${item.isBad ? "text-bad" : "text-ink"}`}>
                    {item.count}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-surface2/80 border border-line/60 flex items-center justify-center text-muted">
                  <Icon name={item.icon} className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Slim Filter Toolbar & View Mode Toggle */}
      <div ref={taskListRef} className="scroll-mt-4 glass-card !px-4 !py-3 border border-line/80 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, ID, person..."
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
            aria-label="Filter by status"
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed / Closed</option>
            <option value="Overdue">Overdue Only</option>
          </Select>

          <Select
            size="sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-36"
            aria-label="Filter by priority"
          >
            <option value="All">Priority: All</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </Select>

          <Select
            size="sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-44"
            aria-label="Sort tasks"
          >
            <option value="due_soon">Sort: Due Soonest</option>
            <option value="due_late">Sort: Due Furthest</option>
            <option value="priority">Sort: Highest Priority</option>
            <option value="recent">Sort: Recently Added</option>
          </Select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-accent hover:bg-accent/10 transition flex items-center gap-1 cursor-pointer"
            >
              <Icon name="rotate-ccw" className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface2/70 p-1 rounded-xl border border-line/60 shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === "list" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name="list" className="w-3.5 h-3.5" />
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === "kanban" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name="columns" className="w-3.5 h-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* 4. Main Content: List View OR Kanban Board */}
      {viewMode === "list" ? (
        <div className="glass-card !p-0 border border-line/80 rounded-[20px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line/60 bg-surface2/50 text-muted font-semibold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Task & Priority</th>
                  <th className="py-3.5 px-3 font-semibold">
                    {activeTab === "team_tasks" ? "Assigned To" : "Assigned By"}
                  </th>
                  <th className="py-3.5 px-3 font-semibold">Due Date</th>
                  <th className="py-3.5 px-3 font-semibold">Progress</th>
                  <th className="py-3.5 px-3 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Icon name="check-square" className="w-8 h-8 text-muted/50" />
                        <span className="text-sm font-semibold text-ink">
                          {activeTab === "team_tasks"
                            ? "No team tasks matching this filter"
                            : "No personal tasks matching this filter"}
                        </span>
                        <span className="text-xs text-muted max-w-sm">
                          {hasActiveFilters
                            ? "Try clearing your search or status filters to see all tasks."
                            : "You are all caught up! New deliverables will appear here."}
                        </span>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-1 px-3.5 py-1.5 rounded-xl bg-surface2 border border-line text-ink text-xs font-semibold hover:border-accent transition cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const overdue = isTaskOverdue(task);
                    const dueNotice = getTaskDueNotice(task);
                    const isAssignee =
                      currentUser?.employeeId === task.assigneeId ||
                      currentUser?.name?.toLowerCase() === task.assigneeName?.toLowerCase();

                    const priorityBadge = {
                      High: "text-bad border-bad/30 bg-bad/10",
                      Medium: "text-warn border-warn/30 bg-warn/10",
                      Low: "text-good border-good/30 bg-good/10"
                    }[task.priority] || "text-muted border-line";

                    const isCompleted = task.status === "Completed" || task.status === "Closed";
                    const isPending = task.status === "Pending";
                    const statusLabel = isCompleted ? "Complete" : isPending ? "Pending" : task.status;
                    const statusTextColor = isCompleted
                      ? "text-good font-medium"
                      : isPending
                      ? "text-muted"
                      : "text-accent font-medium";

                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-surface2/35 transition group ${overdue ? "bg-bad/[0.03]" : ""}`}
                      >
                        {/* Task Title & Priority */}
                        <td className="py-3.5 px-4 max-w-[340px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-data font-semibold text-accent text-[11px]">
                                {task.id}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                                {task.priority}
                              </span>
                              {task.attachments?.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-muted font-medium">
                                  <Icon name="paperclip" className="w-3 h-3" />
                                  {task.attachments.length}
                                </span>
                              )}
                            </div>
                            <span
                              onClick={() => setSelectedTask(task)}
                              className="font-semibold text-ink text-[13px] hover:text-accent cursor-pointer transition leading-snug line-clamp-1"
                            >
                              {task.title}
                            </span>
                            <span className="text-[11px] text-muted truncate font-normal">
                              {task.description}
                            </span>
                          </div>
                        </td>

                        {/* Person */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {activeTab === "team_tasks" ? (
                            <div className="flex items-center gap-2.5">
                              <Avatar name={task.assigneeName} employeeId={task.assigneeId} size="sm" />
                              <div className="flex flex-col">
                                <span className="font-medium text-ink text-[12px]">{task.assigneeName}</span>
                                <span className="text-[10px] text-muted font-normal">{task.assigneeId} · {task.assigneeDept}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <Avatar name={task.assignedByName} employeeId={task.assignedByEmpId} size="sm" />
                              <div className="flex flex-col">
                                <span className="font-medium text-ink text-[12px]">{task.assignedByName}</span>
                                <span className="text-[10px] text-muted font-normal">{task.assignedByRole}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Timeline & Due Notice */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-num text-ink text-[12px]">
                              <Icon name="calendar" className="w-3.5 h-3.5 text-muted" />
                              <span className={overdue ? "text-bad font-semibold" : "font-normal"}>{formatDate(task.dueDate)}</span>
                            </div>
                            {dueNotice && (
                              <span className={`text-[10.5px] font-normal ${
                                dueNotice.type === "bad" ? "text-bad font-medium" :
                                dueNotice.type === "warn" ? "text-warn font-medium" :
                                dueNotice.type === "good" ? "text-good" : "text-muted"
                              }`}>
                                {dueNotice.text}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-num font-semibold text-ink text-xs">
                            {formatPercent(task.progress, { decimals: 0 })}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`text-xs font-normal ${statusTextColor}`}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isAssignee && task.status === "Pending" && (
                              <button
                                type="button"
                                onClick={() => {
                                  startTask(task.id, currentUser);
                                  onTriggerToast(`Started task "${task.title}"`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-accent text-on-accent font-semibold text-[11px] hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Icon name="play" className="w-3 h-3" />
                                Start
                              </button>
                            )}

                            {isAssignee && (task.status === "In Progress" || task.status === "On Hold") && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setProgressTask(task)}
                                  title="Update Progress"
                                  className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line text-ink hover:border-accent font-semibold text-[11px] transition cursor-pointer"
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCompleteTaskItem(task)}
                                  className="px-3 py-1.5 rounded-xl bg-good/15 text-good border border-good/40 font-semibold text-[11px] hover:bg-good/25 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Icon name="check" className="w-3 h-3" />
                                  Complete
                                </button>
                              </>
                            )}

                            {isSupervisor && task.status === "Completed" && (
                              <button
                                type="button"
                                onClick={() => setVerifyCloseTaskItem(task)}
                                className="px-3 py-1.5 rounded-xl bg-good text-white font-semibold text-[11px] hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Icon name="check-circle" className="w-3 h-3" />
                                Close
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedTask(task)}
                              title="View Task Details"
                              className="p-2 rounded-xl bg-surface2 border border-line text-ink hover:border-accent transition cursor-pointer"
                            >
                              <Icon name="eye" className="w-3.5 h-3.5 text-accent" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {Object.entries(kanbanColumns).map(([colName, colTasks]) => {
            const colColor = {
              Pending: "border-line bg-surface2/40 text-muted",
              "In Progress": "border-accent/40 bg-accent/10 text-accent",
              "On Hold": "border-warn/40 bg-warn/10 text-warn",
              "Completed & Closed": "border-good/40 bg-good/10 text-good"
            }[colName];

            return (
              <div
                key={colName}
                className="flex flex-col gap-3 p-4 rounded-[20px] glass-card border border-line/80 bg-surface/50 min-h-[380px] shadow-sm"
              >
                <div className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between font-semibold text-xs ${colColor}`}>
                  <span>{colName}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface border border-line/60 text-ink text-[11px] font-data font-semibold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[580px] pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-muted/60 text-xs italic">
                      No tasks in {colName}
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const overdue = isTaskOverdue(task);
                      const dueNotice = getTaskDueNotice(task);
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`p-3.5 rounded-xl border border-line bg-surface hover:border-accent hover:shadow-md transition cursor-pointer flex flex-col gap-2.5 text-xs ${
                            overdue ? "border-bad/40 bg-bad/[0.03]" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-data font-semibold text-accent text-[11px]">{task.id}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              task.priority === "High" ? "text-bad border-bad/30 bg-bad/10" :
                              task.priority === "Medium" ? "text-warn border-warn/30 bg-warn/10" :
                              "text-good border-good/30 bg-good/10"
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-semibold text-ink text-[13px] line-clamp-2 leading-snug">
                              {task.title}
                            </h4>
                            <p className="text-[11px] text-muted line-clamp-2 mt-1 font-normal">
                              {task.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-line/40">
                            <span className="text-muted flex items-center gap-1 font-data font-normal">
                              <Icon name="calendar" className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                            {dueNotice && (
                              <span className={`text-[10px] font-normal ${
                                dueNotice.type === "bad" ? "text-bad font-medium" :
                                dueNotice.type === "warn" ? "text-warn font-medium" : "text-muted"
                              }`}>
                                {dueNotice.text}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Modals securely */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUser={currentUser}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTriggerToast={onTriggerToast}
          onOpenReassign={(t) => setReassignTaskItem(t)}
          onOpenChangeDue={(t) => setChangeDueTaskItem(t)}
        />
      )}

      {progressTask && (
        <UpdateProgressModal
          task={progressTask}
          currentUser={currentUser}
          isOpen={!!progressTask}
          onClose={() => setProgressTask(null)}
          onTriggerToast={onTriggerToast}
        />
      )}

      {completeTaskItem && (
        <CompleteTaskModal
          task={completeTaskItem}
          currentUser={currentUser}
          isOpen={!!completeTaskItem}
          onClose={() => setCompleteTaskItem(null)}
          onTriggerToast={onTriggerToast}
        />
      )}

      {reassignTaskItem && (
        <ReassignTaskModal
          task={reassignTaskItem}
          currentUser={currentUser}
          isOpen={!!reassignTaskItem}
          onClose={() => setReassignTaskItem(null)}
          onTriggerToast={onTriggerToast}
        />
      )}

      {changeDueTaskItem && (
        <ChangeDueDateModal
          task={changeDueTaskItem}
          currentUser={currentUser}
          isOpen={!!changeDueTaskItem}
          onClose={() => setChangeDueTaskItem(null)}
          onTriggerToast={onTriggerToast}
        />
      )}

      {verifyCloseTaskItem && (
        <VerifyCloseModal
          task={verifyCloseTaskItem}
          currentUser={currentUser}
          isOpen={!!verifyCloseTaskItem}
          onClose={() => setVerifyCloseTaskItem(null)}
          onTriggerToast={onTriggerToast}
        />
      )}
    </div>
  );
};