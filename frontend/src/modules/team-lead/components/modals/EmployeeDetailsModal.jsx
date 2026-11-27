import React, { useEffect, useState } from 'react';
import { Avatar } from '../common/Avatar.jsx';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { formatDate } from '../../utils/helpers.js';
import { ModalPortal } from '../common/ModalPortal.jsx';
import {
  X,
  User,
  Briefcase,
  Phone,
  Clock,
  Calendar,
  Award,
  CheckSquare,
  Edit3,
  ShieldCheck,
  Mail,
  MapPin,
  Save
} from 'lucide-react';

const ProfileInfoCard = ({
  label,
  value,
  readOnly,
  icon: Icon,
  iconColor = 'text-accent',
  valueTone = 'text-ink',
  valueWeight = 'font-semibold'
}) => {
  const displayValue = value || '—';

  return (
    <div className={`rounded-xl border border-line/40 bg-surface2/50 p-2.5 ${
      readOnly ? 'flex min-h-11 min-w-0 items-center gap-2 overflow-hidden' : Icon ? 'flex items-center gap-2' : ''
    }`}>
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />}
      <div className={`min-w-0 ${readOnly ? 'flex items-center gap-1.5' : Icon ? 'truncate' : ''}`}>
        <span className={readOnly ? 'shrink-0 text-[10.5px] font-semibold text-slate-200' : 'block text-[10.5px] text-muted'}>
          {readOnly ? `${label} :` : label}
        </span>
        <span
          className={`${readOnly ? 'min-w-0 truncate font-normal' : valueWeight} ${valueTone}`}
          title={displayValue}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
};

export const EmployeeDetailsModal = ({
  employee,
  isOpen,
  initialTab = 'profile',
  onClose,
  onUpdatePermittedInfo,
  onNavigateToTab,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    phone: employee?.phone || '',
    emergencyContact: employee?.emergencyContact || '',
    city: employee?.city || '',
    skillsString: employee?.skills?.join(', ') || ''
  });

  useEffect(() => {
    if (!isOpen || !employee) return;
    setActiveTab(readOnly ? 'profile' : initialTab);
    setIsEditing(!readOnly && initialTab === 'edit');
    setEditForm({
      phone: employee.phone || '',
      emergencyContact: employee.emergencyContact || '',
      city: employee.city || '',
      skillsString: employee.skills?.join(', ') || ''
    });
  }, [employee, initialTab, isOpen, readOnly]);

  if (!isOpen || !employee) return null;

  const handleSavePermittedInfo = (e) => {
    e.preventDefault();
    if (readOnly || !onUpdatePermittedInfo) return;
    const updatedSkills = editForm.skillsString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onUpdatePermittedInfo(employee.id, {
      phone: editForm.phone,
      emergencyContact: editForm.emergencyContact,
      city: editForm.city,
      skills: updatedSkills
    });
    setIsEditing(false);
  };

  return (
    <ModalPortal onClose={onClose} ariaLabelledby="employee-modal-title">
      <div className={`relative max-h-[90vh] w-full ${readOnly ? 'max-w-3xl p-4' : 'max-w-2xl p-5'} overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] text-white shadow-2xl`}>
        <button
          onClick={onClose}
          className={`absolute ${readOnly ? 'right-3 top-3' : 'right-4 top-4'} p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface2 transition`}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {readOnly ? (
          <div className="flex items-start gap-3 border-b border-line/60 pb-3 pr-10">
            <Avatar name={employee.name} size="lg" />
            <div className="min-w-0 flex-1 space-y-1">
              <h2 id="employee-modal-title" className="truncate font-display text-lg font-bold text-white sm:text-xl">
                {employee.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="shrink-0 whitespace-nowrap rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                  {employee.relation} Report
                </span>
                <StatusBadge status={employee.statusToday} className="shrink-0" />
              </div>
              <div className="truncate text-xs text-slate-200" title={`${employee.designation} · ${employee.dept} · ID: ${employee.id}`}>
                {employee.designation} · {employee.dept} · ID: {employee.id}
              </div>
              <div className="flex min-w-0 items-center gap-3 text-[11px] text-slate-200">
                <span className="flex min-w-0 items-center gap-1 truncate" title={employee.city || employee.workLocation}>
                  <MapPin className="h-3 w-3 shrink-0 text-muted" />
                  <span className="truncate">{employee.city || employee.workLocation || '—'}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap">Joined: {formatDate(employee.joined)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-line/60">
            <Avatar name={employee.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="employee-modal-title" className="font-display font-bold text-lg sm:text-xl text-white truncate">
                  {employee.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold">
                  {employee.relation} Report
                </span>
                <StatusBadge status={employee.statusToday} />
              </div>
              <div className="text-xs text-muted mt-0.5">
                {employee.designation} · {employee.dept} · ID: {employee.id}
              </div>
              <div className="text-[11px] text-muted flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted" />
                  {employee.city || employee.workLocation}
                </span>
                <span>Joined: {formatDate(employee.joined)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex border-b border-line/60 text-xs mt-3 gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
            className={`px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-surface2 text-accent border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile & Info
          </button>

          <button
            onClick={() => { setActiveTab('attendance'); setIsEditing(false); }}
            className={`px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-surface2 text-accent border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Attendance & Leaves
          </button>

          <button
            onClick={() => { setActiveTab('performance'); setIsEditing(false); }}
            className={`px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'performance'
                ? 'bg-surface2 text-accent border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Performance & Skills
          </button>

          {!readOnly && (
            <button
              onClick={() => { setActiveTab('edit'); setIsEditing(true); }}
              className={`px-3 py-2 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ml-auto ${
                activeTab === 'edit'
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'text-accent hover:bg-surface2'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Info
            </button>
          )}
        </div>

        {activeTab === 'profile' && !isEditing && (
          <div className="space-y-4 py-3 text-xs">
            <div>
              <h4 className={`font-semibold uppercase text-[11px] tracking-wider mb-2 ${readOnly ? 'text-slate-200' : 'text-muted'}`}>
                Professional Details
              </h4>
              <div className={`grid grid-cols-2 sm:grid-cols-3 ${readOnly ? 'gap-2' : 'gap-3'}`}>
                <ProfileInfoCard label="Designation" value={employee.designation} readOnly={readOnly} />
                <ProfileInfoCard label="Department" value={employee.dept} readOnly={readOnly} />
                <ProfileInfoCard label="Employment Type" value={employee.type} readOnly={readOnly} />
                <ProfileInfoCard label="Reporting Lead" value={employee.reportingManager} readOnly={readOnly} valueTone="text-accent" />
                <ProfileInfoCard label="Work Location" value={employee.workLocation} readOnly={readOnly} />
                <ProfileInfoCard label="Grade Band" value={employee.payrollSummary?.grade || 'L3'} readOnly={readOnly} />
              </div>
            </div>

            <div>
              <h4 className={`font-semibold uppercase text-[11px] tracking-wider mb-2 ${readOnly ? 'text-slate-200' : 'text-muted'}`}>
                Contact & Personal Information
              </h4>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${readOnly ? 'gap-2' : 'gap-3'}`}>
                <ProfileInfoCard label="Work Email" value={employee.email} readOnly={readOnly} icon={Mail} />
                <ProfileInfoCard label="Mobile Phone" value={employee.phone} readOnly={readOnly} icon={Phone} iconColor="text-good" valueWeight="font-medium" />
                <ProfileInfoCard label="Emergency Contact" value={employee.emergencyContact} readOnly={readOnly} valueWeight="font-medium" />
                <ProfileInfoCard label="Blood Group" value={employee.bloodGroup} readOnly={readOnly} valueTone="text-accent2" valueWeight="font-bold" />
              </div>
            </div>

            <div className={`rounded-xl border border-line/50 bg-surface2/30 text-[11px] ${
              readOnly ? 'flex items-start gap-2 p-2.5 text-slate-200' : 'flex items-center gap-2 p-3 text-muted'
            }`}>
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              {readOnly ? (
                <p className="min-w-0 leading-snug">
                  <span className="font-semibold text-slate-200">Privacy :</span>{' '}
                  <span className="font-normal">Confidential salary structures and personal taxation documents are protected under HR role segregation and not displayed here.</span>
                </p>
              ) : (
                <span>
                  Confidential salary structures and personal taxation documents are protected under HR role segregation and not displayed here.
                </span>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && !isEditing && (
          <div className="space-y-4 py-3 text-xs">
            <div>
              <h4 className="font-semibold text-muted uppercase text-[11px] tracking-wider mb-2">
                Monthly Attendance Metrics (November 2026)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-surface2 border border-line text-center">
                  <span className="text-[10px] text-muted block uppercase">Attendance Rate</span>
                  <span className="text-lg font-display font-bold text-good">
                    {employee.attendanceSummary.rate}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface2 border border-line text-center">
                  <span className="text-[10px] text-muted block uppercase">Present Days</span>
                  <span className="text-lg font-display font-bold text-ink">
                    {employee.attendanceSummary.presentDays}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface2 border border-line text-center">
                  <span className="text-[10px] text-muted block uppercase">Late Days</span>
                  <span className="text-lg font-display font-bold text-warn">
                    {employee.attendanceSummary.lateDays}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface2 border border-line text-center">
                  <span className="text-[10px] text-muted block uppercase">WFH Days</span>
                  <span className="text-lg font-display font-bold text-info">
                    {employee.attendanceSummary.wfhDays}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-muted uppercase text-[11px] tracking-wider mb-2">
                Leave Balances
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-surface2/60 border border-line">
                  <div className="text-[11px] text-muted font-medium">Casual Leave</div>
                  <div className="text-base font-bold text-ink mt-0.5">
                    {employee.leaveBalance.casual.remaining}{' '}
                    <span className="text-[10px] text-muted font-normal">/ {employee.leaveBalance.casual.total}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2/60 border border-line">
                  <div className="text-[11px] text-muted font-medium">Sick Leave</div>
                  <div className="text-base font-bold text-ink mt-0.5">
                    {employee.leaveBalance.sick.remaining}{' '}
                    <span className="text-[10px] text-muted font-normal">/ {employee.leaveBalance.sick.total}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2/60 border border-line">
                  <div className="text-[11px] text-muted font-medium">Earned Leave</div>
                  <div className="text-base font-bold text-ink mt-0.5">
                    {employee.leaveBalance.earned.remaining}{' '}
                    <span className="text-[10px] text-muted font-normal">/ {employee.leaveBalance.earned.total}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface2/60 border border-line">
                  <div className="text-[11px] text-muted font-medium">Optional Holiday</div>
                  <div className="text-base font-bold text-ink mt-0.5">
                    {employee.leaveBalance.optional.remaining}{' '}
                    <span className="text-[10px] text-muted font-normal">/ {employee.leaveBalance.optional.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && !isEditing && (
          <div className="space-y-4 py-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface2 border border-line text-center">
                <span className="text-muted block text-[10.5px]">Performance Score</span>
                <span className="text-2xl font-display font-extrabold text-accent">
                  {employee.performanceScore}/100
                </span>
                <span className="text-[10.5px] text-muted block mt-0.5">Rating: {employee.rating} ★</span>
              </div>

              <div className="p-3 rounded-xl bg-surface2 border border-line text-center">
                <span className="text-muted block text-[10.5px]">KPI Achievement</span>
                <span className="text-2xl font-display font-extrabold text-good">
                  {employee.kpiScore}
                </span>
                <span className="text-[10.5px] text-muted block mt-0.5">Target: 90%</span>
              </div>

              <div className="p-3 rounded-xl bg-surface2 border border-line text-center">
                <span className="text-muted block text-[10.5px]">Goal Completion</span>
                <span className="text-2xl font-display font-extrabold text-accent2">
                  {employee.goalsProgress}%
                </span>
                <span className="text-[10.5px] text-muted block mt-0.5">{employee.reviewCycle}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-muted uppercase text-[11px] tracking-wider mb-2">
                Skills & Technical Competencies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {employee.skills?.map((sk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-ink text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {employee.certifications?.length > 0 && (
              <div>
                <h4 className="font-semibold text-muted uppercase text-[11px] tracking-wider mb-2">
                  Certifications & Verified Badges
                </h4>
                <div className="space-y-1.5">
                  {employee.certifications.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-surface2/50 border border-line/40 flex items-center gap-2 text-ink text-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-accent" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!readOnly && (activeTab === 'edit' || isEditing) && (
          <form onSubmit={handleSavePermittedInfo} className="space-y-3.5 py-3 text-xs">
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-[11px]">
              Team Leads are authorized to update emergency contact details, primary phone number, residential city, and verified skill tags.
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Mobile Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Emergency Contact (Name & Relationship)</label>
              <input
                type="text"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Residential City / Work Base</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">Technical Skills (Comma separated)</label>
              <input
                type="text"
                value={editForm.skillsString}
                onChange={(e) => setEditForm({ ...editForm, skillsString: e.target.value })}
                className="w-full bg-surface2 border border-line rounded-xl p-2.5 text-xs text-ink focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setActiveTab('profile'); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink hover:border-accent transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-accent text-on-accent hover:brightness-105 transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink hover:border-accent transition"
          >
            Close
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
