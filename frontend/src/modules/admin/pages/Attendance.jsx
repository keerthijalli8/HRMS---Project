import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  CircleAlert,
  Timer,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useKpiFilter, useKpiScopedState } from "../hooks/useKpiNavigation";
import { readAdminProfile } from "../services/adminProfile";
import { recordAuditEvent } from "../services/auditLog";
import { readEmployeeRecords } from "../services/employeeRecords";
import { readAttendanceRecords } from "../services/attendanceRecords";
import { locationUrl } from "../services/attendanceLocation";
import {
  formatAttendanceTime,
  formatOfficeTime,
  getClockMinutes,
  getDateKeyInTimezone,
  isEarlyCheckOut,
  isLateArrival,
  readAttendanceSettings,
} from "../services/attendanceSettings";
import {
  applyAttendanceOverrides,
  readAttendanceOverrides,
  saveAttendanceOverrides,
} from "../services/attendanceOverrides";

import "../style/Attendance.css";
import CompanyHolidayCalendar from "../components/CompanyHolidayCalendar";

// =============================================
// SAMPLE EMPLOYEE DATA
// =============================================

// Shared demo fixtures are imported by the report screen.
// eslint-disable-next-line react-refresh/only-export-components
export const employees = [
  {
    id: "EMP001",
    name: "Rahul Sharma",
    role: "Manager",
    designation: "Project Manager",
    department: "Management",
    project: "HRMS India",
  },
  {
    id: "EMP002",
    name: "Priya Reddy",
    role: "HR",
    designation: "Project HR",
    department: "Human Resources",
    project: "HRMS India",
  },
  {
    id: "EMP003",
    name: "Kiran Kumar",
    role: "Employee",
    designation: "Software Developer",
    department: "Technology",
    project: "Employee Portal",
  },
  {
    id: "EMP004",
    name: "Sneha Patel",
    role: "Team Leader",
    designation: "Technical Team Leader",
    department: "Technology",
    project: "HRMS India",
  },
  {
    id: "EMP005",
    name: "Arjun Rao",
    role: "Employee",
    designation: "Backend Developer",
    department: "Technology",
    project: "Payroll Management",
  },
  {
    id: "EMP006",
    name: "Divya Ramesh",
    role: "HR",
    designation: "Administrative HR",
    department: "Human Resources",
    project: "HRMS India",
  },
  {
    id: "EMP007",
    name: "Vikram Singh",
    role: "Manager",
    designation: "Operations Manager",
    department: "Management",
    project: "Operations Portal",
  },
  {
    id: "EMP008",
    name: "Ananya Das",
    role: "Team Leader",
    designation: "Development Team Leader",
    department: "Technology",
    project: "Employee Portal",
  },
  {
    id: "EMP009",
    name: "Meera Nair",
    role: "Employee",
    designation: "SQL Developer",
    department: "Technology",
    project: "Database Management",
  },
  {
    id: "EMP010",
    name: "Rohit Verma",
    role: "Employee",
    designation: "Software Tester",
    department: "Quality Assurance",
    project: "HRMS Testing",
  },
  {
    id: "EMP011",
    name: "Pooja Sharma",
    role: "HR",
    designation: "HR Executive",
    department: "Human Resources",
    project: "HRMS India",
  },
  {
    id: "EMP012",
    name: "Ajay Kumar",
    role: "Manager",
    designation: "Operations Manager",
    department: "Management",
    project: "Operations Portal",
  },
  {
    id: "EMP013",
    name: "Divya Reddy",
    role: "Employee",
    designation: "Frontend Developer",
    department: "Technology",
    project: "Employee Portal",
  },
  {
    id: "EMP014",
    name: "Suresh Babu",
    role: "Team Leader",
    designation: "QA Team Leader",
    department: "Quality Assurance",
    project: "HRMS Testing",
  },
  {
    id: "EMP015",
    name: "Kavya Rao",
    role: "Employee",
    designation: "Business Analyst",
    department: "Business Analysis",
    project: "HRMS India",
  },
  {
    id: "EMP016",
    name: "Naveen Kumar",
    role: "Manager",
    designation: "Development Manager",
    department: "Management",
    project: "Employee Portal",
  },
];

const buildEmployeeDirectory = () => {
  const directory = new Map(employees.map((employee) => [employee.id, employee]));
  readEmployeeRecords().forEach((employee) => {
    directory.set(employee.id, {
      ...(directory.get(employee.id) || {}),
      ...employee,
      role: employee.role || employee.designation || "Employee",
    });
  });
  return [...directory.values()];
};

// =============================================
// SAMPLE ATTENDANCE DATA
// =============================================

// eslint-disable-next-line react-refresh/only-export-components
export const attendanceRecords = [
  // NOVEMBER 2

  { date: "2026-11-02", employeeId: "EMP001", checkIn: "09:05 AM", checkOut: "06:10 PM", status: "Present" },
  { date: "2026-11-02", employeeId: "EMP002", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-02", employeeId: "EMP003", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-02", employeeId: "EMP004", checkIn: "09:45 AM", checkOut: "06:15 PM", status: "Late" },
  { date: "2026-11-02", employeeId: "EMP005", checkIn: "09:10 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-02", employeeId: "EMP006", checkIn: "--", checkOut: "--", status: "On Leave" },
  { date: "2026-11-02", employeeId: "EMP007", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-02", employeeId: "EMP008", checkIn: "09:35 AM", checkOut: "06:15 PM", status: "Late" },

  // NOVEMBER 3

  { date: "2026-11-03", employeeId: "EMP001", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-03", employeeId: "EMP002", checkIn: "09:10 AM", checkOut: "06:05 PM", status: "Present" },
  { date: "2026-11-03", employeeId: "EMP003", checkIn: "09:25 AM", checkOut: "06:00 PM", status: "Late" },
  { date: "2026-11-03", employeeId: "EMP004", checkIn: "09:05 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-03", employeeId: "EMP005", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-03", employeeId: "EMP006", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-03", employeeId: "EMP007", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-03", employeeId: "EMP008", checkIn: "--", checkOut: "--", status: "On Leave" },

  // NOVEMBER 4

  { date: "2026-11-04", employeeId: "EMP001", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-04", employeeId: "EMP002", checkIn: "09:45 AM", checkOut: "06:00 PM", status: "Late" },
  { date: "2026-11-04", employeeId: "EMP003", checkIn: "09:10 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-04", employeeId: "EMP004", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-04", employeeId: "EMP005", checkIn: "09:05 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-04", employeeId: "EMP006", checkIn: "09:20 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-04", employeeId: "EMP007", checkIn: "--", checkOut: "--", status: "On Leave" },
  { date: "2026-11-04", employeeId: "EMP008", checkIn: "09:50 AM", checkOut: "06:00 PM", status: "Late" },

  // NOVEMBER 5

  { date: "2026-11-05", employeeId: "EMP001", checkIn: "09:05 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-05", employeeId: "EMP002", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-05", employeeId: "EMP003", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-05", employeeId: "EMP004", checkIn: "09:40 AM", checkOut: "06:00 PM", status: "Late" },
  { date: "2026-11-05", employeeId: "EMP005", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-05", employeeId: "EMP006", checkIn: "09:10 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-05", employeeId: "EMP007", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-05", employeeId: "EMP008", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },

  // NOVEMBER 6

  { date: "2026-11-06", employeeId: "EMP001", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-06", employeeId: "EMP002", checkIn: "09:20 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-06", employeeId: "EMP003", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-06", employeeId: "EMP004", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-06", employeeId: "EMP005", checkIn: "09:50 AM", checkOut: "06:00 PM", status: "Late" },
  { date: "2026-11-06", employeeId: "EMP006", checkIn: "--", checkOut: "--", status: "On Leave" },
  { date: "2026-11-06", employeeId: "EMP007", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-06", employeeId: "EMP008", checkIn: "09:30 AM", checkOut: "06:00 PM", status: "Late" },

  // NOVEMBER 9

  { date: "2026-11-09", employeeId: "EMP001", checkIn: "09:05 AM", checkOut: "06:10 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP002", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP003", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-09", employeeId: "EMP004", checkIn: "09:45 AM", checkOut: "06:15 PM", status: "Late" },
  { date: "2026-11-09", employeeId: "EMP005", checkIn: "09:10 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP006", checkIn: "--", checkOut: "--", status: "On Leave" },
  { date: "2026-11-09", employeeId: "EMP007", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP008", checkIn: "09:35 AM", checkOut: "06:15 PM", status: "Late" },
  { date: "2026-11-09", employeeId: "EMP009", checkIn: "09:10 AM", checkOut: "06:05 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP010", checkIn: "09:25 AM", checkOut: "06:15 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP011", checkIn: "09:45 AM", checkOut: "06:00 PM", status: "Late" },
  { date: "2026-11-09", employeeId: "EMP012", checkIn: "08:55 AM", checkOut: "06:10 PM", status: "Present" },
  { date: "2026-11-09", employeeId: "EMP013", checkIn: "--", checkOut: "--", status: "Absent" },
  { date: "2026-11-09", employeeId: "EMP014", checkIn: "09:35 AM", checkOut: "06:20 PM", status: "Late" },
  { date: "2026-11-09", employeeId: "EMP015", checkIn: "--", checkOut: "--", status: "On Leave" },
  { date: "2026-11-09", employeeId: "EMP016", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present" },
];

// =============================================
// DATE HELPERS
// =============================================

const getDateKey = (date) => {
  return getDateKeyInTimezone(date, readAttendanceSettings().timezone);
};

const getStatusClass = (status) => {
  return status.toLowerCase().replace(/\s+/g, "-");
};

const readPunchHistory = () => {
  try {
    const legacyRecords = Object.keys(localStorage)
      .filter((key) => key.startsWith("hrms-attendance-"))
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        try {
          return {
            date: key.replace("hrms-attendance-", ""),
            ...JSON.parse(localStorage.getItem(key) || "{}"),
          };
        } catch (error) {
          console.error(`Unable to read attendance record ${key}:`, error);
          return null;
        }
      })
      .filter((record) => record?.checkIn);
    const currentRecords = readAttendanceRecords();
    const unique = new Map([...legacyRecords, ...currentRecords].map((record) => [`${record.date}:${record.employeeId}`, record]));
    return [...unique.values()].sort((left, right) => `${right.date}:${right.employeeId}`.localeCompare(`${left.date}:${left.employeeId}`));
  } catch (error) {
    console.error("Unable to read attendance history:", error);
    return [];
  }
};

const formatPunchTime = (dateString) => {
  if (!dateString) return "--";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getWorkingDuration = (record, now) => {
  const start = new Date(record.checkIn).getTime();
  const end = record.checkOut
    ? new Date(record.checkOut).getTime()
    : now;

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;

  const completedBreaks = (record.breaks || []).reduce((total, item) => {
    if (!item.start || !item.end) return total;

    return total + Math.max(
      0,
      new Date(item.end).getTime() - new Date(item.start).getTime()
    );
  }, 0);

  const activeBreakStart = record.activeBreakStart
    ? new Date(record.activeBreakStart).getTime()
    : null;
  const activeBreak =
    activeBreakStart !== null &&
    Number.isFinite(activeBreakStart) &&
    !record.checkOut
      ? Math.max(0, now - activeBreakStart)
      : 0;

  return Math.max(0, end - start - completedBreaks - activeBreak);
};

const formatWorkingDuration = (milliseconds) => {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getAttendanceWorkingDuration = (record) => {
  const checkInDate = new Date(record.checkIn);
  const checkOutDate = new Date(record.checkOut);
  if (
    Number.isFinite(checkInDate.getTime()) &&
    Number.isFinite(checkOutDate.getTime()) &&
    typeof record.checkIn === "string" &&
    record.checkIn.includes("T")
  ) {
    const breaks = (record.breaks || []).reduce((total, item) => {
      if (!item.start || !item.end) return total;
      return total + Math.max(0, new Date(item.end).getTime() - new Date(item.start).getTime());
    }, 0);
    return Math.max(0, checkOutDate.getTime() - checkInDate.getTime() - breaks);
  }
  const checkIn = getClockMinutes(record.checkIn);
  const checkOut = getClockMinutes(record.checkOut);
  if (checkIn === null || checkOut === null || checkOut < checkIn) return 0;
  return (checkOut - checkIn) * 60000;
};

const getBreakDuration = (record) => {
  const completed = (record.breaks || []).reduce((total, item) => {
    if (!item.start || !item.end) return total;
    return total + Math.max(0, new Date(item.end).getTime() - new Date(item.start).getTime());
  }, 0);
  const active = record.activeBreakStart && !record.checkOut
    ? Math.max(0, Date.now() - new Date(record.activeBreakStart).getTime())
    : 0;
  return completed + active;
};

const formatBreakTimings = (record) => {
  const completed = (record.breaks || []).filter((item) => item.start).map((item) => `${formatPunchTime(item.start)} – ${formatPunchTime(item.end)}`);
  if (record.activeBreakStart) completed.push(`${formatPunchTime(record.activeBreakStart)} – In progress`);
  return completed.length ? completed.join(", ") : "Not recorded";
};

const formatRecordedLocation = (location) => {
  if (!location) return "Not recorded";
  if (location.address) return location.address;
  if (location.latitude !== undefined && location.longitude !== undefined) return `${location.latitude}, ${location.longitude}`;
  return "Recorded location";
};

const readAttendanceRestoreState = () => {
  try {
    return JSON.parse(sessionStorage.getItem("hrms-attendance-origin-state") || "null") || {};
  } catch {
    return {};
  }
};

const isIncompleteAttendance = (record) =>
  !["Absent", "On Leave"].includes(record.status)
  && (!record.checkIn || record.checkIn === "--" || !record.checkOut || record.checkOut === "--");

const getLateMinutes = (checkIn, settings = readAttendanceSettings()) => {
  const checkInMinutes = getClockMinutes(checkIn, settings.timezone);
  const lateAfterMinutes = getClockMinutes(settings.lateAfter, settings.timezone);
  return checkInMinutes === null || lateAfterMinutes === null
    ? null
    : Math.max(0, checkInMinutes - lateAfterMinutes);
};

const getRecordLateMinutes = getLateMinutes;

const buildAttendanceData = (liveRecords, overrides, settings) => {
  const merged = new Map(
    attendanceRecords.map((record) => [`${record.date}:${record.employeeId}`, record])
  );
  liveRecords.forEach((record) => {
    merged.set(`${record.date}:${record.employeeId}`, record);
  });
  const normalized = [...merged.values()].map((record) => ({
    ...record,
    status: record.checkIn && record.checkIn !== "--"
      ? isLateArrival(record.checkIn, settings) ? "Late" : "Present"
      : record.status,
  }));
  return applyAttendanceOverrides(normalized, overrides);
};

// =============================================
// ATTENDANCE COMPONENT
// =============================================

function Attendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const restoreState = location.state?.attendanceRestore || readAttendanceRestoreState();
  const employeeDirectory = useMemo(() => buildEmployeeDirectory(), []);
  const [filter, setFilter] = useKpiFilter("All");
  const [roleFilter, setRoleFilter] = useState(restoreState.roleFilter || "All");
  const [selectedAttendanceKpi, setSelectedAttendanceKpi] = useState(restoreState.selectedKpi || filter);
  const [searchState, setSearchState] = useState({ filter, value: restoreState.search || "" });
  const search = searchState.filter === filter ? searchState.value : "";
  const setSearch = (value) => setSearchState({ filter, value });
  const [punchHistory, setPunchHistory] = useState(() => readPunchHistory());
  const [locationDetails, setLocationDetails] = useState(null);
  const [overviewDepartment, setOverviewDepartment] = useState(restoreState.overviewDepartment || "All");
  const [overviewSearch, setOverviewSearch] = useState(restoreState.overviewSearch || "");
  const [overviewFromDate, setOverviewFromDate] = useState(restoreState.overviewFromDate || "");
  const [overviewToDate, setOverviewToDate] = useState(restoreState.overviewToDate || "");
  const [overviewStatus, setOverviewStatus] = useState(restoreState.overviewStatus || "All");
  const [historyEmployee, setHistoryEmployee] = useState(restoreState.historyEmployee || "All");
  const [historyRole, setHistoryRole] = useState(restoreState.historyRole || "All");
  const [historyDepartment, setHistoryDepartment] = useState(restoreState.historyDepartment || "All");
  const [historyDate, setHistoryDate] = useState(restoreState.historyDate || "");
  const [historyStatus, setHistoryStatus] = useState(restoreState.historyStatus || "All");
  const [historyCheckIn, setHistoryCheckIn] = useState(restoreState.historyCheckIn || "All");
  const [historyCheckOut, setHistoryCheckOut] = useState(restoreState.historyCheckOut || "All");
  const [attendanceOverrides, setAttendanceOverrides] = useState(readAttendanceOverrides);
  const [liveAttendanceRecords, setLiveAttendanceRecords] = useState(readAttendanceRecords);
  const [attendanceSettings, setAttendanceSettings] = useState(readAttendanceSettings);
  const [historyNow] = useState(() => Date.now());
  const attendanceData = useMemo(
    () => buildAttendanceData(liveAttendanceRecords, attendanceOverrides, attendanceSettings),
    [liveAttendanceRecords, attendanceOverrides, attendanceSettings]
  );

  const overviewRows = useMemo(() => attendanceData.map((record) => {
    const employee = employeeDirectory.find((item) => item.id === record.employeeId);
    return employee ? { ...employee, ...record, id: employee.id, workingMilliseconds: getAttendanceWorkingDuration(record) } : null;
  }).filter(Boolean).sort((left, right) => right.date.localeCompare(left.date) || left.name.localeCompare(right.name)), [attendanceData, employeeDirectory]);
  const overviewDepartments = useMemo(() => [...new Set(employeeDirectory.map((employee) => employee.department).filter(Boolean))].sort(), [employeeDirectory]);
  const filteredOverviewRows = useMemo(() => overviewRows.filter((record) => {
    const query = overviewSearch.trim().toLowerCase();
    const matchesSearch = !query || `${record.name} ${record.id}`.toLowerCase().includes(query);
    const matchesDepartment = overviewDepartment === "All" || record.department === overviewDepartment;
    const matchesStatus = overviewStatus === "All" || record.status === overviewStatus;
    const matchesFrom = !overviewFromDate || record.date >= overviewFromDate;
    const matchesTo = !overviewToDate || record.date <= overviewToDate;
    return matchesSearch && matchesDepartment && matchesStatus && matchesFrom && matchesTo;
  }), [overviewRows, overviewSearch, overviewDepartment, overviewStatus, overviewFromDate, overviewToDate]);

  useEffect(() => {
    const refreshAttendance = () => {
      setLiveAttendanceRecords(readAttendanceRecords());
      setPunchHistory(readPunchHistory());
    };
    const refreshSettings = () => setAttendanceSettings(readAttendanceSettings());
    window.addEventListener("hrms-attendance-updated", refreshAttendance);
    window.addEventListener("hrms-attendance-settings-updated", refreshSettings);
    return () => {
      window.removeEventListener("hrms-attendance-updated", refreshAttendance);
      window.removeEventListener("hrms-attendance-settings-updated", refreshSettings);
    };
  }, []);

  useEffect(() => {
    const scrollY = Number(restoreState.scrollY);
    if (!Number.isFinite(scrollY)) return undefined;
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
    return () => window.cancelAnimationFrame(frame);
  }, [restoreState.scrollY]);

  const historyDepartments = useMemo(() => [...new Set(punchHistory.filter((record) => employeeDirectory.some((employee) => employee.id === record.employeeId)).map((record) => record.department).filter(Boolean))].sort(), [punchHistory, employeeDirectory]);
  const filteredPunchHistory = useMemo(() => punchHistory.filter((record) => {
    const employee = employeeDirectory.find((item) => item.id === record.employeeId);
    if (!employee) return false;
    const hasCheckIn = Boolean(record.checkInLocation && locationUrl(record.checkInLocation));
    const hasCheckOut = Boolean(record.checkOutLocation && locationUrl(record.checkOutLocation));
    const employeeMatch = historyEmployee === "All" || record.employeeId === historyEmployee;
    const roleMatch = historyRole === "All" || employee?.role === historyRole;
    const departmentMatch = historyDepartment === "All" || record.department === historyDepartment;
    const dateMatch = !historyDate || record.date === historyDate;
    const late = getLateMinutes(record.checkIn) > 0;
    const statusMatch = historyStatus === "All" || (historyStatus === "Late" ? late : historyStatus === "Present" ? !late : record.status === historyStatus);
    return employeeMatch && roleMatch && departmentMatch && dateMatch && statusMatch && (historyCheckIn === "All" || (historyCheckIn === "Available" ? hasCheckIn : !hasCheckIn)) && (historyCheckOut === "All" || (historyCheckOut === "Available" ? hasCheckOut : !hasCheckOut));
  }), [punchHistory, employeeDirectory, historyEmployee, historyRole, historyDepartment, historyDate, historyStatus, historyCheckIn, historyCheckOut]);

  useEffect(() => {
    saveAttendanceOverrides(attendanceOverrides);
  }, [attendanceOverrides]);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const selected = restoreState.selectedDate ? new Date(`${restoreState.selectedDate}T00:00:00`) : new Date();
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => restoreState.selectedDate || getDateKey(new Date()));
  const [holidayFormRequest, setHolidayFormRequest] = useState(0);

  const activeSummary = filter;
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  // =============================================
  // CALENDAR CALCULATIONS
  // =============================================

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const totalDays = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0
  ).getDate();

  const startingDay =
    (new Date(
      calendarYear,
      calendarMonthIndex,
      1
    ).getDay() + 6) % 7;

  const calendarDays = [
    ...Array(startingDay).fill(null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  // =============================================
  // SELECTED DATE RECORDS
  // =============================================

  const selectedDateRecords = useMemo(() => {
    return attendanceData
      .filter((record) => record.date === selectedDate)
      .map((record) => {
        const employee = employeeDirectory.find(
          (item) => item.id === record.employeeId
        );

        return {
          ...employee,
          ...record,
          id: employee.id,
        };
      })
      .filter((record) => record.id);
  }, [attendanceData, selectedDate, employeeDirectory]);

  // =============================================
  // MONTHLY ATTENDANCE RECORDS
  // =============================================

  const monthlyRecords = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const monthIndex = calendarMonth.getMonth();
    const prefix = `${year}-${String(
      monthIndex + 1
    ).padStart(2, "0")}`;

    return attendanceData
      .filter((record) => record.date.startsWith(prefix))
      .map((record) => ({
        ...employeeDirectory.find(
          (employee) => employee.id === record.employeeId
        ),
        ...record,
        id: record.employeeId,
      }))
      .filter((record) => record.id);
  }, [attendanceData, calendarMonth, employeeDirectory]);

  // =============================================
  // EMPLOYEE MONTHLY ATTENDANCE STATISTICS
  // =============================================

  const employeeMonthlyStats = useMemo(() => {
    return employeeDirectory.map((employee) => {
      const records = monthlyRecords.filter(
        (record) => record.id === employee.id
      );

      return {
        ...employee,
        presentDays: records.filter(
          (record) => record.status === "Present"
        ).length,
        absentDays: records.filter(
          (record) => record.status === "Absent"
        ).length,
        lateDays: records.filter(
          (record) => record.status === "Late"
        ).length,
        leaveDays: records.filter(
          (record) => record.status === "On Leave"
        ).length,
      };
    });
  }, [monthlyRecords, employeeDirectory]);

  // =============================================
  // SUMMARY COUNTS
  // =============================================

  const presentCount = selectedDateRecords.filter(
    (item) => item.status === "Present"
  ).length;

  const absentCount = selectedDateRecords.filter(
    (item) => item.status === "Absent"
  ).length;

  const lateCount = selectedDateRecords.filter(
    (item) => item.status === "Late"
  ).length;

  const earlyCheckOutCount = selectedDateRecords.filter(
    (item) => item.checkOut && isEarlyCheckOut(item.checkOut, attendanceSettings)
  ).length;

  const leaveCount = selectedDateRecords.filter(
    (item) => item.status === "On Leave"
  ).length;

  const incompleteCount = selectedDateRecords.filter(isIncompleteAttendance).length;
  const noCheckInRecords = selectedDateRecords.filter(
    (record) =>
      record.status !== "On Leave" &&
      (!record.checkIn || record.checkIn === "--")
  );
  const noCheckOutRecords = selectedDateRecords.filter(
    (record) =>
      !["Absent", "On Leave"].includes(record.status) &&
      record.checkIn &&
      record.checkIn !== "--" &&
      (!record.checkOut || record.checkOut === "--")
  );
  const workingHoursTotal = selectedDateRecords.reduce(
    (total, record) => total + getAttendanceWorkingDuration(record),
    0
  );
  const monthlyWorkingHoursTotal = monthlyRecords.reduce(
    (total, record) => total + getAttendanceWorkingDuration(record),
    0
  );

  const monthlyPresent = monthlyRecords.filter(
    (item) => item.status === "Present"
  ).length;

  const monthlyAbsent = monthlyRecords.filter(
    (item) => item.status === "Absent"
  ).length;

  const monthlyLate = monthlyRecords.filter(
    (item) => item.status === "Late"
  ).length;

  const managerPresentCount = selectedDateRecords.filter((item) => item.role === "Manager" && item.checkIn && item.checkIn !== "--" && ["Present", "Late"].includes(item.status)).length;
  const hrPresentCount = selectedDateRecords.filter((item) => item.role === "HR" && item.checkIn && item.checkIn !== "--" && ["Present", "Late"].includes(item.status)).length;
  const roleSummaryCards = [
    { title: "Managers Present", value: managerPresentCount, icon: UserCheck, color: "green", description: "Managers with a recorded check-in" },
    { title: "HR Present", value: hrPresentCount, icon: UserCheck, color: "green", description: "HR users with a recorded check-in" },
    { title: "Late Arrivals", value: lateCount, icon: Clock, color: "orange", description: "Manager and HR late check-ins" },
    { title: "Missing Check-outs", value: noCheckOutRecords.length, icon: CircleAlert, color: "orange", description: "Recorded check-ins without check-out" },
    { title: "Total Hours Worked", value: formatWorkingDuration(workingHoursTotal), icon: Timer, color: "blue", description: "Recorded Manager and HR working time" },
  ];

  // =============================================
  // SUMMARY CARDS
  // =============================================

  const summaryCards = [
    {
      title: "Total Records",
      value: selectedDateRecords.length,
      monthlyValue: monthlyRecords.length,
      icon: Users,
      color: "blue",
      description: "Manager and HR attendance records",
      key: "All",
    },
    {
      title: "Present",
      value: presentCount,
      monthlyValue: monthlyPresent,
      icon: UserCheck,
      color: "green",
      description: "Present employee records",
      key: "Present",
    },
    {
      title: "Absent",
      value: absentCount,
      monthlyValue: monthlyAbsent,
      icon: UserX,
      color: "red",
      description: "Absent employee records",
      key: "Absent",
    },
    {
      title: "Late Arrivals",
      value: lateCount,
      monthlyValue: monthlyLate,
      icon: Clock,
      color: "orange",
      description: "Late employee records",
      key: "Late",
    },
    {
      title: "Early Check-outs",
      value: earlyCheckOutCount,
      monthlyValue: monthlyRecords.filter(
        (item) => item.checkOut && isEarlyCheckOut(item.checkOut, attendanceSettings)
      ).length,
      icon: Clock,
      color: "orange",
      description: "Employees checked out before office end time",
      key: "Early Check-outs",
    },
    {
      title: "On Leave",
      value: leaveCount,
      monthlyValue: monthlyRecords.filter((item) => item.status === "On Leave").length,
      icon: CalendarDays,
      color: "blue",
      description: "Employees on leave for selected day",
      key: "On Leave",
    },
    {
      title: "Incomplete Check-ins",
      value: incompleteCount,
      monthlyValue: monthlyRecords.filter(isIncompleteAttendance).length,
      icon: CircleAlert,
      color: "orange",
      description: "Missing check-in or check-out",
      key: "Incomplete Check-ins",
    },
    {
      title: "Working Hours",
      value: formatWorkingDuration(workingHoursTotal),
      monthlyValue: formatWorkingDuration(monthlyWorkingHoursTotal),
      icon: Timer,
      color: "green",
      description: "Total employee working time",
      key: "Working Hours",
    },
    {
      title: "Add Holiday",
      value: "+",
      monthlyValue: "Holiday Management",
      icon: CalendarDays,
      color: "green",
      description: "Create a company or government holiday",
      key: "Add Holiday",
      isAction: true,
    },
  ];

  // =============================================
  // SUMMARY DETAIL DATA
  // =============================================

  const summaryDetailRecords = useMemo(() => {
    if (activeSummary === "All") {
      return employeeMonthlyStats;
    }

    return employeeMonthlyStats.filter((employee) => {
      if (activeSummary === "Present") {
        return employee.presentDays > 0;
      }

      if (activeSummary === "Absent") {
        return employee.absentDays > 0;
      }

      if (activeSummary === "Late") {
        return employee.lateDays > 0;
      }

      return false;
    });
  }, [activeSummary, employeeMonthlyStats]);

  // =============================================
  // FILTERING AND SEARCH
  // =============================================

  const filteredRecords = selectedDateRecords.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(search.toLowerCase()) ||
      employee.id.toLowerCase().includes(search.toLowerCase()) ||
      employee.role.toLowerCase().includes(search.toLowerCase()) ||
      employee.designation.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" ||
      (filter === "Early Check-outs"
        ? Boolean(employee.checkOut && isEarlyCheckOut(employee.checkOut, attendanceSettings))
        : employee.status === filter);
    const matchesRole = roleFilter === "All" || employee.role === roleFilter;

    const matchesSummary = activeSummary === "All" ||
      (activeSummary === "Early Check-outs"
        ? Boolean(employee.checkOut && isEarlyCheckOut(employee.checkOut, attendanceSettings))
        : employee.status === activeSummary);

    return matchesSearch && matchesFilter && matchesRole && matchesSummary;
  });

  // =============================================
  // CHANGE MONTH
  // =============================================

  const changeMonth = (amount) => {
    setCalendarMonth((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth() + amount,
        1
      );
    });
  };

  // =============================================
  // GO TO TODAY
  // =============================================

  const goToToday = () => {
    const today = new Date();

    setCalendarMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setSelectedDate(getDateKey(today));
    setFilter("All");
  };

  // =============================================
  // SELECT DATE
  // =============================================

  const handleDateSelect = (dateKey) => {
    setSelectedDate(dateKey);
    setSearch("");
    setFilter("All");
  };

  const getAttendanceOrigin = () => ({
    pathname: location.pathname,
    originSearch: location.search,
    scrollY: window.scrollY,
    selectedKpi: selectedAttendanceKpi,
    search,
    roleFilter,
    selectedDate,
    overviewDepartment,
    overviewSearch,
    overviewFromDate,
    overviewToDate,
    overviewStatus,
    historyEmployee,
    historyRole,
    historyDepartment,
    historyDate,
    historyStatus,
    historyCheckIn,
    historyCheckOut,
  });

  const openAttendanceDetails = (key, options = {}) => {
    setSelectedAttendanceKpi(key);
    const origin = getAttendanceOrigin();
    try { sessionStorage.setItem("hrms-attendance-origin-state", JSON.stringify(origin)); } catch { /* storage may be unavailable */ }
    const params = new URLSearchParams({ filter: key, date: options.date || selectedDate || "All" });
    if (options.department && options.department !== "All") params.set("department", options.department);
    if (options.role && options.role !== "All") params.set("role", options.role);
    navigate(`/admin/attendance/records?${params.toString()}`, {
      state: { attendanceOrigin: origin },
    });
  };

  // =============================================
  // SELECT SUMMARY CARD
  // =============================================

  const handleSummaryClick = (key) => {
    if (key === "Add Holiday") {
      setHolidayFormRequest((current) => current + 1);
      return;
    }
    openAttendanceDetails(key, { date: key === "All" ? "All" : selectedDate });
  };

  const updateAttendanceStatus = (employeeId, nextStatus) => {
    const record = selectedDateRecords.find((item) => item.id === employeeId);
    if (!record || record.status === nextStatus) return;

    const actor = readAdminProfile().name || "Admin User";
    try {
      recordAuditEvent({
        actor,
        action: "attendance.status-updated",
        entityType: "Attendance record",
        entityId: `${selectedDate}:${employeeId}`,
        summary: `${actor} changed ${record.name}'s attendance from ${record.status} to ${nextStatus}.`,
        details: { before: record.status, after: nextStatus },
      });
    } catch (error) {
      console.error("Unable to record the attendance correction in audit history.", error);
      alert("The attendance change was not applied because its audit entry could not be saved.");
      return;
    }

    const key = `${selectedDate}:${record.employeeId}`;
    setAttendanceOverrides((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        status: nextStatus,
        updatedBy: actor,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  // =============================================
  // DOWNLOAD CSV
  // =============================================

  const downloadAttendance = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Role",
      "Designation",
      "Project",
      "Check In",
      "Check Out",
      "Status",
      "Date",
    ];

    const rows = filteredRecords.map((item) => [
      item.id,
      item.name,
      item.role,
      item.designation,
      item.project,
      item.checkIn,
      item.checkOut,
      item.status,
      selectedDate,
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `attendance-${selectedDate}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =============================================
  // CALENDAR DAY STATUS COUNTS
  // =============================================

  const getDaySummary = (day) => {
    if (!day) return null;

    const dateKey = getDateKey(
      new Date(calendarYear, calendarMonthIndex, day)
    );

    const records = attendanceData.filter(
      (record) => record.date === dateKey && employeeDirectory.some((employee) => employee.id === record.employeeId)
    );

    if (!records.length) return null;

    return {
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      late: records.filter((r) => r.status === "Late").length,
      leave: records.filter((r) => r.status === "On Leave").length,
    };
  };

  // =============================================
  // SUMMARY DETAIL TABLE HEADINGS
  // =============================================

  const getSummaryHeading = () => {
    if (activeSummary === "All") {
      return "All Employee Details";
    }

    if (activeSummary === "Present") {
      return "Present Employee Details";
    }

    if (activeSummary === "Absent") {
      return "Absent Employee Details";
    }

    if (activeSummary === "Late") {
      return "Late Arrival Employee Details";
    }

    return "Employee Details";
  };

  const getSummaryDescription = () => {
    if (activeSummary === "All") {
      return "Complete employee information including role, designation and project.";
    }

    if (activeSummary === "Present") {
      return "Employees present on the selected date and their attendance days this month.";
    }

    if (activeSummary === "Absent") {
      return "Employees absent on the selected date and their total absent days this month.";
    }

    if (activeSummary === "Late") {
      return "Employees arriving late on the selected date and their total late arrivals this month.";
    }

    return "";
  };

  // =============================================
  // RETURN
  // =============================================

  const showLegacyCalendar = false;

  return (
    <div className="attendance-page">

      {/* PAGE HEADER */}

      <div className="attendance-page-header">
        <div>
          <h1>Attendance Management</h1>
          <p>
            Monitor daily attendance, monthly records and employee
            attendance history.
          </p>
        </div>

        <button
          type="button"
          className="attendance-download-btn"
          onClick={() => navigate("/admin/hr-configuration")}
        >
          <ChevronLeft size={17} />
          Back to HR Configuration
        </button>

        <button
          type="button"
          className="attendance-download-btn"
          onClick={downloadAttendance}
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      <nav className="attendance-section-nav" aria-label="Attendance sections">
        <button type="button" className="active" onClick={() => document.getElementById("attendance-overview")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Overview</button>
        <button type="button" onClick={() => document.getElementById("attendance-daily-records")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Daily Attendance</button>
        <button type="button" onClick={() => document.getElementById("attendance-punch-history")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Punch History</button>
      </nav>

      <AttendanceOverview
        rows={filteredOverviewRows}
        allRows={overviewRows}
        departments={overviewDepartments}
        totalEmployees={employeeDirectory.length}
        selectedDepartment={overviewDepartment}
        setDepartment={setOverviewDepartment}
        search={overviewSearch}
        setSearch={setOverviewSearch}
        fromDate={overviewFromDate}
        setFromDate={setOverviewFromDate}
        toDate={overviewToDate}
        setToDate={setOverviewToDate}
        status={overviewStatus}
        setStatus={setOverviewStatus}
        reset={() => { setOverviewDepartment("All"); setOverviewSearch(""); setOverviewFromDate(""); setOverviewToDate(""); setOverviewStatus("All"); }}
        onLocation={(location, type, timestamp) => setLocationDetails({ location, type, timestamp })}
        onDepartment={(department) => openAttendanceDetails("All", { date: "All", department })}
      />

      {/* SUMMARY CARDS */}

      <div className="attendance-summary-cards manager-hr-summary-cards" aria-label="Manager and HR attendance summary">
        {roleSummaryCards.map((card) => {
          const Icon = card.icon;
          const role = card.title === "Managers Present" ? "Manager" : card.title === "HR Present" ? "HR" : "All";
          return <button type="button" className={`attendance-summary-card ${card.color}`} key={card.title} onClick={() => openAttendanceDetails(card.title.includes("Present") ? "Present" : card.title === "Late Arrivals" ? "Late" : card.title === "Missing Check-outs" ? "Incomplete Check-ins" : "Working Hours", { date: selectedDate, role })}>
            <div className="attendance-summary-top"><div className="attendance-summary-icon"><Icon size={21} /></div><span>{card.title}</span></div>
            <h2>{card.value}</h2>
            <p>{card.description}</p>
            <small>View details</small>
          </button>;
        })}
      </div>

      <div className="attendance-summary-cards">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              type="button"
              key={card.key}
              className={`attendance-summary-card ${card.color}
                ${activeSummary === card.key ? "summary-card-active" : ""}
              `}
              onClick={() => handleSummaryClick(card.key)}
            >
              <div className="attendance-summary-top">
                <div className="attendance-summary-icon">
                  <Icon size={21} />
                </div>

                <span>{card.title}</span>
              </div>

              <h2>{card.value}</h2>

              <p>{card.description}</p>

              <small>
                {card.isAction ? card.monthlyValue : `${card.key === "Working Hours" ? "Monthly working hours" : "This month"}: ${card.monthlyValue}`}
              </small>
            </button>
          );
        })}
      </div>

      <section className="attendance-alerts" aria-labelledby="attendance-alerts-title">
        <div className="attendance-alerts-heading">
          <div>
            <h2 id="attendance-alerts-title">Attendance alerts</h2>
            <p>Exceptions for {selectedDate}; employees on leave are excluded.</p>
          </div>
          <CircleAlert size={20} aria-hidden="true" />
        </div>
        <div className="attendance-alert-grid">
          {[
            { label: "No check-in", records: noCheckInRecords },
            { label: "No check-out", records: noCheckOutRecords },
            {
              label: "Absent",
              records: selectedDateRecords.filter((record) => record.status === "Absent"),
            },
          ].map(({ label, records }) => (
            <div className="attendance-alert-item" key={label}>
              <strong>{records.length}</strong>
              <span>{label}</span>
              <small>
                {records.length
                  ? records.map((record) => `${record.name} (${record.id})`).join(", ")
                  : "No employees"}
              </small>
            </div>
          ))}
        </div>
      </section>

      {/* CLICKABLE SUMMARY DETAILS */}

      {showSummaryDetails && (
        <section
          style={{
            marginTop: "24px",
            marginBottom: "24px",
            padding: "24px",
            borderRadius: "16px",
            background: "var(--card-bg, rgba(255,255,255,0.04))",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px" }}>
                {getSummaryHeading()}
              </h2>

              <p style={{ margin: 0, opacity: 0.7 }}>
                {getSummaryDescription()}
              </p>

              <small style={{ display: "block", marginTop: "8px", opacity: 0.65 }}>
                Selected date: {selectedDate} | Month:{" "}
                {calendarMonth.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </small>
            </div>

            <button
              type="button"
              onClick={() => setShowSummaryDetails(false)}
              aria-label="Close employee details"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-color, rgba(255,255,255,0.2))",
                background: "transparent",
                color: "inherit",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* SUMMARY DETAIL COUNTS */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {activeSummary === "All" && (
              <div style={detailStatStyle}>
                <span>Total Employees</span>
                <strong>{employeeDirectory.length}</strong>
              </div>
            )}

            {activeSummary === "Present" && (
              <>
                <div style={detailStatStyle}>
                  <span>Present Today</span>
                  <strong>{presentCount}</strong>
                </div>
                <div style={detailStatStyle}>
                  <span>Present This Month</span>
                  <strong>{monthlyPresent}</strong>
                </div>
              </>
            )}

            {activeSummary === "Absent" && (
              <>
                <div style={detailStatStyle}>
                  <span>Absent Today</span>
                  <strong>{absentCount}</strong>
                </div>
                <div style={detailStatStyle}>
                  <span>Absent This Month</span>
                  <strong>{monthlyAbsent}</strong>
                </div>
              </>
            )}

            {activeSummary === "Late" && (
              <>
                <div style={detailStatStyle}>
                  <span>Late Today</span>
                  <strong>{lateCount}</strong>
                </div>
                <div style={detailStatStyle}>
                  <span>Late This Month</span>
                  <strong>{monthlyLate}</strong>
                </div>
              </>
            )}
          </div>

          {/* EMPLOYEE DETAILS TABLE */}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "850px",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Employee ID",
                    "Employee Name",
                    "Designation",
                    "Role",
                    "Project",
                    ...(activeSummary === "All"
                      ? []
                      : activeSummary === "Present"
                      ? ["Present Days", "GPS Location"]
                      : activeSummary === "Absent"
                      ? ["Absent Days", "GPS Location"]
                      : ["Late Arrivals"]),
                  ].map((heading) => (
                    <th key={heading} style={detailHeaderStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {summaryDetailRecords.length > 0 ? (
                  summaryDetailRecords.map((employee) => {
                    const todayRecord = selectedDateRecords.find(
                      (record) => record.id === employee.id
                    );
                    const punchRecord = punchHistory.find(
                      (record) =>
                        record.employeeId === employee.id &&
                        record.date === selectedDate
                    );
                    const checkInLocation = locationUrl(
                      punchRecord?.checkInLocation
                    )
                      ? punchRecord.checkInLocation
                      : null;
                    const checkOutLocation = locationUrl(
                      punchRecord?.checkOutLocation
                    )
                      ? punchRecord.checkOutLocation
                      : null;
                    const hasGpsLocation =
                      checkInLocation || checkOutLocation;

                    let monthlyValue = 0;
                    let monthlyLabel = "";

                    if (activeSummary === "Present") {
                      monthlyValue = employee.presentDays;
                      monthlyLabel = "days";
                    } else if (activeSummary === "Absent") {
                      monthlyValue = employee.absentDays;
                      monthlyLabel = "days";
                    } else if (activeSummary === "Late") {
                      monthlyValue = employee.lateDays;
                      monthlyLabel = "times";
                    }

                    return (
                      <tr key={employee.id}>
                        <td style={detailCellStyle}>
                          {employee.id}
                        </td>

                        <td style={detailCellStyle}>
                          <strong>{employee.name}</strong>
                        </td>

                        <td style={detailCellStyle}>
                          {employee.designation}
                        </td>

                        <td style={detailCellStyle}>
                          {employee.role}
                        </td>

                        <td style={detailCellStyle}>
                          {employee.project}
                        </td>

                        {activeSummary !== "All" && (
                          <td style={detailCellStyle}>
                            <strong>
                              {monthlyValue} {monthlyLabel}
                            </strong>
                            <div style={{ fontSize: "12px", opacity: 0.65 }}>
                              Today: {todayRecord?.status || "No record"}
                            </div>
                          </td>
                        )}

                        {(activeSummary === "Present" ||
                          activeSummary === "Absent") && (
                          <td style={detailCellStyle}>
                            {checkInLocation ? (
                              <div className="summary-gps-entry">
                                <span>
                                  Check-In: {checkInLocation.latitude},{" "}
                                  {checkInLocation.longitude}
                                </span>
                                <a
                                  href={locationUrl(checkInLocation)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View on Google Maps
                                </a>
                              </div>
                            ) : (
                              <div className="summary-gps-entry">
                                <span>Check-In: Not Available</span>
                              </div>
                            )}

                            {punchRecord?.checkOut ? (
                              checkOutLocation ? (
                                <div className="summary-gps-entry">
                                  <span>
                                    Check-Out: {checkOutLocation.latitude},{" "}
                                    {checkOutLocation.longitude}
                                  </span>
                                  <a
                                    href={locationUrl(checkOutLocation)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View on Google Maps
                                  </a>
                                </div>
                              ) : (
                                <div className="summary-gps-entry">
                                  <span>Check-Out: Not Available</span>
                                </div>
                              )
                            ) : punchRecord?.checkIn ? (
                              <div className="summary-gps-entry">
                                <span>Check-Out: Not Checked Out</span>
                              </div>
                            ) : (
                              <div className="summary-gps-entry">
                                <span>Check-Out: Not Available</span>
                              </div>
                            )}

                            {!hasGpsLocation && (
                              <strong className="summary-gps-status">
                                GPS Status: No GPS Recorded
                              </strong>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={
                        activeSummary === "All"
                          ? 5
                          : activeSummary === "Present" ||
                            activeSummary === "Absent"
                          ? 7
                          : 6
                      }
                      style={{
                        ...detailCellStyle,
                        textAlign: "center",
                        padding: "24px",
                      }}
                    >
                      No employee records available for this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <CompanyHolidayCalendar openHolidayRequest={holidayFormRequest} />
      {showLegacyCalendar && (

      <section className="attendance-calendar-card">

        <div className="attendance-calendar-header">
          <div>
            <span className="attendance-calendar-label">
              ATTENDANCE OVERVIEW
            </span>

            <h2>Attendance Calendar</h2>

            <p>
              Select a date to view individual employee attendance.
            </p>
          </div>

          <CalendarDays size={25} />
        </div>

        {/* CALENDAR NAVIGATION */}

        <div className="attendance-calendar-navigation">
          <h3>
            {calendarMonth.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <div>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={19} />
            </button>

            <button type="button" onClick={goToToday}>
              Today
            </button>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        {/* CALENDAR GRID */}

        <div className="attendance-calendar-grid">

          {[
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
          ].map((day) => (
            <div
              className="attendance-calendar-weekday"
              key={day}
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  className="attendance-calendar-empty"
                  key={`empty-${index}`}
                />
              );
            }

            const dateKey = getDateKey(
              new Date(calendarYear, calendarMonthIndex, day)
            );

            const summary = getDaySummary(day);

            const todayKey = getDateKey(new Date());

            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => handleDateSelect(dateKey)}
                className={`attendance-calendar-day
                  ${isToday ? "attendance-day-today" : ""}
                  ${isSelected ? "attendance-day-selected" : ""}
                `}
              >
                <span className="attendance-calendar-number">
                  {day}
                </span>

                {summary ? (
                  <div className="attendance-calendar-dots">
                    {summary.present > 0 && (
                      <i className="legend-present" />
                    )}

                    {summary.late > 0 && (
                      <i className="legend-late" />
                    )}

                    {summary.absent > 0 && (
                      <i className="legend-absent" />
                    )}

                    {summary.leave > 0 && (
                      <i className="legend-leave" />
                    )}
                  </div>
                ) : (
                  <small className="calendar-no-data">
                    No data
                  </small>
                )}
              </button>
            );
          })}
        </div>

        {/* CALENDAR LEGEND */}

        <div className="attendance-calendar-legend">
          <span>
            <i className="legend-present" />
            Present
          </span>

          <span>
            <i className="legend-late" />
            Late
          </span>

          <span>
            <i className="legend-absent" />
            Absent
          </span>

          <span>
            <i className="legend-leave" />
            On Leave
          </span>
        </div>

        {/* SELECTED DATE DETAILS */}

        <div className="attendance-selected-details">

          <div className="attendance-selected-header">
            <div>
              <span>SELECTED DATE</span>

              <h3>
                {new Date(
                  `${selectedDate}T00:00:00`
                ).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            </div>

            <span className="attendance-record-count">
              {selectedDateRecords.length} Records
            </span>
          </div>

          <div className="attendance-selected-summary">
            <div>
              <span>Present</span>
              <strong>{presentCount}</strong>
            </div>

            <div>
              <span>Absent</span>
              <strong>{absentCount}</strong>
            </div>

            <div>
              <span>Late</span>
              <strong>{lateCount}</strong>
            </div>

            <div>
              <span>On Leave</span>
              <strong>{leaveCount}</strong>
            </div>
          </div>

        </div>
      </section>

      )}

      {/* ATTENDANCE RECORDS TABLE */}

      <section id="attendance-daily-records" className="attendance-records-card">

        <div className="attendance-records-header">
          <div>
            <h2>Daily Attendance Records</h2>
            <p>
              Employee attendance for the selected date.
            </p>
          </div>

          <span className="attendance-selected-date-label">
            {selectedDate}
          </span>
        </div>

        {/* SEARCH AND FILTER */}

        <div className="attendance-table-controls">

          <div className="attendance-search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search employee, ID or role..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Early Check-outs">Early Check-outs</option>
            <option value="On Leave">On Leave</option>
          </select>

          <select aria-label="Filter attendance by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="All">All Roles</option>
            <option value="Manager">Manager</option>
            <option value="HR">HR</option>
          </select>
        </div>

        {/* TABLE */}

        <div className="attendance-table-wrapper">
          <table className="attendance-table">

            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Designation</th>
                <th>Check In</th>
                <th>Scheduled Login</th>
                <th>Delay</th>
                <th>Check Out</th>
                <th>Total Hours</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((employee) => (
                  <tr key={employee.id}>

                    <td>{employee.id}</td>

                    <td className="attendance-employee-name">
                      {employee.name}
                    </td>

                    <td>{employee.role}</td>

                    <td>{employee.designation}</td>

                    <td>{formatAttendanceTime(employee.checkIn, attendanceSettings.timezone)}</td>

                    <td>{formatOfficeTime(attendanceSettings.start)}</td>

                    <td>
                      {getRecordLateMinutes(employee.checkIn, attendanceSettings) === null
                        ? "--"
                        : `${getRecordLateMinutes(employee.checkIn, attendanceSettings)} min`}
                    </td>

                    <td>{formatAttendanceTime(employee.checkOut, attendanceSettings.timezone)}</td>

                    <td>{formatWorkingDuration(getAttendanceWorkingDuration(employee))}</td>

                    <td>
                      <select
                        className={`attendance-status-select status-${getStatusClass(employee.status)}`}
                        value={employee.status}
                        onChange={(event) => updateAttendanceStatus(employee.id, event.target.value)}
                        aria-label={`Update attendance status for ${employee.name}`}
                      >
                        {["Present", "Late", "Absent", "On Leave"].map((status) => (
                          <option value={status} key={status}>{status}</option>
                        ))}
                      </select>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="attendance-empty-row">
                    No attendance records found for this date.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        <div className="attendance-table-footer">
          Showing {filteredRecords.length} of {selectedDateRecords.length} records
        </div>

      </section>

      {/* SAVED CHECK-IN HISTORY */}

      <section id="attendance-punch-history" className="attendance-records-card">
        <div className="attendance-records-header">
          <div>
            <h2>Attendance Punch History</h2>
            <p>
              Saved check-in/out times, working hours, GPS locations and late-login status.
            </p>
          </div>
        </div>

        <div className="attendance-history-filters">
          <select aria-label="Filter attendance history by employee" value={historyEmployee} onChange={(event) => setHistoryEmployee(event.target.value)}><option value="All">All employees</option>{employeeDirectory.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} ({employee.id})</option>)}</select>
          <select aria-label="Filter attendance history by role" value={historyRole} onChange={(event) => setHistoryRole(event.target.value)}><option value="All">All roles</option><option value="Manager">Manager</option><option value="HR">HR</option></select>
          <select aria-label="Filter attendance history by department" value={historyDepartment} onChange={(event) => setHistoryDepartment(event.target.value)}><option value="All">All departments</option>{historyDepartments.map((department) => <option value={department} key={department}>{department}</option>)}</select>
          <input aria-label="Filter attendance history by date" type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} />
          <select aria-label="Filter attendance history by status" value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)}><option value="All">All statuses</option><option value="Present">Present</option><option value="Late">Late</option><option value="On Leave">On Leave</option></select>
          <select aria-label="Filter check-in location availability" value={historyCheckIn} onChange={(event) => setHistoryCheckIn(event.target.value)}><option value="All">Check-in location: All</option><option value="Available">Check-in location: Available</option><option value="Unavailable">Check-in location: Unavailable</option></select>
          <select aria-label="Filter check-out location availability" value={historyCheckOut} onChange={(event) => setHistoryCheckOut(event.target.value)}><option value="All">Check-out location: All</option><option value="Available">Check-out location: Available</option><option value="Unavailable">Check-out location: Unavailable</option></select>
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table attendance-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Login Status</th>
                <th>Check-in Location</th>
                <th>Check-out Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredPunchHistory.length > 0 ? (
                filteredPunchHistory.map((record) => {
                  const lateMinutes = getLateMinutes(record.checkIn);
                  const checkInMap = locationUrl(record.checkInLocation);
                  const checkOutMap = locationUrl(record.checkOutLocation);

                  return (
                    <tr key={record.date}>
                      <td>{record.date}<small className="attendance-location-meta">{record.employeeName || record.employeeId}</small></td>
                      <td>{formatPunchTime(record.checkIn)}</td>
                      <td>{formatPunchTime(record.checkOut)}</td>
                      <td>
                        {formatWorkingDuration(
                          getWorkingDuration(record, historyNow)
                        )}
                        {!record.checkOut && " (In progress)"}
                      </td>
                      <td>
                        <span
                          className={`attendance-status-badge ${
                            lateMinutes === null
                              ? ""
                              : lateMinutes > 0
                              ? "status-late"
                              : "status-present"
                          }`}
                        >
                          {lateMinutes === null
                            ? "Unknown"
                            : lateMinutes > 0
                            ? `Late by ${lateMinutes} min`
                            : "On time"}
                        </span>
                      </td>
                      <td>
                        {checkInMap ? (
                          <button type="button" className="attendance-location-link" onClick={() => setLocationDetails({ type: "Check-In", location: record.checkInLocation, timestamp: record.checkIn })}>
                            <MapPin size={14} />
                            View Check-In Location
                          </button>
                        ) : (
                          "Not captured"
                        )}
                      </td>
                      <td>
                        {checkOutMap ? (
                          <button type="button" className="attendance-location-link" onClick={() => setLocationDetails({ type: "Check-Out", location: record.checkOutLocation, timestamp: record.checkOut })}>
                            <MapPin size={14} />
                            View Check-Out Location
                          </button>
                        ) : (
                          "Not captured"
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="attendance-empty-row">
                    No saved punch history matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {locationDetails && <LocationDetailsModal details={locationDetails} onClose={() => setLocationDetails(null)} />}

    </div>
  );
}

function AttendanceOverview({ rows, allRows, departments, totalEmployees, selectedDepartment, setDepartment, search, setSearch, fromDate, setFromDate, toDate, setToDate, status, setStatus, reset, onLocation, onDepartment }) {
  const [selected, setSelected] = useState(null);
  const departmentCounts = departments.map((department) => ({ department, count: allRows.filter((row) => row.department === department).length }));
  const locationButton = (location, type, timestamp) => location && locationUrl(location)
    ? <button type="button" className="attendance-location-link" title={formatRecordedLocation(location)} onClick={() => onLocation(location, type, timestamp)}><MapPin size={13} />View location</button>
    : <span className="attendance-not-recorded">Not recorded</span>;

  return <section id="attendance-overview" className="attendance-overview-card">
    <div className="attendance-records-header">
      <div><span className="attendance-calendar-label">ATTENDANCE / OVERVIEW</span><h2>Employee attendance overview</h2><p>All available employee attendance records from the existing attendance source.</p></div>
    </div>
    <div className="attendance-overview-kpis">
      <div className="attendance-overview-kpi"><span>Total Departments</span><strong>{departments.length}</strong></div>
      <div className="attendance-overview-kpi"><span>Total Employees</span><strong>{totalEmployees}</strong></div>
      {departmentCounts.map((item) => <button type="button" className={`attendance-overview-kpi department-kpi${selectedDepartment === item.department ? " active" : ""}`} key={item.department} onClick={() => { setDepartment(item.department); onDepartment(item.department); }}><span>{item.department}</span><strong>{item.count}</strong><small>Open details</small></button>)}
    </div>
    <div className="attendance-overview-toolbar">
      <div className="attendance-search-box"><Search size={18} /><input type="search" placeholder="Search employee name or ID..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <select aria-label="Filter overview by department" value={selectedDepartment} onChange={(event) => setDepartment(event.target.value)}><option value="All">All departments</option>{departments.map((department) => <option value={department} key={department}>{department}</option>)}</select>
      <select aria-label="Filter overview by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="All">All statuses</option>{["Present", "Absent", "Late", "On Leave"].map((item) => <option value={item} key={item}>{item}</option>)}</select>
      <input type="date" aria-label="Attendance overview start date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
      <input type="date" aria-label="Attendance overview end date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
      <button type="button" className="attendance-download-btn secondary" onClick={reset}>Clear filters</button>
    </div>
    <div className="attendance-table-wrapper">
      <table className="attendance-table attendance-overview-table">
        <thead><tr><th>Employee</th><th>ID</th><th>Department</th><th>Designation</th><th>Date</th><th>Check-in</th><th>Check-in location</th><th>Check-out</th><th>Check-out location</th><th>Break timings</th><th>Break duration</th><th>Hours worked</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>{rows.length ? rows.map((row) => <tr key={`${row.date}-${row.id}`}>
          <td className="attendance-employee-name">{row.name}</td><td>{row.id}</td><td>{row.department || "Not recorded"}</td><td>{row.designation || "Not recorded"}</td><td>{row.date}</td>
          <td>{formatAttendanceTime(row.checkIn)}</td><td>{locationButton(row.checkInLocation, "Check-In", row.checkIn)}</td><td>{formatAttendanceTime(row.checkOut)}</td><td>{locationButton(row.checkOutLocation, "Check-Out", row.checkOut)}</td>
          <td>{formatBreakTimings(row)}</td><td>{formatWorkingDuration(getBreakDuration(row))}</td><td>{formatWorkingDuration(row.workingMilliseconds)}</td>
          <td><span className={`attendance-status-badge status-${getStatusClass(row.status)}`}>{row.status || "Not recorded"}</span></td><td><button type="button" className="attendance-detail-button" onClick={() => setSelected(row)}>View details</button></td>
        </tr>) : <tr><td colSpan="14" className="attendance-empty-row">No attendance records match the selected filters.</td></tr>}</tbody>
      </table>
    </div>
    <div className="attendance-table-footer">Showing {rows.length} of {allRows.length} attendance records</div>
    {selected && <div className="attendance-detail-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="attendance-detail-modal" role="dialog" aria-modal="true"><div className="attendance-location-modal-header"><div><span className="attendance-calendar-label">ATTENDANCE / EMPLOYEE DETAIL</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close attendance details"><X size={18} /></button></div><dl className="attendance-detail-grid"><dt>Employee ID</dt><dd>{selected.id}</dd><dt>Department</dt><dd>{selected.department || "Not recorded"}</dd><dt>Designation</dt><dd>{selected.designation || "Not recorded"}</dd><dt>Attendance date</dt><dd>{selected.date}</dd><dt>Check-in</dt><dd>{formatAttendanceTime(selected.checkIn)}</dd><dt>Check-out</dt><dd>{formatAttendanceTime(selected.checkOut)}</dd><dt>Break timings</dt><dd>{formatBreakTimings(selected)}</dd><dt>Total break duration</dt><dd>{formatWorkingDuration(getBreakDuration(selected))}</dd><dt>Total hours worked</dt><dd>{formatWorkingDuration(selected.workingMilliseconds)}</dd><dt>Status</dt><dd>{selected.status || "Not recorded"}</dd><dt>Check-in location</dt><dd>{locationButton(selected.checkInLocation, "Check-In", selected.checkIn)}</dd><dt>Check-out location</dt><dd>{locationButton(selected.checkOutLocation, "Check-Out", selected.checkOut)}</dd></dl><p className="attendance-data-note">Values marked “Not recorded” are not available in the existing attendance data source.</p></section></div>}
  </section>;
}

function LocationDetailsModal({ details, onClose }) {
  const location = details.location;
  const map = locationUrl(location);
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const delta = 0.002;
  const mapPreview = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}&layer=mapnik&marker=${latitude},${longitude}`
    : null;
  return <div className="attendance-location-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="attendance-location-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-location-title"><div className="attendance-location-modal-header"><div><span className="attendance-calendar-label">ATTENDANCE / LOCATION EVENT</span><h2 id="attendance-location-title">{details.type} Location Details</h2></div><button type="button" onClick={onClose} aria-label="Close location details"><X size={18} /></button></div>{location ? <><dl className="attendance-location-details"><dt>Event date and time</dt><dd>{new Date(details.timestamp || location.capturedAt).toLocaleString("en-IN")}</dd><dt>Full address</dt><dd>{location.address || "Address unavailable"}</dd><dt>Latitude</dt><dd>{location.latitude}</dd><dt>Longitude</dt><dd>{location.longitude}</dd><dt>GPS accuracy</dt><dd>{Number.isFinite(Number(location.accuracy)) ? `${Math.round(location.accuracy)} meters` : "Unavailable"}</dd><dt>Device / browser</dt><dd>{location.device || "Not recorded"}</dd></dl>{mapPreview ? <iframe className="attendance-location-map-preview" title={`${details.type} location map`} src={mapPreview} loading="lazy" /> : <div className="attendance-location-map-preview"><MapPin size={24} /><span>Map preview unavailable without GPS coordinates.</span></div>}<div className="attendance-location-modal-actions">{map && <a className="attendance-download-btn" href={map} target="_blank" rel="noreferrer"><MapPin size={15} />Open in Google Maps</a>}<button type="button" className="attendance-download-btn secondary" onClick={onClose}>Close</button></div></> : <p>Location Unavailable. No GPS data was captured for this event.</p>}</section></div>;
}

const attendanceFilterLabels = {
  All: "Total Records",
  Present: "Present Today",
  Absent: "Absent Today",
  Late: "Late Arrivals",
  "Early Check-outs": "Early Check-outs",
  "On Leave": "On Leave",
  "Incomplete Check-ins": "Incomplete Check-ins",
  "Working Hours": "Working Hours",
};

function isValidAttendanceDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function AttendanceRecords() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeDirectory = useMemo(() => buildEmployeeDirectory(), []);
  const [filter, setFilter] = useKpiFilter("All");
  const validFilter = Object.hasOwn(attendanceFilterLabels, filter) ? filter : "All";
  const requestedDate = searchParams.get("date") || "All";
  const department = searchParams.get("department") || "All";
  const role = searchParams.get("role") || "All";
  const selectedDate = requestedDate === "All" || isValidAttendanceDate(requestedDate)
    ? requestedDate
    : "All";
  const filterScope = `${validFilter}:${selectedDate}:${department}:${role}`;
  const [search, setSearch] = useKpiScopedState(filterScope, "");
  const [page, setPage] = useKpiScopedState(filterScope, 1);
  const [liveAttendanceRecords, setLiveAttendanceRecords] = useState(readAttendanceRecords);
  const [attendanceSettings, setAttendanceSettings] = useState(readAttendanceSettings);
  const pageSize = 10;

  useEffect(() => {
    const refreshAttendance = () => setLiveAttendanceRecords(readAttendanceRecords());
    const refreshSettings = () => setAttendanceSettings(readAttendanceSettings());
    window.addEventListener("hrms-attendance-updated", refreshAttendance);
    window.addEventListener("hrms-attendance-settings-updated", refreshSettings);
    return () => {
      window.removeEventListener("hrms-attendance-updated", refreshAttendance);
      window.removeEventListener("hrms-attendance-settings-updated", refreshSettings);
    };
  }, []);

  const records = buildAttendanceData(
    liveAttendanceRecords,
    readAttendanceOverrides(),
    attendanceSettings
  )
    .map((record) => {
      const employee = employeeDirectory.find((item) => item.id === record.employeeId);
      return employee
        ? {
            ...employee,
            ...record,
            id: employee.id,
            workingMilliseconds: getAttendanceWorkingDuration(record),
          }
        : null;
    })
    .filter(Boolean)
    .filter((record) => selectedDate === "All" || record.date === selectedDate)
    .filter((record) => department === "All" || record.department === department)
    .filter((record) => role === "All" || record.role === role)
    .filter((record) => {
      if (validFilter === "All") return true;
      if (validFilter === "Incomplete Check-ins") return isIncompleteAttendance(record);
      if (validFilter === "Working Hours") return record.workingMilliseconds > 0;
      if (validFilter === "Early Check-outs") {
        return Boolean(record.checkOut && isEarlyCheckOut(record.checkOut, attendanceSettings));
      }
      return record.status === validFilter;
    })
    .filter((record) =>
      `${record.name} ${record.id} ${record.department} ${record.role}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((left, right) => right.date.localeCompare(left.date) || left.name.localeCompare(right.name));

  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const updateDate = (event) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("date", event.target.value || "All");
    setSearchParams(nextParams);
  };

  const handleBack = () => {
    const origin = location.state?.attendanceOrigin;
    if (!origin?.pathname) {
      navigate(-1);
      return;
    }
    navigate(`${origin.pathname}${origin.originSearch || ""}`, {
      replace: true,
      state: { attendanceRestore: origin },
    });
  };

  return (
    <div className="attendance-page">
      <div className="attendance-page-header">
        <div>
          <h1>{attendanceFilterLabels[validFilter]}</h1>
          <p>
            {selectedDate === "All"
              ? "Attendance records across all available dates."
              : `Attendance records for ${selectedDate}.`}
          </p>
        </div>
        <button
          type="button"
          className="attendance-download-btn"
          onClick={handleBack}
        >
          <ChevronLeft size={17} />
          Back to Attendance
        </button>
      </div>

      <section className="attendance-records-card">
        <div className="attendance-records-header">
          <div>
            <h2>{attendanceFilterLabels[validFilter]}</h2>
            <p>{records.length} matching attendance record{records.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        <div className="attendance-table-controls">
          <div className="attendance-search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search employee, ID or department..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Attendance category"
            value={validFilter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {Object.entries(attendanceFilterLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            className="attendance-date-filter"
            type="date"
            aria-label="Filter attendance by date"
            value={selectedDate === "All" ? "" : selectedDate}
            onChange={updateDate}
          />
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table attendance-detail-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Date</th>
                <th>Scheduled Login</th>
                <th>Check-in Time</th>
                <th>Delay</th>
                <th>Check-out Time</th>
                <th>Working Hours</th>
                <th>Attendance Status</th>
                <th>Early Check-out Reason</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.length ? visibleRecords.map((record) => (
                <tr key={`${record.date}-${record.id}`}>
                  <td className="attendance-employee-name">{record.name}</td>
                  <td>{record.id}</td>
                  <td>{record.department}</td>
                  <td>{record.date}</td>
                  <td>{formatOfficeTime(attendanceSettings.start)}</td>
                  <td>{formatAttendanceTime(record.checkIn, attendanceSettings.timezone)}</td>
                  <td>
                    {getRecordLateMinutes(record.checkIn, attendanceSettings) === null
                      ? "--"
                      : `${getRecordLateMinutes(record.checkIn, attendanceSettings)} min`}
                  </td>
                  <td>{formatAttendanceTime(record.checkOut, attendanceSettings.timezone)}</td>
                  <td>{formatWorkingDuration(record.workingMilliseconds)}</td>
                  <td>
                    <span className={`attendance-status-badge status-${getStatusClass(
                      record.checkOut && isEarlyCheckOut(record.checkOut, attendanceSettings)
                        ? "Early Check-out"
                        : record.status
                    )}`}>
                      {record.checkOut && isEarlyCheckOut(record.checkOut, attendanceSettings)
                        ? "Early Check-out"
                        : record.status}
                    </span>
                  </td>
                  <td>{record.earlyCheckOutReason || "--"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="11" className="attendance-empty-row">
                    No attendance records found for this category and date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="attendance-record-pagination">
          <span>
            {records.length
              ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, records.length)} of ${records.length} records`
              : "No records to display"}
          </span>
          <div>
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </button>
            <span>Page {currentPage} of {pageCount}</span>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =============================================
// INLINE SUMMARY DETAIL STYLES
// =============================================

const detailStatStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
  minWidth: "150px",
};

const detailHeaderStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.15))",
  whiteSpace: "nowrap",
  fontSize: "13px",
};

const detailCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.10))",
  fontSize: "13px",
};

export default Attendance;
