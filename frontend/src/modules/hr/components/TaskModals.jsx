import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { Avatar } from './Avatar.jsx';
import { StatusPill } from './StatusPill.jsx';
import { PrimaryButton, SecondaryButton } from './Buttons.jsx';
import { Select } from './Select.jsx';
import { loadEmployees } from '../services/employeeStore.js';
import { formatDate, formatDateTime, formatPercent } from '../utils/format.js';
import {
  isTaskOverdue,
  getTaskDueNotice,
  canUserAssignTasks,
  startTask,
  updateTaskProgress,
  completeTask,
  verifyAndCloseTask,
  reassignTask,
  changeTaskDueDate,
  addTaskComment,
  createTask
} from '../services/taskStore.js';

export const TaskDetailModal = ({
  task,
  currentUser,
  onClose,
  onTriggerToast,
  onOpenUpdateProgress,
  onOpenComplete,
  onOpenReassign,
  onOpenChangeDueDate,
  onOpenVerifyClose
}) => {
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "comments" | "activity"

  if (!task) return null;

  const dueNotice = getTaskDueNotice(task);
  const overdue = isTaskOverdue(task);
  const isAssignee = currentUser?.employeeId === task.assigneeId ||
    currentUser?.name?.toLowerCase() === task.assigneeName?.toLowerCase();
  const isAssignerOrSuper = currentUser?.employeeId === task.assignedByEmpId ||
    canUserAssignTasks(currentUser);

  const handleStart = () => {
    startTask(task.id, currentUser);
    onTriggerToast(`Started task "${task.title}"`);
    onClose();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addTaskComment(task.id, commentText, currentUser);
    setCommentText("");
    onTriggerToast("Comment added to task");
  };

  const priorityColor = {
    High: "text-bad border-bad/30 bg-bad/10",
    Medium: "text-warn border-warn/30 bg-warn/10",
    Low: "text-good border-good/30 bg-good/10"
  }[task.priority] || "text-muted border-line bg-surface2";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 md:p-5 border-b border-line bg-surface2/30">
          <div className="flex flex-col gap-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-num text-[12px] font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                {task.id}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityColor}`}>
                {task.priority} Priority
              </span>
              <StatusPill status={task.status} />
              {dueNotice && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  dueNotice.type === "bad" ? "text-bad border-bad/30 bg-bad/10" :
                  dueNotice.type === "warn" ? "text-warn border-warn/30 bg-warn/10" :
                  "text-muted border-line bg-surface2"
                }`}>
                  {dueNotice.text}
                </span>
              )}
            </div>
            <h2 className="text-[18px] md:text-[20px] font-display font-bold text-ink leading-snug mt-1">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition shrink-0 cursor-pointer"
            title="Close dialog"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 md:px-5 pt-3 border-b border-line/60 bg-surface/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-2 border-b-2 transition cursor-pointer ${activeTab === "overview" ? "border-accent text-accent font-bold" : "border-transparent text-muted hover:text-ink"}`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-2.5 px-2 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${activeTab === "comments" ? "border-accent text-accent font-bold" : "border-transparent text-muted hover:text-ink"}`}
          >
            Comments & Discussion
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface2 border border-line">
              {task.comments?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-2.5 px-2 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${activeTab === "activity" ? "border-accent text-accent font-bold" : "border-transparent text-muted hover:text-ink"}`}
          >
            Activity Log
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface2 border border-line">
              {task.activityHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs">
          {activeTab === "overview" && (
            <>
              {overdue && (
                <div className="p-3 rounded-xl bg-bad/10 border border-bad/30 flex items-center gap-2.5 text-bad">
                  <Icon name="alert-triangle" className="w-4 h-4 shrink-0 text-bad" />
                  <span className="font-semibold text-[12px]">
                    This task is overdue! Assigned deadline was <span className="font-num">{formatDate(task.dueDate)}</span>. Immediate resolution or revision required.
                  </span>
                </div>
              )}

              {/* Progress Bar & Status */}
              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">Task Progress</span>
                  <span className="font-num font-bold text-accent text-[13px]">{formatPercent(task.progress, { keepZero: true })}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface2 overflow-hidden border border-line/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      task.progress >= 100 ? "bg-good" : task.progress > 50 ? "bg-accent" : "bg-warn"
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Status: <strong className="text-ink">{task.status}</strong></span>
                  <span>Due: <strong className="text-ink font-num">{formatDate(task.dueDate)}</strong></span>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Description</span>
                <p className="text-ink text-[13px] leading-relaxed whitespace-pre-wrap p-3 rounded-xl bg-surface2/30 border border-line/50">
                  {task.description}
                </p>
              </div>

              {/* Special Instructions if any */}
              {task.instructions && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-warn font-bold flex items-center gap-1.5">
                    <Icon name="alert-triangle" className="w-3.5 h-3.5 text-warn" />
                    Additional Instructions from Supervisor
                  </span>
                  <p className="text-ink text-[12px] p-3 rounded-xl bg-warn/5 border border-warn/20 italic">
                    "{task.instructions}"
                  </p>
                </div>
              )}

              {/* Assignee & Assigner 2-Col Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface2/30 border border-line flex items-center gap-3">
                  <Avatar name={task.assigneeName} employeeId={task.assigneeId} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Assigned To (Employee)</span>
                    <span className="font-semibold text-ink text-[13px] truncate">{task.assigneeName}</span>
                    <span className="text-muted text-[11px] truncate">{task.assigneeId} · {task.assigneeRole}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface2/30 border border-line flex items-center gap-3">
                  <Avatar name={task.assignedByName} employeeId={task.assignedByEmpId} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Assigned By (Official)</span>
                    <span className="font-semibold text-ink text-[13px] truncate">{task.assignedByName}</span>
                    <span className="text-muted text-[11px] truncate">{task.assignedByRole}</span>
                  </div>
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface2/20 border border-line text-center">
                <div>
                  <span className="text-[10px] text-muted uppercase font-semibold block">Assigned Date</span>
                  <span className="font-num font-bold text-ink text-[12px]">{formatDate(task.assignedDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase font-semibold block">Start Date</span>
                  <span className="font-num font-bold text-ink text-[12px]">{formatDate(task.startDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase font-semibold block">Due Date</span>
                  <span className={`font-num font-bold text-[12px] ${overdue ? "text-bad" : "text-ink"}`}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>

              {/* Attachments Section */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-bold flex items-center gap-1.5">
                    <Icon name="paperclip" className="w-3.5 h-3.5 text-accent" />
                    Supporting Documents (<span className="font-num">{task.attachments.length}</span>)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {task.attachments.map((att, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-surface2/50 border border-line flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <Icon name="file-text" className="w-4 h-4 text-accent shrink-0" />
                          <span className="font-medium text-ink truncate text-[11.5px]">{att.name}</span>
                        </div>
                        <span className="text-[10px] text-muted shrink-0 font-num">{att.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "comments" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {(!task.comments || task.comments.length === 0) ? (
                  <div className="py-8 text-center text-muted">
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  task.comments.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-ink text-[12px]">{c.author}</span>
                          <span className="text-[10px] text-muted">({c.authorRole})</span>
                        </div>
                        <span className="text-[10px] text-muted font-num">
                          {formatDateTime(c.timestamp)}
                        </span>
                      </div>
                      <p className="text-ink text-[12px] whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-line">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment or query..."
                  className="flex-1 px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
                />
                <PrimaryButton type="submit" disabled={!commentText.trim()}>
                  Send
                </PrimaryButton>
              </form>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {(!task.activityHistory || task.activityHistory.length === 0) ? (
                <div className="py-8 text-center text-muted">No activity recorded yet.</div>
              ) : (
                task.activityHistory.map(a => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-surface2/30 border border-line/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0"></span>
                      <span className="font-medium text-ink">{a.action}</span>
                      <span className="text-muted">by {a.by}</span>
                    </div>
                    <span className="text-[10px] text-muted font-num">
                      {formatDateTime(a.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 md:p-4 border-t border-line bg-surface2/30">
          <div className="flex items-center gap-2">
            {isAssignerOrSuper && task.status !== "Closed" && (
              <>
                <button
                  onClick={() => { onClose(); onOpenReassign(task); }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-surface2 border border-line transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="users" className="w-3.5 h-3.5 text-accent" />
                  Reassign
                </button>
                <button
                  onClick={() => { onClose(); onOpenChangeDueDate(task); }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-surface2 border border-line transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="calendar" className="w-3.5 h-3.5 text-accent" />
                  Change Due Date
                </button>
              </>
            )}

            {isAssignerOrSuper && task.status === "Completed" && (
              <PrimaryButton
                icon="check-circle"
                onClick={() => { onClose(); onOpenVerifyClose(task); }}
              >
                Verify & Close Task
              </PrimaryButton>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isAssignee && task.status === "Pending" && (
              <PrimaryButton icon="play" onClick={handleStart}>
                Start Task
              </PrimaryButton>
            )}

            {isAssignee && (task.status === "In Progress" || task.status === "On Hold") && (
              <>
                <SecondaryButton
                  icon="edit"
                  onClick={() => { onClose(); onOpenUpdateProgress(task); }}
                >
                  Update Progress
                </SecondaryButton>
                <PrimaryButton
                  icon="check"
                  onClick={() => { onClose(); onOpenComplete(task); }}
                >
                  Mark as Completed
                </PrimaryButton>
              </>
            )}

            <SecondaryButton onClick={onClose}>
              Close
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const AssignTaskModal = ({ currentUser, isOpen, onClose, onTriggerToast }) => {
  const employees = useMemo(() => loadEmployees(), [isOpen]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [instructions, setInstructions] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(e => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.id?.toLowerCase().includes(q) ||
      e.dept?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q)
    );
  });

  const toggleAssignee = (empId) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSimulatedFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = files.map(f => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.name.endsWith(".pdf") ? "pdf" : f.name.endsWith(".xlsx") ? "excel" : "file"
    }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a task title.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please enter task details and scope.");
      return;
    }
    if (!selectedAssigneeIds.length) {
      setErrorMsg("Please select at least one employee to assign this task.");
      return;
    }
    if (!dueDate) {
      setErrorMsg("Please set a valid due date.");
      return;
    }

    const assignees = employees.filter(e => selectedAssigneeIds.includes(e.id));
    createTask({
      title,
      description,
      assignees,
      priority,
      startDate,
      dueDate,
      instructions,
      attachments
    }, currentUser);

    onTriggerToast(`Task assigned to ${assignees.length} team member(s) successfully!`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-line bg-surface2/30">
          <div>
            <h2 className="text-[18px] font-display font-bold text-ink flex items-center gap-2">
              <Icon name="check-square" className="w-5 h-5 text-accent" />
              Assign New Task
            </h2>
            <p className="text-[12px] text-muted">
              Delegate responsibilities, set milestones and monitor team execution.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 cursor-pointer">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-bad/10 border border-bad/30 text-bad font-medium text-xs flex items-center gap-2">
              <Icon name="alert-triangle" className="w-4 h-4 text-bad shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">
              Task Title <span className="text-bad">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Indian Payroll Compliance Audit"
              className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">
              Detailed Description & Objectives <span className="text-bad">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific objectives, deliverables, steps, and expected outcomes..."
              className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent resize-none"
              required
            />
          </div>

          {/* Assign To Employee Picker (Multi-select) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-ink">
                Assign To Employee(s) <span className="text-bad">*</span>
              </label>
              <span className="text-muted text-[11px]">
                {selectedAssigneeIds.length} selected
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface2/30 border border-line flex flex-col gap-2">
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Search employee by name, ID, or department..."
                className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              />
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                {filteredEmployees.map(emp => {
                  const isChecked = selectedAssigneeIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleAssignee(emp.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? "bg-accent/10 border-accent/40 text-ink"
                          : "bg-surface/50 border-line/60 text-muted hover:bg-surface2 hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={emp.name} employeeId={emp.id} size="sm" />
                        <div className="truncate">
                          <span className="font-semibold text-ink text-[12px] block truncate">{emp.name}</span>
                          <span className="text-[10px] text-muted">{emp.id} · {emp.dept} · {emp.role}</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-line text-accent focus:ring-0 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Priority & Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">Priority</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-ink">
                Due Date <span className="text-bad">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">Additional Instructions / Guidelines</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Ensure all Maharashtra state gazettes are attached for audit signoff."
              className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Attachments Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-ink flex items-center justify-between">
              <span>Supporting Documents & Templates</span>
              <span className="text-muted font-normal text-[11px]">PDF, Excel, Word (Max 15MB)</span>
            </label>
            <div className="p-3 rounded-xl bg-surface2/30 border border-dashed border-line flex flex-col items-center justify-center gap-2 text-center">
              <Icon name="paperclip" className="w-5 h-5 text-accent" />
              <label className="cursor-pointer text-accent hover:underline font-semibold text-xs">
                Click to attach files
                <input
                  type="file"
                  multiple
                  onChange={handleSimulatedFileUpload}
                  className="hidden"
                />
              </label>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {attachments.map((att, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-surface border border-line text-[11px] font-medium text-ink flex items-center gap-1">
                      {att.name} ({att.size})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" icon="check">
              Assign Task
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const UpdateProgressModal = ({ task, currentUser, isOpen, onClose, onTriggerToast }) => {
  const [progress, setProgress] = useState(task?.progress || 0);

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTaskProgress(task.id, progress, currentUser);
    onTriggerToast(`Updated task progress to ${progress}%`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display font-bold text-ink text-sm">Update Execution Progress</h3>
          <button onClick={onClose} className="text-muted hover:text-ink cursor-pointer"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-ink">Progress: <span className="font-num text-accent">{progress}%</span></label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Save Progress</PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const CompleteTaskModal = ({ task, currentUser, isOpen, onClose, onTriggerToast }) => {
  const [remarks, setRemarks] = useState("");

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    completeTask(task.id, remarks, currentUser);
    onTriggerToast(`Marked task "${task.title}" as completed`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display font-bold text-ink text-sm">Mark Task as Completed</h3>
          <button onClick={onClose} className="text-muted hover:text-ink cursor-pointer"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">Completion Remarks & Summary <span className="text-bad">*</span></label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide summary of completed work..."
              className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Submit for Review</PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const ReassignTaskModal = ({ task, currentUser, isOpen, onClose, onTriggerToast }) => {
  const employees = useMemo(() => loadEmployees(), [isOpen]);
  const [newAssigneeId, setNewAssigneeId] = useState("");

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAssigneeId) return;
    const targetEmp = employees.find(e => e.id === newAssigneeId);
    if (!targetEmp) return;
    reassignTask(task.id, targetEmp, currentUser);
    onTriggerToast(`Reassigned task to ${targetEmp.name}`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display font-bold text-ink text-sm">Reassign Task</h3>
          <button onClick={onClose} className="text-muted hover:text-ink cursor-pointer"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">Select New Assignee</label>
            <Select value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)} required>
              <option value="">-- Choose employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.dept})</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Confirm Reassignment</PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const ChangeDueDateModal = ({ task, currentUser, isOpen, onClose, onTriggerToast }) => {
  const [newDate, setNewDate] = useState(task?.dueDate || "");

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    changeTaskDueDate(task.id, newDate, currentUser);
    onTriggerToast(`Updated due date to ${formatDate(newDate)}`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display font-bold text-ink text-sm">Change Task Due Date</h3>
          <button onClick={onClose} className="text-muted hover:text-ink cursor-pointer"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">New Due Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Update Date</PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const VerifyCloseModal = ({ task, currentUser, isOpen, onClose, onTriggerToast }) => {
  const [closingNote, setClosingNote] = useState("");

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyAndCloseTask(task.id, closingNote, currentUser);
    onTriggerToast(`Verified & closed task "${task.title}"`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display font-bold text-ink text-sm">Verify & Close Task</h3>
          <button onClick={onClose} className="text-muted hover:text-ink cursor-pointer"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-ink">Closing Note / Signoff Remarks</label>
            <textarea
              rows={3}
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              placeholder="Add final review feedback or sign-off notes..."
              className="px-3 py-2 rounded-xl bg-surface border border-line text-ink text-xs focus:outline-none focus:border-accent resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Close Task</PrimaryButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};