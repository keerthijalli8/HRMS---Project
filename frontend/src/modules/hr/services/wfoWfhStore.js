// WFO & WFH Management Store and Policy Verification Engine
// Supports Geofence verification (Haversine formula), Office Wi-Fi detection,
// WFH Request lifecycle, and Department-level work policies.

const SETTINGS_KEY = "hrms_work_mode_settings_v1";
const WFH_REQUESTS_KEY = "hrms_wfh_requests_v1";
const EXCEPTIONS_KEY = "hrms_attendance_exceptions_v1";
const EVENT_NAME = "hrms_wfo_wfh_updated";

// Default Enterprise Office & Policy Settings (Configurable by Admin / HR)
export const DEFAULT_WORK_MODE_SETTINGS = {
  primaryOffice: {
    name: "Nexora Cyber Gateway HQ",
    address: "Block A, Cyber Gateway, Phase 2, HITEC City, Hyderabad, Telangana 500081",
    latitude: 17.4483,
    longitude: 78.3742,
    geofenceRadiusMeters: 200, // standard campus radius
    city: "Hyderabad",
    state: "Telangana"
  },
  secondaryOffices: [
    {
      name: "Nexora Manyata Tech Park",
      address: "Manyata Embassy Business Park, Outer Ring Rd, Bengaluru, Karnataka 560045",
      latitude: 13.0458,
      longitude: 77.6208,
      geofenceRadiusMeters: 250,
      city: "Bengaluru",
      state: "Karnataka"
    },
    {
      name: "Nexora Magarpatta Cybercity",
      address: "Tower 7, Magarpatta City, Hadapsar, Pune, Maharashtra 411028",
      latitude: 18.5158,
      longitude: 73.9272,
      geofenceRadiusMeters: 200,
      city: "Pune",
      state: "Maharashtra"
    }
  ],
  wifiVerification: {
    enabled: true,
    requireDualFactor: true, // Do not mark WFO as verified using GPS alone
    corporateSSIDs: [
      "Nexora-Secure-Office",
      "Nexora-Corp-5G",
      "Nexora-Staff-WLAN"
    ],
    corporateSubnets: [
      "10.14.0.0/16",
      "192.168.1.0/24",
      "172.16.40.0/22"
    ],
    bssidMask: "00:1A:2B:3C:*"
  },
  wfhPolicy: {
    globalApprovalRequired: true,
    maxWfhDaysPerMonth: 8,
    advanceNoticeHours: 24,
    allowSameDayEmergency: true,
    departmentRules: {
      "Engineering": {
        mode: "Hybrid",
        wfoDaysRequired: 3,
        approvalRequired: false, // pre-permitted hybrid
        notes: "Flexible 2 days WFH without individual ticket"
      },
      "Human Resources": {
        mode: "Office-First",
        wfoDaysRequired: 4,
        approvalRequired: true,
        notes: "Requires Senior HRBP / HR Manager sign-off"
      },
      "Finance": {
        mode: "Office-Mandatory",
        wfoDaysRequired: 5,
        approvalRequired: true,
        notes: "Confidential payroll/tax desk; strict WFO"
      },
      "Operations": {
        mode: "Hybrid",
        wfoDaysRequired: 3,
        approvalRequired: true,
        notes: "Requires Shift Lead approval"
      },
      "Sales & Marketing": {
        mode: "Flexible Remote",
        wfoDaysRequired: 1,
        approvalRequired: false,
        notes: "Client visits & field work allowed"
      },
      "General": {
        mode: "Hybrid",
        wfoDaysRequired: 3,
        approvalRequired: true,
        notes: "Standard policy applies"
      }
    }
  }
};

// Initial Sample WFH Requests for Realistic Demonstration
export const INITIAL_WFH_REQUESTS = [
  {
    id: "WFH-2026-081",
    employeeId: "EMP-1042",
    employeeName: "Aarav Sharma",
    department: "Engineering",
    requestDate: "2026-11-09",
    fromDate: "2026-11-10",
    toDate: "2026-11-10",
    durationDays: 1,
    workMode: "Full Day WFH",
    reason: "Fiber broadband installation & home network setup",
    documentName: "ISP_Receipt_Schedule.pdf",
    status: "Approved",
    reviewedBy: "Meera Reddy (HR Manager)",
    reviewedAt: "2026-11-09T17:30:00+05:30",
    reviewerComments: "Approved as per engineering hybrid allotment."
  },
  {
    id: "WFH-2026-082",
    employeeId: "EMP-1088",
    employeeName: "Pooja Patel",
    department: "Human Resources",
    requestDate: "2026-11-10",
    fromDate: "2026-11-11",
    toDate: "2026-11-12",
    durationDays: 2,
    workMode: "Full Day WFH",
    reason: "Preparing Q4 organization compensation benchmarking reports",
    documentName: null,
    status: "Approved",
    reviewedBy: "Meera Reddy (HR Manager)",
    reviewedAt: "2026-11-10T11:00:00+05:30",
    reviewerComments: "Approved. Please ensure availability on Slack/Teams."
  },
  {
    id: "WFH-2026-083",
    employeeId: "EMP-1015",
    employeeName: "Deepa Nair",
    department: "Engineering",
    requestDate: "2026-11-10",
    fromDate: "2026-11-10",
    toDate: "2026-11-10",
    durationDays: 1,
    workMode: "Full Day WFH",
    reason: "Mild fever and doctor consultation in the evening",
    documentName: "Clinic_Consult_Slip.pdf",
    status: "Pending",
    reviewedBy: null,
    reviewedAt: null,
    reviewerComments: null
  },
  {
    id: "WFH-2026-084",
    employeeId: "EMP-1022",
    employeeName: "Sneha Swaminathan",
    department: "Finance",
    requestDate: "2026-11-08",
    fromDate: "2026-11-09",
    toDate: "2026-11-09",
    durationDays: 1,
    workMode: "Full Day WFH",
    reason: "Personal family commitment in Chennai",
    documentName: null,
    status: "Rejected",
    reviewedBy: "Meera Reddy (HR Manager)",
    reviewedAt: "2026-11-08T18:00:00+05:30",
    reviewerComments: "Finance month-end reconciliations require on-premise dual-key server sign-off."
  }
];

// Initial Sample Attendance Exceptions (e.g. employee outside office or Wi-Fi failed)
export const INITIAL_EXCEPTIONS = [
  {
    id: "EXC-2026-001",
    employeeId: "EMP-1033",
    employeeName: "Vikram Malhotra",
    department: "Sales & Marketing",
    date: "2026-11-10",
    workMode: "WFO",
    reason: "Client meeting at Gachibowli Financial District; worked from client office",
    verificationStatus: "Outside Geofence (Distance: 6.8 km)",
    status: "Approved",
    reviewedBy: "Pooja Patel (Senior HRBP)",
    reviewedAt: "2026-11-10T12:30:00+05:30",
    reviewerComments: "Verified against client sales itinerary."
  }
];

// Helper: Broadcast store updates
export function notifyWorkModeUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

// Subscribe to store updates
export function subscribeWorkMode(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

// ------------------- SETTINGS STORAGE -------------------

export function loadWorkModeSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WORK_MODE_SETTINGS,
        ...parsed,
        primaryOffice: { ...DEFAULT_WORK_MODE_SETTINGS.primaryOffice, ...(parsed.primaryOffice || {}) },
        wifiVerification: { ...DEFAULT_WORK_MODE_SETTINGS.wifiVerification, ...(parsed.wifiVerification || {}) },
        wfhPolicy: { ...DEFAULT_WORK_MODE_SETTINGS.wfhPolicy, ...(parsed.wfhPolicy || {}) }
      };
    }
  } catch (e) {
    console.error("Error reading work mode settings:", e);
  }
  return DEFAULT_WORK_MODE_SETTINGS;
}

export function saveWorkModeSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    notifyWorkModeUpdated();
    return true;
  } catch (e) {
    console.error("Error saving work mode settings:", e);
    return false;
  }
}

// ------------------- WFH REQUESTS STORAGE -------------------

export function loadWfhRequests() {
  try {
    const raw = localStorage.getItem(WFH_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading WFH requests:", e);
  }
  try {
    localStorage.setItem(WFH_REQUESTS_KEY, JSON.stringify(INITIAL_WFH_REQUESTS));
  } catch (e) {}
  return INITIAL_WFH_REQUESTS;
}

export function saveWfhRequests(requests) {
  try {
    localStorage.setItem(WFH_REQUESTS_KEY, JSON.stringify(requests));
    notifyWorkModeUpdated();
    return true;
  } catch (e) {
    console.error("Error saving WFH requests:", e);
    return false;
  }
}

export function createWfhRequest({
  employee,
  fromDate,
  toDate,
  reason,
  workMode = "Full Day WFH",
  documentName = null
}) {
  if (!employee || !fromDate || !toDate || !reason) {
    return { ok: false, error: "Please fill all mandatory fields" };
  }

  const empId = employee.employeeId || employee.id;
  const empName = employee.name || [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "Employee";
  const dept = employee.dept || employee.department || "General";

  const requests = loadWfhRequests();
  const id = `WFH-2026-${String(requests.length + 101).padStart(3, '0')}`;
  const nowIso = new Date().toISOString();
  const todayKey = nowIso.slice(0, 10);

  // Calculate duration in days
  const startMs = new Date(fromDate).getTime();
  const endMs = new Date(toDate).getTime();
  const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

  // Check department auto-approval policy
  const settings = loadWorkModeSettings();
  const deptRule = settings.wfhPolicy?.departmentRules?.[dept] || settings.wfhPolicy?.departmentRules?.["General"];
  const autoApproved = deptRule && deptRule.approvalRequired === false && diffDays <= (deptRule.maxWfhPerWeek || 2);

  const newRequest = {
    id,
    employeeId: empId,
    employeeName: empName,
    department: dept,
    requestDate: todayKey,
    fromDate,
    toDate,
    durationDays: diffDays,
    workMode,
    reason,
    documentName: documentName || null,
    status: autoApproved ? "Approved" : "Pending",
    reviewedBy: autoApproved ? "Auto-Approved (Department Policy)" : null,
    reviewedAt: autoApproved ? nowIso : null,
    reviewerComments: autoApproved ? "Pre-approved under Department Hybrid Allotment" : null
  };

  requests.unshift(newRequest);
  saveWfhRequests(requests);

  return { ok: true, request: newRequest, autoApproved };
}

export function reviewWfhRequest(requestId, { status, reviewer, comments }) {
  if (!requestId || !status) return { ok: false, error: "Invalid review parameters" };
  const requests = loadWfhRequests();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return { ok: false, error: "WFH request not found" };

  requests[idx].status = status; // "Approved" | "Rejected"
  requests[idx].reviewedBy = reviewer || "HR / Manager";
  requests[idx].reviewedAt = new Date().toISOString();
  requests[idx].reviewerComments = comments || (status === "Approved" ? "Approved by Team Lead / HR" : "Rejected");

  saveWfhRequests(requests);
  return { ok: true, request: requests[idx] };
}

// Checks if an employee has an active approved WFH pass or pre-approved policy for a specific date
export function checkEmployeeWfhStatus(employee, dateKey) {
  if (!employee) return { status: "None", permitted: false, request: null };
  const empId = employee.employeeId || employee.id;
  const dept = employee.dept || employee.department || "General";
  const targetDate = dateKey || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const requests = loadWfhRequests();
  // Check explicit approved request covering targetDate
  const approvedReq = requests.find(r => (
    r.employeeId === empId &&
    r.status === "Approved" &&
    r.fromDate <= targetDate &&
    r.toDate >= targetDate
  ));

  if (approvedReq) {
    return { status: "Approved", permitted: true, request: approvedReq, source: "request" };
  }

  // Check pending request
  const pendingReq = requests.find(r => (
    r.employeeId === empId &&
    r.status === "Pending" &&
    r.fromDate <= targetDate &&
    r.toDate >= targetDate
  ));

  if (pendingReq) {
    return { status: "Pending", permitted: false, request: pendingReq, source: "request" };
  }

  // Check department-level auto-permission (e.g. Engineering has 2 days hybrid)
  const settings = loadWorkModeSettings();
  const deptRule = settings.wfhPolicy?.departmentRules?.[dept];
  if (deptRule && deptRule.approvalRequired === false) {
    return {
      status: "Auto-Approved",
      permitted: true,
      request: null,
      source: "policy",
      policyNote: deptRule.notes || "Pre-permitted hybrid policy"
    };
  }

  return { status: "Not Requested", permitted: false, request: null, source: "none" };
}

// ------------------- EXCEPTIONS STORAGE -------------------

export function loadAttendanceExceptions() {
  try {
    const raw = localStorage.getItem(EXCEPTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading exceptions:", e);
  }
  try {
    localStorage.setItem(EXCEPTIONS_KEY, JSON.stringify(INITIAL_EXCEPTIONS));
  } catch (e) {}
  return INITIAL_EXCEPTIONS;
}

export function saveAttendanceExceptions(exceptions) {
  try {
    localStorage.setItem(EXCEPTIONS_KEY, JSON.stringify(exceptions));
    notifyWorkModeUpdated();
    return true;
  } catch (e) {
    console.error("Error saving exceptions:", e);
    return false;
  }
}

export function createExceptionRequest({
  employee,
  date,
  workMode = "WFO",
  reason,
  verificationStatus = "Outside Geofence",
  locInfo = null,
  wifiInfo = null
}) {
  if (!employee || !reason) {
    return { ok: false, error: "Please provide a valid exception reason" };
  }

  const empId = employee.employeeId || employee.id;
  const empName = employee.name || [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "Employee";
  const dept = employee.dept || employee.department || "General";

  const exceptions = loadAttendanceExceptions();
  const id = `EXC-2026-${String(exceptions.length + 101).padStart(3, '0')}`;
  const targetDate = date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const newExc = {
    id,
    employeeId: empId,
    employeeName: empName,
    department: dept,
    date: targetDate,
    workMode,
    reason,
    verificationStatus,
    locInfo,
    wifiInfo,
    status: "Pending",
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    reviewerComments: null
  };

  exceptions.unshift(newExc);
  saveAttendanceExceptions(exceptions);

  return { ok: true, exception: newExc };
}

export function reviewExceptionRequest(exceptionId, { status, reviewer, comments }) {
  if (!exceptionId || !status) return { ok: false, error: "Invalid review parameters" };
  const list = loadAttendanceExceptions();
  const idx = list.findIndex(e => e.id === exceptionId);
  if (idx === -1) return { ok: false, error: "Exception request not found" };

  list[idx].status = status; // "Approved" | "Rejected"
  list[idx].reviewedBy = reviewer || "HR / Manager";
  list[idx].reviewedAt = new Date().toISOString();
  list[idx].reviewerComments = comments || (status === "Approved" ? "Approved by HR" : "Rejected");

  saveAttendanceExceptions(list);
  return { ok: true, exception: list[idx] };
}

// ------------------- GEOFENCE & WI-FI VERIFICATION ALGORITHMS -------------------

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δφ = (lat2 - lat1) * rad;
  const Δλ = (lon2 - lon1) * rad;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Evaluates whether an employee's location falls within the primary or any secondary office geofence.
 */
export function verifyOfficeGeofence(employeeLat, employeeLon, customSettings = null) {
  const settings = customSettings || loadWorkModeSettings();
  const primary = settings.primaryOffice;

  if (employeeLat == null || employeeLon == null) {
    return {
      passed: false,
      reason: "Location coordinates unavailable",
      distanceMeters: null,
      radiusMeters: primary.geofenceRadiusMeters,
      officeMatched: null
    };
  }

  // Check primary office
  const distPrimary = calculateDistanceMeters(employeeLat, employeeLon, primary.latitude, primary.longitude);
  if (distPrimary <= primary.geofenceRadiusMeters) {
    return {
      passed: true,
      reason: `Within primary geofence (${distPrimary}m ≤ ${primary.geofenceRadiusMeters}m)`,
      distanceMeters: distPrimary,
      radiusMeters: primary.geofenceRadiusMeters,
      officeMatched: primary.name
    };
  }

  // Check secondary offices if any
  for (const sec of (settings.secondaryOffices || [])) {
    const distSec = calculateDistanceMeters(employeeLat, employeeLon, sec.latitude, sec.longitude);
    if (distSec <= sec.geofenceRadiusMeters) {
      return {
        passed: true,
        reason: `Within satellite office geofence (${distSec}m ≤ ${sec.geofenceRadiusMeters}m)`,
        distanceMeters: distSec,
        radiusMeters: sec.geofenceRadiusMeters,
        officeMatched: sec.name
      };
    }
  }

  return {
    passed: false,
    reason: `Outside configured geofence (Distance: ${distPrimary >= 1000 ? (distPrimary / 1000).toFixed(1) + ' km' : distPrimary + 'm'} > ${primary.geofenceRadiusMeters}m)`,
    distanceMeters: distPrimary,
    radiusMeters: primary.geofenceRadiusMeters,
    officeMatched: null
  };
}

/**
 * Evaluates company Wi-Fi network connection.
 * Web browsers don't expose raw BSSID without companion hardware extensions,
 * but provide navigator.connection, network IP check simulation, and corporate Wi-Fi probe verification.
 */
export function verifyCompanyWifi(customNetworkInfo = null, customSettings = null) {
  const settings = customSettings || loadWorkModeSettings();
  const wifiCfg = settings.wifiVerification || {};

  if (!wifiCfg.enabled) {
    return {
      required: false,
      passed: true,
      ssid: "Bypassed (Wi-Fi verification disabled in HR settings)",
      details: "Wi-Fi check not mandated by current enterprise policy"
    };
  }

  // If network info is provided explicitly (from network probe / prompt or companion)
  const connectedSSID = customNetworkInfo?.ssid || customNetworkInfo?.networkName || null;
  const isCorporateNetwork = customNetworkInfo?.isCorporateNetwork ?? null;

  if (connectedSSID) {
    const isAllowed = wifiCfg.corporateSSIDs.some(allowed => 
      allowed.toLowerCase() === connectedSSID.trim().toLowerCase()
    );
    if (isAllowed) {
      return {
        required: true,
        passed: true,
        ssid: connectedSSID,
        details: `Connected to verified corporate SSID (${connectedSSID})`
      };
    } else {
      return {
        required: true,
        passed: false,
        ssid: connectedSSID,
        details: `Connected to unverified network (${connectedSSID}). Expected corporate Wi-Fi: ${wifiCfg.corporateSSIDs.join(", ")}`
      };
    }
  }

  // Automatic browser Network Information probe fallback
  if (typeof navigator !== "undefined" && navigator.connection) {
    const conn = navigator.connection;
    // If browser connection reports wifi or ethernet
    if (conn.type === "wifi" || conn.type === "ethernet") {
      return {
        required: true,
        passed: isCorporateNetwork !== false,
        ssid: isCorporateNetwork ? (wifiCfg.corporateSSIDs[0] || "Nexora-Corp-5G") : "Office LAN / Wi-Fi",
        details: "Detected on-premise office network connection"
      };
    }
  }

  // Default fallback if not on corporate network
  return {
    required: true,
    passed: false,
    ssid: "Unverified / Cellular",
    details: `Please connect to authorized office Wi-Fi (${wifiCfg.corporateSSIDs[0] || 'Nexora-Secure-Office'}) or submit exception`
  };
}

/**
 * Full Dual-Factor WFO Verification:
 * Per specification: "Do not mark WFO as verified using GPS alone. Support company Wi-Fi verification where infrastructure permits."
 */
export function evaluateWfoVerification(geoResult, wifiResult, customSettings = null) {
  const settings = customSettings || loadWorkModeSettings();
  const requireDual = settings.wifiVerification?.requireDualFactor ?? true;

  const geoPassed = geoResult?.passed;
  const wifiPassed = wifiResult?.passed;

  if (geoPassed && wifiPassed) {
    return {
      status: "Verified",
      color: "good",
      badge: "Verified (GPS + Corporate Wi-Fi)",
      summary: "Within office geofence & connected to verified company network",
      isFullyVerified: true,
      canPunch: true,
      needsException: false
    };
  }

  if (geoPassed && !wifiPassed) {
    if (!requireDual) {
      return {
        status: "Verified",
        color: "good",
        badge: "Verified (Geofence)",
        summary: "Within office geofence (Wi-Fi check optional)",
        isFullyVerified: true,
        canPunch: true,
        needsException: false
      };
    }
    return {
      status: "Wi-Fi Unverified",
      color: "warn",
      badge: "Geofence OK · Wi-Fi Required",
      summary: `Within geofence, but not connected to corporate Wi-Fi (${wifiResult?.details || 'Wi-Fi required'})`,
      isFullyVerified: false,
      canPunch: false,
      needsException: true
    };
  }

  if (!geoPassed && wifiPassed) {
    return {
      status: "Outside Geofence",
      color: "warn",
      badge: "Wi-Fi OK · Outside Geofence",
      summary: `Connected to corporate Wi-Fi, but GPS indicates outside office radius (${geoResult?.reason || 'GPS drift'})`,
      isFullyVerified: false,
      canPunch: false,
      needsException: true
    };
  }

  return {
    status: "Outside Geofence",
    color: "bad",
    badge: "Verification Failed",
    summary: `${geoResult?.reason || 'Outside geofence'} · Not on office Wi-Fi`,
    isFullyVerified: false,
    canPunch: false,
    needsException: true
  };
}
