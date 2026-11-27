import { readEmployeeRecords } from "./employeeRecords";

const ANNOUNCEMENTS_KEY = "hrms-announcements";
const CATEGORIES = [
  "Company Updates",
  "HR Updates",
  "Holiday Announcements",
  "Events and Celebrations",
  "Attendance and Working Hours",
  "Leave Policy Updates",
  "Payroll Updates",
  "Training and Development",
  "IT and Technical Updates",
  "Emergency Notifications",
  "General Announcements",
];
const PRIORITIES = ["Normal", "Important", "Urgent", "Critical"];

const DEMO_ANNOUNCEMENTS = [
  {
    id: "ANN-DEMO-001",
    title: "Annual health insurance enrollment is now open",
    shortDescription: "Review your coverage options and submit dependent details before 30 November.",
    content: "Annual health insurance enrollment is open for all eligible employees. Please review the coverage options, update dependent information, and submit your selection before 30 November 2026. Contact People Operations if you need help.",
    category: "HR Updates",
    priority: "Important",
    audience: { type: "all", values: [] },
    requireAcknowledgement: true,
    enableComments: true,
    status: "Published",
    archived: false,
    createdBy: "Meera Menon",
    createdByEmail: "meera.menon@hrmsindia.com",
    createdAt: "2026-11-18T09:00:00.000Z",
    publishAt: "2026-11-18T09:30:00.000Z",
    expiresAt: "2026-12-01T18:00:00.000Z",
    recipients: [],
    attachments: [],
  },
  {
    id: "ANN-DEMO-002",
    title: "Town hall meeting scheduled for December",
    shortDescription: "Join the quarterly town hall to hear business updates and ask questions.",
    content: "The quarterly company town hall will be held on 5 December 2026 at 11:00 AM. The session includes business updates, recognition highlights, and an open question-and-answer segment.",
    category: "Company Updates",
    priority: "Normal",
    audience: { type: "all", values: [] },
    requireAcknowledgement: false,
    enableComments: true,
    status: "Scheduled",
    archived: false,
    createdBy: "Sonal Gupta",
    createdByEmail: "sonal.gupta@hrmsindia.com",
    createdAt: "2026-11-20T10:15:00.000Z",
    publishAt: "2026-12-01T08:00:00.000Z",
    expiresAt: "2026-12-06T18:00:00.000Z",
    recipients: [],
    attachments: [],
  },
  {
    id: "ANN-DEMO-003",
    title: "New employee wellness program",
    shortDescription: "A draft announcement for the upcoming wellness sessions and activities.",
    content: "People Operations is preparing a new employee wellness program with monthly sessions, fitness activities, and wellbeing resources. More details will be shared after the schedule is finalized.",
    category: "Training and Development",
    priority: "Normal",
    audience: { type: "all", values: [] },
    requireAcknowledgement: false,
    enableComments: false,
    status: "Draft",
    archived: false,
    createdBy: "Priya Nair",
    createdByEmail: "priya.nair@hrmsindia.com",
    createdAt: "2026-11-22T14:30:00.000Z",
    publishAt: "",
    expiresAt: "",
    recipients: [],
    attachments: [],
  },
  {
    id: "ANN-DEMO-004",
    title: "October attendance regularization window",
    shortDescription: "The regularization window for October attendance corrections has closed.",
    content: "The October attendance regularization window closed on 10 November 2026. Please contact your manager or HR if you have an unresolved correction request.",
    category: "Attendance and Working Hours",
    priority: "Normal",
    audience: { type: "all", values: [] },
    requireAcknowledgement: false,
    enableComments: false,
    status: "Published",
    archived: false,
    createdBy: "Amit Verma",
    createdByEmail: "amit.verma@hrmsindia.com",
    createdAt: "2026-10-28T07:30:00.000Z",
    publishAt: "2026-10-28T08:00:00.000Z",
    expiresAt: "2026-11-11T18:00:00.000Z",
    recipients: [],
    attachments: [],
  },
];

export { CATEGORIES, PRIORITIES };

export function readAnnouncements() {
  try {
    const saved = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!saved) return DEMO_ANNOUNCEMENTS.map((announcement) => ({ ...announcement, recipients: [], attachments: [] }));
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new TypeError("Saved announcements must be an array.");
    return parsed.map((announcement) => ({
      ...announcement,
      recipients: Array.isArray(announcement.recipients) ? announcement.recipients : [],
      attachments: Array.isArray(announcement.attachments) ? announcement.attachments : [],
    }));
  } catch (error) {
    console.error("Unable to load saved announcements.", error);
    throw new Error("Saved announcements could not be loaded. Check browser storage and try again.", { cause: error });
  }
}

export function saveAnnouncements(announcements) {
  try {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    window.dispatchEvent(new Event("hrms-announcements-updated"));
  } catch (error) {
    console.error("Unable to save announcements.", error);
    throw new Error("Announcements could not be saved. Browser storage may be full.", { cause: error });
  }
}

export function publishDueAnnouncements(announcements, now = Date.now()) {
  let changed = false;
  const updated = announcements.map((announcement) => {
    if (
      announcement.status !== "Scheduled" ||
      announcement.archived ||
      new Date(announcement.publishAt).getTime() > now
    ) return announcement;
    changed = true;
    return {
      ...announcement,
      status: "Published",
      recipients: materializeRecipients(announcement),
    };
  });
  if (changed) saveAnnouncements(updated);
  return updated;
}

export function getAnnouncementStatus(announcement, now = Date.now()) {
  if (announcement.archived) return "Archived";
  if (announcement.status === "Draft") return "Draft";
  const publishAt = new Date(announcement.publishAt || announcement.createdAt).getTime();
  if (Number.isFinite(publishAt) && publishAt > now) return "Scheduled";
  if (announcement.expiresAt && new Date(announcement.expiresAt).getTime() <= now) return "Expired";
  return "Published";
}

export function getAudienceEmployees(audience = {}, employees = readEmployeeRecords()) {
  if (audience.type === "all") return employees;
  return employees.filter((employee) => {
    if (audience.type === "departments") return (audience.values || []).includes(employee.department);
    if (audience.type === "roles") return (audience.values || []).includes(employee.role);
    if (audience.type === "designations") return (audience.values || []).includes(employee.designation);
    if (audience.type === "projects") return (audience.values || []).includes(employee.project);
    if (audience.type === "employees") return (audience.values || []).includes(employee.id);
    return false;
  });
}

export function materializeRecipients(announcement) {
  const employees = getAudienceEmployees(announcement.audience);
  return employees.map((employee) => {
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department || "—",
      designation: employee.designation || employee.role || "—",
      project: employee.project || "—",
      deliveredAt: new Date().toISOString(),
      readAt: null,
      acknowledgedAt: null,
    };
  });
}

export function publishAnnouncement(announcement, scheduled = false) {
  const publishAt = announcement.publishAt || new Date().toISOString();
  return {
    ...announcement,
    status: scheduled ? "Scheduled" : "Published",
    publishAt,
    archived: false,
    recipients: scheduled ? announcement.recipients || [] : materializeRecipients(announcement),
  };
}

export function getEngagement(announcement) {
  const recipients = announcement.recipients || [];
  const reads = recipients.filter((recipient) => recipient.readAt).length;
  const acknowledgements = recipients.filter((recipient) => recipient.acknowledgedAt).length;
  return {
    total: recipients.length,
    delivered: recipients.filter((recipient) => recipient.deliveredAt).length,
    reads,
    unread: recipients.length - reads,
    acknowledgements,
    pendingAcknowledgements: announcement.requireAcknowledgement
      ? recipients.length - acknowledgements
      : 0,
  };
}

export function getDistinctEmployeeValues(key) {
  return [...new Set(readEmployeeRecords().map((employee) => employee[key]).filter(Boolean))].sort();
}

export function createAnnouncementId() {
  return `ANN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}
