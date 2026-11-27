// src/context/AttendanceContext.jsx
// Manages live attendance state, punch operations, multi-tab sync, and real-time net/gross tick calculations.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { attendanceService } from '../services/attendanceService.js';
import { evaluateDay, timeToMinutes } from '../utils/attendanceEngine.js';
import { ATTENDANCE_RULES } from '../config/attendanceRules.js';

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nowDate, setNowDate] = useState(() => new Date());

  // Helper: getNow() ensuring simulated time or actual device time
  const getNow = useCallback(() => {
    return new Date();
  }, []);

  // Tick every 1000ms for live timer and net calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial today record
  const refreshToday = useCallback(async () => {
    const data = await attendanceService.getToday();
    setTodayData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  // Sync across browser tabs via storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'hrms_emp_attendance_today') {
        try {
          if (e.newValue) {
            setTodayData(JSON.parse(e.newValue));
          } else {
            refreshToday();
          }
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshToday]);

  // Live evaluation of today's attendance
  const evaluation = useMemo(() => {
    if (!todayData) {
      return {
        status: 'absent',
        label: 'Not Checked In',
        statusColor: 'bad',
        netMinutes: 0,
        grossMinutes: 0,
        breakMinutes: 0,
        recordedBreakMinutes: 0,
        netSeconds: 0,
        grossSeconds: 0,
        breakSeconds: 0,
        recordedBreakSeconds: 0,
        flags: ['NO_PUNCH']
      };
    }

    const currentMin = nowDate.getHours() * 60 + nowDate.getMinutes();
    const currentSec = currentMin * 60 + nowDate.getSeconds();
    return evaluateDay(todayData, ATTENDANCE_RULES, {
      nowMinutes: currentMin,
      nowSeconds: currentSec,
      currentMonthLateCount: 1 // Aarav has 1 late mark so far
    });
  }, [todayData, nowDate]);

  // Active break detection
  const activeBreak = useMemo(() => {
    if (!todayData?.breaks?.length) return null;
    const last = todayData.breaks[todayData.breaks.length - 1];
    return last && !last.end ? last : null;
  }, [todayData]);

  // Action methods with validation + instant clock sync so transitions never lag a tick
  const punchIn = useCallback(async (mode = 'Office', note = '', location = null) => {
    const res = await attendanceService.punchIn(mode, note, location);
    setNowDate(new Date());
    setTodayData(res);
    return res;
  }, []);

  const punchOut = useCallback(async (location = null, earlyReason = '') => {
    const res = await attendanceService.punchOut(location, earlyReason);
    setNowDate(new Date());
    setTodayData(res);
    return res;
  }, []);

  const startBreak = useCallback(async (type = 'Lunch') => {
    const res = await attendanceService.startBreak(type);
    setNowDate(new Date());
    setTodayData(res);
    return res;
  }, []);

  const endBreak = useCallback(async () => {
    const res = await attendanceService.endBreak();
    setNowDate(new Date());
    setTodayData(res);
    return res;
  }, []);

  const setWorkMode = useCallback(async (mode, note = '') => {
    const res = await attendanceService.setWorkMode(mode, note);
    setTodayData(res);
    return res;
  }, []);

  const updateTodayLocation = useCallback(async (location) => {
    const res = await attendanceService.updateTodayLocation(location);
    setTodayData(res);
    return res;
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        todayData,
        loading,
        nowDate,
        getNow,
        evaluation,
        activeBreak,
        punchIn,
        punchOut,
        startBreak,
        endBreak,
        setWorkMode,
        updateTodayLocation,
        refreshToday
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}

export default AttendanceContext;

