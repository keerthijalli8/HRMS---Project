import React, { useState } from 'react';
import Card from '../components/Card';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import Drawer from '../components/Drawer';
import FormField from '../components/FormField';
import Textarea from '../components/Textarea';
import { initialProjects } from '../data/projects';
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  Target,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  Check,
  Send,
  Flag,
} from 'lucide-react';

export default function Projects({ employees = [], onTriggerToast }) {
  const [projects, setProjects] = useState(initialProjects);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'on-track' | 'at-risk' | 'delayed'
  const [selectedProject, setSelectedProject] = useState(null);

  // Report Blocker Drawer State
  const [blockerTargetProject, setBlockerTargetProject] = useState(null);
  const [blockerForm, setBlockerForm] = useState({
    title: '',
    severity: 'High',
    impact: '',
    owner: '',
  });

  // Create Project Drawer State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    code: '',
    pod: 'Frontend Guild',
    lead: 'Sneha Reddy',
    priority: 'High',
    targetDate: '2026-12-30',
    description: '',
  });

  const notify = (msg, undoFn) => {
    if (onTriggerToast) onTriggerToast(msg, undoFn);
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.health === statusFilter;
  });

  // Calculate metrics
  const totalProjects = projects.length;
  const onTrackCount = projects.filter((p) => p.health === 'on-track').length;
  const atRiskCount = projects.filter((p) => p.health === 'at-risk' || p.health === 'behind').length;
  const totalBlockers = projects.reduce((acc, p) => acc + (p.blockers?.length || 0), 0);

  // Add Blocker handler
  const handleAddBlocker = (e) => {
    e?.preventDefault();
    if (!blockerTargetProject || !blockerForm.title) return;

    const newBlocker = {
      id: `blk-${Date.now()}`,
      title: blockerForm.title,
      severity: blockerForm.severity,
      reportedBy: 'Lokesh Kumar (Manager)',
      reportedAt: 'Today',
      impact: blockerForm.impact || 'Delays critical path milestone delivery.',
      owner: blockerForm.owner || 'Assigned Eng Lead',
      status: 'Open',
    };

    const prev = [...projects];
    setProjects(
      projects.map((p) =>
        p.id === blockerTargetProject.id
          ? {
              ...p,
              health: 'at-risk',
              blockers: [newBlocker, ...(p.blockers || [])],
            }
          : p
      )
    );

    setBlockerTargetProject(null);
    setBlockerForm({ title: '', severity: 'High', impact: '', owner: '' });
    notify(`Reported blocker on ${blockerTargetProject.title}`, () => setProjects(prev));
  };

  // Resolve Blocker handler
  const handleResolveBlocker = (projectId, blockerId) => {
    const prev = [...projects];
    setProjects(
      projects.map((p) => {
        if (p.id !== projectId) return p;
        const remaining = (p.blockers || []).filter((b) => b.id !== blockerId);
        return {
          ...p,
          health: remaining.length === 0 ? 'on-track' : p.health,
          blockers: remaining,
        };
      })
    );
    notify('Blocker resolved and cleared from project.', () => setProjects(prev));
  };

  // Create Project handler
  const handleCreateProject = (e) => {
    e?.preventDefault();
    if (!newProjectForm.title.trim()) return;

    const created = {
      id: `PRJ-${Date.now().toString().slice(-2)}`,
      code: newProjectForm.code || newProjectForm.title.slice(0, 4).toUpperCase(),
      title: newProjectForm.title,
      pod: newProjectForm.pod,
      lead: newProjectForm.lead,
      leadRole: 'Lead Engineer',
      priority: newProjectForm.priority,
      status: 'On Track',
      health: 'on-track',
      progress: 0,
      startDate: '06 Nov 2026',
      targetDate: newProjectForm.targetDate,
      description: newProjectForm.description || 'Sprint initiative in progress.',
      teamMembers: [
        { id: 'EMP-003', name: newProjectForm.lead, avatar: newProjectForm.lead.slice(0, 2).toUpperCase(), role: 'Lead' },
      ],
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Technical Architecture & Scope RFC', dueDate: '15 Nov 2026', status: 'In Progress' },
        { id: `m-${Date.now()}-2`, title: 'Staging Alpha Milestone', dueDate: newProjectForm.targetDate, status: 'Upcoming' },
      ],
      blockers: [],
    };

    setProjects([created, ...projects]);
    setIsNewProjectOpen(false);
    notify(`Created project: "${created.title}"`);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Top Strip: Description & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-line/40">
        <div>
          <h2 className="text-[17px] font-bold text-ink font-display">Projects & Initiatives</h2>
          <p className="text-[12.5px] text-muted">
            Track milestone delivery, sprint deadlines, technical dependencies, and active blockers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewProjectOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[12.5px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Project Initiative</span>
        </button>
      </div>

      {/* 2. Project Health KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface2/50 border border-line flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Active Initiatives</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[22px] font-bold font-mono text-ink">{totalProjects}</span>
            <span className="text-[11px] text-muted font-mono">across 4 pods</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface2/50 border border-good/30 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider">On Track</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[22px] font-bold font-mono text-good">{onTrackCount}</span>
            <span className="text-[11px] text-good font-mono">{Math.round((onTrackCount / totalProjects) * 100)}% healthy</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface2/50 border border-warn/30 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider">At Risk / Delayed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[22px] font-bold font-mono text-warn">{atRiskCount}</span>
            <span className="text-[11px] text-muted font-mono">need unblocking</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface2/50 border border-bad/30 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Active Blockers</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[22px] font-bold font-mono text-bad">{totalBlockers}</span>
            <span className="text-[11px] text-bad font-mono">critical hurdles</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Navigation & Projects Grid */}
      <Card
        title="Engineering Initiatives & Deliverables"
        subtitle="Sprint 44–46 roadmap milestones and blocker management"
        action={
          <div className="flex items-center gap-1 bg-surface2 rounded-lg p-0.5 border border-line text-[11px] font-semibold">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'on-track', label: 'On Track' },
              { id: 'at-risk', label: 'At Risk' },
              { id: 'behind', label: 'Delayed' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusFilter(t.id)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === t.id ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => {
            const hasBlockers = project.blockers && project.blockers.length > 0;
            const completedMilestones = project.milestones.filter((m) => m.status === 'Completed').length;

            return (
              <div
                key={project.id}
                className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${
                  hasBlockers
                    ? 'bg-surface2/50 border-warn/50 hover:border-warn'
                    : 'bg-surface2/30 border-line hover:border-line/80'
                }`}
              >
                {/* Project Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface2 border border-line flex items-center justify-center font-mono font-bold text-accent shrink-0">
                      {project.code.slice(0, 3)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[14.5px] text-ink">{project.title}</span>
                        <Tag variant="default">{project.pod}</Tag>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            project.health === 'on-track'
                              ? 'bg-good/15 text-good border-good/40'
                              : project.health === 'at-risk'
                              ? 'bg-warn/15 text-warn border-warn/40'
                              : 'bg-bad/15 text-bad border-bad/40'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <p className="text-[12px] text-muted mt-1 leading-relaxed">{project.description}</p>
                    </div>
                  </div>

                  {/* Actions & Report Blocker */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                    <button
                      type="button"
                      onClick={() => setBlockerTargetProject(project)}
                      className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line hover:border-warn text-muted hover:text-warn text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Flag size={13} />
                      <span>Report Blocker</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Key Stats */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface/50 border border-line/40">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-muted font-mono flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-accent" />
                      <span>Delivery Progress</span>
                    </span>
                    <span className="font-mono font-bold text-ink">{project.progress}% Complete</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden border border-line/30">
                    <div
                      className={`h-full rounded-full transition-all ${
                        project.health === 'on-track' ? 'bg-good' : project.health === 'at-risk' ? 'bg-warn' : 'bg-bad'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted pt-1 mt-0.5 border-t border-line/20">
                    <span>Target Delivery: <strong className="text-ink font-mono">{project.targetDate}</strong></span>
                    <span>Lead: <strong className="text-ink">{project.lead}</strong> ({project.leadRole})</span>
                    <span>Milestones: <strong className="text-ink font-mono">{completedMilestones}/{project.milestones.length}</strong></span>
                  </div>
                </div>

                {/* Milestones Horizontal Row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono uppercase text-muted tracking-wider font-semibold">
                    Key Milestones:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {project.milestones.map((ms) => {
                      const isDone = ms.status === 'Completed';
                      const isBlocked = ms.status === 'Blocked';
                      const isInProgress = ms.status === 'In Progress';

                      return (
                        <div
                          key={ms.id}
                          className={`p-2.5 rounded-lg border text-[11.5px] flex flex-col justify-between gap-1.5 ${
                            isDone
                              ? 'bg-good/10 border-good/30'
                              : isBlocked
                              ? 'bg-bad/10 border-bad/30'
                              : isInProgress
                              ? 'bg-accent/10 border-accent/30'
                              : 'bg-surface2/40 border-line/50'
                          }`}
                        >
                          <span className="font-medium text-ink leading-tight">{ms.title}</span>
                          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-line/30">
                            <span className="text-muted">{ms.dueDate}</span>
                            <span
                              className={`font-bold ${
                                isDone
                                  ? 'text-good'
                                  : isBlocked
                                  ? 'text-bad'
                                  : isInProgress
                                  ? 'text-accent'
                                  : 'text-muted'
                              }`}
                            >
                              {ms.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blockers Callout if present */}
                {hasBlockers && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-warn/15 border border-warn/40 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-warn flex items-center gap-1.5">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Active Blocker ({project.blockers.length}):</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warn text-black font-bold uppercase">
                        Requires Action
                      </span>
                    </div>

                    {project.blockers.map((blk) => (
                      <div
                        key={blk.id}
                        className="p-2.5 rounded-lg bg-surface/80 border border-warn/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-ink text-[12.5px]">{blk.title}</span>
                          <span className="text-[11.5px] text-muted">{blk.impact}</span>
                          <span className="text-[10.5px] text-muted/80 font-mono">
                            Reported by {blk.reportedBy} · Owner: {blk.owner}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleResolveBlocker(project.id, blk.id)}
                          className="px-3 py-1 rounded-lg bg-good/20 border border-good text-good hover:bg-good/30 text-[11px] font-bold flex items-center gap-1 self-start sm:self-center transition-colors cursor-pointer shrink-0"
                        >
                          <Check size={12} strokeWidth={2.5} />
                          <span>Resolve</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Report Blocker Drawer */}
      <Drawer
        isOpen={Boolean(blockerTargetProject)}
        onClose={() => setBlockerTargetProject(null)}
        title="Report Project Blocker"
        subtitle={blockerTargetProject?.title || 'Engineering Initiative'}
        width="480px"
      >
        <form onSubmit={handleAddBlocker} className="flex flex-col gap-4 text-[13px]">
          <FormField label="Blocker Title / Issue" id="blk-title" required>
            <input
              id="blk-title"
              type="text"
              value={blockerForm.title}
              onChange={(e) => setBlockerForm({ ...blockerForm, title: e.target.value })}
              placeholder="e.g. AWS DirectConnect VPC peering latency timeout"
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none"
              required
            />
          </FormField>

          <FormField label="Severity Level" id="blk-sev" required>
            <select
              id="blk-sev"
              value={blockerForm.severity}
              onChange={(e) => setBlockerForm({ ...blockerForm, severity: e.target.value })}
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none font-sans"
            >
              <option value="Critical">Critical — Blocks deployment / releases</option>
              <option value="High">High — Impacts secondary milestones</option>
              <option value="Medium">Medium — Minor technical impediment</option>
            </select>
          </FormField>

          <FormField label="Business & Delivery Impact" id="blk-impact" required>
            <Textarea
              id="blk-impact"
              rows={2}
              value={blockerForm.impact}
              onChange={(e) => setBlockerForm({ ...blockerForm, impact: e.target.value })}
              placeholder="e.g. Halts multi-region failover tests in Hyderabad DR site..."
              required
            />
          </FormField>

          <FormField label="Assigned Resolution Owner / Team" id="blk-owner" required>
            <input
              id="blk-owner"
              type="text"
              value={blockerForm.owner}
              onChange={(e) => setBlockerForm({ ...blockerForm, owner: e.target.value })}
              placeholder="e.g. Network Infrastructure Team / DevOps"
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none"
              required
            />
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-2">
            <button
              type="button"
              onClick={() => setBlockerTargetProject(null)}
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
              <Flag size={14} />
              <span>Submit Blocker</span>
            </button>
          </div>
        </form>
      </Drawer>

      {/* 5. Create Project Drawer */}
      <Drawer
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        title="Create New Project Initiative"
        subtitle="Sprint 44–46 Engineering Deliverables"
        width="480px"
      >
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4 text-[13px]">
          <FormField label="Project Title" id="np-title" required>
            <input
              id="np-title"
              type="text"
              value={newProjectForm.title}
              onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
              placeholder="e.g. Graph Database Recommendation Engine"
              className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Project Code" id="np-code" required>
              <input
                id="np-code"
                type="text"
                value={newProjectForm.code}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. GRAPH"
                className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2 rounded-xl border border-line focus:border-accent outline-none font-mono"
              />
            </FormField>

            <FormField label="Target Delivery Date" id="np-date" required>
              <input
                id="np-date"
                type="date"
                value={newProjectForm.targetDate}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, targetDate: e.target.value })}
                className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2 rounded-xl border border-line focus:border-accent outline-none font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Pod / Guild" id="np-pod" required>
              <select
                id="np-pod"
                value={newProjectForm.pod}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, pod: e.target.value })}
                className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none font-sans"
              >
                <option value="Frontend Guild">Frontend Guild</option>
                <option value="Platform Pod">Platform Pod</option>
                <option value="Core Backend Pod">Core Backend Pod</option>
                <option value="Quality Pod">Quality Pod</option>
              </select>
            </FormField>

            <FormField label="Lead Engineer" id="np-lead" required>
              <select
                id="np-lead"
                value={newProjectForm.lead}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, lead: e.target.value })}
                className="w-full bg-surface2 text-ink text-[13px] px-3.5 py-2.5 rounded-xl border border-line focus:border-accent outline-none font-sans"
              >
                <option value="Sneha Reddy">Sneha Reddy (Lead Engineer)</option>
                <option value="Aarav Mehta">Aarav Mehta (Senior Architect)</option>
                <option value="Karthik Iyer">Karthik Iyer (Staff Backend)</option>
                <option value="Rahul Verma">Rahul Verma (QA Lead)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Project Scope & Architecture Overview" id="np-desc" required>
            <Textarea
              id="np-desc"
              rows={3}
              value={newProjectForm.description}
              onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
              placeholder="Technical objectives, expected latency reduction, service dependencies..."
            />
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line mt-2">
            <button
              type="button"
              onClick={() => setIsNewProjectOpen(false)}
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
              <Send size={14} />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
