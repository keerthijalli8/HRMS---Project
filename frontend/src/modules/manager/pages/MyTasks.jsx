import React, { useState } from 'react';
import Card from '../components/Card';
import Kpi from '../components/Kpi';
import Drawer from '../components/Drawer';
import FormField from '../components/FormField';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Tag from '../components/Tag';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  Trash2,
  Tag as TagIcon,
  Send,
  ListTodo,
  Check,
  Undo2,
  Layers,
  Sparkles,
} from 'lucide-react';

const INITIAL_MY_TASKS = [
  {
    id: 'PT-01',
    title: 'Review Sprint 44 Platform Architecture RFC (Kafka Partition Scaling)',
    category: 'Engineering RFC',
    priority: 'Critical',
    dueDate: '2026-11-08',
    dueDateFormatted: '8 Nov 2026',
    done: false,
    notes: 'Verify partition consumer rebalance latency under 15k events/sec with Aarav.',
    tags: ['Architecture', 'Platform', 'Sprint 44'],
  },
  {
    id: 'PT-02',
    title: 'Complete Q3 Annual Performance Reviews for 6 Senior Engineers',
    category: 'Management & People',
    priority: 'High',
    dueDate: '2026-11-12',
    dueDateFormatted: '12 Nov 2026',
    done: false,
    notes: 'Draft rating justification and review promotion packets with Vikram Malhotra.',
    tags: ['Reviews', 'Appraisals', 'People'],
  },
  {
    id: 'PT-03',
    title: 'Approve pending Team Leave & Regularisation requests before weekend',
    category: 'Admin & Operations',
    priority: 'High',
    dueDate: '2026-11-06',
    dueDateFormatted: 'Today (6 Nov 2026)',
    done: false,
    notes: 'Review Sneha and Rohan regularisation requests in approvals queue.',
    tags: ['Approvals', 'Attendance'],
  },
  {
    id: 'PT-04',
    title: 'Prepare 1:1 check-in notes for Sneha Reddy (Staff Engineer track)',
    category: '1:1 Coaching',
    priority: 'Medium',
    dueDate: '2026-11-09',
    dueDateFormatted: '9 Nov 2026',
    done: false,
    notes: 'Discuss frontend design system cross-team adoption and mentoring juniors.',
    tags: ['1on1', 'Career Growth'],
  },
  {
    id: 'PT-05',
    title: 'Submit Engineering Q4 Hiring Requisitions to Talent Acquisition',
    category: 'Management & People',
    priority: 'High',
    dueDate: '2026-11-10',
    dueDateFormatted: '10 Nov 2026',
    done: true,
    notes: 'Opened requisitions for 2x Distributed Systems Engineers and 1x SDET.',
    tags: ['Hiring', 'Recruiting'],
  },
  {
    id: 'PT-06',
    title: 'Finalize SOC2 Security Audit evidence for Cloud Microservices',
    category: 'Compliance & Security',
    priority: 'Medium',
    dueDate: '2026-11-04',
    dueDateFormatted: '4 Nov 2026',
    done: true,
    notes: 'All AWS KMS encryption keys and production access logs verified.',
    tags: ['SOC2', 'Security'],
  },
  {
    id: 'PT-07',
    title: 'Draft Project Aurora Q4 Milestones & Cross-functional dependencies',
    category: 'Engineering RFC',
    priority: 'Medium',
    dueDate: '2026-11-05',
    dueDateFormatted: '5 Nov 2026',
    done: true,
    notes: 'Shared sync doc with Product and Design Leads.',
    tags: ['Aurora', 'Milestones'],
  },
];

export default function MyTasks({ onTriggerToast }) {
  const [tasks, setTasks] = useState(INITIAL_MY_TASKS);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'completed' | 'critical'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isNewTaskDrawerOpen, setIsNewTaskDrawerOpen] = useState(false);

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    category: 'Engineering RFC',
    priority: 'High',
    dueDate: '2026-11-15',
    notes: '',
    tagInput: 'Architecture, Sprint 44',
  });

  const notify = (msg, undoFn) => {
    if (onTriggerToast) onTriggerToast(msg, undoFn);
  };

  // Toggle task done
  const handleToggleTask = (taskId) => {
    const prev = [...tasks];
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const newDone = !target.done;
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, done: newDone } : t)));

    notify(
      newDone ? `Marked "${target.title}" as completed` : `Reopened "${target.title}"`,
      () => setTasks(prev)
    );
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    const prev = [...tasks];
    const target = tasks.find((t) => t.id === taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));

    notify(`Deleted task "${target?.title}"`, () => setTasks(prev));
  };

  // Submit new task
  const handleCreateTaskSubmit = (e) => {
    e?.preventDefault();
    if (!newTaskForm.title.trim()) {
      notify('Please enter a task title.');
      return;
    }

    const tagsArray = newTaskForm.tagInput
      ? newTaskForm.tagInput.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Personal'];

    const newTask = {
      id: `PT-${Date.now().toString().slice(-4)}`,
      title: newTaskForm.title.trim(),
      category: newTaskForm.category,
      priority: newTaskForm.priority,
      dueDate: newTaskForm.dueDate,
      dueDateFormatted: newTaskForm.dueDate,
      done: false,
      notes: newTaskForm.notes.trim(),
      tags: tagsArray,
    };

    const prev = [...tasks];
    setTasks([newTask, ...tasks]);
    setIsNewTaskDrawerOpen(false);
    setNewTaskForm({
      title: '',
      category: 'Engineering RFC',
      priority: 'High',
      dueDate: '2026-11-15',
      notes: '',
      tagInput: 'Architecture, Sprint 44',
    });

    notify(`Added personal task "${newTask.title}"`, () => setTasks(prev));
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterTab === 'active' && t.done) return false;
    if (filterTab === 'completed' && !t.done) return false;
    if (filterTab === 'critical' && t.priority !== 'Critical') return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => !t.done).length;
  const completedTasks = tasks.filter((t) => t.done).length;
  const criticalTasks = tasks.filter((t) => !t.done && (t.priority === 'Critical' || t.priority === 'High')).length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-display font-bold text-ink">My Personal Tasks</h2>
          <p className="text-[12.5px] text-muted">
            Personal deliverables, leadership responsibilities, engineering RFC reviews, and 1:1 coaching action items
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTaskDrawerOpen(true)}
          className="px-4 py-2 rounded-xl font-bold text-[12.5px] flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
          }}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>New Personal Task</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Total Tasks"
          value={totalTasks}
          change="Personal scope"
          sublabel="Manager responsibilities"
          trend="neutral"
        />
        <Kpi
          label="Pending / In Progress"
          value={activeTasks}
          change="Action required"
          sublabel="Sprint 44 delivery"
          trend={activeTasks > 5 ? 'warn' : 'neutral'}
        />
        <Kpi
          label="Completed"
          value={completedTasks}
          change={`${Math.round((completedTasks / totalTasks) * 100)}% done`}
          sublabel="This month"
          trend="up"
        />
        <Kpi
          label="Critical / High Priority"
          value={criticalTasks}
          change="Urgent focus"
          sublabel="Due this week"
          trend="down"
        />
      </div>

      {/* Main Task List Card */}
      <Card
        title="Personal Task Tracker"
        subtitle={`Showing ${filteredTasks.length} of ${totalTasks} personal tasks`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center bg-surface2 rounded-xl p-0.5 border border-line text-[11px] font-semibold">
              {[
                { id: 'all', label: `All (${totalTasks})` },
                { id: 'active', label: `Active (${activeTasks})` },
                { id: 'critical', label: `Critical (${criticalTasks})` },
                { id: 'completed', label: `Completed (${completedTasks})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0a222b] text-ink text-[11px] px-2.5 py-1 rounded-lg border border-line outline-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all">All Categories</option>
              <option value="Engineering RFC">Engineering RFC</option>
              <option value="Management & People">Management & People</option>
              <option value="Admin & Operations">Admin & Operations</option>
              <option value="1:1 Coaching">1:1 Coaching</option>
              <option value="Compliance & Security">Compliance & Security</option>
            </select>
          </div>
        }
      >
        <div className="flex flex-col divide-y divide-line/40">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-muted">
              <CheckCircle2 size={36} className="text-good opacity-80" />
              <span className="font-semibold text-ink text-[14px]">No tasks found</span>
              <p className="text-[12px] max-w-sm">
                You have no tasks matching the selected filters. Great job keeping your personal checklist clean!
              </p>
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`py-3.5 px-3 rounded-xl transition-all flex items-start justify-between gap-3 ${
                  t.done ? 'bg-surface2/20 opacity-70' : 'hover:bg-surface2/40'
                }`}
              >
                {/* Left check & content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => handleToggleTask(t.id)}
                    aria-label={`Mark task ${t.title} as ${t.done ? 'incomplete' : 'complete'}`}
                    className="mt-1 w-4 h-4 rounded border-line accent-accent cursor-pointer shrink-0"
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[13.5px] font-semibold leading-snug transition-colors ${
                          t.done ? 'line-through text-muted' : 'text-ink'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>

                    {t.notes && (
                      <p className="text-[12px] text-muted mt-1 leading-relaxed">
                        {t.notes}
                      </p>
                    )}

                    {/* Metadata & Tag row */}
                    <div className="flex items-center gap-2.5 mt-2 flex-wrap text-[11px] text-muted">
                      <span className="px-2 py-0.5 rounded bg-surface border border-line font-medium text-ink/90">
                        {t.category}
                      </span>

                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={11} className={!t.done && t.dueDateFormatted.includes('Today') ? 'text-warn' : 'text-muted'} />
                        <span className={!t.done && t.dueDateFormatted.includes('Today') ? 'text-warn font-semibold' : ''}>
                          Due {t.dueDateFormatted}
                        </span>
                      </span>

                      {t.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-surface2/70 text-muted font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Priority & Delete button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono uppercase tracking-wider border ${
                      t.priority === 'Critical'
                        ? 'bg-bad/15 text-bad border-bad/30'
                        : t.priority === 'High'
                        ? 'bg-warn/15 text-warn border-warn/30'
                        : 'bg-surface2 text-muted border-line'
                    }`}
                  >
                    {t.priority}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1 rounded-lg text-muted/60 hover:text-bad hover:bg-bad/10 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* New Task Drawer */}
      <Drawer
        isOpen={isNewTaskDrawerOpen}
        onClose={() => setIsNewTaskDrawerOpen(false)}
        title="Create Personal Task"
        subtitle="Add a new action item to your personal checklist"
        width="460px"
      >
        <form onSubmit={handleCreateTaskSubmit} className="flex flex-col gap-4 text-[13px]">
          <FormField label="Task Title" id="pt-title" required>
            <input
              id="pt-title"
              type="text"
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              placeholder="e.g. Prepare system design doc for Redis migration..."
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" id="pt-cat" required>
              <select
                id="pt-cat"
                value={newTaskForm.category}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value })}
                className="w-full bg-[#0a222b] text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line focus:border-accent outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="Engineering RFC">Engineering RFC</option>
                <option value="Management & People">Management & People</option>
                <option value="Admin & Operations">Admin & Operations</option>
                <option value="1:1 Coaching">1:1 Coaching</option>
                <option value="Compliance & Security">Compliance & Security</option>
              </select>
            </FormField>

            <FormField label="Priority" id="pt-priority" required>
              <select
                id="pt-priority"
                value={newTaskForm.priority}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                className="w-full bg-[#0a222b] text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line focus:border-accent outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </FormField>
          </div>

          <FormField label="Due Date" id="pt-due" required>
            <input
              id="pt-due"
              type="date"
              value={newTaskForm.dueDate}
              min="2026-11-01"
              max="2026-12-31"
              onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
              className="w-full bg-surface2 text-ink text-[12.5px] px-3 py-2 rounded-xl border border-line font-mono focus:border-accent outline-none"
              required
            />
          </FormField>

          <FormField label="Notes & Context" id="pt-notes">
            <Textarea
              id="pt-notes"
              rows={3}
              value={newTaskForm.notes}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
              placeholder="Key deliverables, agenda items, or references..."
            />
          </FormField>

          <FormField label="Tags (comma-separated)" id="pt-tags">
            <input
              id="pt-tags"
              type="text"
              value={newTaskForm.tagInput}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, tagInput: e.target.value })}
              placeholder="e.g. Architecture, Sprint 44, Hiring"
              className="w-full bg-surface2 text-ink text-[12.5px] px-3.5 py-2 rounded-xl border border-line focus:border-accent outline-none font-mono"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-2">
            <button
              type="button"
              onClick={() => setIsNewTaskDrawerOpen(false)}
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
              <Plus size={14} strokeWidth={2.4} />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
