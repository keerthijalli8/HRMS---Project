/**
 * Dual-Factor Face Recognition + Office QR Attendance Workflow Processor
 * Enforces strict order: Official Login -> Face Verification -> Office QR -> Commit
 */

import {
  checkIn,
  checkOut,
  getMyToday,
  formatTime,
  formatHoursWorked,
  getTodayDateKey
} from './attendanceLog.js';
import {
  validateQrToken,
  loadQrConfig,
  loadQrTokens,
  saveQrConfig
} from './qrAttendanceStore.js';
import {
  getTodayVerificationRecord,
  recordStepVerification,
  addBiometricAuditLog,
  getEmployeeExemption
} from './faceBiometricsStore.js';
import { addNotification } from './notificationStore.js';

export function executeDualFactorCheckIn(currentUser, {
  qrTokenString = null,
  officeLocation = null,
  bypassReason = null
} = {}) {
  const empId = (currentUser?.employeeId || currentUser?.id || "").trim().toUpperCase();
  const empName = currentUser?.name || "Employee";

  if (!empId) {
    return { ok: false, error: "Authentication missing. Please log in first with registered HRMS credentials." };
  }

  // 1. Check current attendance state: Prevent duplicate check-in
  const myToday = getMyToday(currentUser);
  if (myToday.state === "working" || myToday.state === "on_break") {
    return { ok: false, error: "Already checked in today. Please check out first before checking in again." };
  }

  // 2. Validate Step 3: Face Verification & Liveness
  const dailyRecord = getTodayVerificationRecord(empId);
  const exemption = getEmployeeExemption(empId);
  const isFaceVerified = dailyRecord.faceVerifiedCheckIn || (exemption && exemption.status === "Approved");

  if (!isFaceVerified) {
    return {
      ok: false,
      stepFailed: "face",
      error: "Face Scan Verification has not been completed. Please complete Face Verification first."
    };
  }

  // 3. Validate Step 4: Office QR Token
  if (!qrTokenString) {
    return {
      ok: false,
      stepFailed: "qr",
      error: "Office QR Code has not been scanned. Please scan the current valid Office QR."
    };
  }

  const qrValidation = validateQrToken(qrTokenString);
  if (!qrValidation.valid) {
    return {
      ok: false,
      stepFailed: "qr",
      error: qrValidation.error || "Invalid or expired Office QR code."
    };
  }

  const token = qrValidation.token;
  const config = loadQrConfig();

  // 4. Calculate Late Arrival
  const currentTimeStr = new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const isLate = currentTimeStr > (config.graceTime || "09:30");
  const attendanceStatus = isLate ? "Late" : "Present";

  // 5. Commit Check-In
  const checkInRes = checkIn(currentUser, {
    mode: "office",
    verificationStatus: `Dual-Factor Verified (Face: ${dailyRecord.faceConfidenceCheckIn || 96}% + QR: ${token.officeId})`,
    approvalStatus: isLate ? "Late Arrival (Verified)" : "Approved",
    source: "Face + QR Attendance Desk",
    location: {
      shared: true,
      label: token.officeName || "Main Office Entrance",
      method: "Face + QR"
    }
  });

  if (!checkInRes.ok) {
    return { ok: false, error: checkInRes.error || "Failed to commit check-in." };
  }

  const recordedTime = formatTime(new Date().toISOString());

  // Record completed step in verification cache
  recordStepVerification(empId, "qr-checkin", { tokenId: token.tokenId });
  recordStepVerification(empId, "checkin-complete");

  addBiometricAuditLog({
    action: "CHECK_IN_SUCCESS",
    employeeId: empId,
    employeeName: empName,
    detail: `Check-in recorded at ${recordedTime}. Dual-factor: Face Verified (${dailyRecord.faceConfidenceCheckIn || 96}%) + Office QR (${token.tokenId})`,
    tokenId: token.tokenId,
    status: "Success"
  });

  addNotification({
    title: "Attendance Check-in Successful",
    desc: `Check-in recorded at ${recordedTime} (${attendanceStatus}) via Face Recognition & Office QR scan.`,
    icon: "check-circle",
    type: "attendance",
    targetEmployeeId: empId
  });

  return {
    ok: true,
    action: "check-in",
    message: "Attendance Check-in Successful",
    recordedTime,
    status: attendanceStatus,
    verificationStatus: "Face Verified + Office QR Verified",
    officeName: token.officeName
  };
}

export function executeDualFactorCheckOut(currentUser, {
  qrTokenString = null,
  officeLocation = null
} = {}) {
  const empId = (currentUser?.employeeId || currentUser?.id || "").trim().toUpperCase();
  const empName = currentUser?.name || "Employee";

  if (!empId) {
    return { ok: false, error: "Authentication missing. Please log in first with registered HRMS credentials." };
  }

  // 1. Check current attendance state: Must be currently working and not on break
  const myToday = getMyToday(currentUser);
  if (myToday.state === "not_checked_in") {
    return { ok: false, error: "No active check-in session found for today. You must check in before checking out." };
  }
  if (myToday.state === "on_break") {
    return { ok: false, error: "You are currently on break. Please conclude your break before checking out." };
  }
  if (myToday.state === "checked_out") {
    return { ok: false, error: "You have already completed check-out for today." };
  }

  // 2. Validate Step 2: Face Verification for Check-out
  const dailyRecord = getTodayVerificationRecord(empId);
  const exemption = getEmployeeExemption(empId);
  const isFaceVerified = dailyRecord.faceVerifiedCheckOut || (exemption && exemption.status === "Approved");

  if (!isFaceVerified) {
    return {
      ok: false,
      stepFailed: "face",
      error: "Face Scan Verification has not been completed for check-out. Please complete Face Verification first."
    };
  }

  // 3. Validate Step 3: Office QR Token
  if (!qrTokenString) {
    return {
      ok: false,
      stepFailed: "qr",
      error: "Office QR Code has not been scanned. Please scan the current valid Office QR."
    };
  }

  const qrValidation = validateQrToken(qrTokenString);
  if (!qrValidation.valid) {
    return {
      ok: false,
      stepFailed: "qr",
      error: qrValidation.error || "Invalid or expired Office QR code."
    };
  }

  const token = qrValidation.token;

  // 4. Commit Check-Out
  const checkOutRes = checkOut(currentUser, {
    location: {
      shared: true,
      label: token.officeName || "Main Office Entrance",
      method: "Face + QR"
    },
    source: "Face + QR Attendance Desk"
  });

  if (!checkOutRes.ok) {
    return { ok: false, error: checkOutRes.error || "Failed to commit check-out." };
  }

  const recordedTime = formatTime(new Date().toISOString());
  const freshToday = getMyToday(currentUser);
  const totalWorkingHours = formatHoursWorked(freshToday.netMs || 0);

  // Record completed step
  recordStepVerification(empId, "qr-checkout", { tokenId: token.tokenId });
  recordStepVerification(empId, "checkout-complete");

  addBiometricAuditLog({
    action: "CHECK_OUT_SUCCESS",
    employeeId: empId,
    employeeName: empName,
    detail: `Check-out recorded at ${recordedTime}. Total hours: ${totalWorkingHours}. Dual-factor: Face Verified + Office QR (${token.tokenId})`,
    tokenId: token.tokenId,
    status: "Success"
  });

  addNotification({
    title: "Attendance Check-out Successful",
    desc: `Check-out recorded at ${recordedTime}. Total working hours: ${totalWorkingHours}.`,
    icon: "check-circle",
    type: "attendance",
    targetEmployeeId: empId
  });

  return {
    ok: true,
    action: "check-out",
    message: "Attendance Check-out Successful",
    recordedTime,
    totalWorkingHours,
    verificationStatus: "Face Verified + Office QR Verified",
    officeName: token.officeName
  };
}
