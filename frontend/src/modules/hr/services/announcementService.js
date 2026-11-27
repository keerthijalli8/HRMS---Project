/**
 * Central Announcement & Meeting Management Service for HRMS India
 * Supports department targeting, scheduling, expiration, meeting invitations,
 * RSVP responses, and integration with the central notification system.
 * Persisted in localStorage.
 */

import { addNotification } from './notificationStore.js';
import { loadDepartmentsList, loadAllEmployees } from './teamService.js';

const ANNOUNCEMENTS_STORAGE_KEY = "hrms_announcements_v1";
const MEETINGS_STORAGE_KEY = "hrms_meetings_v1";

const ANNOUNCEMENT_EVENT = "hrms_announcements_updated";
const MEETING_EVENT = "hrms_meetings_updated";

// Categories available for announcements
export const ANNOUNCEMENT_CATEGORIES = [
  "General",
  "Important",
  "Holiday",
  "Policy Update",
  "HR Update",
  "Emergency"
];

// Priorities available
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

// Audience scopes
export const AUDIENCE_OPTIONS = [
  { id: "All Employees", label: "All Employees (Company-wide)" },
  { id: "All Departments", label: "All Departments" },
  { id: "Specific Department", label: "Specific Department(s)" },
  { id: "Selected Employees", label: "Selected Employees" }
];

// Meeting status types
export const MEETING_STATUSES = ["Upcoming", "Today", "Completed", "Cancelled"];

// Initial Seeded Announcements
const INITIAL_ANNOUNCEMENTS = [
  {
    id: "ANN-2026-001",
    title: "Diwali Holidays & Corporate Office Schedule 2026",
    category: "Holiday",
    description: "Please note that all regional offices (Hyderabad, Bengaluru, Pune) will observe official holidays on November 13 and 14 for Diwali celebrations. Emergency on-call rosters will remain active for critical infrastructure. Wishing everyone a joyous and safe festive season with family!",
    priority: "High",
    targetAudience: "All Employees",
    targetDepartments: [],
    targetEmployeeIds: [],
    status: "Published",
    publishType: "now",
    publishDate: "2026-11-03",
    publishTime: "09:00",
    expiryDate: "2026-11-20",
    attachments: [
      { name: "Diwali_Holiday_Circular_2026.pdf", type: "application/pdf", size: "320 KB", url: "#" }
    ],
    authorName: "Pooja Patel",
    authorRole: "Senior HRBP",
    authorId: "EMP-1088",
    createdAt: Date.now() - 8 * 86400000,
    updatedAt: Date.now() - 8 * 86400000
  },
  {
    id: "ANN-2026-002",
    title: "Q4 Hybrid Work & Security Protocol Refresh",
    category: "Policy Update",
    description: "All team members operating in hybrid or remote mode are required to verify multi-factor authentication (MFA) tokens and review our confidential data handling guidelines before the end of the sprint. Zero-trust network access will be strictly enforced on company-managed devices.",
    priority: "Urgent",
    targetAudience: "Specific Department",
    targetDepartments: ["Engineering", "Operations", "Finance"],
    targetEmployeeIds: [],
    status: "Published",
    publishType: "now",
    publishDate: "2026-11-08",
    publishTime: "10:30",
    expiryDate: "2026-11-30",
    attachments: [
      { name: "IT_Security_Compliance_v4.pdf", type: "application/pdf", size: "1.4 MB", url: "#" }
    ],
    authorName: "Meera Reddy",
    authorRole: "HR Manager",
    authorId: "EMP-1001",
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now() - 3 * 86400000
  },
  {
    id: "ANN-2026-003",
    title: "Annual Corporate Health Checkup Camp - Apollo Healthcare",
    category: "HR Update",
    description: "Annual comprehensive health assessments in partnership with Apollo Hospitals will be conducted at our Hyderabad campus cafeteria next Tuesday and Wednesday. Services include complete hemogram, ECG, cardiac screening, and vision tests.",
    priority: "Medium",
    targetAudience: "All Departments",
    targetDepartments: [],
    targetEmployeeIds: [],
    status: "Published",
    publishType: "now",
    publishDate: "2026-11-09",
    publishTime: "11:00",
    expiryDate: "2026-11-25",
    attachments: [
      { name: "Health_Camp_Slots_Guide.pdf", type: "application/pdf", size: "540 KB", url: "#" }
    ],
    authorName: "Pooja Patel",
    authorRole: "Senior HRBP",
    authorId: "EMP-1088",
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now() - 2 * 86400000
  },
  {
    id: "ANN-2026-004",
    title: "POSH Compliance & Inclusive Workplace Refresher Workshop",
    category: "Important",
    description: "Mandatory annual Prevention of Sexual Harassment (POSH) compliance and sensitization webinar. Interactive Q&A and scenario walkthroughs hosted by our Internal Complaints Committee (ICC). Attendance is tracked for compliance records.",
    priority: "High",
    targetAudience: "All Employees",
    targetDepartments: [],
    targetEmployeeIds: [],
    status: "Scheduled",
    publishType: "later",
    publishDate: "2026-11-15",
    publishTime: "10:00",
    expiryDate: "2026-12-05",
    attachments: [
      { name: "POSH_Policy_Summary.pdf", type: "application/pdf", size: "890 KB", url: "#" }
    ],
    authorName: "Pooja Patel",
    authorRole: "Senior HRBP",
    authorId: "EMP-1088",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: "ANN-2026-005",
    title: "Emergency Network Switch Upgrade Notice - Hyderabad DC",
    category: "Emergency",
    description: "Critical firmware patching and redundant switchover will be executed between 01:00 AM and 03:00 AM IST on Sunday. Local VPN and internal git mirrors will experience momentary blips.",
    priority: "Urgent",
    targetAudience: "Specific Department",
    targetDepartments: ["Engineering", "Support"],
    targetEmployeeIds: [],
    status: "Published",
    publishType: "now",
    publishDate: "2026-11-10",
    publishTime: "16:00",
    expiryDate: "2026-11-16",
    attachments: [],
    authorName: "Aarav Sharma",
    authorRole: "Staff Architect & Main TL",
    authorId: "EMP-1042",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: "ANN-2026-006",
    title: "New Corporate Travel & Expense Claim Policy (v3.2)",
    category: "Policy Update",
    description: "Effective 15th November, updated per-diem allowances for tier-1 metropolitan travels and paperless digital receipt approvals via the HR Desk portal.",
    priority: "Low",
    targetAudience: "Specific Department",
    targetDepartments: ["Finance", "Sales", "Marketing"],
    targetEmployeeIds: [],
    status: "Draft",
    publishType: "now",
    publishDate: "2026-11-11",
    publishTime: "09:00",
    expiryDate: "",
    attachments: [],
    authorName: "Pooja Patel",
    authorRole: "Senior HRBP",
    authorId: "EMP-1088",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// Helper to get formatted today string (YYYY-MM-DD)
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Initial Seeded Meetings
const INITIAL_MEETINGS = [
  {
    id: "MTG-2026-001",
    title: "Sprint 48 Architecture Sign-Off & Release Review",
    description: "Review production release candidates, Kubernetes migration checklist, and critical dependency updates.",
    agenda: "1. Sprint 48 Velocity & PR Review\n2. Kubernetes Pod autoscaling test metrics\n3. Database connection pool optimization\n4. Go/No-Go Decision",
    meetingType: "Online",
    organizerName: "Aarav Sharma",
    organizerId: "EMP-1042",
    organizerRole: "Engineering Manager & Lead Architect",
    departments: ["Engineering"],
    participants: [
      { employeeId: "EMP-1042", name: "Aarav Sharma", email: "aarav.sharma@nexora.in", designation: "Engineering Manager", response: "accepted" },
      { employeeId: "EMP-1234", name: "Devansh Mehta", email: "devansh.mehta@nexora.in", designation: "Senior Frontend Engineer", response: "accepted" },
      { employeeId: "EMP-1301", name: "Vikram Malhotra", email: "vikram.malhotra@nexora.in", designation: "Enterprise Sales Lead", response: "accepted" },
      { employeeId: "EMP-1088", name: "Pooja Patel", email: "pooja.patel@nexora.in", designation: "Senior HRBP", response: "maybe" }
    ],
    meetingDate: getTodayDateString(),
    startTime: "14:30",
    endTime: "15:30",
    location: "Google Meet",
    meetingLink: "https://meet.google.com/nexora-sprint-signoff",
    attachments: [
      { name: "Release_Checklist_Sprint48.pdf", type: "application/pdf", size: "480 KB", url: "#" }
    ],
    status: "Today",
    cancellationReason: "",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: "MTG-2026-002",
    title: "Q4 Engineering All-Hands & Strategic Roadmap 2027",
    description: "Quarterly townhall for the complete engineering department covering product milestones, cloud infrastructure budget, and team recognitions.",
    agenda: "1. Welcome & Leadership Address\n2. Q3 Engineering Retrospective & Deliverables\n3. Q4 Key Focus Areas & Architecture Scalability\n4. Excellence Awards & Open Floor Q&A",
    meetingType: "Online",
    organizerName: "Aarav Sharma",
    organizerId: "EMP-1042",
    organizerRole: "Engineering Manager & Lead Architect",
    departments: ["Engineering"],
    participants: [
      { employeeId: "EMP-1042", name: "Aarav Sharma", email: "aarav.sharma@nexora.in", designation: "Engineering Manager", response: "accepted" },
      { employeeId: "EMP-1234", name: "Devansh Mehta", email: "devansh.mehta@nexora.in", designation: "Senior Frontend Engineer", response: "accepted" },
      { employeeId: "EMP-1301", name: "Vikram Malhotra", email: "vikram.malhotra@nexora.in", designation: "Enterprise Sales Lead", response: "accepted" },
      { employeeId: "EMP-1088", name: "Pooja Patel", email: "pooja.patel@nexora.in", designation: "Senior HRBP", response: "accepted" },
      { employeeId: "EMP-1001", name: "Meera Reddy", email: "meera.reddy@nexora.in", designation: "HR Manager", response: "pending" }
    ],
    meetingDate: "2026-11-14",
    startTime: "11:00",
    endTime: "12:30",
    location: "Google Meet",
    meetingLink: "https://meet.google.com/eng-q4-allhands",
    attachments: [
      { name: "Q4_Engineering_Roadmap_Deck.pdf", type: "application/pdf", size: "2.1 MB", url: "#" }
    ],
    status: "Upcoming",
    cancellationReason: "",
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now() - 2 * 86400000
  },
  {
    id: "MTG-2026-003",
    title: "Department Budget & Headcount Planning (FY 2027)",
    description: "In-person strategic meeting between HR Leadership and Finance Directors for Q1-Q2 campus hiring allocations and tool licensing budgets.",
    agenda: "1. FY26 Spend Analysis vs Budget\n2. Campus Recruitment & Lateral Hiring Targets\n3. SaaS Subscriptions & Tooling Renewal\n4. Final Approval Signatures",
    meetingType: "Offline",
    organizerName: "Meera Reddy",
    organizerId: "EMP-1001",
    organizerRole: "HR Manager",
    departments: ["Human Resources", "Finance"],
    participants: [
      { employeeId: "EMP-1001", name: "Meera Reddy", email: "meera.reddy@nexora.in", designation: "HR Manager", response: "accepted" },
      { employeeId: "EMP-1088", name: "Pooja Patel", email: "pooja.patel@nexora.in", designation: "Senior HRBP", response: "accepted" },
      { employeeId: "EMP-1102", name: "Rohan Varma", email: "rohan.varma@nexora.in", designation: "Lead Product Designer", response: "accepted" }
    ],
    meetingDate: "2026-11-18",
    startTime: "15:00",
    endTime: "16:30",
    location: "Boardroom Alpha, 4th Floor - Hyderabad HQ",
    meetingLink: "",
    attachments: [
      { name: "Budget_Allocation_Draft_2027.xlsx", type: "application/vnd.ms-excel", size: "750 KB", url: "#" }
    ],
    status: "Upcoming",
    cancellationReason: "",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    id: "MTG-2026-004",
    title: "Q3 Client Satisfaction & SLA Debrief",
    description: "Review of customer onboarding velocity and enterprise SLA performance across all support tiers.",
    agenda: "1. CSAT scores overview\n2. First-response time analytics\n3. Escalation protocol review",
    meetingType: "Online",
    organizerName: "Pooja Patel",
    organizerId: "EMP-1088",
    organizerRole: "Senior HRBP",
    departments: ["Support", "Operations"],
    participants: [
      { employeeId: "EMP-1088", name: "Pooja Patel", email: "pooja.patel@nexora.in", designation: "Senior HRBP", response: "accepted" }
    ],
    meetingDate: "2026-11-05",
    startTime: "10:00",
    endTime: "11:00",
    location: "Google Meet",
    meetingLink: "https://meet.google.com/sla-review-2026",
    attachments: [],
    status: "Completed",
    cancellationReason: "",
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now() - 6 * 86400000
  },
  {
    id: "MTG-2026-005",
    title: "Ad-hoc Platform Deployment Sync",
    description: "Emergency alignment on patch deployment for payment gateway integration.",
    agenda: "1. Webhook retry mechanism\n2. Reversion plan",
    meetingType: "Online",
    organizerName: "Aarav Sharma",
    organizerId: "EMP-1042",
    organizerRole: "Engineering Manager & Lead Architect",
    departments: ["Engineering"],
    participants: [
      { employeeId: "EMP-1042", name: "Aarav Sharma", email: "aarav.sharma@nexora.in", designation: "Engineering Manager", response: "accepted" },
      { employeeId: "EMP-1234", name: "Devansh Mehta", email: "devansh.mehta@nexora.in", designation: "Senior Frontend Engineer", response: "declined" }
    ],
    meetingDate: "2026-11-07",
    startTime: "16:00",
    endTime: "16:30",
    location: "Google Meet",
    meetingLink: "https://meet.google.com/eng-adhoc-sync",
    attachments: [],
    status: "Cancelled",
    cancellationReason: "Postponed because vendor webhook sandbox environment was temporarily down.",
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now() - 4 * 86400000
  }
];

// Helper to determine if user has HR or Admin role
export function isHRorAdminUser(user) {
  if (!user) return false;
  const sysRole = (user.systemRole || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  return (
    sysRole.includes("hr") ||
    sysRole.includes("admin") ||
    role.includes("hr") ||
    role.includes("admin") ||
    role.includes("director")
  );
}

// ---------------- ANNOUNCEMENT METHODS ----------------

export function loadAllAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_ANNOUNCEMENTS;
  } catch (e) {
    console.warn("Failed to load announcements from storage", e);
    return INITIAL_ANNOUNCEMENTS;
  }
}

export function saveAllAnnouncements(announcements) {
  try {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_EVENT, { detail: announcements }));
  } catch (e) {
    console.error("Failed to save announcements", e);
  }
}

/**
 * Filter announcements based on user role and targeting
 */
export function getAnnouncementsForUser(user) {
  // First update any scheduled items that have reached their publish time
  checkScheduledAnnouncements();

  const all = loadAllAnnouncements();
  const isHR = isHRorAdminUser(user);

  // HR/Admin can see all announcements, including Drafts and Scheduled
  if (isHR) {
    return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  // Regular employees only see Published announcements targeted to them
  const userEmpId = user?.employeeId || user?.id || "";
  const userDept = (user?.dept || user?.department || "").toLowerCase();

  return all.filter(ann => {
    // Only published announcements
    if (ann.status !== "Published") return false;

    // Check expiry date
    if (ann.expiryDate) {
      const today = getTodayDateString();
      if (ann.expiryDate < today) return false;
    }

    // Check target audience
    if (ann.targetAudience === "All Employees" || ann.targetAudience === "All Departments") {
      return true;
    }

    if (ann.targetAudience === "Specific Department") {
      const depts = (ann.targetDepartments || []).map(d => d.toLowerCase());
      return depts.includes(userDept);
    }

    if (ann.targetAudience === "Selected Employees") {
      const ids = ann.targetEmployeeIds || [];
      return ids.includes(userEmpId);
    }

    return true;
  }).sort((a, b) => {
    // Sort urgent/high priority first, then by date
    const priorityWeight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

/**
 * Automatically transitions Scheduled announcements to Published when time arrives,
 * and marks Expired announcements.
 */
export function checkScheduledAnnouncements() {
  const all = loadAllAnnouncements();
  const now = new Date();
  const todayStr = getTodayDateString();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  let hasChanged = false;

  const updated = all.map(ann => {
    // Check Scheduled -> Published
    if (ann.status === "Scheduled") {
      const publishDate = ann.publishDate || todayStr;
      const publishTime = ann.publishTime || "00:00";

      if (publishDate < todayStr || (publishDate === todayStr && publishTime <= currentTimeStr)) {
        hasChanged = true;
        // Trigger notification
        addNotification({
          title: `Announcement: ${ann.title}`,
          desc: ann.description?.slice(0, 120) + (ann.description?.length > 120 ? "..." : ""),
          icon: "megaphone",
          type: "announcement",
          targetEmployeeId: ann.targetAudience === "Selected Employees" ? (ann.targetEmployeeIds?.[0] || "all") : "all"
        });
        return {
          ...ann,
          status: "Published",
          updatedAt: Date.now()
        };
      }
    }

    // Check Published -> Expired
    if (ann.status === "Published" && ann.expiryDate && ann.expiryDate < todayStr) {
      hasChanged = true;
      return {
        ...ann,
        status: "Expired",
        updatedAt: Date.now()
      };
    }

    return ann;
  });

  if (hasChanged) {
    saveAllAnnouncements(updated);
  }
}

/**
 * Create a new Announcement
 */
export function createAnnouncement(data, currentUser) {
  const all = loadAllAnnouncements();
  const id = `ANN-${Date.now()}`;
  const isScheduled = data.publishType === "later" || data.publishType === "schedule";
  const status = data.isDraft ? "Draft" : (isScheduled ? "Scheduled" : "Published");

  const authorName = currentUser?.name || "HR Admin";
  const authorRole = currentUser?.role || currentUser?.systemRole || "HR Operations";
  const authorId = currentUser?.employeeId || currentUser?.id || "EMP-1088";

  const newAnn = {
    id,
    title: data.title.trim(),
    category: data.category || "General",
    description: data.description.trim(),
    priority: data.priority || "Medium",
    targetAudience: data.targetAudience || "All Employees",
    targetDepartments: Array.isArray(data.targetDepartments) ? data.targetDepartments : [],
    targetEmployeeIds: Array.isArray(data.targetEmployeeIds) ? data.targetEmployeeIds : [],
    status,
    publishType: data.publishType || "now",
    publishDate: data.publishDate || getTodayDateString(),
    publishTime: data.publishTime || "09:00",
    expiryDate: data.expiryDate || "",
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    authorName,
    authorRole,
    authorId,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const updated = [newAnn, ...all];
  saveAllAnnouncements(updated);

  // Send notification if Published immediately
  if (status === "Published") {
    sendAnnouncementNotifications(newAnn);
  }

  return newAnn;
}

/**
 * Dispatch notification for announcement
 */
function sendAnnouncementNotifications(ann) {
  const isDepartmentTarget = ann.targetAudience === "Specific Department" && ann.targetDepartments?.length > 0;
  const isSelectedEmpTarget = ann.targetAudience === "Selected Employees" && ann.targetEmployeeIds?.length > 0;

  let descText = ann.description?.slice(0, 100) || "";
  if (ann.description?.length > 100) descText += "...";

  if (isSelectedEmpTarget) {
    // Send notification to each selected employee
    ann.targetEmployeeIds.forEach(empId => {
      addNotification({
        title: `📢 Announcement: ${ann.title}`,
        desc: descText,
        icon: "megaphone",
        type: "announcement",
        targetEmployeeId: empId
      });
    });
  } else {
    // Broadcast notification
    addNotification({
      title: `📢 ${ann.category}: ${ann.title}`,
      desc: isDepartmentTarget
        ? `[${ann.targetDepartments.join(", ")}] ${descText}`
        : descText,
      icon: "megaphone",
      type: "announcement",
      targetEmployeeId: "all"
    });
  }
}

/**
 * Update an existing Announcement
 */
export function updateAnnouncement(id, updates, currentUser) {
  const all = loadAllAnnouncements();
  const existing = all.find(a => a.id === id);
  if (!existing) return { ok: false, error: "Announcement not found" };

  const updated = all.map(ann => {
    if (ann.id === id) {
      return {
        ...ann,
        ...updates,
        updatedAt: Date.now()
      };
    }
    return ann;
  });

  saveAllAnnouncements(updated);
  return { ok: true, announcement: updated.find(a => a.id === id) };
}

/**
 * Delete an announcement
 */
export function deleteAnnouncement(id) {
  const all = loadAllAnnouncements();
  const filtered = all.filter(a => a.id !== id);
  saveAllAnnouncements(filtered);
  return { ok: true };
}

/**
 * Publish a draft or scheduled announcement immediately
 */
export function publishAnnouncementNow(id, currentUser) {
  const all = loadAllAnnouncements();
  const ann = all.find(a => a.id === id);
  if (!ann) return { ok: false };

  let updatedAnn = null;
  const updated = all.map(a => {
    if (a.id === id) {
      updatedAnn = {
        ...a,
        status: "Published",
        publishType: "now",
        publishDate: getTodayDateString(),
        publishTime: "Just now",
        updatedAt: Date.now()
      };
      return updatedAnn;
    }
    return a;
  });

  saveAllAnnouncements(updated);
  sendAnnouncementNotifications({ ...ann, status: "Published" });
  return updatedAnn || { ok: true };
}

/**
 * Reschedule an announcement
 */
export function rescheduleAnnouncement(id, publishDate, publishTime, currentUser) {
  return updateAnnouncement(id, {
    publishDate,
    publishTime,
    publishType: "later",
    status: "Scheduled"
  }, currentUser);
}

// ---------------- MEETING METHODS ----------------

export function loadAllMeetings() {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(INITIAL_MEETINGS));
      return INITIAL_MEETINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_MEETINGS;
  } catch (e) {
    console.warn("Failed to load meetings from storage", e);
    return INITIAL_MEETINGS;
  }
}

export function saveAllMeetings(meetings) {
  try {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
    window.dispatchEvent(new CustomEvent(MEETING_EVENT, { detail: meetings }));
  } catch (e) {
    console.error("Failed to save meetings", e);
  }
}

/**
 * Get meetings visible to user and compute live status (Today, Upcoming, Completed, Cancelled)
 */
export function getMeetingsForUser(user) {
  const all = loadAllMeetings();
  const isHR = isHRorAdminUser(user);
  const userEmpId = user?.employeeId || user?.id || "";
  const userDept = (user?.dept || user?.department || "").toLowerCase();
  const todayStr = getTodayDateString();

  // Compute live meeting status based on date/time unless already Cancelled
  const normalized = all.map(m => {
    if (m.status === "Cancelled") return m;

    if (m.meetingDate === todayStr) {
      return { ...m, status: "Today" };
    }
    if (m.meetingDate > todayStr) {
      return { ...m, status: "Upcoming" };
    }
    return { ...m, status: "Completed" };
  });

  if (isHR) {
    return normalized.sort((a, b) => {
      // Today first, then Upcoming, Completed, Cancelled
      const order = { Today: 1, Upcoming: 2, Completed: 3, Cancelled: 4 };
      if (order[a.status] !== order[b.status]) {
        return (order[a.status] || 9) - (order[b.status] || 9);
      }
      return (a.meetingDate || "").localeCompare(b.meetingDate || "");
    });
  }

  // Filter for employee:
  // Is organizer OR is participant OR meeting is targeted to all departments / user's department
  return normalized.filter(m => {
    if (m.organizerId === userEmpId) return true;
    if (m.participants?.some(p => p.employeeId === userEmpId)) return true;
    if (m.departments?.some(d => d.toLowerCase() === "all" || d.toLowerCase() === "all departments")) return true;
    if (m.departments?.some(d => d.toLowerCase() === userDept)) return true;
    return false;
  }).sort((a, b) => {
    const order = { Today: 1, Upcoming: 2, Completed: 3, Cancelled: 4 };
    if (order[a.status] !== order[b.status]) {
      return (order[a.status] || 9) - (order[b.status] || 9);
    }
    return (a.meetingDate || "").localeCompare(b.meetingDate || "");
  });
}

/**
 * Schedule / Create a new Meeting
 */
export function createMeeting(data, currentUser) {
  const all = loadAllMeetings();
  const id = `MTG-${Date.now()}`;
  const todayStr = getTodayDateString();

  const organizerName = data.organizerName || currentUser?.name || "Organizer";
  const organizerId = currentUser?.employeeId || currentUser?.id || "EMP-1088";
  const organizerRole = currentUser?.role || currentUser?.systemRole || "Meeting Host";

  const status = data.meetingDate === todayStr ? "Today" : (data.meetingDate > todayStr ? "Upcoming" : "Completed");

  const newMeeting = {
    id,
    title: data.title.trim(),
    description: data.description?.trim() || "",
    agenda: data.agenda?.trim() || "",
    meetingType: data.meetingType || "Online",
    organizerName,
    organizerId,
    organizerRole,
    departments: Array.isArray(data.departments) ? data.departments : [],
    participants: Array.isArray(data.participants) ? data.participants : [],
    meetingDate: data.meetingDate || todayStr,
    startTime: data.startTime || "10:00",
    endTime: data.endTime || "11:00",
    location: data.location || (data.meetingType === "Online" ? "Google Meet" : "Main Conference Room"),
    meetingLink: data.meetingLink || (data.meetingType === "Online" ? `https://meet.google.com/tc-${id.toLowerCase()}` : ""),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    status,
    cancellationReason: "",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const updated = [newMeeting, ...all];
  saveAllMeetings(updated);

  // Send meeting invitation notification to every invited participant
  newMeeting.participants.forEach(p => {
    if (p.employeeId && p.employeeId !== organizerId) {
      addNotification({
        title: `📅 Meeting Invitation: ${newMeeting.title}`,
        desc: `Scheduled for ${newMeeting.meetingDate} at ${newMeeting.startTime}. Organized by ${organizerName}.`,
        icon: newMeeting.meetingType === "Online" ? "video" : "calendar",
        type: "meeting",
        targetEmployeeId: p.employeeId
      });
    }
  });

  return newMeeting;
}

/**
 * Update Meeting details
 */
export function updateMeeting(id, updates, currentUser) {
  const all = loadAllMeetings();
  const existing = all.find(m => m.id === id);
  if (!existing) return { ok: false, error: "Meeting not found" };

  const updated = all.map(m => {
    if (m.id === id) {
      return {
        ...m,
        ...updates,
        updatedAt: Date.now()
      };
    }
    return m;
  });

  saveAllMeetings(updated);
  return { ok: true, meeting: updated.find(m => m.id === id) };
}

/**
 * Reschedule a Meeting
 */
export function rescheduleMeeting(id, { meetingDate, date, startTime, endTime, reason = "", rescheduleReason = "" }, currentUser) {
  const all = loadAllMeetings();
  const existing = all.find(m => m.id === id);
  if (!existing) return { ok: false, error: "Meeting not found" };

  const finalDate = meetingDate || date;
  const todayStr = getTodayDateString();
  const status = finalDate === todayStr ? "Today" : (finalDate > todayStr ? "Upcoming" : "Completed");

  let updatedMeeting = null;
  const updated = all.map(m => {
    if (m.id === id) {
      updatedMeeting = {
        ...m,
        meetingDate: finalDate,
        date: finalDate,
        startTime,
        endTime,
        status,
        updatedAt: Date.now()
      };
      return updatedMeeting;
    }
    return m;
  });

  saveAllMeetings(updated);

  // Send reschedule notification to participants
  const finalReason = reason || rescheduleReason;
  existing.participants?.forEach(p => {
    addNotification({
      title: `⏰ Meeting Rescheduled: ${existing.title}`,
      desc: `New time: ${finalDate} from ${startTime} to ${endTime}. ${finalReason ? `Reason: ${finalReason}` : ''}`,
      icon: "clock",
      type: "meeting",
      targetEmployeeId: p.employeeId || "all"
    });
  });

  return updatedMeeting || { ok: true };
}

/**
 * Cancel a Meeting
 */
export function cancelMeeting(id, reason = "", currentUser) {
  const all = loadAllMeetings();
  const existing = all.find(m => m.id === id);
  if (!existing) return { ok: false, error: "Meeting not found" };

  let updatedMeeting = null;
  const updated = all.map(m => {
    if (m.id === id) {
      updatedMeeting = {
        ...m,
        status: "Cancelled",
        cancellationReason: reason.trim() || "Cancelled by organizer",
        updatedAt: Date.now()
      };
      return updatedMeeting;
    }
    return m;
  });

  saveAllMeetings(updated);

  // Send cancellation notification to participants
  existing.participants?.forEach(p => {
    addNotification({
      title: `🚫 Meeting Cancelled: ${existing.title}`,
      desc: `The meeting on ${existing.meetingDate} was cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      icon: "alert-triangle",
      type: "meeting",
      targetEmployeeId: p.employeeId || "all"
    });
  });

  return updatedMeeting || { ok: true };
}

/**
 * Employee RSVP response (Accept, Decline, Maybe)
 */
export function respondToMeeting(meetingId, employeeId, response) {
  const all = loadAllMeetings();
  const meeting = all.find(m => m.id === meetingId);
  if (!meeting) return { ok: false, error: "Meeting not found" };

  const validResponses = ["accepted", "declined", "maybe"];
  const cleanResp = validResponses.includes(response?.toLowerCase()) ? response.toLowerCase() : "accepted";

  const updatedParticipants = (meeting.participants || []).map(p => {
    if (p.employeeId === employeeId || p.id === employeeId) {
      return { ...p, employeeId: p.employeeId || p.id, response: cleanResp };
    }
    return p;
  });

  // If participant wasn't in the list, add them
  const exists = updatedParticipants.some(p => p.employeeId === employeeId || p.id === employeeId);
  if (!exists) {
    const allEmps = loadAllEmployees();
    const emp = allEmps.find(e => e.id === employeeId);
    updatedParticipants.push({
      employeeId,
      name: emp?.name || "Employee",
      email: emp?.email || "",
      designation: emp?.designation || "",
      response: cleanResp
    });
  }

  let updatedMeeting = null;
  const updated = all.map(m => {
    if (m.id === meetingId) {
      updatedMeeting = {
        ...m,
        participants: updatedParticipants,
        updatedAt: Date.now()
      };
      return updatedMeeting;
    }
    return m;
  });

  saveAllMeetings(updated);
  return { ok: true, participants: updatedParticipants, meeting: updatedMeeting };
}

/**
 * Get aggregated statistics for dashboard
 */
export function getAnnouncementsAndMeetingStats(user) {
  const announcements = getAnnouncementsForUser(user);
  const meetings = getMeetingsForUser(user);
  const userEmpId = user?.employeeId || user?.id || "";

  const totalAnnouncements = announcements.length;
  const publishedCount = announcements.filter(a => a.status === "Published").length;
  const scheduledCount = announcements.filter(a => a.status === "Scheduled").length;
  const draftCount = announcements.filter(a => a.status === "Draft").length;

  const todayMeetingsCount = meetings.filter(m => m.status === "Today").length;
  const upcomingMeetingsCount = meetings.filter(m => m.status === "Upcoming").length;
  const pendingMyResponseCount = meetings.filter(m => {
    const myP = m.participants?.find(p => p.employeeId === userEmpId);
    return myP && (!myP.response || myP.response === "pending");
  }).length;

  return {
    totalAnnouncements,
    publishedCount,
    scheduledCount,
    draftCount,
    todayMeetingsCount,
    upcomingMeetingsCount,
    pendingMyResponseCount
  };
}

// ---------------- EVENT SUBSCRIPTIONS ----------------

export function subscribeAnnouncements(callback) {
  const handler = () => callback();
  window.addEventListener(ANNOUNCEMENT_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(ANNOUNCEMENT_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function subscribeMeetings(callback) {
  const handler = () => callback();
  window.addEventListener(MEETING_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(MEETING_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
