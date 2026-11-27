import React, { useEffect, useState } from 'react';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal.jsx';

export const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, initialData = null }) => {
  const { teamMembers } = useTeamLead();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assigneeId: initialData?.assigneeId || '',
    priority: initialData?.priority || 'High',
    category: initialData?.category || 'Frontend',
    startDate: initialData?.startDate || '2026-11-09',
    dueDate: initialData?.dueDate || '2026-11-16',
    status: initialData?.status || 'To Do',
    attachments: initialData?.attachments || 1
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (teamMembers.length === 0) return;
    setFormData(current => {
      const initialAssignee = teamMembers.find(
        member => String(member.id) === String(initialData?.assigneeId)
      );
      if (initialAssignee) return { ...current, assigneeId: initialAssignee.id };

      const selectedAssigneeExists = teamMembers.some(
        member => String(member.id) === String(current.assigneeId)
      );
      if (selectedAssigneeExists) return current;

      return { ...current, assigneeId: teamMembers[0].id };
    });
  }, [teamMembers, initialData?.assigneeId]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = "Task title is required.";
    if (!formData.description.trim()) errs.description = "Task description is required.";
    if (!formData.assigneeId) errs.assigneeId = "Please select an assignee.";
    if (!formData.dueDate) errs.dueDate = "Due date is required.";
    if (formData.startDate && formData.dueDate && formData.dueDate < formData.startDate) {
      errs.dueDate = "Due date cannot be before start date.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const assignee = teamMembers.find(m => String(m.id) === String(formData.assigneeId));

    onTaskCreated({
      ...formData,
      assigneeName: assignee ? assignee.name : 'Unassigned'
    });
    onClose();
  };

  return (
    <ModalPortal onClose={onClose} ariaLabelledby="create-task-modal-title">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface2 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pb-3 border-b border-line/60">
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 id="create-task-modal-title" className="font-display font-bold text-lg text-white">
              {initialData ? 'Edit Team Task' : 'Create New Team Task'}
            </h3>
            <span className="text-xs text-muted">
              Assign deliverables to team engineers and track sprint milestones
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">

          <div>
            <label className="font-semibold text-ink block mb-1">
              Task Title <span className="text-bad">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Implement FastAPI Pydantic V2 Schemas for Employee APIs"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full bg-surface2 border rounded-xl p-2.5 text-xs text-ink placeholder:text-muted focus:border-accent ${
                errors.title ? 'border-bad' : 'border-line'
              }`}
            />
            {errors.title && <span className="text-bad text-[11px] mt-0.5 block">{errors.title}</span>}
          </div>

          <div>
            <label className="font-semibold text-ink block mb-1">
              Task Description <span className="text-bad">*</span>
            </label>
            <textarea
              rows="3"
              placeholder="Provide technical specifications, acceptance criteria, or relevant links..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full bg-surface2 border rounded-xl p-2.5 text-xs text-ink placeholder:text-muted focus:border-accent ${
                errors.description ? 'border-bad' : 'border-line'
              }`}
            />
            {errors.description && <span className="text-bad text-[11px] mt-0.5 block">{errors.description}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink block mb-1">
                Assign Employee <span className="text-bad">*</span>
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                disabled={teamMembers.length === 0}
                required
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              >
                {teamMembers.length === 0 ? (
                  <option value="" className="bg-white text-slate-900">No team employees available</option>
                ) : (
                  <>
                    <option value="" disabled className="bg-white text-slate-900">Select an employee</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id} className="bg-white text-slate-900">
                        {m.name} ({m.designation})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {teamMembers.length === 0 && (
                <span className="mt-1 block text-[11px] text-bad">Employee assignments are unavailable until team data loads.</span>
              )}
              {errors.assigneeId && <span className="mt-0.5 block text-[11px] text-bad">{errors.assigneeId}</span>}
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              >
                <option value="Frontend" className="bg-[#06141c]">Frontend</option>
                <option value="Backend" className="bg-[#06141c]">Backend</option>
                <option value="Design" className="bg-[#06141c]">Design & UX</option>
                <option value="Testing" className="bg-[#06141c]">QA & Testing</option>
                <option value="DevOps" className="bg-[#06141c]">DevOps & Cloud</option>
                <option value="Architecture" className="bg-[#06141c]">Architecture & Security</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink block mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              >
                <option value="Low" className="bg-[#06141c]">Low</option>
                <option value="Medium" className="bg-[#06141c]">Medium</option>
                <option value="High" className="bg-[#06141c]">High</option>
                <option value="Critical" className="bg-[#06141c]">Critical</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              >
                <option value="To Do" className="bg-[#06141c]">To Do</option>
                <option value="In Progress" className="bg-[#06141c]">In Progress</option>
                <option value="In Review" className="bg-[#06141c]">In Review</option>
                <option value="Completed" className="bg-[#06141c]">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-ink block mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Due Date <span className="text-bad">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`w-full bg-surface2 border rounded-xl p-2.5 text-xs text-ink focus:border-accent ${
                  errors.dueDate ? 'border-bad' : 'border-line'
                }`}
              />
              {errors.dueDate && <span className="text-bad text-[11px] mt-0.5 block">{errors.dueDate}</span>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink hover:border-accent transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-accent text-on-accent hover:brightness-105 transition shadow-sm"
            >
              {initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
