import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Select } from '../components/Select.jsx';
import { AnnouncementCard } from '../components/announcements/AnnouncementCard.jsx';
import { MeetingCard } from '../components/announcements/MeetingCard.jsx';
import { AnnouncementsStats } from '../components/announcements/AnnouncementsStats.jsx';
import { CreateAnnouncementModal } from '../components/announcements/CreateAnnouncementModal.jsx';
import { ScheduleMeetingModal } from '../components/announcements/ScheduleMeetingModal.jsx';
import { AnnouncementDetailModal } from '../components/announcements/AnnouncementDetailModal.jsx';
import { MeetingDetailModal } from '../components/announcements/MeetingDetailModal.jsx';
import {
  getAnnouncementsForUser,
  getMeetingsForUser,
  getAnnouncementsAndMeetingStats,
  deleteAnnouncement,
  publishAnnouncementNow,
  rescheduleAnnouncement,
  cancelMeeting,
  rescheduleMeeting,
  respondToMeeting,
  checkScheduledAnnouncements,
  subscribeAnnouncements,
  subscribeMeetings,
  ANNOUNCEMENT_CATEGORIES,
  PRIORITIES,
  isHRorAdminUser
} from '../services/announcementService.js';
import { loadDepartmentsList } from '../services/teamService.js';

export const AnnouncementsView = ({ currentUser, onTriggerToast, setCurrentRoute }) => {
  const isHR = useMemo(() => isHRorAdminUser(currentUser), [currentUser]);

  // Main Module Tabs: 'announcements' | 'meetings'
  const [activeMainTab, setActiveMainTab] = useState("announcements");

  // Sub-filter tabs
  const [announcementFilter, setAnnouncementFilter] = useState("all"); // 'all' | 'published' | 'scheduled' | 'draft' | 'department_wise' | 'expired'
  const [meetingFilter, setMeetingFilter] = useState("all"); // 'all' | 'today' | 'upcoming' | 'my_invites' | 'completed' | 'cancelled'

  // Search & Filter Toolbar
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Revision state for reactive updates
  const [revision, setRevision] = useState(0);

  // Modals state
  const [createAnnModalOpen, setCreateAnnModalOpen] = useState(false);
  const [scheduleMtgModalOpen, setScheduleMtgModalOpen] = useState(false);

  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);

  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);

  // Dynamically load departments from teamService
  const departments = useMemo(() => {
    return loadDepartmentsList();
  }, [revision]);

  // Periodic check for scheduled announcements & reminders
  useEffect(() => {
    checkScheduledAnnouncements();
    const timer = setInterval(() => {
      checkScheduledAnnouncements();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubAnn = subscribeAnnouncements(() => setRevision(r => r + 1));
    const unsubMtg = subscribeMeetings(() => setRevision(r => r + 1));
    return () => {
      unsubAnn();
      unsubMtg();
    };
  }, []);

  // Fetch data for current user
  const announcements = useMemo(() => {
    return getAnnouncementsForUser(currentUser);
  }, [currentUser, revision]);

  const meetings = useMemo(() => {
    return getMeetingsForUser(currentUser);
  }, [currentUser, revision]);

  const stats = useMemo(() => {
    return getAnnouncementsAndMeetingStats(currentUser);
  }, [currentUser, revision]);

  // Handle KPI Tile filter clicks
  const handleKPIClick = (tab, filterKey) => {
    setActiveMainTab(tab);
    if (tab === "announcements") {
      setAnnouncementFilter(filterKey);
    } else {
      setMeetingFilter(filterKey);
    }
  };

  // ----------------- FILTERING LOGIC -----------------

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      // Sub-filter status
      if (announcementFilter === "published" && ann.status !== "Published") return false;
      if (announcementFilter === "scheduled" && ann.status !== "Scheduled") return false;
      if (announcementFilter === "draft" && ann.status !== "Draft") return false;
      if (announcementFilter === "expired" && ann.status !== "Expired") return false;

      // Category filter
      if (selectedCategory !== "all" && ann.category !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== "all" && ann.priority !== selectedPriority) return false;

      // Department filter
      if (selectedDepartment !== "all") {
        if (ann.targetAudience === "All Employees" || ann.targetAudience === "All Departments") {
          // company-wide applies to all
        } else if (ann.targetAudience === "Specific Department") {
          const match = (ann.targetDepartments || []).some(
            d => d.toLowerCase() === selectedDepartment.toLowerCase()
          );
          if (!match) return false;
        } else {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (ann.title || "").toLowerCase().includes(q);
        const matchesDesc = (ann.description || "").toLowerCase().includes(q);
        const matchesAuthor = (ann.authorName || "").toLowerCase().includes(q);
        const matchesDept = (ann.targetDepartments || []).some(d => d.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesDept) return false;
      }

      return true;
    });
  }, [announcements, announcementFilter, selectedCategory, selectedPriority, selectedDepartment, searchQuery]);

  const filteredMeetings = useMemo(() => {
    const userEmpId = currentUser?.employeeId || currentUser?.id || "";

    return meetings.filter(mtg => {
      // Sub-filter status
      if (meetingFilter === "today" && mtg.status !== "Today") return false;
      if (meetingFilter === "upcoming" && mtg.status !== "Upcoming") return false;
      if (meetingFilter === "completed" && mtg.status !== "Completed") return false;
      if (meetingFilter === "cancelled" && mtg.status !== "Cancelled") return false;
      if (meetingFilter === "my_invites") {
        const isInvited = mtg.participants?.some(p => p.employeeId === userEmpId);
        if (!isInvited) return false;
      }
      if (meetingFilter === "pending_rsvp") {
        const myP = mtg.participants?.find(p => p.employeeId === userEmpId);
        if (!myP || myP.response !== "pending") return false;
      }

      // Department filter
      if (selectedDepartment !== "all") {
        const matchesDept = (mtg.departments || []).some(
          d => d.toLowerCase() === "all departments" || d.toLowerCase() === selectedDepartment.toLowerCase()
        );
        if (!matchesDept) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (mtg.title || "").toLowerCase().includes(q);
        const matchesDesc = (mtg.description || "").toLowerCase().includes(q);
        const matchesHost = (mtg.organizerName || "").toLowerCase().includes(q);
        const matchesAgenda = (mtg.agenda || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesHost && !matchesAgenda) return false;
      }

      return true;
    });
  }, [meetings, meetingFilter, selectedDepartment, searchQuery, currentUser]);

  // Group announcements by department for department-wise view
  const departmentWiseAnnouncements = useMemo(() => {
    const map = {};
    departments.forEach(dept => {
      map[dept.name] = [];
    });
    map["Company-Wide"] = [];

    filteredAnnouncements.forEach(ann => {
      if (ann.targetAudience === "All Employees" || ann.targetAudience === "All Departments") {
        map["Company-Wide"].push(ann);
      } else if (ann.targetAudience === "Specific Department" && ann.targetDepartments?.length > 0) {
        ann.targetDepartments.forEach(deptName => {
          if (!map[deptName]) map[deptName] = [];
          map[deptName].push(ann);
        });
      } else {
        if (!map["Other Announcements"]) map["Other Announcements"] = [];
        map["Other Announcements"].push(ann);
      }
    });

    return Object.entries(map).filter(([_, items]) => items.length > 0);
  }, [departments, filteredAnnouncements]);

  // ----------------- ACTION HANDLERS -----------------

  const handlePublishNow = (id) => {
    const res = publishAnnouncementNow(id, currentUser);
    if (res.ok) {
      onTriggerToast?.("Announcement published successfully to all targeted recipients!");
      setRevision(r => r + 1);
    }
  };

  const handleDeleteAnnouncement = (id) => {
    if (window.confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
      deleteAnnouncement(id);
      onTriggerToast?.("Announcement deleted from corporate bulletin.");
      setRevision(r => r + 1);
    }
  };

  const handleRescheduleAnnouncement = (ann, date, time) => {
    rescheduleAnnouncement(ann.id, date, time, currentUser);
    onTriggerToast?.(`Announcement rescheduled for ${date} at ${time}.`);
    setRevision(r => r + 1);
  };

  const handleCancelMeeting = (mtg, reason) => {
    cancelMeeting(mtg.id, reason, currentUser);
    onTriggerToast?.("Meeting cancelled. All participants have been notified.");
    setRevision(r => r + 1);
  };

  const handleRescheduleMeeting = (mtg) => {
    setEditingMeeting(mtg);
    setScheduleMtgModalOpen(true);
  };

  const handleMeetingRSVP = (meetingId, response) => {
    const empId = currentUser?.employeeId || currentUser?.id || "EMP-1088";
    respondToMeeting(meetingId, empId, response);
    onTriggerToast?.(`RSVP updated: Marked as ${response.toUpperCase()}!`);
    setRevision(r => r + 1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedDepartment("all");
    setAnnouncementFilter("all");
    setMeetingFilter("all");
  };

  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedPriority !== "all" ||
    selectedDepartment !== "all" ||
    (activeMainTab === "announcements" && announcementFilter !== "all") ||
    (activeMainTab === "meetings" && meetingFilter !== "all");

  return (
    <div className="flex flex-col gap-5 w-full animate-fadeIn pb-12">
      
      {/* 1. TOP HEADER & PRIMARY ACTION BUTTONS */}
      <div className="glass-card !p-4 sm:!p-5 border border-line rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent2 text-on-accent flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <Icon name="megaphone" className="w-6 h-6 text-on-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-ink text-lg sm:text-xl md:text-2xl leading-tight">
                Announcements & Meeting Management
              </h1>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-accent font-semibold hidden sm:inline">
                Broadcast Hub
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Publish circulars, department announcements, and schedule synchronized video conferences
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingMeeting(null);
              setScheduleMtgModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-bold text-ink hover:text-accent transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Icon name="calendar" className="w-4 h-4 text-accent" />
            <span>Schedule Meeting</span>
          </button>

          {isHR && (
            <button
              type="button"
              onClick={() => {
                setEditingAnnouncement(null);
                setCreateAnnModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent2 text-on-accent text-xs font-bold shadow-md hover:brightness-110 transition flex items-center gap-2 cursor-pointer"
            >
              <Icon name="plus" className="w-4 h-4 text-on-accent" />
              <span>Create Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. OVERVIEW STATISTICS ROW */}
      <AnnouncementsStats
        stats={stats}
        activeTab={activeMainTab}
        activeFilter={activeMainTab === "announcements" ? announcementFilter : meetingFilter}
        onFilterClick={handleKPIClick}
      />

      {/* 3. MAIN NAVIGATION TABS (Announcements vs Meetings) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-1">
        <div className="inline-flex items-center p-1 bg-surface2/60 border border-line rounded-2xl shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMainTab("announcements")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeMainTab === "announcements"
                ? "bg-accent text-on-accent shadow-md"
                : "text-muted hover:text-ink hover:bg-surface2/50"
            }`}
          >
            <Icon name="megaphone" className={`w-4 h-4 ${activeMainTab === "announcements" ? "text-on-accent" : "text-muted"}`} />
            <span>Corporate Announcements</span>
            <span className={`px-1.5 py-0.2 rounded-full font-num text-[10.5px] font-bold ${
              activeMainTab === "announcements" ? "bg-black/20 text-on-accent" : "bg-surface2 text-muted"
            }`}>
              {announcements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("meetings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeMainTab === "meetings"
                ? "bg-accent text-on-accent shadow-md"
                : "text-muted hover:text-ink hover:bg-surface2/50"
            }`}
          >
            <Icon name="video" className={`w-4 h-4 ${activeMainTab === "meetings" ? "text-on-accent" : "text-muted"}`} />
            <span>Meetings & Conferences</span>
            <span className={`px-1.5 py-0.2 rounded-full font-num text-[10.5px] font-bold ${
              activeMainTab === "meetings" ? "bg-black/20 text-on-accent" : "bg-surface2 text-muted"
            }`}>
              {meetings.length}
            </span>
          </button>
        </div>

        {/* Sub-Filters Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {activeMainTab === "announcements" ? (
            <>
              {[
                { id: "all", label: "All Notices" },
                { id: "published", label: "Published" },
                { id: "scheduled", label: "Scheduled" },
                { id: "department_wise", label: "Department-Wise" },
                ...(isHR ? [{ id: "draft", label: "Drafts" }] : []),
                { id: "expired", label: "Archived / Expired" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAnnouncementFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    announcementFilter === f.id
                      ? "bg-accent/20 border border-accent/40 text-accent font-bold"
                      : "bg-surface2/50 border border-line text-muted hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { id: "all", label: "All Sessions" },
                { id: "today", label: "Today's Meetings" },
                { id: "upcoming", label: "Upcoming" },
                { id: "my_invites", label: "My Invitations" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMeetingFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    meetingFilter === f.id
                      ? "bg-accent/20 border border-accent/40 text-accent font-bold"
                      : "bg-surface2/50 border border-line text-muted hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 4. FILTER TOOLBAR: Search, Category, Priority, Department */}
      <div className="glass-card !p-3 border border-line rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeMainTab === "announcements" ? "Search announcements by title, content or author..." : "Search meetings by title, host or agenda..."}
              className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-surface2 border border-line text-xs text-ink placeholder:text-muted/60 focus:border-accent outline-none"
            />
            <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department filter (Dynamic from teamService) */}
          <Select
            size="sm"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-36"
            ariaLabel="Filter by department"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </Select>

          {/* Category filter (for announcements) */}
          {activeMainTab === "announcements" && (
            <Select
              size="sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-36"
              ariaLabel="Filter by category"
            >
              <option value="all">All Categories</option>
              {ANNOUNCEMENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          )}

          {/* Priority filter (for announcements) */}
          {activeMainTab === "announcements" && (
            <Select
              size="sm"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-32"
              ariaLabel="Filter by priority"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </Select>
          )}
        </div>

        {/* Reset Filters button */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1 rounded-xl bg-surface2 border border-line text-muted hover:text-accent text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
          >
            <Icon name="rotate-cw" className="w-3 h-3 text-inherit" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 5. TAB CONTENT: ANNOUNCEMENTS */}
      {activeMainTab === "announcements" && (
        <>
          {/* Department-Wise Grouped View */}
          {announcementFilter === "department_wise" ? (
            <div className="flex flex-col gap-6">
              {departmentWiseAnnouncements.length === 0 ? (
                <div className="glass-card !p-12 text-center text-muted">
                  <Icon name="megaphone" className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-ink text-sm">No department announcements found</p>
                  <p className="text-xs text-muted mt-1">Try clearing filters or broadcast a circular to specific departments.</p>
                </div>
              ) : (
                departmentWiseAnnouncements.map(([deptName, items]) => (
                  <div key={deptName} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-line/60 pb-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                        <Icon name="briefcase" className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <h3 className="font-display font-bold text-ink text-base">{deptName}</h3>
                      <span className="px-2 py-0.2 rounded-full bg-surface2 text-muted font-num text-[11px] font-bold">
                        {items.length} {items.length === 1 ? 'circular' : 'circulars'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map(ann => (
                        <AnnouncementCard
                          key={ann.id}
                          announcement={ann}
                          onView={(a) => setViewingAnnouncement(a)}
                          onEdit={(a) => { setEditingAnnouncement(a); setCreateAnnModalOpen(true); }}
                          onDelete={handleDeleteAnnouncement}
                          onPublishNow={handlePublishNow}
                          onReschedule={(a) => setViewingAnnouncement(a)}
                          canManage={isHR}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Standard Grid View of Announcements */
            <div className="flex flex-col gap-4">
              {filteredAnnouncements.length === 0 ? (
                <div className="glass-card !p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface2 border border-line flex items-center justify-center text-muted">
                    <Icon name="megaphone" className="w-6 h-6 text-muted" />
                  </div>
                  <h4 className="font-display font-bold text-ink text-base">No announcements found</h4>
                  <p className="text-xs text-muted max-w-sm">
                    {searchQuery || selectedCategory !== "all" || selectedDepartment !== "all"
                      ? "No announcements matched your search or filter settings."
                      : "No active circulars are currently available for your view."}
                  </p>
                  {isHR && (
                    <button
                      type="button"
                      onClick={() => { setEditingAnnouncement(null); setCreateAnnModalOpen(true); }}
                      className="mt-2 px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-md cursor-pointer"
                    >
                      Create First Announcement
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAnnouncements.map(ann => (
                    <AnnouncementCard
                      key={ann.id}
                      announcement={ann}
                      onView={(a) => setViewingAnnouncement(a)}
                      onEdit={(a) => { setEditingAnnouncement(a); setCreateAnnModalOpen(true); }}
                      onDelete={handleDeleteAnnouncement}
                      onPublishNow={handlePublishNow}
                      onReschedule={(a) => setViewingAnnouncement(a)}
                      canManage={isHR}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 6. TAB CONTENT: MEETINGS */}
      {activeMainTab === "meetings" && (
        <div className="flex flex-col gap-4">
          {filteredMeetings.length === 0 ? (
            <div className="glass-card !p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-surface2 border border-line flex items-center justify-center text-muted">
                <Icon name="video" className="w-6 h-6 text-muted" />
              </div>
              <h4 className="font-display font-bold text-ink text-base">No scheduled meetings found</h4>
              <p className="text-xs text-muted max-w-sm">
                {searchQuery || meetingFilter !== "all" || selectedDepartment !== "all"
                  ? "No meetings matched your search criteria."
                  : "You currently have no scheduled sessions or meetings on your calendar."}
              </p>
              <button
                type="button"
                onClick={() => { setEditingMeeting(null); setScheduleMtgModalOpen(true); }}
                className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Schedule New Meeting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeetings.map(mtg => (
                <MeetingCard
                  key={mtg.id}
                  meeting={mtg}
                  currentUser={currentUser}
                  onView={(m) => setViewingMeeting(m)}
                  onEdit={(m) => { setEditingMeeting(m); setScheduleMtgModalOpen(true); }}
                  onReschedule={handleRescheduleMeeting}
                  onCancel={(m) => handleCancelMeeting(m, "Cancelled by host")}
                  onRespond={handleMeetingRSVP}
                  canManage={isHR}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Create / Edit Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={createAnnModalOpen}
        onClose={() => setCreateAnnModalOpen(false)}
        onSaved={() => {
          onTriggerToast?.(editingAnnouncement ? "Announcement updated successfully." : "Announcement created and published!");
          setRevision(r => r + 1);
        }}
        editAnnouncement={editingAnnouncement}
        currentUser={currentUser}
      />

      {/* Schedule / Edit Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={scheduleMtgModalOpen}
        onClose={() => setScheduleMtgModalOpen(false)}
        onSaved={() => {
          onTriggerToast?.(editingMeeting ? "Meeting updated successfully." : "Meeting scheduled and invitations dispatched!");
          setRevision(r => r + 1);
        }}
        editMeeting={editingMeeting}
        currentUser={currentUser}
      />

      {/* Announcement Detail Modal */}
      <AnnouncementDetailModal
        isOpen={Boolean(viewingAnnouncement)}
        onClose={() => setViewingAnnouncement(null)}
        announcement={viewingAnnouncement}
        onEdit={(a) => {
          setViewingAnnouncement(null);
          setEditingAnnouncement(a);
          setCreateAnnModalOpen(true);
        }}
        onDelete={handleDeleteAnnouncement}
        onPublishNow={handlePublishNow}
        onReschedule={handleRescheduleAnnouncement}
        canManage={isHR}
      />

      {/* Meeting Detail Modal */}
      <MeetingDetailModal
        isOpen={Boolean(viewingMeeting)}
        onClose={() => setViewingMeeting(null)}
        meeting={viewingMeeting}
        currentUser={currentUser}
        onRespond={handleMeetingRSVP}
        onEdit={(m) => {
          setViewingMeeting(null);
          setEditingMeeting(m);
          setScheduleMtgModalOpen(true);
        }}
        onReschedule={handleRescheduleMeeting}
        onCancel={handleCancelMeeting}
        canManage={isHR}
      />

    </div>
  );
};

export default AnnouncementsView;
