// src/components/PunchControl.jsx
// Header and Overview punch widget with GPS location tracking, geofence validation, and live net hours.

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Radio } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { StatusPill } from './StatusPill.jsx';
import { PrimaryButton, SecondaryButton } from './Buttons.jsx';
import { Drawer } from './Drawer.jsx';
import { Tag } from './Tag.jsx';
import { LocationMap } from './LocationMap.jsx';
import { CheckOutDrawer } from './CheckOutDrawer.jsx';
import { formatDurationWithSeconds, formatTime12 } from '../utils/format.js';
import { getDeviceGPSLocation, formatCoordinates, formatDistance } from '../utils/geo.js';
import { timeToSeconds } from '../utils/attendanceEngine.js';

export function PunchControl({ compact = false, className = '' }) {
  const {
    todayData,
    evaluation,
    activeBreak,
    nowDate,
    punchIn,
    startBreak,
    endBreak
  } = useAttendance();

  // Compute live break duration & active break elapsed time in seconds
  const nowSeconds = nowDate
    ? (nowDate.getHours() * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds())
    : 0;
  const activeBreakElapsedSec = activeBreak?.start
    ? Math.max(0, nowSeconds - (timeToSeconds(activeBreak.start) ?? nowSeconds))
    : 0;
  const recordedBreakSeconds = evaluation.recordedBreakSeconds ?? (
    (todayData?.breaks?.reduce((sum, b) => sum + (b.durationSeconds ?? ((b.duration || 0) * 60)), 0) || 0) + activeBreakElapsedSec
  );

  const { showToast } = useToast();
  const [checkOutDrawerOpen, setCheckOutDrawerOpen] = useState(false);
  const [breakDrawer, setBreakDrawer] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState('Lunch');

  // GPS Location state & verification drawer
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [gpsCheckInDrawer, setGpsCheckInDrawer] = useState(false);
  const [checkInMode, setCheckInMode] = useState(todayData?.workMode || 'Office');

  const isCheckedIn = !!todayData?.checkIn && !todayData?.checkOut;
  const isCheckedOut = !!todayData?.checkOut;

  // Trigger GPS acquisition before check-in (enforcing 1 check-in per day policy)
  const initiateCheckIn = async (overrideMode) => {
    if (todayData?.checkIn) {
      showToast(
        todayData?.checkOut
          ? 'Daily check-in policy: Only 1 check-in is allowed per day. Submit Attendance Regularisation if checked out accidentally.'
          : 'You are already checked in for today.'
      );
      return;
    }
    const activeMode = typeof overrideMode === 'string' ? overrideMode : (todayData?.workMode || 'Office');
    setCheckInMode(activeMode);
    setPendingLocation(null);
    setIsLocating(true);
    setGpsCheckInDrawer(true);
    try {
      const loc = await getDeviceGPSLocation({ workMode: activeMode });
      setPendingLocation(loc);
    } catch (err) {
      console.warn('GPS location error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const confirmPunchIn = async () => {
    try {
      const res = await punchIn(checkInMode, '', pendingLocation);
      setGpsCheckInDrawer(false);
      const savedLoc = res?.checkInLocation || pendingLocation;
      const coordLabel = savedLoc ? formatCoordinates(savedLoc.latitude, savedLoc.longitude) : '';
      showToast(
        checkInMode !== 'Office'
          ? `Checked in (${checkInMode}) · GPS: ${coordLabel}`
          : savedLoc?.inGeofence
            ? `Checked in at campus · GPS: ${coordLabel}`
            : `Checked in · Geotagged GPS: ${coordLabel}`,
        {
          undoLabel: 'Undo',
          onUndo: () => console.log('Undo punch in')
        }
      );
    } catch (err) {
      showToast(err.message || 'Check-in failed');
    }
  };

  const handlePunchOutClick = () => {
    setCheckOutDrawerOpen(true);
  };

  const handleStartBreak = async () => {
    try {
      await startBreak(selectedBreakType);
      setBreakDrawer(false);
      showToast(`Started ${selectedBreakType} break.`);
    } catch (err) {
      showToast(err.message || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      await endBreak();
      showToast('Break ended. Back to work!');
    } catch (err) {
      showToast(err.message || 'Failed to end break');
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isCheckedIn ? (
          <div className="flex items-center gap-2">
            {/* GPS Location Chip */}
            {todayData?.checkInLocation && (
              <button
                type="button"
                onClick={() => setLocationDrawerOpen(true)}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2/60 hover:bg-surface2 border border-line text-[11px] text-muted hover:text-ink transition-colors"
                title="View GPS check-in location mapping"
              >
                <MapPin className="w-3 h-3 text-accent" />
                <span className="truncate max-w-[110px]">
                  {todayData.workMode === 'Remote'
                    ? 'Remote GPS'
                    : todayData.workMode === 'Work from home'
                      ? 'WFH GPS'
                      : todayData.checkInLocation.inGeofence
                        ? 'Campus GPS'
                        : 'Remote GPS'}
                </span>
              </button>
            )}

            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2/70 border border-line text-[12px] font-mono font-semibold text-ink tabular-nums"
              title={`In: ${formatTime12(todayData?.checkIn)} · Net: ${formatDurationWithSeconds(evaluation.netSeconds)} · Break: ${formatDurationWithSeconds(recordedBreakSeconds)}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeBreak ? 'bg-warn' : 'bg-good'}`} />
              {formatDurationWithSeconds(evaluation.netSeconds)}
            </span>
            {activeBreak ? (
              <SecondaryButton size="sm" onClick={handleEndBreak} className="text-warn border-warn/40 font-mono tabular-nums">
                End break ({formatDurationWithSeconds(activeBreakElapsedSec)})
              </SecondaryButton>
            ) : (
              <SecondaryButton size="sm" onClick={() => setBreakDrawer(true)}>
                Break
              </SecondaryButton>
            )}
            <PrimaryButton size="sm" onClick={handlePunchOutClick}>
              Check out
            </PrimaryButton>
          </div>
        ) : isCheckedOut ? (
          <div className="flex items-center gap-2">
            {todayData?.checkOutLocation && (
              <button
                type="button"
                onClick={() => setLocationDrawerOpen(true)}
                className="hidden sm:flex items-center gap-1 text-[11px] text-muted hover:text-accent font-mono"
              >
                <MapPin className="w-3 h-3 text-good" /> Geotagged
              </button>
            )}
            <span
              className="text-[12px] font-mono font-semibold text-ink tabular-nums px-2 py-0.5 rounded-full bg-surface2/60 border border-line"
              title={`In: ${formatTime12(todayData?.checkIn)} · Out: ${formatTime12(todayData?.checkOut)} · Break: ${formatDurationWithSeconds(recordedBreakSeconds)} · Daily limit: 1 check-in/day`}
            >
              {formatDurationWithSeconds(evaluation.netSeconds)}
            </span>
            <StatusPill status="good" label={`Out ${formatTime12(todayData?.checkOut)}`} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {nowDate && (
              <span className="hidden xl:inline text-[11px] font-mono text-muted tabular-nums">
                {formatTime12(nowDate)}
              </span>
            )}
            <PrimaryButton size="sm" onClick={() => initiateCheckIn()}>
              Check in
            </PrimaryButton>
          </div>
        )}

        {/* GPS Check-In Confirmation Drawer */}
        <Drawer
          isOpen={gpsCheckInDrawer}
          onClose={() => setGpsCheckInDrawer(false)}
          title="GPS Location Verification"
          footer={
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setGpsCheckInDrawer(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={confirmPunchIn} disabled={isLocating}>
                {isLocating ? 'Locating...' : 'Confirm & Check In'}
              </PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <span className="block text-[11px] text-muted font-medium">Select Work Mode</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Office', 'Work from home', 'Remote'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => initiateCheckIn(mode)}
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                      checkInMode === mode
                        ? 'bg-accent text-on-accent border-accent font-semibold'
                        : 'bg-surface2 text-muted border-line hover:text-ink'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {isLocating ? (
              <div className="p-8 text-center space-y-3 rounded-tpl bg-surface2/30 border border-line">
                <Radio className="w-8 h-8 text-accent animate-ping mx-auto" />
                <p className="font-semibold text-ink">Acquiring High-Precision GPS Lock...</p>
                <p className="text-muted text-[11px]">Connecting to device location satellites</p>
              </div>
            ) : pendingLocation ? (
              <div className="space-y-3">
                <LocationMap activeLocation={pendingLocation} workMode={checkInMode} height={200} />
                <div className="p-3 rounded-tpl bg-surface2/40 border border-line space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-ink">Geofence Compliance:</span>
                    <Tag color={pendingLocation.inGeofence ? 'good' : 'warn'}>
                      {pendingLocation.inGeofence ? '✓ In Geofence' : 'Remote Geotag'}
                    </Tag>
                  </div>
                  <p className="text-muted text-[11px]">
                    Distance from Tower B: <strong>{pendingLocation.distanceMeters}m</strong> (Allowed: 300m)
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </Drawer>

        {/* Location Mapping Drawer */}
        <Drawer
          isOpen={locationDrawerOpen}
          onClose={() => setLocationDrawerOpen(false)}
          title="Today's Punch GPS Mapping"
          maxWidth="max-w-[540px]"
        >
          <div className="space-y-4">
            <LocationMap
              checkInLocation={todayData?.checkInLocation}
              checkOutLocation={todayData?.checkOutLocation}
              checkInTime={todayData?.checkIn}
              checkOutTime={todayData?.checkOut}
              workMode={todayData?.workMode}
              height={300}
            />
          </div>
        </Drawer>

        {/* Check-Out Confirmation, Reason & GPS Tracking Drawer */}
        <CheckOutDrawer
          isOpen={checkOutDrawerOpen}
          onClose={() => setCheckOutDrawerOpen(false)}
        />

        {/* Break Drawer */}
        <Drawer
          isOpen={breakDrawer}
          onClose={() => setBreakDrawer(false)}
          title="Start Break"
          footer={
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setBreakDrawer(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleStartBreak}>Start Break</PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4 text-[13px]">
            <p className="text-muted">Select break type:</p>
            <div className="space-y-2">
              {['Lunch (45-60 min)', 'Tea / Refreshment (15 min)', 'Personal / Urgent (15 min)'].map((b) => {
                const typeName = b.split(' ')[0];
                return (
                  <label
                    key={b}
                    className={`flex items-center gap-3 p-3 rounded-tpl border cursor-pointer transition-colors ${
                      selectedBreakType === typeName
                        ? 'border-accent bg-accent/10 text-ink'
                        : 'border-line bg-surface2/40 text-muted hover:bg-surface2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="breakType"
                      checked={selectedBreakType === typeName}
                      onChange={() => setSelectedBreakType(typeName)}
                      className="accent-accent"
                    />
                    <span>{b}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </Drawer>
      </div>
    );
  }

  // Full Widget Punch Panel for Overview or Attendance page
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold block">
            TODAY'S SHIFT
          </span>
          <span className="text-[13px] font-medium text-ink">
            General 9:30 AM – 6:30 PM
          </span>
        </div>
        <StatusPill status={evaluation.statusColor} label={evaluation.label} />
      </div>

      {/* Recorded Check-In & Check-Out GPS Locations */}
      {(todayData?.checkInLocation || todayData?.checkOutLocation) && (
        <div className="space-y-2">
          {todayData?.checkInLocation && (
            <button
              type="button"
              onClick={() => setLocationDrawerOpen(true)}
              className="w-full p-2.5 rounded-tpl bg-surface2/40 border border-line hover:border-accent/50 flex items-center justify-between gap-2 text-xs text-left transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-good shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-ink block truncate">
                    In ({formatTime12(todayData.checkIn)}) · {todayData.checkInLocation.address}
                  </span>
                  <span className="text-muted text-[11px] font-mono block">
                    {formatCoordinates(todayData.checkInLocation.latitude, todayData.checkInLocation.longitude)} ·{' '}
                    {formatDistance(todayData.checkInLocation.distanceMeters)}
                  </span>
                </div>
              </div>
              <Tag color={todayData.checkInLocation.inGeofence ? 'good' : 'warn'}>
                {todayData.checkInLocation.inGeofence ? 'In Geofence' : (todayData.workMode || 'Remote')}
              </Tag>
            </button>
          )}

          {todayData?.checkOutLocation && (
            <button
              type="button"
              onClick={() => setLocationDrawerOpen(true)}
              className="w-full p-2.5 rounded-tpl bg-surface2/40 border border-line hover:border-accent2/50 flex items-center justify-between gap-2 text-xs text-left transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-accent2 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-ink block truncate">
                    Out ({formatTime12(todayData.checkOut)}) · {todayData.checkOutLocation.address}
                  </span>
                  <span className="text-muted text-[11px] font-mono block">
                    {formatCoordinates(todayData.checkOutLocation.latitude, todayData.checkOutLocation.longitude)} ·{' '}
                    {formatDistance(todayData.checkOutLocation.distanceMeters)}
                  </span>
                </div>
              </div>
              <Tag color={todayData.checkOutLocation.inGeofence ? 'good' : 'warn'}>
                {todayData.checkOutLocation.inGeofence ? 'In Geofence' : (todayData.workMode || 'Remote')}
              </Tag>
            </button>
          )}
        </div>
      )}

      <div className="p-4 rounded-tpl bg-surface2/50 border border-line flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">
            {activeBreak ? 'Net Working (Paused)' : 'Net Working Hours'}
          </span>
          <span className={`font-display font-bold text-xl font-mono tabular-nums ${activeBreak ? 'text-warn' : 'text-ink'}`}>
            {formatDurationWithSeconds(evaluation.netSeconds)}
          </span>
        </div>

        {/* 8 hour progress bar with marker */}
        <div className="relative pt-1 pb-1">
          <div className="w-full h-2.5 rounded-full bg-surface2 border border-line overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (evaluation.netMinutes / 480) * 100)}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                evaluation.netMinutes >= 480
                  ? 'bg-good'
                  : evaluation.netMinutes >= 270
                  ? 'bg-accent'
                  : 'bg-warn'
              }`}
            />
          </div>
          {/* Half day 4h 30m marker (56.25%) */}
          <div
            style={{ left: '56.25%' }}
            className="absolute top-0 bottom-0 w-[2px] bg-line z-10 pointer-events-none"
            title="Half day threshold: 4h 30m"
          />
        </div>

        <div className="flex justify-between text-[11px] text-muted">
          <span>0h</span>
          <span className="text-muted/80">4h 30m (Half)</span>
          <span>8h Goal</span>
        </div>

        {/* Time & Break Duration Breakdown */}
        {todayData?.checkIn && (
          <div
            className={`pt-2 mt-1 border-t border-line/40 grid gap-2 text-[11px] font-mono tabular-nums ${
              todayData?.checkOut ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
            }`}
          >
            <div>
              <span className="text-muted block">In Time</span>
              <span className="text-ink font-semibold">{formatTime12(todayData.checkIn)}</span>
            </div>
            {todayData?.checkOut && (
              <div>
                <span className="text-muted block">Out Time</span>
                <span className="text-ink font-semibold">{formatTime12(todayData.checkOut)}</span>
              </div>
            )}
            <div>
              <span className="text-muted block">Break Duration</span>
              <span className={`font-semibold ${activeBreak ? 'text-warn' : 'text-ink'}`}>
                {formatDurationWithSeconds(recordedBreakSeconds)}
              </span>
            </div>
            <div className={todayData?.checkOut ? 'sm:text-right' : 'text-right'}>
              <span className="text-muted block">Gross Hours</span>
              <span className="text-ink font-semibold">{formatDurationWithSeconds(evaluation.grossSeconds)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isCheckedIn ? (
          <>
            {activeBreak ? (
              <SecondaryButton onClick={handleEndBreak} className="flex-1 text-warn border-warn/40 font-mono tabular-nums">
                End Break ({activeBreak.type} · {formatDurationWithSeconds(activeBreakElapsedSec)})
              </SecondaryButton>
            ) : (
              <SecondaryButton onClick={() => setBreakDrawer(true)} className="flex-1">
                Start Break
              </SecondaryButton>
            )}
            <PrimaryButton onClick={handlePunchOutClick} className="flex-1">
              Check Out
            </PrimaryButton>
          </>
        ) : isCheckedOut ? (
          <div
            className="w-full text-center py-2 px-3 text-[12px] text-muted border border-line rounded-tpl bg-surface2/30"
            title="Only 1 check-in is permitted per day. Submit Attendance Regularisation if checked out accidentally."
          >
            Punched out at {formatTime12(todayData?.checkOut)}. Day closed (1 check-in/day policy).
          </div>
        ) : (
          <div className="w-full text-center py-2.5 px-3 text-[12px] text-muted border border-line rounded-tpl bg-surface2/30">
            Not checked in yet · Use <strong className="text-ink">Check in</strong> in the top header to clock in (1 check-in/day).
          </div>
        )}
      </div>

      {/* Drawers */}
      <Drawer
        isOpen={gpsCheckInDrawer}
        onClose={() => setGpsCheckInDrawer(false)}
        title="GPS Check-In Location"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setGpsCheckInDrawer(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={confirmPunchIn} disabled={isLocating}>
              {isLocating ? 'Locating...' : 'Confirm & Check In'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <span className="block text-[11px] text-muted font-medium">Select Work Mode</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Office', 'Work from home', 'Remote'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => initiateCheckIn(mode)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                    checkInMode === mode
                      ? 'bg-accent text-on-accent border-accent font-semibold'
                      : 'bg-surface2 text-muted border-line hover:text-ink'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          {isLocating ? (
            <div className="p-8 text-center space-y-3 rounded-tpl bg-surface2/30 border border-line">
              <Radio className="w-8 h-8 text-accent animate-ping mx-auto" />
              <p className="font-semibold text-ink">Acquiring GPS Position...</p>
            </div>
          ) : pendingLocation ? (
            <div className="space-y-3">
              <LocationMap activeLocation={pendingLocation} workMode={checkInMode} height={200} />
              <div className="p-3 rounded-tpl bg-surface2/40 border border-line">
                <span className="font-semibold text-ink block">{pendingLocation.address}</span>
                <span className="text-muted font-mono">{formatCoordinates(pendingLocation.latitude, pendingLocation.longitude)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </Drawer>

      <Drawer
        isOpen={locationDrawerOpen}
        onClose={() => setLocationDrawerOpen(false)}
        title="GPS Location Mapping"
        maxWidth="max-w-[540px]"
      >
        <LocationMap
          checkInLocation={todayData?.checkInLocation}
          checkOutLocation={todayData?.checkOutLocation}
          checkInTime={todayData?.checkIn}
          checkOutTime={todayData?.checkOut}
          workMode={todayData?.workMode}
          height={300}
        />
      </Drawer>

      <CheckOutDrawer
        isOpen={checkOutDrawerOpen}
        onClose={() => setCheckOutDrawerOpen(false)}
      />

      <Drawer
        isOpen={breakDrawer}
        onClose={() => setBreakDrawer(false)}
        title="Start Break"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setBreakDrawer(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleStartBreak}>Start Break</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4 text-[13px]">
          <p className="text-muted">Select break type:</p>
          <div className="space-y-2">
            {['Lunch (45-60 min)', 'Tea / Refreshment (15 min)', 'Personal / Urgent (15 min)'].map((b) => {
              const typeName = b.split(' ')[0];
              return (
                <label
                  key={b}
                  className={`flex items-center gap-3 p-3 rounded-tpl border cursor-pointer transition-colors ${
                    selectedBreakType === typeName
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'border-line bg-surface2/40 text-muted hover:bg-surface2'
                  }`}
                >
                  <input
                    type="radio"
                    name="breakType2"
                    checked={selectedBreakType === typeName}
                    onChange={() => setSelectedBreakType(typeName)}
                    className="accent-accent"
                  />
                  <span>{b}</span>
                </label>
              );
            })}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default PunchControl;
