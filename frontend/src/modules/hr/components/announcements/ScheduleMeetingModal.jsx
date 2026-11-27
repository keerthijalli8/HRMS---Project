import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { createMeeting, updateMeeting } from '../../services/announcementService.js';
import { loadDepartmentsList, loadAllEmployees } from '../../services/teamService.js';

export const ScheduleMeetingModal = ({
  isOpen,
  onClose,
  onSaved,
  editMeeting = null,
  currentUser = null
}) => {
  const isEdit = Boolean(editMeeting);

  // Load actual departments dynamically from teamService
  const availableDepartments = useMemo(() => {
    return loadDepartmentsList();
  }, [isOpen]);

  // Load all employees dynamically from teamService
  const allEmployees = useMemo(() => {
    return loadAllEmployees();
  }, [isOpen]);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agenda, setAgenda] = useState("");
  const [meetingType, setMeetingType] = useState("Online"); // 'Online' | 'Offline'
  const [organizerName, setOrganizerName] = useState(currentUser?.name || "Organizer");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]); // array of participant objects or IDs
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("Boardroom Alpha, 4th Floor");
  const [meetingLink, setMeetingLink] = useState("");
  const [attachments, setAttachments] = useState([]);

  // Filter / helper states
  const [participantSearch, setParticipantSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (editMeeting) {
      setTitle(editMeeting.title || "");
      setDescription(editMeeting.description || "");
      setAgenda(editMeeting.agenda || "");
      setMeetingType(editMeeting.meetingType || "Online");
      setOrganizerName(editMeeting.organizerName || currentUser?.name || "Organizer");
      setSelectedDepartments(editMeeting.departments || []);
      setSelectedParticipants(editMeeting.participants || []);
      setMeetingDate(editMeeting.meetingDate || "");
      setStartTime(editMeeting.startTime || "10:00");
      setEndTime(editMeeting.endTime || "11:00");
      setLocation(editMeeting.location || "Boardroom Alpha, 4th Floor");
      setMeetingLink(editMeeting.meetingLink || "");
      setAttachments(editMeeting.attachments || []);
    } else {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      setTitle("");
      setDescription("");
      setAgenda("");
      setMeetingType("Online");
      setOrganizerName(currentUser?.name || "Organizer");
      setSelectedDepartments([]);
      
      // Auto-include organizer in participants
      if (currentUser?.employeeId || currentUser?.id) {
        setSelectedParticipants([
          {
            employeeId: currentUser.employeeId || currentUser.id,
            name: currentUser.name || "Organizer",
            email: currentUser.email || "",
            designation: currentUser.role || currentUser.systemRole || "Host",
            response: "accepted"
          }
        ]);
      } else {
        setSelectedParticipants([]);
      }

      setMeetingDate(todayStr);
      setStartTime("11:00");
      setEndTime("12:00");
      setLocation("Boardroom Alpha, 4th Floor - Hyderabad HQ");
      setMeetingLink(`https://meet.google.com/tc-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`);
      setAttachments([]);
    }
    setErrors({});
  }, [editMeeting, currentUser, isOpen]);

  // Compute eligible employees based on selected departments
  const departmentFilteredEmployees = useMemo(() => {
    if (selectedDepartments.length === 0 || selectedDepartments.includes("All Departments")) {
      return allEmployees;
    }
    const lowerDepts = selectedDepartments.map(d => d.toLowerCase());
    return allEmployees.filter(e => {
      const eDept = (e.dept || e.department || "").toLowerCase();
      return lowerDepts.includes(eDept);
    });
  }, [allEmployees, selectedDepartments]);

  // Further filtered by search query
  const searchableEmployees = useMemo(() => {
    if (!participantSearch.trim()) return departmentFilteredEmployees;
    const q = participantSearch.toLowerCase();
    return departmentFilteredEmployees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.dept || e.department || "").toLowerCase().includes(q) ||
      (e.designation || "").toLowerCase().includes(q)
    );
  }, [departmentFilteredEmployees, participantSearch]);

  // Toggle department selection
  const handleToggleDepartment = (deptName) => {
    let nextDepts;
    if (deptName === "All Departments") {
      nextDepts = selectedDepartments.includes("All Departments") ? [] : ["All Departments"];
    } else {
      const filtered = selectedDepartments.filter(d => d !== "All Departments");
      nextDepts = filtered.includes(deptName)
        ? filtered.filter(d => d !== deptName)
        : [...filtered, deptName];
    }
    setSelectedDepartments(nextDepts);
  };

  // Toggle individual participant
  const handleToggleParticipant = (emp) => {
    setSelectedParticipants(prev => {
      const exists = prev.some(p => p.employeeId === emp.id);
      if (exists) {
        return prev.filter(p => p.employeeId !== emp.id);
      } else {
        return [
          ...prev,
          {
            employeeId: emp.id,
            name: emp.name,
            email: emp.email || "",
            designation: emp.designation || emp.role || "Team Member",
            response: "pending"
          }
        ];
      }
    });
  };

  // Quick Action: Invite All in Department
  const handleInviteAllInDepartment = () => {
    const newParticipants = departmentFilteredEmployees.map(emp => ({
      employeeId: emp.id,
      name: emp.name,
      email: emp.email || "",
      designation: emp.designation || emp.role || "Team Member",
      response: emp.id === (currentUser?.employeeId || currentUser?.id) ? "accepted" : "pending"
    }));

    // Merge with existing
    setSelectedParticipants(prev => {
      const map = new Map();
      prev.forEach(p => map.set(p.employeeId, p));
      newParticipants.forEach(p => map.set(p.employeeId, p));
      return Array.from(map.values());
    });
  };

  // Quick Action: Invite Department Managers and Team Leads
  const handleInviteLeadersOnly = () => {
    const leaders = departmentFilteredEmployees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const desig = (e.designation || "").toLowerCase();
      return (
        role === "MAIN_TL" ||
        role === "TL" ||
        e.isDepartmentHead ||
        desig.includes("lead") ||
        desig.includes("manager") ||
        desig.includes("director")
      );
    });

    const newParticipants = leaders.map(emp => ({
      employeeId: emp.id,
      name: emp.name,
      email: emp.email || "",
      designation: emp.designation || emp.role || "Team Lead",
      response: emp.id === (currentUser?.employeeId || currentUser?.id) ? "accepted" : "pending"
    }));

    setSelectedParticipants(prev => {
      const map = new Map();
      prev.forEach(p => map.set(p.employeeId, p));
      newParticipants.forEach(p => map.set(p.employeeId, p));
      return Array.from(map.values());
    });
  };

  // Generate meeting link
  const handleGenerateMeetLink = () => {
    const code = `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    setMeetingLink(`https://meet.google.com/nexora-${code}`);
  };

  // File attachments
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newAttachments = files.map(file => {
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      return {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: sizeStr,
        url: "#"
      };
    });
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = "Meeting Title is required";
    if (!meetingDate) errs.meetingDate = "Meeting Date is required";
    if (!startTime) errs.startTime = "Start Time is required";
    if (!endTime) errs.endTime = "End Time is required";
    if (meetingType === "Online" && !meetingLink.trim()) {
      errs.meetingLink = "Meeting Link is required for online meetings";
    }
    if (meetingType === "Offline" && !location.trim()) {
      errs.location = "Location / Room is required for in-person meetings";
    }
    if (selectedParticipants.length === 0) {
      errs.participants = "Please select at least one participant";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        agenda,
        meetingType,
        organizerName,
        departments: selectedDepartments.length > 0 ? selectedDepartments : ["All Departments"],
        participants: selectedParticipants,
        meetingDate,
        startTime,
        endTime,
        location,
        meetingLink,
        attachments
      };

      if (isEdit) {
        updateMeeting(editMeeting.id, payload, currentUser);
      } else {
        createMeeting(payload, currentUser);
      }

      setIsSubmitting(false);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ global: err.message || "Failed to schedule meeting" });
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-3xl max-h-[92vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 rounded-3xl bg-[#0d1622]/95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/25 to-emerald-500/25 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-lg shadow-md">
              <Icon name="calendar" className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-ink text-base sm:text-lg">
                {isEdit ? "Edit Scheduled Meeting" : "Schedule Meeting & Conference"}
              </h2>
              <p className="text-[12px] text-muted">
                Coordinate departmental syncs, architecture reviews, and company-wide town halls
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition cursor-pointer"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errors.global && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <Icon name="alert-triangle" className="w-4 h-4 text-rose-400" />
            <span>{errors.global}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs flex flex-col gap-5">
          
          {/* Meeting Title & Type Row */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                Meeting Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Engineering Architecture Review or Sprint 48 Sign-Off"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-surface2/60 border ${
                  errors.title ? "border-rose-400" : "border-line"
                } text-ink placeholder:text-muted/60 text-xs focus:border-accent outline-none transition`}
              />
              {errors.title && <span className="text-rose-400 text-[11px] mt-1 block">{errors.title}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Meeting Type (Online / Offline) */}
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  Meeting Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingType("Online")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      meetingType === "Online"
                        ? "bg-accent text-on-accent border-accent font-bold shadow-sm"
                        : "bg-surface2/60 border-line text-muted hover:text-ink"
                    }`}
                  >
                    <Icon name="video" className="w-3.5 h-3.5 text-inherit" />
                    <span>Online (Video)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType("Offline")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      meetingType === "Offline"
                        ? "bg-accent text-on-accent border-accent font-bold shadow-sm"
                        : "bg-surface2/60 border-line text-muted hover:text-ink"
                    }`}
                  >
                    <Icon name="map-pin" className="w-3.5 h-3.5 text-inherit" />
                    <span>In-Person (Room)</span>
                  </button>
                </div>
              </div>

              {/* Organizer Name */}
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  Organizer Host
                </label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Organizer name"
                  className="w-full px-3 py-2 rounded-xl bg-surface2/60 border border-line text-ink text-xs focus:border-accent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description & Agenda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                Meeting Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level purpose and key deliverables of this session..."
                className="w-full p-3 rounded-xl bg-surface2/60 border border-line text-ink placeholder:text-muted/60 text-xs focus:border-accent outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                Structured Agenda
              </label>
              <textarea
                rows={3}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="1. Introduction\n2. Key Metrics & Discussion\n3. Action Items"
                className="w-full p-3 rounded-xl bg-surface2/60 border border-line text-ink placeholder:text-muted/60 text-xs focus:border-accent outline-none leading-relaxed font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Date, Time & Location Row */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  Meeting Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-surface2/60 border ${
                    errors.meetingDate ? "border-rose-400" : "border-line"
                  } text-ink text-xs focus:border-accent outline-none`}
                />
                {errors.meetingDate && <span className="text-rose-400 text-[11px] mt-1 block">{errors.meetingDate}</span>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  Start Time <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface2/60 border border-line text-ink text-xs focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                  End Time <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface2/60 border border-line text-ink text-xs focus:border-accent outline-none"
                />
              </div>
            </div>

            {/* Location or Meeting Link */}
            <div className="pt-2 border-t border-line/60">
              {meetingType === "Online" ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider">
                      Meeting Link (Google Meet / Zoom / Teams) <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateMeetLink}
                      className="text-[11px] text-accent font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name="sparkles" className="w-3 h-3 text-accent" />
                      <span>Auto-Generate Link</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className={`w-full px-3 py-2 rounded-xl bg-surface2/60 border ${
                      errors.meetingLink ? "border-rose-400" : "border-line"
                    } text-ink font-mono text-xs focus:border-accent outline-none`}
                  />
                  {errors.meetingLink && <span className="text-rose-400 text-[11px] mt-1 block">{errors.meetingLink}</span>}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                    Conference Room / Location <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Boardroom Alpha (4th Floor), Meeting Pod 2, or Campus Cafeteria"
                    className={`w-full px-3 py-2 rounded-xl bg-surface2/60 border ${
                      errors.location ? "border-rose-400" : "border-line"
                    } text-ink text-xs focus:border-accent outline-none`}
                  />
                  {errors.location && <span className="text-rose-400 text-[11px] mt-1 block">{errors.location}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Department & Participants Targeting */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider">
                  Target Departments
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDepartments(["All Departments"])}
                    className="text-[10.5px] text-accent hover:underline cursor-pointer"
                  >
                    Entire Company
                  </button>
                  <span className="text-muted">·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDepartments([])}
                    className="text-[10.5px] text-muted hover:text-ink cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Department chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleDepartment("All Departments")}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    selectedDepartments.includes("All Departments")
                      ? "bg-accent text-on-accent border-accent"
                      : "bg-surface2 border-line text-muted hover:text-ink"
                  }`}
                >
                  All Departments
                </button>

                {availableDepartments.map(dept => {
                  const isChecked = selectedDepartments.includes(dept.name);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleToggleDepartment(dept.name)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-accent/15 border-accent text-accent"
                          : "bg-surface2 border-line text-muted hover:text-ink"
                      }`}
                    >
                      <span>{dept.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Participants Selection Box */}
            <div className="pt-2 border-t border-line/60 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] font-semibold text-ink">
                  Select Participants: <strong className="text-accent font-num font-bold">{selectedParticipants.length}</strong> selected
                </div>

                {/* Quick actions for participants */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInviteAllInDepartment}
                    className="px-2 py-0.5 rounded-lg bg-surface2 border border-line text-[10.5px] font-semibold text-ink hover:text-accent hover:border-accent/40 transition cursor-pointer"
                  >
                    + All in Department ({departmentFilteredEmployees.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleInviteLeadersOnly}
                    className="px-2 py-0.5 rounded-lg bg-surface2 border border-line text-[10.5px] font-semibold text-ink hover:text-accent hover:border-accent/40 transition cursor-pointer"
                  >
                    + Leads & Managers Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedParticipants([])}
                    className="text-[10.5px] text-muted hover:text-ink cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search Participant */}
              <div className="relative">
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search participants by name, EMP ID or designation..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder:text-muted/60 outline-none focus:border-accent"
                />
                <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Participant checkbox list */}
              <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-surface2/40 border border-line rounded-xl">
                {searchableEmployees.map(emp => {
                  const isChecked = selectedParticipants.some(p => p.employeeId === emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleParticipant(emp)}
                      className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                        isChecked ? "bg-accent/15 text-accent font-semibold" : "hover:bg-surface2 text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] shrink-0 ${
                          isChecked ? "bg-accent text-on-accent border-accent" : "border-line bg-surface2"
                        }`}>
                          {isChecked && "✓"}
                        </span>
                        <span className="truncate">{emp.name}</span>
                        <span className="text-[10px] text-muted font-num">({emp.id})</span>
                      </div>
                      <span className="text-[10px] text-muted shrink-0">{emp.department || emp.dept}</span>
                    </div>
                  );
                })}
              </div>
              {errors.participants && <span className="text-rose-400 text-[11px]">{errors.participants}</span>}
            </div>
          </div>

          {/* Optional Attachments */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-surface2/30 border border-line flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider">
                  Meeting Documents & Presentation Deck (Optional)
                </label>
                <div className="text-[11px] text-muted">Upload agenda files, slide decks, or briefing documents</div>
              </div>

              <label className="px-3 py-1.5 rounded-xl bg-surface2 border border-line hover:border-accent text-accent font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm">
                <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
                <span>Upload</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface2 border border-line text-ink text-xs shadow-sm"
                  >
                    <Icon name="file-text" className="w-3.5 h-3.5 text-accent" />
                    <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                    <span className="text-[10px] text-muted font-num">({file.size})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-muted hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    >
                      <Icon name="x" className="w-3 h-3 text-inherit" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-end gap-3 bg-surface/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface2 border border-line text-muted hover:text-ink text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
          >
            <Icon name="calendar" className="w-4 h-4 text-white" />
            <span>{isEdit ? "Update Meeting" : "Schedule Meeting"}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ScheduleMeetingModal;
