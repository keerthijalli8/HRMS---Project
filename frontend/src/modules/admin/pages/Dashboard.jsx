import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Play,
  CheckCircle,
  Timer,
  X,
  FileText,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

import "../style/Dashboard.css";
import { readAdminProfile } from "../services/adminProfile";
import { readAuditLog, recordAuditEvent } from "../services/auditLog";
import { readEmployeeRecords } from "../services/employeeRecords";
import { readAttendanceRecord, readAttendanceRecords, saveAttendanceRecord } from "../services/attendanceRecords";
import { captureAttendanceLocation } from "../services/attendanceLocation";
import {
  formatAttendanceTime,
  getDateKeyInTimezone,
  isEarlyCheckOut,
  isLateArrival,
  readAttendanceSettings,
} from "../services/attendanceSettings";
import { initialLeaveData } from "../data/leaveData";

// ---------------------------------------------
// SAMPLE EMPLOYEE DATA
// ---------------------------------------------

const employees = [
  {
    id: "EMP001",
    name: "Rahul Sharma",
    designation: "Manager",
    department: "IT",
    status: "Present",
  },
  {
    id: "EMP002",
    name: "Priya Reddy",
    designation: "HR",
    department: "Human Resources",
    status: "Present",
  },
  {
    id: "EMP003",
    name: "Kiran Kumar",
    designation: "Employee",
    department: "Finance",
    status: "On Leave",
  },
  {
    id: "EMP004",
    name: "Sneha Patel",
    designation: "Team Leader",
    department: "IT",
    status: "Present",
  },
  {
    id: "EMP005",
    name: "Arjun Rao",
    designation: "Employee",
    department: "Marketing",
    status: "Present",
  },
  {
    id: "EMP006",
    name: "Ananya Das",
    designation: "HR",
    department: "Human Resources",
    status: "On Leave",
  },
  {
    id: "EMP007",
    name: "Vikram Singh",
    designation: "Employee",
    department: "Finance",
    status: "Present",
  },
  {
    id: "EMP008",
    name: "Meera Nair",
    designation: "Team Leader",
    department: "Operations",
    status: "Present",
  },
];

// ---------------------------------------------
// ATTENDANCE HELPERS
// ---------------------------------------------

const emptySession = {
  date: "",
  employeeId: "",
  checkIn: null,
  checkOut: null,
  activeBreakStart: null,
  activeBreakReason: "",
  breaks: [],
  checkInLocation: null,
  checkOutLocation: null,
  status: "",
  attendanceStatus: "",
  earlyCheckOutReason: "",
  checkoutStatus: "",
};

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
};

const formatTime = (dateString) => {
  return formatAttendanceTime(dateString, readAttendanceSettings().timezone);
};

const parseLeaveDateKey = (value, timezone) => {
  const match = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(value || "");
  if (match) {
    const monthIndex = new Date(`${match[2]} 1, 2000`).getMonth() + 1;
    if (monthIndex > 0) {
      return `${match[3]}-${String(monthIndex).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : getDateKeyInTimezone(date, timezone);
};

const isOnLeaveDate = (record, dateKey, timezone) => {
  const from = parseLeaveDateKey(record.fromDate || record.from, timezone);
  const to = parseLeaveDateKey(record.toDate || record.to, timezone);
  return Boolean(from && to && from <= dateKey && dateKey <= to);
};

// ---------------------------------------------
// DATE HELPER
// ---------------------------------------------

const getLocalDateKey = (date) => {
  return getDateKeyInTimezone(date, readAttendanceSettings().timezone);
};

// ---------------------------------------------
// DASHBOARD COMPONENT
// ---------------------------------------------

function Dashboard() {
  const navigate = useNavigate();
  const employeeRoleRecords = useMemo(() => readEmployeeRecords(), []);
  const [adminProfile, setAdminProfile] = useState(readAdminProfile);
  const [auditLogs, setAuditLogs] = useState(readAuditLog);
  const [attendanceSettings, setAttendanceSettings] = useState(readAttendanceSettings);
  const [attendanceHistory, setAttendanceHistory] = useState(readAttendanceRecords);
  const [attendanceEmployeeId] = useState(() => {
    const savedEmployeeId = readAdminProfile().id;
    if (employeeRoleRecords.some((employee) => employee.id === savedEmployeeId)) {
      return savedEmployeeId;
    }
    return employeeRoleRecords.find((employee) => employee.role === "Employee")?.id ||
      employeeRoleRecords[0]?.id || "";
  });
  const [now, setNow] = useState(new Date());
  const [selectedView, setSelectedView] = useState(null);
  const [selectedModule, setSelectedModule] = useState("organizationUsage");
  const moduleSectionRefs = useRef({});
  const [showBreakReasonModal, setShowBreakReasonModal] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  const [showEarlyCheckoutModal, setShowEarlyCheckoutModal] = useState(false);
  const [earlyCheckoutReason, setEarlyCheckoutReason] = useState("");
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceFeedbackState, setAttendanceFeedbackState] = useState({ key: "", message: "" });
  const attendanceMutationInProgress = useRef(false);
  const currentEmployee = employeeRoleRecords.find((employee) => employee.id === attendanceEmployeeId);
  const attendanceDate = getDateKeyInTimezone(now, attendanceSettings.timezone);
  const attendanceSessionKey = `${attendanceDate}:${attendanceEmployeeId}`;
  const attendanceFeedback = attendanceFeedbackState.key === attendanceSessionKey
    ? attendanceFeedbackState.message
    : "";
  const setAttendanceFeedback = (message) => {
    setAttendanceFeedbackState({ key: attendanceSessionKey, message });
  };

  const [sessionState, setSession] = useState(() => {
    const record = readAttendanceRecord(attendanceDate, attendanceEmployeeId);
    return { ...emptySession, ...(record || {}), date: attendanceDate, employeeId: attendanceEmployeeId };
  });
  const session = sessionState.date === attendanceDate && sessionState.employeeId === attendanceEmployeeId
    ? sessionState
    : {
        ...emptySession,
        ...(readAttendanceRecord(attendanceDate, attendanceEmployeeId) || {}),
        date: attendanceDate,
        employeeId: attendanceEmployeeId,
      };

  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  useEffect(() => {
    const loadSettings = () => setAttendanceSettings(readAttendanceSettings());
    const loadRecords = () => setAttendanceHistory(readAttendanceRecords());
    window.addEventListener("hrms-attendance-settings-updated", loadSettings);
    window.addEventListener("hrms-attendance-updated", loadRecords);
    return () => {
      window.removeEventListener("hrms-attendance-settings-updated", loadSettings);
      window.removeEventListener("hrms-attendance-updated", loadRecords);
    };
  }, []);

  useEffect(() => {
    const refreshProfile = () => setAdminProfile(readAdminProfile());
    window.addEventListener("admin-profile-updated", refreshProfile);
    return () => window.removeEventListener("admin-profile-updated", refreshProfile);
  }, []);

  useEffect(() => {
    const refreshAuditLogs = () => setAuditLogs(readAuditLog());
    window.addEventListener("hrms-audit-log-updated", refreshAuditLogs);
    window.addEventListener("storage", refreshAuditLogs);
    return () => {
      window.removeEventListener("hrms-audit-log-updated", refreshAuditLogs);
      window.removeEventListener("storage", refreshAuditLogs);
    };
  }, []);

  const attendanceCounts = useMemo(() => {
    const records = attendanceHistory.filter((record) => record.checkIn);
    return {
      checkIns: records.filter((record) => record.checkIn).length,
      checkOuts: records.filter((record) => record.checkOut).length,
    };
  }, [attendanceHistory]);

  // Update clock every second.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------
  // EMPLOYEE STATISTICS
  // ---------------------------------------------

  const currentHour = now.getHours();
  const greeting = currentHour < 12
    ? "Good morning"
    : currentHour < 17
    ? "Good afternoon"
    : "Good evening";
  const firstName = String(adminProfile?.name || "Admin").trim().split(/\s+/)[0] || "Admin";

  const totalEmployees = employeeRoleRecords.length;
  const todayAttendanceRecords = attendanceHistory.filter((record) => record.date === attendanceDate);
  const presentEmployees = todayAttendanceRecords
    .filter((record) => record.checkIn)
    .map((record) => ({
      ...(employeeRoleRecords.find((employee) => employee.id === record.employeeId) ||
        employees.find((employee) => employee.id === record.employeeId) || {}),
      ...record,
      attendanceStatus: isLateArrival(record.checkIn, attendanceSettings) ? "Late Arrival" : "Present / On Time",
    }));
  const currentLeaveRecords = useMemo(() => {
    try {
      const saved = localStorage.getItem("hrms-leave-requests");
      const records = saved ? JSON.parse(saved) : initialLeaveData;
      return Array.isArray(records) ? records : initialLeaveData;
    } catch (error) {
      console.error("Unable to load leave records for the Overview dashboard.", error);
      return initialLeaveData;
    }
  }, []);
  const leaveEmployeeIds = new Set(currentLeaveRecords
    .filter((record) => record.status === "Approved" && isOnLeaveDate(record, attendanceDate, attendanceSettings.timezone))
    .map((record) => record.employeeId));
  const leaveEmployees = employeeRoleRecords
    .filter((employee) => leaveEmployeeIds.has(employee.id))
    .map((employee) => ({ ...employee, attendanceStatus: "On Leave" }));
  const presentEmployeeIds = new Set(todayAttendanceRecords.filter((record) => record.checkIn).map((record) => record.employeeId));
  const absentEmployees = employeeRoleRecords.filter(
    (employee) => !presentEmployeeIds.has(employee.id) && !leaveEmployeeIds.has(employee.id)
  ).map((employee) => ({ ...employee, attendanceStatus: "Absent" }));
  const lateArrivals = presentEmployees.filter((employee) => isLateArrival(employee.checkIn, attendanceSettings));
  const earlyCheckOuts = todayAttendanceRecords
    .filter((record) => record.checkOut && isEarlyCheckOut(record.checkOut, attendanceSettings))
    .map((record) => ({
      ...(employeeRoleRecords.find((employee) => employee.id === record.employeeId) ||
        employees.find((employee) => employee.id === record.employeeId) || {}),
      ...record,
      attendanceStatus: "Early Check-out",
    }));
  const pendingLeaveApprovals = currentLeaveRecords.filter((record) => record.status === "Pending").length;
  const readStoredCount = (key, statuses) => {
    try {
      const records = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(records) ? records.filter((record) => !statuses || statuses.includes(record.status)).length : 0;
    } catch { return 0; }
  };
  const completedReviews = readStoredCount("hrms-performance-reviews", ["Completed", "complete"]);
  const pendingReviews = readStoredCount("hrms-performance-reviews", ["Pending", "pending"]);

  // ---------------------------------------------
  // ATTENDANCE TRACKER CALCULATIONS
  // ---------------------------------------------

  const isCheckedIn = Boolean(session.checkIn);
  const isCheckedOut = Boolean(session.checkOut);
  const isOnBreak = Boolean(session.activeBreakStart);

  const loginStart = session.checkIn
    ? new Date(session.checkIn).getTime()
    : null;

  const loginEnd = session.checkOut
    ? new Date(session.checkOut).getTime()
    : now.getTime();

  const loginDuration =
    loginStart !== null
      ? Math.max(0, loginEnd - loginStart)
      : 0;

  const completedBreakDuration = (
    session.breaks || []
  ).reduce((total, item) => {
    if (!item.start || !item.end) return total;

    return (
      total +
      Math.max(
        0,
        new Date(item.end).getTime() -
          new Date(item.start).getTime()
      )
    );
  }, 0);

  const activeBreakDuration =
    session.activeBreakStart && !isCheckedOut
      ? Math.max(
          0,
          now.getTime() -
            new Date(session.activeBreakStart).getTime()
        )
      : 0;

  const totalBreakDuration =
    completedBreakDuration + activeBreakDuration;

  const workingDuration = Math.max(
    0,
    loginDuration - totalBreakDuration
  );

  const attendanceStatus = !isCheckedIn
    ? "Not Checked In"
    : isCheckedOut
    ? session.checkoutStatus || "Checked Out"
    : isOnBreak
    ? "On Break"
    : "Working";

  const handleCheckIn = async () => {
    if (!currentEmployee || isCheckedIn || attendanceMutationInProgress.current) return;
    attendanceMutationInProgress.current = true;
    setIsCapturingLocation(true);
    setIsSubmittingAttendance(true);
    setAttendanceFeedback("");
    try {
      const location = await captureAttendanceLocation();
      const timestamp = location.capturedAt || new Date().toISOString();
      const late = isLateArrival(timestamp, attendanceSettings);
      const next = {
        ...emptySession,
        date: attendanceDate,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        department: currentEmployee.department || "",
        checkIn: timestamp,
        checkInLocation: location,
        lateArrivalThreshold: attendanceSettings.lateAfter,
        status: late ? "Late" : "Present",
        attendanceStatus: late ? "Late Arrival" : "Present / On Time",
      };
      saveAttendanceRecord(next);
      setSession(next);
      setAttendanceFeedback(late ? "Check-in saved. Your status is Late Arrival." : "Check-in saved. You are Present / On Time.");
      try {
        recordAuditEvent({
          actor: currentEmployee.name,
          action: "attendance.check-in",
          entityType: "Attendance",
          entityId: `${attendanceDate}:${currentEmployee.id}`,
          summary: `${currentEmployee.name} checked in and recorded a GPS location.`,
        });
      } catch (error) {
        console.error("Check-in was recorded, but audit history could not be updated.", error);
        alert("Your check-in was recorded, but its audit-history entry could not be saved.");
      }
    } catch (error) {
      console.error("Unable to save the check-in.", error);
      alert(
        error?.message?.includes("GPS")
          ? "Unable to capture GPS location. Please enable location permission and try again. Your check-in was not recorded."
          : "Unable to save your check-in. It was not recorded."
      );
    } finally {
      attendanceMutationInProgress.current = false;
      setIsCapturingLocation(false);
      setIsSubmittingAttendance(false);
    }
  };

  const handleStartBreak = () => {
    if (
      !isCheckedIn ||
      isCheckedOut ||
      isOnBreak ||
      isCapturingLocation ||
      isSubmittingAttendance
    ) {
      return;
    }

    setBreakReason("");
    setShowBreakReasonModal(true);
  };

  const submitBreakReason = async (event) => {
    event.preventDefault();
    const reason = breakReason.trim();
    if (!reason) {
      alert("Please provide a reason before starting a break.");
      return;
    }
    if (!isCheckedIn || isCheckedOut || isOnBreak || attendanceMutationInProgress.current) return;

    attendanceMutationInProgress.current = true;
    setIsSubmittingAttendance(true);
    const timestamp = new Date().toISOString();
    const next = {
      ...session,
      activeBreakStart: timestamp,
      activeBreakReason: reason,
    };
    try {
      saveAttendanceRecord(next);
      setSession(next);
      setShowBreakReasonModal(false);
      setBreakReason("");
      setAttendanceFeedback("Your break has started.");
    } catch (error) {
      console.error("Unable to save the break reason.", error);
      alert("The break was not started because its reason could not be saved.");
    } finally {
      attendanceMutationInProgress.current = false;
      setIsSubmittingAttendance(false);
    }
  };

  const submitEarlyCheckoutReason = async (event) => {
    event.preventDefault();
    const reason = earlyCheckoutReason.trim();
    if (!reason) {
      alert("Please provide a reason for your early check-out.");
      return;
    }
    await completeCheckOut(reason);
  };

  const handleEndBreak = () => {
    if (!isOnBreak || attendanceMutationInProgress.current) return;
    attendanceMutationInProgress.current = true;
    setIsSubmittingAttendance(true);
    const end = new Date().toISOString();
    const next = {
      ...session,
      breaks: [
        ...(session.breaks || []),
        {
          start: session.activeBreakStart,
          end,
          reason: session.activeBreakReason || "",
          durationMs: Math.max(0, new Date(end).getTime() - new Date(session.activeBreakStart).getTime()),
        },
      ],
      activeBreakStart: null,
      activeBreakReason: "",
    };
    try {
      saveAttendanceRecord(next);
      setSession(next);
      setAttendanceFeedback("Your break has ended. Work resumed.");
    } catch (error) {
      console.error("Unable to save the break end time.", error);
      alert("Your break is still active because its end time could not be saved.");
    } finally {
      attendanceMutationInProgress.current = false;
      setIsSubmittingAttendance(false);
    }
  };

  const completeCheckOut = async (reason = "") => {
    if (!isCheckedIn || isCheckedOut || isCapturingLocation || attendanceMutationInProgress.current) return;
    if (isOnBreak) {
      alert("Please end your break before checking out.");
      return;
    }

    const timestamp = new Date();
    const isEarly = isEarlyCheckOut(timestamp, attendanceSettings);
    if (isEarly && !reason.trim()) {
      setShowEarlyCheckoutModal(true);
      return;
    }

    attendanceMutationInProgress.current = true;
    setIsCapturingLocation(true);
    setIsSubmittingAttendance(true);
    setAttendanceFeedback("");
    try {
      const location = await captureAttendanceLocation();
      const timestampValue = timestamp.toISOString();
      const next = {
        ...session,
        checkOut: timestampValue,
        checkOutLocation: location,
        checkoutStatus: isEarly ? "Early Check-out" : "Checked Out",
        earlyCheckOutReason: isEarly ? reason.trim() : "",
      };
      saveAttendanceRecord(next);
      setSession(next);
      setShowEarlyCheckoutModal(false);
      setEarlyCheckoutReason("");
      setAttendanceFeedback(isEarly
        ? "Check-out saved. Your status is Early Check-out."
        : "You have successfully checked out.");
      try {
        recordAuditEvent({
          actor: currentEmployee?.name || "Employee",
          action: "attendance.check-out",
          entityType: "Attendance",
          entityId: `${attendanceDate}:${currentEmployee?.id || ""}`,
          summary: `${currentEmployee?.name || "Employee"} checked out and recorded a GPS location.`,
          details: isEarly ? { reason: reason.trim() } : {},
        });
      } catch (error) {
        console.error("Check-out was recorded, but audit history could not be updated.", error);
        alert("Your check-out was recorded, but its audit-history entry could not be saved.");
      }
    } catch (error) {
      console.error("Unable to save the check-out.", error);
      alert(
        "Unable to save your check-out. It was not recorded; please try again."
      );
    } finally {
      attendanceMutationInProgress.current = false;
      setIsCapturingLocation(false);
      setIsSubmittingAttendance(false);
    }
  };

  const handleCheckOut = () => {
    if (!isCheckedIn || isCheckedOut || isCapturingLocation || isSubmittingAttendance) return;
    if (isOnBreak) {
      alert("Please end your break before checking out.");
      return;
    }
    if (isEarlyCheckOut(new Date(), attendanceSettings)) {
      setEarlyCheckoutReason("");
      setShowEarlyCheckoutModal(true);
      return;
    }
    completeCheckOut();
  };

  // ---------------------------------------------
  // POPUP DETAILS
  // ---------------------------------------------

  const closeDetails = () => {
    setSelectedView(null);
  };

  const handleOverviewStatClick = (view) => {
    const routes = {
      employees: "/admin/employees/records?filter=all",
      active: "/admin/employees/records?filter=status:Active",
      inactive: "/admin/employees/records?filter=status:Inactive",
      present: `/admin/attendance/records?filter=Present&date=${encodeURIComponent(attendanceDate)}`,
      absent: `/admin/attendance/records?filter=Absent&date=${encodeURIComponent(attendanceDate)}`,
      leave: "/admin/leaves/records?filter=Approved",
      late: `/admin/attendance/records?filter=Late&date=${encodeURIComponent(attendanceDate)}`,
      "pending-leave": "/admin/leaves/records?filter=Pending",
      "pending-documents": "/admin/documents/records?filter=Pending",
      "completed-reviews": "/admin/performance/records?filter=completed",
      "pending-reviews": "/admin/performance/records?filter=pending",
      "open-support": "/admin/support/records?filter=Open",
    };
    if (routes[view]) navigate(routes[view]);
  };

  const modalTitle = {
    employees: "All Employees",
    present: "Employees Present Today",
    absent: "Employees Absent Today",
    late: "Late Arrivals",
    leave: "Employees On Leave",
    early: "Early Check-outs",
  };

  const modalEmployees = selectedView === "employees"
    ? employeeRoleRecords.map((employee) => {
      const attendance = todayAttendanceRecords.find((record) => record.employeeId === employee.id);
      return {
        ...employee,
        status: leaveEmployeeIds.has(employee.id)
          ? "On Leave"
          : attendance?.checkIn
            ? (isLateArrival(attendance.checkIn, attendanceSettings) ? "Late Arrival" : "Present / On Time")
            : "Absent",
      };
    })
    : selectedView === "present"
      ? presentEmployees
      : selectedView === "absent"
        ? absentEmployees
        : selectedView === "late"
          ? lateArrivals
          : selectedView === "leave"
            ? leaveEmployees
            : selectedView === "early"
              ? earlyCheckOuts
              : [];

  const legacyOverviewBlocks = [
    { title: "Total Employees", value: totalEmployees, detail: "All employee records", icon: Users, tone: "blue", view: "employees" },
    { title: "Attendance Management", description: `${presentEmployees.length} present today · ${lateArrivals.length} late`, icon: UserCheck, path: `/admin/attendance/records?filter=All&date=${encodeURIComponent(attendanceDate)}` },
    { title: "Leave Management", description: `${pendingLeaveApprovals} requests awaiting review`, icon: CalendarDays, path: "/admin/leaves" },
    { title: "Payroll", description: "Open payroll processing and history", icon: FileText, path: "/admin/payroll" },
    { title: "Performance Reviews", description: `${completedReviews} completed · ${pendingReviews} pending`, icon: CheckCircle, path: "/admin/performance" },
    { title: "Reports & Audit Logs", description: "Review usage, changes and security events", icon: FileText, path: "/admin/reports" },
  ];
  void legacyOverviewBlocks;

  const dashboardKpis = [
    { title: "Total Employees", value: totalEmployees, detail: "All employee records", icon: Users, tone: "blue", view: "employees" },
    { title: "Present Today", value: presentEmployees.length, detail: "Employees checked in today", icon: UserCheck, tone: "green", view: "present" },
    { title: "Absent Today", value: absentEmployees.length, detail: "No attendance or approved leave", icon: UserX, tone: "red", view: "absent" },
    { title: "Late Arrivals", value: lateArrivals.length, detail: "Checked in after schedule", icon: Clock, tone: "orange", view: "late" },
    { title: "On Leave", value: leaveEmployees.length, detail: "Approved leave today", icon: CalendarDays, tone: "purple", view: "leave" },
    { title: "Early Check-outs", value: earlyCheckOuts.length, detail: "Checked out before schedule", icon: LogOut, tone: "orange", view: "early" },
  ];
  const dashboardDataBlocks = [
    { title: "Total Employees", summary: `${totalEmployees} records`, records: employeeRoleRecords, path: "/admin/employees/records?filter=all", icon: Users },
    { title: "Present Today", summary: `${presentEmployees.length} present`, records: presentEmployees, path: `/admin/attendance/records?filter=Present&date=${encodeURIComponent(attendanceDate)}`, icon: UserCheck },
    { title: "Absent Today", summary: `${absentEmployees.length} absent`, records: absentEmployees, path: `/admin/attendance/records?filter=Absent&date=${encodeURIComponent(attendanceDate)}`, icon: UserX },
    { title: "Late Arrivals", summary: `${lateArrivals.length} late`, records: lateArrivals, path: `/admin/attendance/records?filter=Late&date=${encodeURIComponent(attendanceDate)}`, icon: Clock },
    { title: "On Leave", summary: `${leaveEmployees.length} on leave`, records: leaveEmployees, path: "/admin/leaves/records?filter=Approved", icon: CalendarDays },
    { title: "Early Check-outs", summary: `${earlyCheckOuts.length} early`, records: earlyCheckOuts, path: `/admin/attendance/records?filter=${encodeURIComponent("Early Check-outs")}&date=${encodeURIComponent(attendanceDate)}`, icon: LogOut },
  ];
  void dashboardKpis;
  void dashboardDataBlocks;

  const storedPayroll = useMemo(() => {
    try {
      const value = JSON.parse(localStorage.getItem("hrms-payroll-data-v1") || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }, []);
  const payrollRuns = Array.isArray(storedPayroll.runs) ? storedPayroll.runs : [];
  const performanceRecords = useMemo(() => {
    try {
      const value = JSON.parse(localStorage.getItem("hrms-performance-reviews") || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }, []);
  const scopedAuditLogs = auditLogs
    .filter((record) => {
      const eventCompany = record?.companyId || record?.company_id || record?.company;
      const currentCompany = adminProfile?.companyId || adminProfile?.company_id || adminProfile?.company;
      return !eventCompany || !currentCompany || String(eventCompany) === String(currentCompany);
    })
  const recentAuditRecords = scopedAuditLogs
    .filter((record) => record && (record.timestamp || record.created_at || record.date))
    .sort((a, b) => new Date(b.timestamp || b.created_at || b.date) - new Date(a.timestamp || a.created_at || a.date))
    .slice(0, 5);
  const auditLabel = (record) => record.action || record.activity || record.type || "Activity recorded";
  const auditActor = (record) => record.actor || record.user || record.userName || record.performedBy || "Unknown user";
  const departmentUsageRows = [...new Set(employeeRoleRecords.map((employee) => employee.department).filter(Boolean))]
    .map((department) => ({ label: department, value: employeeRoleRecords.filter((employee) => employee.department === department).length }));
  const activeUsers = employeeRoleRecords.filter((employee) => {
    const status = String(employee.status || employee.accountStatus || "").toLowerCase();
    return Boolean(employee.email) && !["inactive", "deactivated", "disabled", "terminated"].includes(status);
  });
  const enabledModules = ["Employees", "Attendance", "Leave Management", "Payroll", "Performance", "Reports & Audits", "Settings"];
  const configurationAlerts = scopedAuditLogs.filter((record) => /configuration|settings|permission|role|policy|module/i.test(`${record.action || ""} ${record.module || ""} ${record.description || ""}`));
  const leaveStatusRows = ["Approved", "Pending", "Rejected"].map((status) => ({ label: status, value: currentLeaveRecords.filter((record) => String(record.status).toLowerCase() === status.toLowerCase()).length }));
  const payrollStatusRows = ["Processed", "Pending", "Failed"].map((status) => ({ label: status, value: payrollRuns.filter((run) => {
    const runStatus = String(run.status || "").toLowerCase();
    return status === "Processed" ? ["approved", "processed", "finalized", "paid"].includes(runStatus) : runStatus === status.toLowerCase();
  }).length }));
  const moduleKpis = [
    { key: "employees", target: "organizationUsage", title: "Employees", value: totalEmployees, detail: "Employee records", icon: Users, tone: "blue" },
    { key: "attendance", target: "activeUsers", title: "Attendance", value: presentEmployees.length, detail: "Present today", icon: UserCheck, tone: "green" },
    { key: "leave", target: "leaveManagement", title: "Leave Management", value: pendingLeaveApprovals, detail: "Pending requests", icon: CalendarDays, tone: "purple" },
    { key: "payroll", target: "payrollSummary", title: "Payroll", value: payrollRuns.length, detail: "Recorded payroll runs", icon: Wallet, tone: "orange" },
    { key: "performance", target: "enabledModules", title: "Performance", value: performanceRecords.length, detail: "Saved reviews", icon: CheckCircle, tone: "blue" },
    { key: "recentActivities", target: "recentActivities", title: "Recent Activities", value: scopedAuditLogs.length, detail: "Recorded activities", icon: FileText, tone: "red" },
  ];
  const moduleDetailBlocks = {
    organizationUsage: { title: "Organization Usage", summary: `${totalEmployees} employees across ${departmentUsageRows.length} departments`, records: employeeRoleRecords, path: "/admin/reports?section=usage", icon: Users, kind: "usage" },
    activeUsers: { title: "Active Users", summary: `${activeUsers.length} active users · ${presentEmployees.length} present today`, records: activeUsers, path: "/admin/users?filter=active", icon: UserCheck, kind: "users" },
    enabledModules: { title: "Enabled Modules", summary: `${enabledModules.length} dashboard modules available`, records: enabledModules.map((label) => ({ label })), path: "/admin/reports?section=configuration", icon: CheckCircle, kind: "modules" },
    configurationAlerts: { title: "Configuration Alerts", summary: `${configurationAlerts.length} recorded configuration events`, records: configurationAlerts, path: "/admin/reports?section=audit", icon: FileText, kind: "alerts" },
    leaveManagement: { title: "Leave Management", summary: `${pendingLeaveApprovals} pending requests`, records: currentLeaveRecords, path: "/admin/leaves/records?filter=Pending", icon: CalendarDays, kind: "leave" },
    payrollSummary: { title: "Payroll Summary", summary: `${payrollRuns.length} recorded payroll runs`, records: payrollRuns, path: "/admin/payroll/records?filter=Monthly%20Payroll", icon: Wallet, kind: "payroll" },
  };
  const selectModule = (key) => {
    setSelectedModule(key);
    window.requestAnimationFrame(() => {
      moduleSectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const openModuleDetails = (block) => {
    navigate(block.path, { state: { from: "/admin/dashboard", dashboardModule: selectedModule } });
  };
  const renderBlockContent = (block) => {
    if (block.kind === "usage") {
      const max = Math.max(...departmentUsageRows.map((row) => row.value), 1);
      return <><div className="dashboard-detail-stat-row"><span>Employees</span><strong>{totalEmployees}</strong><span>Present today</span><strong>{presentEmployees.length}</strong><span>Attendance rate</span><strong>{totalEmployees ? `${Math.round((presentEmployees.length / totalEmployees) * 100)}%` : "0%"}</strong></div><div className="dashboard-detail-bars">{departmentUsageRows.slice(0, 5).map((row) => <span key={row.label}><small>{row.label}</small><i><b style={{ width: `${(row.value / max) * 100}%` }} /></i><strong>{row.value}</strong></span>)}</div></>;
    }
    if (block.kind === "users") {
      return <div className="dashboard-detail-list">{block.records.slice(0, 5).map((record, index) => <span key={record.id || record.employeeId || index}><strong>{record.name || record.email || "User"}</strong><small>{record.role || record.designation || "Active user"}</small><em>{presentEmployees.some((item) => item.id === record.id) ? "Present" : "Active"}</em></span>)}{!block.records.length && <span className="dashboard-empty-message">No active user records available.</span>}</div>;
    }
    if (block.kind === "modules") {
      return <div className="dashboard-module-chips">{block.records.map((record) => <span key={record.label}><CheckCircle size={14} />{record.label}</span>)}</div>;
    }
    if (block.kind === "alerts") {
      return <div className="dashboard-detail-list">{block.records.slice(0, 5).map((record, index) => <span key={record.id || index}><strong>{auditLabel(record)}</strong><small>{record.description || record.module || "Configuration activity"}</small><em>{record.status || "Recorded"}</em></span>)}{!block.records.length && <span className="dashboard-empty-message">No configuration alerts recorded.</span>}</div>;
    }
    if (block.kind === "leave") {
      return <div className="dashboard-detail-bars dashboard-status-bars">{leaveStatusRows.map((row) => <span key={row.label}><small>{row.label}</small><i><b style={{ width: `${Math.min(row.value * 12, 100)}%` }} /></i><strong>{row.value}</strong></span>)}</div>;
    }
    if (block.kind === "payroll") {
      return <div className="dashboard-detail-list dashboard-payroll-summary">{payrollStatusRows.map((row) => <span key={row.label}><strong>{row.label}</strong><em>{row.value}</em></span>)}{!payrollRuns.length && <span className="dashboard-empty-message">No payroll runs recorded.</span>}</div>;
    }
    return null;
  };

  // Kept as inert compatibility values for the retired dashboard markup below.
  // The visible calendar is now the shared HRMSCalendar component.
  const calendarMonth = new Date();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarYear = calendarMonth.getFullYear();
  const calendarCells = [];
  const selectedCalendarDate = attendanceDate;
  const selectedDateEvents = [];
  const setSelectedCalendarDate = () => {};
  const showLegacyCalendar = false;
  const getEventsForDay = () => [];
  const changeCalendarMonth = () => {};
  const goToCurrentMonth = () => {};
  const showAttendanceTracker = false;

  // ---------------------------------------------
  // RETURN DASHBOARD UI
  // ---------------------------------------------

  return (
    <div className="dashboard-page">
      {/* DASHBOARD HEADER */}

      <div className="dashboard-header">
        <div>
          <h1>Overview</h1>
          <p>{greeting}, {firstName}</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} />

          <span>
            {now.toLocaleDateString("en-IN", {
              timeZone: attendanceSettings.timezone,
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <section className="dashboard-stats" aria-label="Dashboard KPIs">
        {moduleKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button type="button" className={`dashboard-stat-card ${selectedModule === kpi.target ? "is-selected" : ""}`} key={kpi.key} onClick={() => selectModule(kpi.target)} aria-pressed={selectedModule === kpi.target}>
              <span className={`dashboard-stat-icon ${kpi.tone}`}><Icon size={22} /></span>
              <span className="dashboard-stat-info">
                <p>{kpi.title}</p>
                <h2>{kpi.value}</h2>
                <span>{kpi.detail}</span>
              </span>
              <ArrowRight className="stat-arrow" size={17} />
            </button>
          );
        })}
      </section>

      <section className="dashboard-kpi-data-grid" aria-label="Module details">
        {Object.entries(moduleDetailBlocks).map(([key, block]) => {
          const Icon = block.icon;
          return (
            <section className={`dashboard-module-detail ${selectedModule === key ? "is-selected" : ""}`} id={`dashboard-module-${key}`} ref={(element) => { moduleSectionRefs.current[key] = element; }} key={key} aria-labelledby={`dashboard-module-title-${key}`}>
              <button type="button" className="dashboard-kpi-data-block" onClick={() => openModuleDetails(block)}>
                <span className="dashboard-kpi-data-heading">
                  <span className="dashboard-content-block-icon"><Icon size={19} /></span>
                  <span><strong id={`dashboard-module-title-${key}`}>{block.title}</strong><small>{block.summary}</small></span>
                  <ArrowRight size={16} className="dashboard-content-block-arrow" />
                </span>
                <div className="dashboard-kpi-data-records">{renderBlockContent(block)}</div>
              </button>
            </section>
          );
        })}
      </section>

      <section className={`dashboard-recent-activity ${selectedModule === "recentActivities" ? "is-selected" : ""}`} id="dashboard-module-recentActivities" ref={(element) => { moduleSectionRefs.current.recentActivities = element; }} aria-labelledby="dashboard-recent-activity-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="dashboard-recent-activity-title">Recent Activities</h2>
            <p>Recorded administrative and security activity.</p>
          </div>
          <button type="button" className="dashboard-activity-view-all" onClick={() => navigate("/admin/reports?section=audit")}>View audit logs <ArrowRight size={15} /></button>
        </div>
        <div className="dashboard-recent-activity-list">
          {recentAuditRecords.length ? recentAuditRecords.map((record, index) => (
            <button type="button" className="dashboard-recent-activity-item" key={record.id || `${auditLabel(record)}-${index}`} onClick={() => navigate(`/admin/reports?section=audit&activity=${encodeURIComponent(auditLabel(record))}`)}>
              <span className="dashboard-recent-activity-icon"><FileText size={16} /></span>
              <span><strong>{auditActor(record)}</strong><small>{auditLabel(record)}{record.description ? ` - ${record.description}` : ""}</small></span>
              <time dateTime={record.timestamp || record.created_at || record.date}>{new Date(record.timestamp || record.created_at || record.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
              <ArrowRight size={15} />
            </button>
          )) : <p className="dashboard-empty-message">No recorded activity available.</p>}
        </div>
      </section>

      {/* ATTENDANCE AND BREAK TRACKER removed from the Overview page. */}
      {showAttendanceTracker && <section className="overview-attendance">

        <div className="overview-attendance-header">
          <div>
            <h2>Attendance & Break Tracker</h2>
            <p>
              Manage your daily login, breaks and working hours.
            </p>
          </div>

          <div className="attendance-live-time">
            <Clock size={17} />

            <span>
              {now.toLocaleTimeString("en-IN", {
                timeZone: attendanceSettings.timezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>

        {/* CURRENT STATUS */}

        <div className="attendance-current-status">
          <div>
            <span className="attendance-status-label">
              Current Status
            </span>

            <h3>{attendanceStatus}</h3>
          </div>

          <span
            className={`attendance-status-badge ${
              !isCheckedIn
                ? "not-checked"
                : isCheckedOut
                ? "checked-out"
                : isOnBreak
                ? "on-break"
                : "working"
            }`}
          >
            {attendanceStatus}
          </span>
        </div>

        {/* TIME SUMMARY */}

        <div className="attendance-summary-grid">

          <div className="attendance-summary-box">
            <div className="attendance-summary-heading">
              <div className="attendance-summary-icon login-icon">
                <LogIn size={20} />
              </div>

              <span>Login Duration</span>
            </div>

            <h2>{formatDuration(loginDuration)}</h2>
            <p>Total time since check-in</p>
          </div>

          <div className="attendance-summary-box">
            <div className="attendance-summary-heading">
              <div className="attendance-summary-icon break-icon">
                <Coffee size={20} />
              </div>

              <span>Total Break Time</span>
            </div>

            <h2>{formatDuration(totalBreakDuration)}</h2>
            <p>Completed and current breaks</p>
          </div>

          <div className="attendance-summary-box">
            <div className="attendance-summary-heading">
              <div className="attendance-summary-icon work-icon">
                <Timer size={20} />
              </div>

              <span>Actual Working Time</span>
            </div>

            <h2>{formatDuration(workingDuration)}</h2>
            <p>Login duration minus breaks</p>
          </div>

        </div>

        {/* ATTENDANCE ACTION BUTTONS */}

        <div className="attendance-action-buttons">

          <button
            type="button"
            className="attendance-action-btn checkin-btn"
            onClick={handleCheckIn}
            disabled={!currentEmployee || isCheckedIn || isCapturingLocation || isSubmittingAttendance}
          >
            <LogIn size={18} />
            {isCapturingLocation && !isCheckedIn
              ? "Capturing location..."
              : "Check In"}
          </button>

          {!isOnBreak ? (
            <button
              type="button"
              className="attendance-action-btn break-btn"
              onClick={handleStartBreak}
              disabled={
                !isCheckedIn || isCheckedOut || isCapturingLocation
                || isSubmittingAttendance
              }
            >
              <Coffee size={18} />
              Start Break
            </button>
          ) : (
            <button
              type="button"
              className="attendance-action-btn resume-btn"
              onClick={handleEndBreak}
              disabled={isSubmittingAttendance}
            >
              <Play size={18} />
              End Break
            </button>
          )}

          <button
            type="button"
            className="attendance-action-btn checkout-btn"
            onClick={handleCheckOut}
            disabled={
              !isCheckedIn ||
              isCheckedOut ||
              isOnBreak ||
              isCapturingLocation ||
              isSubmittingAttendance
            }
          >
            <LogOut size={18} />
            {isCapturingLocation && isCheckedIn
              ? "Capturing location..."
              : "Check Out"}
          </button>

        </div>

        <p className={`attendance-action-message${attendanceFeedback ? " attendance-action-feedback" : ""}`} role={attendanceFeedback ? "status" : undefined}>
          {attendanceFeedback || (!currentEmployee
            ? "Add an employee record before checking in."
            : !isCheckedIn
            ? "Please check in to start your working time."
            : isCheckedOut
            ? (session.checkoutStatus === "Early Check-out"
              ? `You checked out early. Reason: ${session.earlyCheckOutReason}`
              : "You have successfully checked out for today.")
            : isOnBreak
            ? "Your break is running. End your break to resume working."
            : "You are checked in. You can start a break or check out.")}
        </p>

        {/* PUNCH DETAILS */}

        <div className="attendance-punch-details">

          <div>
            <span>Check In Time</span>
            <strong>{formatTime(session.checkIn)}</strong>
          </div>

          <div>
            <span>Check Out Time</span>
            <strong>{formatTime(session.checkOut)}</strong>
          </div>

          <div>
            <span>Break Started</span>
            <strong>
              {isOnBreak
                ? formatTime(session.activeBreakStart)
                : "--"}
            </strong>
          </div>

        </div>

        <div className="attendance-punch-counts">
          <div>
            <span>Total Check-ins</span>
            <strong>{attendanceCounts.checkIns}</strong>
          </div>
          <div>
            <span>Total Check-outs</span>
            <strong>{attendanceCounts.checkOuts}</strong>
          </div>
        </div>

        {/* BREAK HISTORY */}

        <div className="break-history">
          <h3>Today's Break History</h3>

          {!session.breaks?.length && !isOnBreak ? (
            <p className="no-breaks">
              No breaks recorded today.
            </p>
          ) : (
            <div className="break-history-list">

              {(session.breaks || []).map((item, index) => {
                const duration =
                  new Date(item.end).getTime() -
                  new Date(item.start).getTime();

                return (
                  <div
                    className="break-history-item"
                    key={index}
                  >
                    <div>
                      <Coffee size={17} />
                      <span>Break {index + 1}</span>
                    </div>

                    <span>
                      {formatTime(item.start)} – {formatTime(item.end)}
                    </span>

                    <span className="break-history-reason">{item.reason}</span>
                    <strong>{formatDuration(item.durationMs ?? duration)}</strong>
                  </div>
                );
              })}

              {isOnBreak && (
                <div className="break-history-item active-break-row">
                  <div>
                    <Coffee size={17} />
                    <span>Current Break</span>
                  </div>

                  <span>
                    Started at {formatTime(session.activeBreakStart)}
                  </span>

                  <span className="break-history-reason">{session.activeBreakReason}</span>
                  <strong>{formatDuration(activeBreakDuration)}</strong>
                </div>
              )}

            </div>
          )}
        </div>

      </section>}

      <section className="dashboard-content-blocks" aria-labelledby="overview-content-title" style={{ display: "none" }}>
        <div className="dashboard-section-heading">
          <div>
            <h2 id="overview-content-title">Quick access</h2>
            <p>Open important HRMS content using the existing module pages.</p>
          </div>
        </div>
        <div className="dashboard-content-block-grid">
          {[].map((block) => {
            const Icon = block.icon;
            return <button type="button" className="dashboard-content-block" key={block.path} onClick={() => navigate(block.path)}>
              <span className="dashboard-content-block-icon"><Icon size={20} /></span>
              <span className="dashboard-content-block-copy"><strong>{block.title}</strong><small>{block.description}</small></span>
              <ArrowRight size={17} className="dashboard-content-block-arrow" />
            </button>;
          })}
        </div>
      </section>

      <section className="dashboard-late-arrivals" style={{ display: "none" }}>
        <div className="dashboard-late-arrivals-header">
          <div>
            <h2>Late Arrivals</h2>
            <p>Employees checked in after {attendanceSettings.lateAfter} ({attendanceSettings.timezone}).</p>
          </div>
          <button type="button" onClick={() => handleOverviewStatClick("late")}>
            View attendance details <ArrowRight size={16} />
          </button>
        </div>
        <div className="dashboard-modal-table-wrapper">
          <table className="dashboard-modal-table dashboard-late-arrivals-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Check-in Time</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {lateArrivals.length ? lateArrivals.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td className="employee-name-cell">{employee.name}</td>
                  <td>{employee.department || "Not provided"}</td>
                  <td>{formatTime(employee.checkIn)}</td>
                  <td><span className="employee-status status-late">Late Arrival</span></td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="dashboard-empty-message">No late arrivals today.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showBreakReasonModal && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => !isSubmittingAttendance && setShowBreakReasonModal(false)}
        >
          <form
            className="attendance-reason-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="break-reason-title"
            onSubmit={submitBreakReason}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="attendance-reason-heading">
              <h2 id="break-reason-title">Why are you taking a break?</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Cancel break"
                disabled={isSubmittingAttendance}
                onClick={() => setShowBreakReasonModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <label htmlFor="break-reason">Reason (required)</label>
            <textarea
              id="break-reason"
              value={breakReason}
              onChange={(event) => setBreakReason(event.target.value)}
              rows={4}
              required
              autoFocus
              disabled={isSubmittingAttendance}
              placeholder="Enter your break reason"
            />
            <div className="attendance-reason-actions">
              <button
                type="button"
                className="attendance-reason-cancel"
                disabled={isSubmittingAttendance}
                onClick={() => setShowBreakReasonModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="attendance-reason-submit" disabled={isSubmittingAttendance}>
                {isSubmittingAttendance ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEarlyCheckoutModal && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => !isSubmittingAttendance && setShowEarlyCheckoutModal(false)}
        >
          <form
            className="attendance-reason-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="early-checkout-title"
            onSubmit={submitEarlyCheckoutReason}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="attendance-reason-heading">
              <h2 id="early-checkout-title">Early Check-out</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Cancel check-out"
                disabled={isSubmittingAttendance}
                onClick={() => setShowEarlyCheckoutModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p>You are checking out before the official office end time. Please provide a reason for early check-out.</p>
            <label htmlFor="early-checkout-reason">Reason (required)</label>
            <textarea
              id="early-checkout-reason"
              value={earlyCheckoutReason}
              onChange={(event) => setEarlyCheckoutReason(event.target.value)}
              rows={4}
              required
              autoFocus
              disabled={isSubmittingAttendance}
              placeholder="Enter your early check-out reason"
            />
            <div className="attendance-reason-actions">
              <button
                type="button"
                className="attendance-reason-cancel"
                disabled={isSubmittingAttendance}
                onClick={() => {
                  setShowEarlyCheckoutModal(false);
                  setEarlyCheckoutReason("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="attendance-reason-submit" disabled={isSubmittingAttendance || !isCheckedIn || isCheckedOut}>
                {isSubmittingAttendance ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Retired dashboard calendar markup is kept unreachable to avoid changing the established CSS hooks. */}
      {showLegacyCalendar && (

      <section className="dashboard-calendar-card">

        <div className="dashboard-calendar-header">

          <div>
            <span className="dashboard-calendar-eyebrow">
              PLAN & SCHEDULE
            </span>

            <h2>Company Calendar</h2>

            <p>
              View upcoming holidays, meetings and employee events.
            </p>
          </div>

          <div className="dashboard-calendar-controls">

            <button
              type="button"
              onClick={goToCurrentMonth}
              className="calendar-today-btn"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => changeCalendarMonth(-1)}
              className="calendar-nav-btn"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => changeCalendarMonth(1)}
              className="calendar-nav-btn"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>

          </div>
        </div>

        <div className="dashboard-calendar-month">
          {calendarMonth.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </div>

        <div className="dashboard-calendar-layout">

          {/* CALENDAR GRID */}

          <div className="dashboard-calendar-grid">

            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day) => (
                <div className="calendar-weekday" key={day}>
                  {day}
                </div>
              )
            )}

            {calendarCells.map((day, index) => {

              if (!day) {
                return (
                  <div
                    className="calendar-day calendar-day-empty"
                    key={`empty-${index}`}
                  />
                );
              }

              const date = new Date(
                calendarYear,
                calendarMonthIndex,
                day
              );

              const dateKey = getLocalDateKey(date);

              const isToday =
                dateKey === getLocalDateKey(new Date());

              const isSelected =
                dateKey === selectedCalendarDate;

              const dayEvents = getEventsForDay(day);

              return (
                <button
                  type="button"
                  key={dateKey}
                  className={`calendar-day
                    ${isToday ? "calendar-day-today" : ""}
                    ${isSelected ? "calendar-day-selected" : ""}
                    ${dayEvents.length ? "calendar-day-has-event" : ""}
                  `}
                  onClick={() => setSelectedCalendarDate(dateKey)}
                >

                  <span>{day}</span>

                  {dayEvents.length > 0 && (
                    <span className="calendar-event-dots">

                      {dayEvents.slice(0, 3).map((event, eventIndex) => (
                        <i
                          key={`${event.title}-${eventIndex}`}
                          className={`calendar-dot calendar-dot-${event.type.toLowerCase()}`}
                        />
                      ))}

                    </span>
                  )}

                </button>
              );
            })}

          </div>

          {/* SELECTED DATE EVENTS */}

          <aside className="dashboard-calendar-agenda">

            <div className="calendar-agenda-heading">

              <div>
                <span>SELECTED DATE</span>

                <h3>
                  {new Date(
                    `${selectedCalendarDate}T00:00:00`
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>

              <CalendarDays size={20} />

            </div>

            {selectedDateEvents.length > 0 ? (

              <div className="calendar-event-list">

                {selectedDateEvents.map((event, index) => (

                  <div
                    className="calendar-event-item"
                    key={`${event.title}-${index}`}
                  >

                    <span
                      className={`calendar-event-type calendar-event-type-${event.type.toLowerCase()}`}
                    >
                      {event.type}
                    </span>

                    <h4>{event.title}</h4>

                    <p>{event.description}</p>

                  </div>

                ))}

              </div>

            ) : (

              <div className="calendar-no-events">
                <CalendarDays size={25} />
                <p>No events scheduled for this date.</p>
              </div>

            )}

          </aside>

        </div>

        {/* EVENT LEGEND */}

        <div className="dashboard-calendar-legend">

          <span>
            <i className="calendar-dot calendar-dot-holiday" />
            Holiday
          </span>

          <span>
            <i className="calendar-dot calendar-dot-meeting" />
            Meeting
          </span>

          <span>
            <i className="calendar-dot calendar-dot-event" />
            Event
          </span>

          <span>
            <i className="calendar-dot calendar-dot-birthday" />
            Birthday
          </span>

          <span>
            <i className="calendar-dot calendar-dot-reminder" />
            Reminder
          </span>

        </div>

      </section>
      )}

      {/* RECENT ACTIVITIES */}

      <section className="dashboard-activity-card" style={{ display: "none" }}>

        <div className="dashboard-activity-header">
          <div>
            <h2>Recent Activities</h2>
            <p>Click an activity to open its page.</p>
          </div>

          <CheckCircle size={21} />
        </div>

        <div className="dashboard-activity-list">

          {[].map((activity) => {
            const Icon = activity.icon;

            return (
              <button
                type="button"
                className="dashboard-activity-item"
                key={activity.id}
                onClick={() =>
                  navigate(activity.path)
                }
              >
                <div className="activity-icon">
                  <Icon size={19} />
                </div>

                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                </div>

                <span className="activity-time">
                  {activity.time}
                </span>

                <ArrowRight
                  className="activity-arrow"
                  size={17}
                />
              </button>
            );
          })}

        </div>

      </section>

      {/* EMPLOYEE / ROLE DETAILS POPUP */}

      {selectedView && (
        <div
          className="dashboard-modal-overlay"
          onClick={closeDetails}
        >
          <div
            className="dashboard-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-modal-title"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="dashboard-modal-header">

              <div>
                <h2 id="dashboard-modal-title">
                  {modalTitle[selectedView]}
                </h2>

                <p>
                  Showing {modalEmployees.length} employee records for {attendanceDate}.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDetails}
                aria-label="Close details"
              >
                <X size={21} />
              </button>

            </div>

            {/* EMPLOYEE TABLE */}

            <div className="dashboard-modal-table-wrapper">

              {modalEmployees.length > 0 ? (
                <table className="dashboard-modal-table">

                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Check-in Time</th>
                      <th>Check-out Time</th>
                      <th>Attendance Status</th>
                      <th>Early Check-out Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {modalEmployees.map((employee) => {
                      const status = employee.attendanceStatus || employee.status || "Absent";
                      const statusClass = status.toLowerCase().includes("late")
                        ? "status-late"
                        : status.toLowerCase().includes("absent")
                          ? "status-absent"
                          : status.toLowerCase().includes("leave")
                            ? "status-leave"
                            : "status-present";
                      return (
                        <tr key={employee.id}>
                          <td>{employee.id}</td>

                          <td className="employee-name-cell">{employee.name}</td>
                          <td>{employee.department || "Not provided"}</td>
                          <td>{formatTime(employee.checkIn)}</td>
                          <td>{formatTime(employee.checkOut)}</td>
                          <td><span className={`employee-status ${statusClass}`}>{status}</span></td>
                          <td>{employee.earlyCheckOutReason || "--"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="dashboard-empty-message">No employee records found.</p>
              )}

            </div>

            {/* POPUP FOOTER */}

            <div className="dashboard-modal-footer">
              <span>Attendance records are stored in this browser.</span>

              <button
                type="button"
                onClick={closeDetails}
                className="modal-done-btn"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
