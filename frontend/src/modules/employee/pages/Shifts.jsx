// src/pages/Shifts.jsx
// Shift management module: current shift overview, weekly roster, and shift swap requests.

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Repeat,
  MapPin,
  Coffee,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { Table } from '../components/Table.jsx';
import { INITIAL_SHIFTS } from '../data/employee.js';
import { formatDate, formatTime12, formatDurationWithSeconds } from '../utils/format.js';

export function Shifts() {
  const { showToast } = useToast();
  const { todayData, evaluation, nowDate } = useAttendance();
  const [shiftsData, setShiftsData] = useState(INITIAL_SHIFTS);
  const [swapDrawerOpen, setSwapDrawerOpen] = useState(false);

  // Swap form state
  const [swapDate, setSwapDate] = useState('2026-11-18');
  const [swapShift, setSwapShift] = useState('Morning Shift (8:00 AM – 5:00 PM)');
  const [swapColleague, setSwapColleague] = useState('Rahul Verma (QA Lead)');
  const [swapReason, setSwapReason] = useState('');

  const handleSwapSubmit = (e) => {
    e.preventDefault();
    if (!swapReason.trim()) {
      showToast('Please provide a reason for the shift change.');
      return;
    }

    const newReq = {
      id: `SWP-2026-${String(shiftsData.swapRequests.length + 13).padStart(3, '0')}`,
      date: swapDate,
      requestedShift: swapShift,
      swapWith: swapColleague || 'None (Schedule change)',
      reason: swapReason,
      status: 'Pending',
      appliedOn: '2026-11-06'
    };

    setShiftsData(prev => ({
      ...prev,
      swapRequests: [newReq, ...prev.swapRequests]
    }));

    setSwapDrawerOpen(false);
    setSwapReason('');

    showToast(`Shift swap request ${newReq.id} submitted for review.`, {
      undoLabel: 'Withdraw',
      onUndo: () => {
        setShiftsData(prev => ({
          ...prev,
          swapRequests: prev.swapRequests.filter(r => r.id !== newReq.id)
        }));
        showToast(`Withdrew request ${newReq.id}`);
      }
    });
  };

  const handleWithdraw = (id) => {
    const target = shiftsData.swapRequests.find(r => r.id === id);
    setShiftsData(prev => ({
      ...prev,
      swapRequests: prev.swapRequests.filter(r => r.id !== id)
    }));
    showToast(`Shift change request ${id} withdrawn.`, {
      undoLabel: 'Undo',
      onUndo: () => {
        setShiftsData(prev => ({
          ...prev,
          swapRequests: [target, ...prev.swapRequests]
        }));
      }
    });
  };

  const current = shiftsData.current;

  return (
    <div className="space-y-6">
      {/* 1. SHIFTNOW CARD (Section 18) */}
      <Card
        title="Current Shift Overview"
        subtext="Assigned recurring shift schedule"
        action={
          <PrimaryButton size="sm" onClick={() => setSwapDrawerOpen(true)}>
            <Repeat className="w-3.5 h-3.5" /> Request Swap / Change
          </PrimaryButton>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-tpl bg-surface2/40 border border-line space-y-1.5">
            <span className="text-xs text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" /> Assigned Timing
            </span>
            <div className="font-display font-bold text-lg text-ink">
              {current.timings}
            </div>
            <Tag color="accent">{current.name} ({current.code})</Tag>
          </div>

          <div className="p-4 rounded-tpl bg-surface2/40 border border-line space-y-1.5">
            <span className="text-xs text-muted flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-warn" /> Break Window
            </span>
            <div className="font-display font-bold text-lg text-ink">
              {current.breakWindow}
            </div>
            <span className="text-[11px] text-muted block">Mandatory 60 min lunch</span>
          </div>

          <div className="p-4 rounded-tpl bg-surface2/40 border border-line space-y-1.5">
            <span className="text-xs text-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-good" /> Grace Period
            </span>
            <div className="font-display font-bold text-lg text-ink">
              {current.gracePeriod}
            </div>
            <span className="text-[11px] text-muted block">3 free late marks/month</span>
          </div>

          <div className="p-4 rounded-tpl bg-surface2/40 border border-line space-y-1.5">
            <span className="text-xs text-muted flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-info" /> Base Location
            </span>
            <div className="font-semibold text-sm text-ink truncate">
              {current.workLocation}
            </div>
            <span className="text-[11px] text-muted block">Weekly Off: {current.weeklyOff}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-tpl bg-surface2/25 border border-line/60 flex items-center justify-between gap-3 flex-wrap text-xs text-muted">
          <div className="flex items-center gap-3 flex-wrap font-mono tabular-nums">
            <span className="flex items-center gap-1.5 text-ink font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Live IST: {formatTime12(nowDate)}
            </span>
            <span>·</span>
            <span>
              In: <strong className="text-ink">{todayData?.checkIn ? formatTime12(todayData.checkIn) : '--:--:--'}</strong>
            </span>
            <span>·</span>
            <span>
              Net: <strong className="text-accent">{formatDurationWithSeconds(evaluation.netSeconds)}</strong>
            </span>
            <span>·</span>
            <span>
              Break: <strong className="text-ink">{formatDurationWithSeconds(evaluation.recordedBreakSeconds ?? evaluation.breakSeconds)}</strong>
            </span>
          </div>
          <span className="text-ink font-medium">{current.nextShiftChange}</span>
        </div>
      </Card>

      {/* 2. WEEKLY ROSTER (Section 18) */}
      <Card
        title="Weekly Shift Roster"
        subtext="Week of 02 Nov – 08 Nov 2026 (Read-only view matching manager roster)"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {shiftsData.roster.map((r, idx) => {
            const isToday = r.date === '06 Nov';
            const isWeekend = r.shift === 'Weekly Off';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-tpl border text-center space-y-2 transition-all ${
                  isToday
                    ? 'border-accent bg-accent/10 shadow-md ring-1 ring-accent'
                    : isWeekend
                    ? 'border-line/40 bg-surface2/20 opacity-60'
                    : 'border-line bg-surface2/40'
                }`}
              >
                <div className="text-[11px] uppercase font-bold text-muted font-mono">
                  {r.day} · {r.date}
                </div>
                <div className="font-display font-bold text-sm text-ink">
                  {r.shift}
                </div>
                <div className="text-[11px] font-mono text-muted">
                  {r.hours}
                </div>
                <div className="pt-1">
                  <Tag color={isToday ? 'accent' : isWeekend ? 'default' : 'good'}>
                    {r.status}
                  </Tag>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. SWAP REQUESTS LIST */}
      <Card
        title="My Shift Change & Swap Requests"
        subtext="Tracking history of requested schedule swaps"
      >
        <Table
          keyField="id"
          columns={[
            {
              header: 'Request ID',
              key: 'id',
              render: (id) => <span className="font-mono font-semibold text-accent">{id}</span>
            },
            {
              header: 'Target Date',
              key: 'date',
              render: (d) => <span className="font-mono text-ink">{formatDate(d)}</span>
            },
            {
              header: 'Requested Shift',
              key: 'requestedShift',
              render: (shift) => <span className="text-ink font-medium">{shift}</span>
            },
            {
              header: 'Swap Colleague',
              key: 'swapWith',
              render: (name) => <span className="text-muted">{name}</span>
            },
            {
              header: 'Reason',
              key: 'reason',
              render: (r) => <span className="text-muted text-xs line-clamp-1">{r}</span>
            },
            {
              header: 'Status',
              key: 'status',
              render: (status) => <StatusPill status={status} label={status} />
            },
            {
              header: 'Actions',
              key: 'actions',
              render: (_, row) => (
                row.status === 'Pending' ? (
                  <button
                    onClick={() => handleWithdraw(row.id)}
                    className="text-bad hover:underline text-xs"
                  >
                    Withdraw
                  </button>
                ) : (
                  <span className="text-muted text-xs">--</span>
                )
              )
            }
          ]}
          data={shiftsData.swapRequests}
        />
      </Card>

      {/* Request Shift Swap Drawer */}
      <Drawer
        isOpen={swapDrawerOpen}
        onClose={() => setSwapDrawerOpen(false)}
        title="Request Shift Swap or Change"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setSwapDrawerOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSwapSubmit}>
              Submit Request
            </PrimaryButton>
          </div>
        }
      >
        <form onSubmit={handleSwapSubmit} className="space-y-4 text-[13px]">
          <p className="text-muted leading-relaxed">
            Request an alternate shift timing or propose a mutual swap with an engineering colleague.
          </p>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Target Date *</label>
            <input
              type="date"
              required
              value={swapDate}
              onChange={(e) => setSwapDate(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Requested Timing *</label>
            <select
              value={swapShift}
              onChange={(e) => setSwapShift(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Morning Shift (8:00 AM – 5:00 PM)">Morning Shift (8:00 AM – 5:00 PM)</option>
              <option value="Evening Shift (1:00 PM – 10:00 PM)">Evening Shift (1:00 PM – 10:00 PM)</option>
              <option value="Night Shift (9:00 PM – 6:00 AM)">Night Shift (9:00 PM – 6:00 AM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Swap With Colleague (Optional)
            </label>
            <select
              value={swapColleague}
              onChange={(e) => setSwapColleague(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="">None (Individual schedule change)</option>
              <option value="Rahul Verma (QA Lead)">Rahul Verma (QA Lead)</option>
              <option value="Karthik Reddy (Backend Engineer)">Karthik Reddy (Backend Engineer)</option>
              <option value="Divya Menon (UI Designer)">Divya Menon (UI Designer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Reason for Shift Change *
            </label>
            <textarea
              required
              rows={3}
              value={swapReason}
              onChange={(e) => setSwapReason(e.target.value)}
              placeholder="State reason for shifting schedule..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-xs text-muted">
            ℹ️ Requires confirmation by colleague and final authorization from Priya Nair.
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default Shifts;

