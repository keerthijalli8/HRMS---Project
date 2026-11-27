import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import {
  FolderKanban,
  Search,
  Plus,
  ChevronDown
} from 'lucide-react';
import { formatDate } from '../../utils/helpers.js';

export const Projects = () => {
  const navigate = useNavigate();
  const { triggerToast } = useTeamLead();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const projectsList = [
    {
      id: 'PRJ-101',
      name: 'Platform Modernization',
      leadName: 'Aarav Menon',
      team: 'Core Engineering',
      progress: 70,
      status: 'On track',
      dueDate: '2026-12-10',
      membersCount: 4,
      milestonesCompleted: 2,
      totalMilestones: 3
    },
    {
      id: 'PRJ-102',
      name: 'Mobile Experience',
      leadName: 'Diya Sharma',
      team: 'Design',
      progress: 30,
      status: 'At risk',
      dueDate: '2026-12-11',
      membersCount: 4,
      milestonesCompleted: 1,
      totalMilestones: 3
    },
    {
      id: 'PRJ-103',
      name: 'Quality Automation Suite',
      leadName: 'Rohan Iyer',
      team: 'QA',
      progress: 100,
      status: 'Completed',
      dueDate: '2026-11-20',
      membersCount: 3,
      milestonesCompleted: 3,
      totalMilestones: 3
    },
    {
      id: 'PRJ-104',
      name: 'Cloud Migration & Security',
      leadName: 'Meera Nair',
      team: 'DevOps',
      progress: 55,
      status: 'Delayed',
      dueDate: '2026-12-25',
      membersCount: 5,
      milestonesCompleted: 2,
      totalMilestones: 4
    }
  ];

  const filteredProjects = projectsList.filter(proj => {
    const matchesSearch = proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proj.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proj.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || proj.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">

      <section className="glass-card !p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-ink">Projects Directory</h2>
          <p className="text-xs text-muted">Manage active team projects, sprint assignments, and milestones.</p>
        </div>
        <button
          onClick={() => triggerToast('New Project creation wizard opened.', 'info')}
          className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-semibold flex items-center gap-1.5 hover:brightness-105 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </section>

      <section className="glass-card !p-4 flex flex-col sm:flex-row items-center justify-between gap-3">

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search projects or leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface2/80 border border-line rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder:text-muted focus:border-accent transition"
          />
        </div>

        <div className="relative w-full sm:w-64">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full appearance-none bg-[#141824] border border-line rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:border-accent focus:outline-none transition cursor-pointer pr-8 shadow-sm"
          >
            <option value="All" className="bg-[#141824] text-white font-semibold py-2">All Statuses</option>
            <option value="On track" className="bg-[#141824] text-white py-2">On track</option>
            <option value="At risk" className="bg-[#141824] text-white py-2">At risk</option>
            <option value="Delayed" className="bg-[#141824] text-white py-2">Delayed</option>
            <option value="Completed" className="bg-[#141824] text-white py-2">Completed</option>
          </select>
          <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full glass-card !p-8 text-center text-muted text-xs">
            No projects found matching your filter criteria.
          </div>
        ) : (
          filteredProjects.map(proj => (
            <div key={proj.id} className="glass-card !p-4 flex flex-col justify-between space-y-5 border border-line/60 hover:border-accent/40 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-accent tracking-wider uppercase">{proj.id} · {proj.team}</span>
                  <h3 className="font-display font-semibold text-base text-ink mt-0.5">{proj.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                    <Avatar name={proj.leadName} size="xs" />
                    <span>Lead: <strong className="text-ink">{proj.leadName}</strong></span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  proj.status === 'Completed' ? 'bg-good/15 text-good border border-good/30' :
                  proj.status === 'Delayed' ? 'bg-bad/15 text-bad border border-bad/30' :
                  proj.status === 'At risk' ? 'bg-warn/15 text-warn border border-warn/30' :
                  'bg-accent/15 text-accent border border-accent/30'
                }`}>
                  • {proj.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted">Progress</span>
                  <span className="text-ink font-bold">{proj.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface2 border border-line overflow-hidden">
                  <div
                    style={{ width: `${proj.progress}%` }}
                    className={`h-full ${proj.progress === 100 ? 'bg-good' : proj.progress < 40 ? 'bg-warn' : 'bg-accent'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs text-muted">
                <span>{proj.membersCount} members · {proj.milestonesCompleted}/{proj.totalMilestones} milestones</span>
                <span className="font-data font-medium text-ink">Due: {formatDate(proj.dueDate)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};