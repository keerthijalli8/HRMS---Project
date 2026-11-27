import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceService } from '../services/attendanceService.js';
import { attendanceRules } from '../config/attendanceRules.js';
import { evaluateDay, timeStringToMinutes } from '../utils/attendanceEngine.js';
import { useTick } from '../hooks/useTick.js';
import CheckoutConfirmDrawer from '../components/attendance/CheckoutConfirmDrawer.jsx';

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children, onTriggerToast }) {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [regularisations, setRegularisations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preferredWorkMode, setPreferredWorkMode] = useState('Office');
  const [checkoutConfirm, setCheckoutConfirm] = useState({
    isOpen: false,
    earlyMin: 0,
    isImmediate: false,
  });

  // Live timer tick every 1000ms
  const currentTimestamp = useTick(1000);

  // Load state from attendanceService / localStorage
  const loadData = useCallback(async () => {
    try {
      const [todayRecord, monthData, regList] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.getMonth(2026, 11),
        attendanceService.listRegularisations(),
      ]);
      setToday(todayRecord);
      setHistory(monthData);
      setRegularisations(regList);
    } catch (err) {
      console.error('Failed to load attendance data in AttendanceProvider:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Multi-tab sync via storage events
    const handleStorageChange = (e) => {
      if (e.key === 'hrms_my_attendance') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadData]);

  // Derived current day states
  const isCheckedIn = Boolean(today?.checkIn);
  const isCheckedOut = Boolean(today?.checkOut);
  const onBreak = Boolean(today?.activeBreak);

  // Compute live current minutes in IST for in-progress day
  const nowMinutes = useMemo(() => {
    // Simulated time or real clock
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [currentTimestamp]);

  // Evaluated record for today
  const evaluatedToday = useMemo(() => {
    if (!today) return null;
    return evaluateDay(today, attendanceRules, { nowMinutes, isPastDay: false });
  }, [today, nowMinutes]);

  // Live Net Milliseconds working today (ticks reactively every second via currentTimestamp)
  const liveNetMs = useMemo(() => {
    if (!today || !today.checkIn) return 0;
    if (isCheckedOut) {
      return evaluatedToday?.netMs || 0;
    }

    const now = new Date(currentTimestamp);
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let grossMs = 0;
    if (today.checkInTimeMs) {
      grossMs = Math.max(0, currentTimestamp - today.checkInTimeMs);
    } else {
      const checkInMin = timeStringToMinutes(today.checkIn);
      const checkInSec = checkInMin * 60;
      if (nowSec >= checkInSec) {
        grossMs = (nowSec - checkInSec) * 1000;
      } else {
        // In case of any desync or test clock difference, clamp to 0
        grossMs = 0;
      }
    }

    // Completed breaks total
    const completedBreaksMs = (today.breaks || []).reduce((acc, b) => acc + (b.durationMin || 0) * 60 * 1000, 0);

    // Active break duration if currently on break
    let currentActiveBreakMs = 0;
    if (today.activeBreak) {
      const bStartMin = timeStringToMinutes(today.activeBreak.start);
      const bStartSec = bStartMin * 60;
      currentActiveBreakMs = Math.max(0, (nowSec - bStartSec) * 1000);
    }

    return Math.max(0, grossMs - completedBreaksMs - currentActiveBreakMs);
  }, [today, isCheckedOut, currentTimestamp, evaluatedToday]);

  // Live active break duration (ticks every second)
  const activeBreakDurationMs = useMemo(() => {
    if (!today?.activeBreak) return 0;
    const now = new Date(currentTimestamp);
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const startMin = timeStringToMinutes(today.activeBreak.start);
    const startSec = startMin * 60;
    return Math.max(0, (nowSec - startSec) * 1000);
  }, [today?.activeBreak, currentTimestamp]);

  // Actions
  const handleCheckIn = async (payload = {}) => {
    if (today?.checkIn || today?.checkOut) {
      onTriggerToast?.('Daily check-in limit reached: only 1 check-in per day is permitted.');
      return today;
    }
    try {
      const updated = await attendanceService.checkIn({
        workMode: preferredWorkMode,
        ...payload,
      });
      setToday(updated);
      await loadData();
      if (onTriggerToast && updated?.checkIn) {
        const inMin = timeStringToMinutes(updated.checkIn);
        const cutoffMin = timeStringToMinutes(attendanceRules.lateCutoffTime);
        if (inMin > cutoffMin) {
          onTriggerToast(`Checked in at ${updated.checkIn} (Late by ${inMin - timeStringToMinutes(attendanceRules.shift.startTime)}m) · GPS Verified.`);
        } else {
          onTriggerToast(`Checked in at ${updated.checkIn} · On time · GPS Verified.`);
        }
      }
      return updated;
    } catch (err) {
      onTriggerToast?.(err.message || 'Check-in not allowed more than once per day.');
      return null;
    }
  };

  const handleStartBreak = async (type = 'Lunch', startTime) => {
    const updated = await attendanceService.startBreak(type, startTime);
    setToday(updated);
    await loadData();
    return updated;
  };

  const handleEndBreak = async (endTime) => {
    const updated = await attendanceService.endBreak(endTime);
    setToday(updated);
    await loadData();
    return updated;
  };

  const handleCheckOut = async (payload = {}) => {
    const updated = await attendanceService.checkOut(payload);
    setToday(updated);
    await loadData();
    if (onTriggerToast && updated?.checkOut) {
      onTriggerToast(
        payload?.earlyReason
          ? `Checked out early at ${updated.checkOut} · Reason: ${payload.earlyReason}`
          : `Checked out at ${updated.checkOut} · Shift completed.`
      );
    }
    return updated;
  };

  // Initiates checkout and requires reason if leaving early (before 18:15 cutoff or under 8h goal)
  const requestCheckOut = () => {
    if (!today?.checkIn) return;
    const nowStr = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const nowMin = timeStringToMinutes(nowStr);
    const inMin = timeStringToMinutes(today.checkIn);
    const shiftEndMin = timeStringToMinutes(attendanceRules.shift?.endTime || '18:30');
    const earlyCutoff = timeStringToMinutes(attendanceRules.earlyDepartureCutoffTime || '18:15');

    // Calculate net worked duration so far
    const workedMinFromMs = liveNetMs > 0 ? Math.floor(liveNetMs / 60000) : Math.max(0, nowMin - inMin);
    const fullDayMinutes = (attendanceRules.fullDayMinHours || 8) * 60; // 480 min (8h standard work goal)

    // Early departure is triggered if checking out before 18:15 OR net work hours is less than 8 hours
    const isEarly = nowMin < earlyCutoff || workedMinFromMs < fullDayMinutes;

    if (isEarly) {
      const earlyDiff = nowMin < earlyCutoff
        ? Math.max(1, shiftEndMin - nowMin)
        : Math.max(1, fullDayMinutes - workedMinFromMs);

      setCheckoutConfirm({
        isOpen: true,
        earlyMin: earlyDiff,
        isImmediate: nowMin - inMin < 5 || workedMinFromMs < 5,
      });
      return;
    }

    handleCheckOut({ time: nowStr });
  };

  const handleUndoCheckOut = async () => {
    const updated = await attendanceService.undoCheckOut();
    setToday(updated);
    await loadData();
    onTriggerToast?.('Check-out cancelled. Resumed active check-in for today.');
    return updated;
  };

  const handleUndoCheckIn = async () => {
    const updated = await attendanceService.undoCheckIn();
    setToday(updated);
    await loadData();
    onTriggerToast?.("Today's check-in has been reset. You can check in again.");
    return updated;
  };

  const handleRegularise = async (payload) => {
    const created = await attendanceService.regularise(payload);
    await loadData();
    return created;
  };

  const handleWithdrawRegularisation = async (id) => {
    await attendanceService.withdrawRegularisation(id);
    await loadData();
  };

  return (
    <AttendanceContext.Provider
      value={{
        today,
        history,
        regularisations,
        isLoading,
        isCheckedIn,
        isCheckedOut,
        onBreak,
        activeBreakDurationMs,
        liveNetMs,
        evaluatedToday,
        currentTimestamp,
        checkIn: handleCheckIn,
        undoCheckIn: handleUndoCheckIn,
        startBreak: handleStartBreak,
        endBreak: handleEndBreak,
        checkOut: handleCheckOut,
        requestCheckOut,
        undoCheckOut: handleUndoCheckOut,
        regularise: handleRegularise,
        withdrawRegularisation: handleWithdrawRegularisation,
        refreshData: loadData,
        attendanceRules,
        preferredWorkMode,
        setPreferredWorkMode,
      }}
    >
      {children}
      <CheckoutConfirmDrawer
        isOpen={checkoutConfirm.isOpen}
        onClose={() => setCheckoutConfirm((prev) => ({ ...prev, isOpen: false }))}
        earlyMin={checkoutConfirm.earlyMin}
        isImmediateCheckout={checkoutConfirm.isImmediate}
        onConfirmCheckout={(earlyReason) => {
          const nowStr = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          });
          handleCheckOut({ time: nowStr, earlyReason });
        }}
      />
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}

