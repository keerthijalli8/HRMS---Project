// src/pages/Tasks.jsx
// My Tasks module with Kanban board and List views, task progress sliders, time logging, and detail drawers.

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  List,
  Columns
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { KpiTile } from '../components/Kpi.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Progress } from '../components/Progress.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { Table } from '../components/Table.jsx';
import { taskService } from '../services/taskService.js';
import { formatDate } from '../utils/format.js';

const STATUS_COLUMNS = ['To do', 'In progress', 'In review', 'Done'];

export function Tasks() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dueThisWeekOnly, setDueThisWeekOnly] = useState(false);

  // Selected task drawer
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressVal, setProgressVal] = useState(0);
  const [statusVal, setStatusVal] = useState('In progress');
  const [commentText, setCommentText] = useState('');
  const [logHours, setLogHours] = useState('');
  const [logNote, setLogNote] = useState('');

  // Extension request sub-drawer
  const [extDrawerOpen, setExtDrawerOpen] = useState(false);
  const [extDate, setExtDate] = useState('2026-11-15');
  const [extReason, setExtReason] = useState('');

  const loadTasks = async () => {
    const list = await taskService.getTasks();
    setTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setProgressVal(task.progress);
    setStatusVal(task.status);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const oldStatus = tasks.find(t => t.id === taskId)?.status;
    try {
      const res = await taskService.updateTaskStatus(taskId, newStatus);
      await loadTasks();

      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: res.newStatus, waitingForManager: res.waitingForManager } : null);
      }

      showToast(
        res.waitingForManager
          ? 'Moved to In Review. Waiting for manager approval to mark Done.'
          : `Task moved to ${res.newStatus}`,
        {
          undoLabel: 'Undo',
          onUndo: async () => {
            await taskService.updateTaskStatus(taskId, oldStatus);
            await loadTasks();
            showToast(`Reverted task status to ${oldStatus}`);
          }
        }
      );
    } catch (err) {
      showToast(err.message || 'Failed to update status');
    }
  };

  const handleProgressChange = async (taskId, val) => {
    setProgressVal(val);
    await taskService.updateProgress(taskId, val);
    await loadTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, progress: val } : null);
    }
  };

  const handleToggleChecklist = async (taskId, itemIdx) => {
    await taskService.toggleChecklistItem(taskId, itemIdx);
    await loadTasks();
    if (selectedTask?.id === taskId) {
      const updatedChecklist = [...selectedTask.checklist];
      updatedChecklist[itemIdx].done = !updatedChecklist[itemIdx].done;
      setSelectedTask(prev => prev ? { ...prev, checklist: updatedChecklist } : null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    const added = await taskService.addComment(selectedTask.id, commentText);
    await loadTasks();
    setSelectedTask(prev => prev ? { ...prev, comments: [...(prev.comments || []), added] } : null);
    setCommentText('');
    showToast('Comment added');
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!logHours || !selectedTask) return;
    const added = await taskService.logTime(selectedTask.id, logHours, logNote);
    await loadTasks();
    setSelectedTask(prev => prev ? { ...prev, timeLogs: [added, ...(prev.timeLogs || [])] } : null);
    setLogHours('');
    setLogNote('');
    showToast(`Logged ${logHours}h on ${selectedTask.id}`);
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    await taskService.requestExtension(selectedTask.id, extDate, extReason);
    await loadTasks();
    setExtDrawerOpen(false);
    setExtReason('');
    showToast('Deadline extension request sent to Priya Nair');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'All' && t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (priorityFilter !== 'All' && t.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (dueThisWeekOnly && !t.dueNote.toLowerCase().includes('today') && !t.dueNote.toLowerCase().includes('tomorrow') && !t.dueNote.toLowerCase().includes('week')) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. TASKSUM TILES (Section 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[var(--gap)]">
        <KpiTile label="Assigned Tasks" value="12" delta="Total" subtext="active queue" icon={CheckSquare} />
        <KpiTile label="In Progress" value="4" delta="Active now" isPositive={true} subtext="sprint focus" icon={Clock} />
        <KpiTile label="In Review" value="2" delta="Manager review" subtext="awaiting check" icon={User} />
        <KpiTile label="Overdue" value="1" delta="Action required" isPositive={false} subtext="deadline passed" icon={AlertCircle} />
        <KpiTile label="Completed" value="5" delta="This week" isPositive={true} subtext="great velocity" icon={CheckCircle2} />
      </div>

      {/* 2. FILTER & VIEW BAR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-full bg-surface2/60 border border-line text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent w-44"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface2/60 border border-line rounded-full px-3 py-1.5 text-xs text-ink focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#0b1f2b] text-ink">All Statuses</option>
            <option value="To do" className="bg-[#0b1f2b] text-ink">To do</option>
            <option value="In progress" className="bg-[#0b1f2b] text-ink">In progress</option>
            <option value="In review" className="bg-[#0b1f2b] text-ink">In review</option>
            <option value="Done" className="bg-[#0b1f2b] text-ink">Done</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface2/60 border border-line rounded-full px-3 py-1.5 text-xs text-ink focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#0b1f2b] text-ink">All Priorities</option>
            <option value="Urgent" className="bg-[#0b1f2b] text-ink">Urgent</option>
            <option value="High" className="bg-[#0b1f2b] text-ink">High</option>
            <option value="Medium" className="bg-[#0b1f2b] text-ink">Medium</option>
            <option value="Low" className="bg-[#0b1f2b] text-ink">Low</option>
          </select>

          {/* Due this week pill */}
          <button
            onClick={() => setDueThisWeekOnly(!dueThisWeekOnly)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              dueThisWeekOnly
                ? 'bg-accent text-on-accent border-accent font-semibold'
                : 'bg-surface2/60 border-line text-muted hover:text-ink'
            }`}
          >
            Due this week only
          </button>
        </div>

        {/* Board / List Toggle */}
        <div className="flex items-center rounded-full border border-line bg-surface2/60 p-0.5 text-xs">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
              viewMode === 'board' ? 'bg-accent text-on-accent' : 'text-muted'
            }`}
          >
            <Columns className="w-3.5 h-3.5" strokeWidth={1.8} /> Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
              viewMode === 'list' ? 'bg-accent text-on-accent' : 'text-muted'
            }`}
          >
            <List className="w-3.5 h-3.5" strokeWidth={1.8} /> List
          </button>
        </div>
      </div>

      {/* 3. BOARD OR LIST VIEW */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col);
            return (
              <div
                key={col}
                className="glass-card p-4 space-y-3 min-h-[450px] bg-surface/50 flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-line/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-[14px] text-ink">
                      {col}
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-surface2 text-muted text-[11px] font-mono">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openTaskDetail(task)}
                      className="p-3.5 rounded-tpl border border-line bg-surface2/40 hover:bg-surface2 transition-all cursor-pointer space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Tag
                          color={
                            task.priority === 'Urgent'
                              ? 'bad'
                              : task.priority === 'High'
                              ? 'warn'
                              : 'default'
                          }
                        >
                          {task.priority}
                        </Tag>
                        <Avatar name={task.assignedBy.name} size={22} alt={task.assignedBy.name} />
                      </div>

                      <h4 className="font-medium text-[13px] text-ink leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted">
                          <span
                            className={
                              task.dueNote.includes('today') || task.dueNote.includes('tomorrow')
                                ? 'text-warn font-semibold'
                                : ''
                            }
                          >
                            {task.dueNote}
                          </span>
                          <span className="font-mono">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} max={100} height={4} />
                      </div>

                      {/* Accessible Move To selector */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-2 border-t border-line/30 flex items-center justify-between text-[11px]"
                      >
                        <span className="text-muted">Move to:</span>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="bg-surface2 text-ink border border-line rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-accent cursor-pointer"
                        >
                          {STATUS_COLUMNS.map(s => (
                            <option key={s} value={s} className="bg-[#0b1f2b] text-ink">{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-muted/60 text-xs">
                      No tasks in this column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card title="Task Directory">
          <Table
            keyField="id"
            columns={[
              {
                header: 'Task ID',
                key: 'id',
                render: (id) => <span className="font-mono font-semibold text-accent">{id}</span>
              },
              {
                header: 'Title & Assigned By',
                key: 'title',
                render: (title, row) => (
                  <div className="space-y-1">
                    <span className="font-semibold text-ink block">{title}</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Avatar name={row.assignedBy.name} size={18} />
                      <span>{row.assignedBy.name}</span>
                    </div>
                  </div>
                )
              },
              {
                header: 'Priority',
                key: 'priority',
                render: (p) => (
                  <Tag color={p === 'Urgent' ? 'bad' : p === 'High' ? 'warn' : 'default'}>
                    {p}
                  </Tag>
                )
              },
              {
                header: 'Deadline',
                key: 'dueDate',
                render: (date, row) => (
                  <div className="text-xs">
                    <span className="text-ink font-mono block">{formatDate(date)}</span>
                    <span className={row.dueNote.includes('today') ? 'text-warn font-semibold' : 'text-muted'}>
                      {row.dueNote}
                    </span>
                  </div>
                )
              },
              {
                header: 'Progress',
                key: 'progress',
                render: (prog) => (
                  <div className="w-24 space-y-1">
                    <span className="text-xs font-mono text-muted">{prog}%</span>
                    <Progress value={prog} max={100} height={4} />
                  </div>
                )
              },
              {
                header: 'Status',
                key: 'status',
                render: (s) => <StatusPill status={s} label={s} />
              },
              {
                header: 'Actions',
                key: 'actions',
                render: (_, row) => (
                  <button
                    onClick={() => openTaskDetail(row)}
                    className="text-accent hover:underline text-xs font-semibold"
                  >
                    Open
                  </button>
                )
              }
            ]}
            data={filteredTasks}
          />
        </Card>
      )}

      {/* Task Detail Drawer (Section 14) */}
      <Drawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? `Task Details: ${selectedTask.id}` : ''}
      >
        {selectedTask && (
          <div className="space-y-5 text-[13px]">
            {/* Title & Assigned */}
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-ink leading-snug">
                {selectedTask.title}
              </h3>
              <div className="flex items-center gap-2 pt-1">
                <Tag color={selectedTask.priority === 'Urgent' ? 'bad' : 'warn'}>
                  {selectedTask.priority}
                </Tag>
                <span className="text-xs text-muted">
                  Assigned by {selectedTask.assignedBy.name}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-tpl bg-surface2/30 border border-line text-muted leading-relaxed">
              {selectedTask.description}
            </div>

            {/* Progress Slider (0–100) */}
            <div className="p-4 rounded-tpl bg-surface2/50 border border-line space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink">Update Progress</span>
                <span className="font-mono font-bold text-accent text-sm">{progressVal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progressVal}
                onChange={(e) => handleProgressChange(selectedTask.id, e.target.value)}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            {/* Status Change (Section 14: Done requires manager acceptance) */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Workflow Status
              </label>
              <select
                value={selectedTask.status}
                onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none cursor-pointer"
              >
                <option value="To do" className="bg-[#0b1f2b] text-ink">To do</option>
                <option value="In progress" className="bg-[#0b1f2b] text-ink">In progress</option>
                <option value="In review" className="bg-[#0b1f2b] text-ink">In review</option>
                <option value="Done" className="bg-[#0b1f2b] text-ink">Done (Awaiting Manager Acceptance)</option>
              </select>
              {selectedTask.waitingForManager && (
                <p className="text-[11px] text-warn mt-1">
                  ⏳ Marked as Done. Waiting for manager review & acceptance.
                </p>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono block">
                Deliverable Checklist
              </span>
              <div className="space-y-2">
                {selectedTask.checklist?.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2.5 p-2 rounded-tpl bg-surface2/30 border border-line/60 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleChecklist(selectedTask.id, idx)}
                      className="accent-accent"
                    />
                    <span className={item.done ? 'line-through text-muted' : 'text-ink'}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Logging */}
            <form onSubmit={handleLogTime} className="space-y-2 p-3.5 rounded-tpl bg-surface2/40 border border-line">
              <span className="text-xs font-semibold text-ink block">Log Work Time</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  required
                  placeholder="Hours (e.g. 2.5)"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="bg-surface2 border border-line rounded-tpl px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Note (e.g. Bug fixes)"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="bg-surface2 border border-line rounded-tpl px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                />
              </div>
              <PrimaryButton type="submit" size="sm" className="w-full">
                Add Log Entry
              </PrimaryButton>
            </form>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2 border-t border-line/40">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono block">
                Activity & Notes
              </span>
              <div className="space-y-2">
                {selectedTask.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-tpl bg-surface2/20 border border-line/40 text-xs space-y-1">
                    <div className="flex justify-between text-muted text-[10.5px]">
                      <span className="font-semibold text-ink">{c.user}</span>
                      <span>{c.time}</span>
                    </div>
                    <p className="text-muted leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-surface2 border border-line rounded-tpl px-3 py-1.5 text-xs text-ink focus:outline-none"
                />
                <SecondaryButton type="submit" size="sm">
                  Send
                </SecondaryButton>
              </form>
            </div>

            {/* Request Extension Button */}
            <div className="pt-2 border-t border-line/40">
              <button
                type="button"
                onClick={() => setExtDrawerOpen(true)}
                className="w-full py-2 rounded-tpl border border-line text-xs font-medium text-warn hover:bg-warn/10 transition-colors"
              >
                Request Deadline Extension
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Extension Request Sub-Drawer */}
      <Drawer
        isOpen={extDrawerOpen}
        onClose={() => setExtDrawerOpen(false)}
        title="Request Deadline Extension"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setExtDrawerOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleRequestExtension}>Send Request</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4 text-[13px]">
          <p className="text-muted">
            Requesting extension for task: <strong>{selectedTask?.title}</strong>
          </p>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Proposed New Deadline
            </label>
            <input
              type="date"
              required
              value={extDate}
              onChange={(e) => setExtDate(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Reason for Extension *
            </label>
            <textarea
              required
              rows={3}
              value={extReason}
              onChange={(e) => setExtReason(e.target.value)}
              placeholder="Explain dependency blocks or workload scope changes..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default Tasks;

