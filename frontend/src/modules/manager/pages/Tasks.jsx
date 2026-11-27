import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Kpi from '../components/Kpi';
import Drawer from '../components/Drawer';
import FormField from '../components/FormField';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import StatusPill from '../components/StatusPill';
import KanbanBoard from '../components/KanbanBoard';
import PersonSelect from '../components/PersonSelect';
import {
  taskSummaryStats,
  initialTasks,
  teamWorkloadList,
} from '../data/tasks';
import { initialGoals } from '../data/performance';
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  AlertCircle,
  Clock,
  Paperclip,
  Send,
  Check,
  Filter,
  Gauge,
  Briefcase,
  UserPlus,
  TrendingUp,
  Layers,
  AlertOctagon,
  ArrowUpRight,
} from 'lucide-react';

export default function Tasks({ employees = [], onTriggerToast }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Assign Task Drawer State
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    assigneeId: employees[0]?.id || 'EMP-001',
    priority: 'High',
    startDate: '6 Nov 2026',
    dueDate: '13 Nov 2026',
    linkedGoal: initialGoals[0]?.title || 'Platform Reliability',
    checklist: [{ text: '', done: false }],
    reminder: '1 day before',
  });
  const [assignErrors, setAssignErrors] = useState({});

  // Task Detail Drawer State
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isExtendingDeadline, setIsExtendingDeadline] = useState(false);
  const [extendedDate, setExtendedDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const notify = (msg, undoFn) => {
    if (onTriggerToast) onTriggerToast(msg, undoFn);
  };

  // Move task (Kanban drag/drop or keyboard action)
  const handleMoveTask = (taskId, targetStatus) => {
    const prev = [...tasks];
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              isOverdue: targetStatus === 'Done' ? false : t.isOverdue,
              activity: [
                {
                  action: `Status moved to ${targetStatus}`,
                  time: 'Just now',
                },
                ...t.activity,
              ],
            }
          : t
      )
    );

    notify(
      `Moved "${targetTask.title}" to ${targetStatus}`,
      () => setTasks(prev)
    );
  };

  // Assign Task submit
  const handleAssignTaskSubmit = () => {
    if (!assignForm.title.trim()) {
      setAssignErrors({ title: 'Task title is required' });
      return;
    }

    const assignee = employees.find((e) => e.id === assignForm.assigneeId);
    const newTask = {
      id: `TSK-${Date.now()}`,
      title: assignForm.title,
      description: assignForm.description,
      status: 'To do',
      assigneeId: assignForm.assigneeId,
      assigneeName: assignee ? assignee.name : 'Team Member',
      assigneeAvatar: assignee?.avatar || assignee?.name?.slice(0, 2).toUpperCase() || 'TM',
      priority: assignForm.priority,
      startDate: assignForm.startDate,
      dueDate: assignForm.dueDate,
      isOverdue: false,
      linkedGoal: assignForm.linkedGoal,
      subtasks: assignForm.checklist
        .filter((c) => c.text.trim())
        .map((c, i) => ({ id: `sub-${Date.now()}-${i}`, title: c.text, done: false })),
      attachments: [],
      comments: [],
      activity: [{ action: `Task assigned to ${assignee?.name}`, time: 'Just now' }],
    };

    const prev = [...tasks];
    setTasks([newTask, ...tasks]);
    setIsAssignDrawerOpen(false);
    setAssignForm({
      title: '',
      description: '',
      assigneeId: employees[0]?.id || 'EMP-001',
      priority: 'High',
      startDate: '6 Nov 2026',
      dueDate: '13 Nov 2026',
      linkedGoal: initialGoals[0]?.title || 'Platform Reliability',
      checklist: [{ text: '', done: false }],
      reminder: '1 day before',
    });
    setAssignErrors({});

    notify(`Task assigned to ${newTask.assigneeName}`, () => setTasks(prev));
  };

  // Add comment to task
  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTask) return;
    const updated = {
      ...selectedTask,
      comments: [
        ...selectedTask.comments,
        { author: 'Lokesh Kumar', text: newComment, time: 'Just now' },
      ],
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)));
    setNewComment('');
  };

  // Extend deadline
  const handleExtendDeadlineSubmit = () => {
    if (!extendedDate || !selectedTask) return;
    const prev = [...tasks];
    const updated = {
      ...selectedTask,
      dueDate: extendedDate,
      isOverdue: false,
      activity: [
        {
          action: `Deadline extended to ${extendedDate} (${extendReason || 'Manager approval'})`,
          time: 'Just now',
        },
        ...selectedTask.activity,
      ],
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)));
    setIsExtendingDeadline(false);
    setExtendedDate('');
    setExtendReason('');

    notify(`Deadline extended to ${extendedDate} for "${selectedTask.title}"`, () =>
      setTasks(prev)
    );
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedPerson !== 'all' && t.assigneeId !== selectedPerson) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Controls Strip with Subtitle and View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[12.5px] text-muted">
          Sprint deliverables, Kanban board lanes, and engineer workload distribution
        </p>

        <div className="flex items-center gap-2 ml-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-surface2 rounded-xl border border-line p-0.5 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'board' ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              <List size={13} />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('capacity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'capacity' ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              <Gauge size={13} />
              <span>Capacity & Staffing</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAssignDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-on-accent text-[12.5px] font-bold shadow-sm hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2.4} />
            <span>Assign task</span>
          </button>
        </div>
      </div>

      {/* View Mode Switching: Capacity & Staffing vs Board/List */}
      {viewMode === 'capacity' ? (
        <div className="flex flex-col gap-5">
          {/* Capacity KPI summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <Kpi
              label="Sprint Capacity"
              value="960h"
              change="24 engineers"
              sublabel="40 hrs/week base"
              trend="neutral"
            />
            <Kpi
              label="Workload Allocated"
              value="820h"
              change="85.4% utilized"
              sublabel="Optimal band (80–90%)"
              trend="up"
            />
            <Kpi
              label="Over-allocated"
              value="2 engineers"
              change="Platform Pod"
              sublabel="Load > 105% capacity"
              trend="down"
            />
            <Kpi
              label="Staffing Needs"
              value="3 requisitions"
              change="2 High Priority"
              sublabel="Platform & SDET gaps"
              trend="up"
            />
          </div>

          {/* Pod-wise Capacity Bars & Staffing Needs Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pod Capacity Overview (2 Cols) */}
            <Card
              title="Pod-wise Capacity & Workload Allocation"
              subtitle="Current Sprint 44 allocation across engineering pods"
              className="lg:col-span-2"
            >
              <div className="flex flex-col gap-4">
                {[
                  {
                    pod: 'Platform Engineering',
                    allocated: 324,
                    total: 300,
                    pct: 108,
                    status: 'Over-allocated',
                    engineers: 6,
                    head: 'Aarav Mehta',
                  },
                  {
                    pod: 'Frontend Guild',
                    allocated: 276,
                    total: 300,
                    pct: 92,
                    status: 'Optimal',
                    engineers: 7,
                    head: 'Sneha Reddy',
                  },
                  {
                    pod: 'Core Backend & Data Services',
                    allocated: 202,
                    total: 240,
                    pct: 84,
                    status: 'Optimal',
                    engineers: 6,
                    head: 'Karthik Iyer',
                  },
                  {
                    pod: 'Quality & Test Automation',
                    allocated: 78,
                    total: 120,
                    pct: 65,
                    status: 'Available Bandwidth',
                    engineers: 3,
                    head: 'Rahul Verma',
                  },
                  {
                    pod: 'Design System & UX',
                    allocated: 72,
                    total: 80,
                    pct: 90,
                    status: 'Optimal',
                    engineers: 2,
                    head: 'Divya Menon',
                  },
                ].map((p) => (
                  <div
                    key={p.pod}
                    className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-[13px] flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{p.pod}</span>
                        <span className="text-[11px] text-muted">
                          ({p.engineers} engineers · Lead: {p.head})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted">
                          {p.allocated}h / {p.total}h
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            p.pct > 100
                              ? 'bg-bad/15 text-bad border-bad/30'
                              : p.pct >= 80
                              ? 'bg-accent/15 text-accent border-accent/30'
                              : 'bg-good/15 text-good border-good/30'
                          }`}
                        >
                          {p.pct}% ({p.status})
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.pct > 100 ? 'bg-bad' : p.pct >= 80 ? 'bg-accent' : 'bg-good'
                        }`}
                        style={{ width: `${Math.min(p.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Staffing Needs Card (1 Col) */}
            <Card
              title="Staffing Needs & Gaps"
              subtitle="Open headcount requirements to relieve bottlenecks"
              action={
                <Link
                  to="/manager/team?view=vacancies"
                  className="text-[11px] text-accent font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Vacancies</span>
                  <ArrowUpRight size={12} />
                </Link>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-xl bg-bad/10 border border-bad/30 text-[12px] text-bad flex items-start gap-2">
                  <AlertOctagon size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Capacity Bottleneck Alert:</strong>
                    <p className="text-[11.5px] text-muted mt-0.5">
                      Platform pod is operating at 108% capacity. Scaling microservices and Aurora initiative require immediate requisition backfills.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mt-1">
                  {[
                    {
                      role: 'Senior Distributed Systems Engineer',
                      pod: 'Platform Pod',
                      urgency: 'Immediate (High)',
                      needed: 2,
                      experience: '5+ years (Go/Kubernetes)',
                    },
                    {
                      role: 'Senior SDET / Performance Engineer',
                      pod: 'Quality Guild',
                      urgency: 'Sprint 45 (Medium)',
                      needed: 1,
                      experience: '4+ years (k6 / Cypress)',
                    },
                    {
                      role: 'Cloud Security Architect',
                      pod: 'DevOps / Platform',
                      urgency: 'Q1 2027 (Planned)',
                      needed: 1,
                      experience: '6+ years (AWS / SOC2)',
                    },
                  ].map((req, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface2/50 border border-line flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink text-[12.5px] leading-snug">
                          {req.role}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 shrink-0">
                          +{req.needed} open
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>{req.pod} · {req.experience}</span>
                        <span className={req.urgency.includes('High') ? 'text-bad font-semibold' : 'text-warn font-semibold'}>
                          {req.urgency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Per-Engineer Allocation & Workload Table */}
          <Card
            title="Engineer Workload & Allocation Roster"
            subtitle="Sprint 44 story points, weekly committed hours and utilization status"
          >
            <div className="overflow-x-auto w-full rounded-xl border border-line bg-surface/30">
              <table className="w-full border-collapse text-left min-w-[700px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface2/50 text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                    <th className="py-2.5 px-3">Engineer</th>
                    <th className="py-2.5 px-3">Pod / Role</th>
                    <th className="py-2.5 px-3">Story Points</th>
                    <th className="py-2.5 px-3">Committed / Available</th>
                    <th className="py-2.5 px-3">Utilization</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/30">
                  {[
                    { name: 'Aarav Mehta', role: 'Staff Engineer', pod: 'Platform', points: 15, committed: 45, max: 40, pct: 112, status: 'Over-allocated' },
                    { name: 'Sneha Reddy', role: 'Lead Frontend', pod: 'Frontend', points: 13, committed: 38, max: 40, pct: 95, status: 'Optimal' },
                    { name: 'Rohan Gupta', role: 'Senior SRE', pod: 'Platform', points: 11, committed: 42, max: 40, pct: 105, status: 'Over-allocated' },
                    { name: 'Karthik Iyer', role: 'Database Architect', pod: 'Backend', points: 10, committed: 36, max: 40, pct: 90, status: 'Optimal' },
                    { name: 'Vikram Singh', role: 'DevOps Engineer', pod: 'Platform', points: 12, committed: 41, max: 40, pct: 102, status: 'Over-allocated' },
                    { name: 'Divya Nair', role: 'UI Engineer', pod: 'Frontend', points: 8, committed: 34, max: 40, pct: 85, status: 'Optimal' },
                    { name: 'Rahul Verma', role: 'QA Lead', pod: 'Quality', points: 7, committed: 28, max: 40, pct: 70, status: 'Available' },
                    { name: 'Amit Deshmukh', role: 'Security Analyst', pod: 'Backend', points: 8, committed: 32, max: 40, pct: 80, status: 'Optimal' },
                    { name: 'Pooja Sharma', role: 'Backend Dev', pod: 'Backend', points: 9, committed: 35, max: 40, pct: 88, status: 'Optimal' },
                    { name: 'Sanjay Rao', role: 'Frontend Dev', pod: 'Frontend', points: 9, committed: 36, max: 40, pct: 90, status: 'Optimal' },
                  ].map((eng) => (
                    <tr key={eng.name} className="hover:bg-surface2/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={eng.name} size={26} />
                          <span className="font-semibold text-ink">{eng.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted">
                        <span>{eng.role}</span>
                        <span className="text-[11px] font-mono text-muted/70 block">{eng.pod} Pod</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-ink">
                        {eng.points} pts
                      </td>
                      <td className="py-3 px-3 font-mono text-muted">
                        <span className={eng.committed > eng.max ? 'text-bad font-bold' : 'text-ink'}>
                          {eng.committed}h
                        </span>{' '}
                        / {eng.max}h
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-surface2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                eng.pct > 100 ? 'bg-bad' : eng.pct >= 80 ? 'bg-accent' : 'bg-good'
                              }`}
                              style={{ width: `${Math.min(eng.pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted">{eng.pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            eng.status === 'Over-allocated'
                              ? 'bg-bad/15 text-bad border-bad/30'
                              : eng.status === 'Optimal'
                              ? 'bg-accent/15 text-accent border-accent/30'
                              : 'bg-good/15 text-good border-good/30'
                          }`}
                        >
                          {eng.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Summary KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <Kpi
              label="Open Tasks"
              value={taskSummaryStats.open}
              change="31 total"
              sublabel="Across 24 engineers"
              trend="neutral"
            />
            <Kpi
              label="In Progress"
              value={taskSummaryStats.inProgress}
              change="Active sprints"
              sublabel="High team velocity"
              trend="up"
            />
            <Kpi
              label="Tasks Overdue"
              value={taskSummaryStats.overdue}
              change="Needs escalation"
              sublabel="4 delayed tickets"
              trend="down"
            />
            <Kpi
              label="Completed This Week"
              value={taskSummaryStats.completedThisWeek}
              change="18 delivered"
              sublabel="Sprint 44 on track"
              trend="up"
            />
          </div>

          {/* Grid: 2 equal columns, widgets taskboard and tasklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Widget: taskboard (spans 2) */}
            <Card
              id="taskboard"
              title="Sprint Task Board"
              className="col-span-1 md:col-span-2"
              action={
                <div className="flex items-center gap-3">
                  <PersonSelect
                    employees={employees}
                    selectedPerson={selectedPerson}
                    onChange={setSelectedPerson}
                    label="Assignee:"
                  />
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                    <span>Priority:</span>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="bg-[#0a222b] text-ink rounded-lg px-2 py-1 border border-line text-[11px] outline-none cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-[#0a222b] text-ink">All</option>
                      <option value="High" className="bg-[#0a222b] text-ink">High</option>
                      <option value="Medium" className="bg-[#0a222b] text-ink">Medium</option>
                      <option value="Low" className="bg-[#0a222b] text-ink">Low</option>
                    </select>
                  </div>
                </div>
              }
            >
              {viewMode === 'board' ? (
                <KanbanBoard
                  tasks={filteredTasks}
                  onTaskClick={setSelectedTask}
                  onMoveTask={handleMoveTask}
                />
              ) : (
                /* List View */
                <div className="overflow-x-auto w-full rounded-xl border border-line bg-surface/30">
                  <table className="w-full border-collapse text-left min-w-[650px] text-[12.5px]">
                    <thead>
                      <tr className="border-b border-line bg-surface2/50 text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                        <th className="py-2.5 px-3">Task Title</th>
                        <th className="py-2.5 px-3">Assignee</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Subtasks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/30">
                      {filteredTasks.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className="hover:bg-surface2/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3 font-semibold text-ink">{t.title}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={t.assigneeName} size={22} />
                              <span className="text-muted">{t.assigneeName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Tag
                              variant={
                                t.priority === 'High'
                                  ? 'bad'
                                  : t.priority === 'Medium'
                                  ? 'warn'
                                  : 'default'
                              }
                            >
                              {t.priority}
                            </Tag>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface2 text-ink border border-line">
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span className={t.isOverdue ? 'text-bad font-bold' : 'text-muted'}>
                              {t.dueDate}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted">
                            {t.subtasks?.filter((s) => s.done).length || 0}/{t.subtasks?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Widget: tasklist (spans 2) - Workload by Engineer */}
            <Card
              id="tasklist"
              title="Team Workload & Capacity Tracker"
              className="col-span-1 md:col-span-2"
              action={
                <span className="text-[11px] font-mono text-muted">
                  24 team members · Workload balanced
                </span>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {teamWorkloadList.map((w) => {
                  const pct = Math.round((w.completedTasks / w.totalTasks) * 100);

                  return (
                    <div
                      key={w.employeeId}
                      className="p-3.5 rounded-xl bg-surface2/30 border border-line flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={w.name} size={32} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold text-ink truncate">
                            {w.name}
                          </span>
                          <span className="text-[11px] text-muted font-mono">
                            {w.completedTasks} of {w.totalTasks} completed
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 flex flex-col gap-1">
                          <div className="w-full h-1.5 rounded-full bg-surface2 overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted text-right">
                            {pct}%
                          </span>
                        </div>

                        {w.overdueCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bad/20 text-bad border border-bad/40">
                            {w.overdueCount} overdue
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Assign Task Drawer */}
      <Drawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        title="Assign New Sprint Task"
        width="520px"
      >
        <div className="flex flex-col gap-4">
          <FormField label="Task Title" id="tsk-title" error={assignErrors.title} required>
            <input
              id="tsk-title"
              type="text"
              value={assignForm.title}
              onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
              placeholder="e.g. Implement WebSocket reconnection retry backoff"
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2 rounded-xl border border-line focus:border-accent outline-none"
            />
          </FormField>

          <FormField label="Description" id="tsk-desc">
            <Textarea
              id="tsk-desc"
              value={assignForm.description}
              onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
              placeholder="Detailed acceptance criteria, reproduction steps, or context..."
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Assignee" id="tsk-assignee" required>
              <Select
                id="tsk-assignee"
                value={assignForm.assigneeId}
                onChange={(e) => setAssignForm({ ...assignForm, assigneeId: e.target.value })}
                options={employees.map((e) => ({ value: e.id, label: e.name }))}
              />
            </FormField>

            <FormField label="Priority" id="tsk-priority">
              <Select
                id="tsk-priority"
                value={assignForm.priority}
                onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                options={['Low', 'Medium', 'High']}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" id="tsk-start">
              <input
                id="tsk-start"
                type="text"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2 rounded-xl border border-line font-mono"
              />
            </FormField>
            <FormField label="Due Date" id="tsk-due">
              <input
                id="tsk-due"
                type="text"
                value={assignForm.dueDate}
                onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2 rounded-xl border border-line font-mono"
              />
            </FormField>
          </div>

          <FormField label="Link to OKR / Goal" id="tsk-goal">
            <Select
              id="tsk-goal"
              value={assignForm.linkedGoal}
              onChange={(e) => setAssignForm({ ...assignForm, linkedGoal: e.target.value })}
              options={initialGoals.map((g) => ({ value: g.title, label: g.title }))}
            />
          </FormField>

          <FormField label="Reminder Schedule" id="tsk-reminder">
            <Select
              id="tsk-reminder"
              value={assignForm.reminder}
              onChange={(e) => setAssignForm({ ...assignForm, reminder: e.target.value })}
              options={['1 day before', 'On due date', '2 hours before deadline']}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line mt-2">
            <button
              type="button"
              onClick={() => setIsAssignDrawerOpen(false)}
              className="px-3.5 py-2 rounded-xl bg-surface2 text-muted border border-line text-[12.5px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignTaskSubmit}
              className="px-4 py-2 rounded-xl bg-accent text-on-accent text-[12.5px] font-bold shadow-sm hover:opacity-90"
            >
              Assign task
            </button>
          </div>
        </div>
      </Drawer>

      {/* Task Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedTask)}
        onClose={() => {
          setSelectedTask(null);
          setIsExtendingDeadline(false);
        }}
        title={selectedTask?.title || 'Task Details'}
        width="520px"
      >
        {selectedTask && (
          <div className="flex flex-col gap-4 text-[13px]">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Tag
                  variant={
                    selectedTask.priority === 'High'
                      ? 'bad'
                      : selectedTask.priority === 'Medium'
                      ? 'warn'
                      : 'default'
                  }
                >
                  {selectedTask.priority} Priority
                </Tag>
                <span className="text-[12px] font-mono font-bold text-accent">
                  {selectedTask.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleMoveTask(selectedTask.id, 'Done')}
                className="px-3 py-1 rounded-xl bg-good text-[#06141c] text-[11.5px] font-bold flex items-center gap-1 shadow-sm"
              >
                <Check size={13} strokeWidth={2.4} />
                <span>Mark complete</span>
              </button>
            </div>

            <p className="text-ink/90 leading-relaxed bg-surface2/40 p-3 rounded-xl border border-line/40">
              {selectedTask.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="text-muted block text-[11px]">Assignee</span>
                <span className="font-bold text-ink flex items-center gap-1.5 mt-0.5">
                  <Avatar name={selectedTask.assigneeName} size={20} />
                  {selectedTask.assigneeName}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Due Date</span>
                <span className={`font-mono font-bold mt-0.5 inline-block ${selectedTask.isOverdue ? 'text-bad' : 'text-ink'}`}>
                  {selectedTask.dueDate} {selectedTask.isOverdue && '(Overdue)'}
                </span>
              </div>
            </div>

            {/* Extend deadline accordion */}
            <div className="p-3 rounded-xl bg-surface2/30 border border-line flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-muted">Need more time?</span>
                <button
                  type="button"
                  onClick={() => setIsExtendingDeadline(!isExtendingDeadline)}
                  className="text-[12px] text-accent font-bold hover:underline"
                >
                  {isExtendingDeadline ? 'Cancel' : 'Extend deadline'}
                </button>
              </div>

              {isExtendingDeadline && (
                <div className="flex flex-col gap-2 pt-2 border-t border-line/40">
                  <input
                    type="text"
                    value={extendedDate}
                    onChange={(e) => setExtendedDate(e.target.value)}
                    placeholder="New due date (e.g. 15 Nov 2026)"
                    className="w-full bg-surface2 text-ink text-[12px] px-3 py-1.5 rounded-lg border border-line font-mono"
                  />
                  <input
                    type="text"
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    placeholder="Reason for extension (e.g. Waiting on partner API)"
                    className="w-full bg-surface2 text-ink text-[12px] px-3 py-1.5 rounded-lg border border-line"
                  />
                  <button
                    type="button"
                    onClick={handleExtendDeadlineSubmit}
                    className="self-end px-3 py-1 bg-accent text-on-accent text-[11.5px] font-bold rounded-lg"
                  >
                    Confirm extension
                  </button>
                </div>
              )}
            </div>

            {/* Subtasks checklist */}
            {selectedTask.subtasks?.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                  Subtasks Checklist
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedTask.subtasks.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={() => {
                          const updatedSt = selectedTask.subtasks.map((s) =>
                            s.id === st.id ? { ...s, done: !s.done } : s
                          );
                          const upd = { ...selectedTask, subtasks: updatedSt };
                          setSelectedTask(upd);
                          setTasks(tasks.map((t) => (t.id === upd.id ? upd : t)));
                        }}
                        className="rounded bg-surface2 border-line text-accent w-3.5 h-3.5"
                      />
                      <span className={st.done ? 'line-through text-muted' : 'text-ink'}>
                        {st.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Thread */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
                Discussion & Notes
              </span>
              <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                {selectedTask.comments?.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface2/40 text-[11.5px] flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-muted text-[10.5px]">
                      <strong className="text-ink">{c.author}</strong>
                      <span className="font-mono">{c.time}</span>
                    </div>
                    <p className="text-ink/90 mt-0.5">{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Post comment to thread..."
                  className="flex-1 bg-surface2 text-ink text-[12px] px-3 py-1.5 rounded-lg border border-line outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="p-2 rounded-lg bg-accent text-on-accent"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

