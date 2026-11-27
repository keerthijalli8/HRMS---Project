// src/components/CheckOutDrawer.jsx
// Shared Check-Out drawer: collects required reason on early check-out (<8h),
// acquires live device GPS location (supporting Office, Work from home & Remote),
// and executes confirmed punchOut with reason + tracked GPS coordinates.

import React, { useState, useEffect } from 'react';
import { Radio, MapPin, AlertTriangle, Crosshair } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Drawer } from './Drawer.jsx';
import { PrimaryButton, SecondaryButton } from './Buttons.jsx';
import { Tag } from './Tag.jsx';
import { LocationMap } from './LocationMap.jsx';
import { formatDurationWithSeconds, formatTime12 } from '../utils/format.js';
import { formatCoordinates, formatDistance, getDeviceGPSLocation } from '../utils/geo.js';

const EARLY_REASON_PRESETS = [
  'Medical Appointment',
  'Personal Emergency',
  'Family Obligation',
  'Approved Half Day'
];

export function CheckOutDrawer({ isOpen, onClose }) {
  const { todayData, evaluation, punchOut } = useAttendance();
  const { showToast } = useToast();

  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [trackedLocation, setTrackedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEarly = (evaluation?.netMinutes ?? 0) < 480;
  const workMode = todayData?.workMode || 'Office';

  const captureGPS = async () => {
    setIsLocating(true);
    try {
      const loc = await getDeviceGPSLocation({ workMode });
      setTrackedLocation(loc);
    } catch (err) {
      console.warn('Check-out GPS capture error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setReasonError('');
    setTrackedLocation(null);
    captureGPS();
  }, [isOpen, workMode]);

  const handleConfirmCheckOut = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const trimmedReason = reason.trim();

    if (isEarly && trimmedReason.length < 5) {
      setReasonError('Please enter a brief reason (at least 5 characters) for checking out early.');
      return;
    }

    setReasonError('');
    setIsSubmitting(true);
    try {
      const finalLocation = trackedLocation || (await getDeviceGPSLocation({ workMode }));
      await punchOut(finalLocation, trimmedReason);
      onClose();
      showToast(
        workMode !== 'Office'
          ? `Checked out (${workMode})! Exact GPS & details saved.`
          : finalLocation.inGeofence
            ? 'Checked out! GPS location verified at HITEC City Campus.'
            : 'Checked out! GPS location geotagged.'
      );
    } catch (err) {
      setReasonError(err.message || 'Check-out failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nowPreviewTime = formatTime12(new Date());

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEarly ? 'Early Check-Out Confirmation' : 'Confirm Check-Out & GPS Tracking'}
      maxWidth="max-w-[520px]"
      footer={
        <div className="flex gap-2">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleConfirmCheckOut}
            disabled={isLocating || isSubmitting}
            className={isEarly ? 'bg-warn text-bg' : ''}
          >
            {isSubmitting
              ? 'Recording Check Out...'
              : isLocating
                ? 'Tracking GPS...'
                : isEarly
                  ? 'Confirm Early Check Out'
                  : 'Confirm Check Out'}
          </PrimaryButton>
        </div>
      }
    >
      <form onSubmit={handleConfirmCheckOut} className="space-y-4 text-xs">
        {/* Net Hours & Daily 1 Check-In Policy Notice */}
        <div
          className={`p-3 rounded-tpl border space-y-1.5 ${
            isEarly ? 'bg-warn/10 border-warn/40' : 'bg-surface2/40 border-line'
          }`}
        >
          {isEarly ? (
            <p className="text-warn font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Early Check-Out: Net hours worked {formatDurationWithSeconds(evaluation?.netSeconds || 0)} (below 8h target).
              </span>
            </p>
          ) : (
            <p className="text-good font-semibold">
              Full shift completed: {formatDurationWithSeconds(evaluation?.netSeconds || 0)} net worked today.
            </p>
          )}
          <p className="text-muted text-[11px] leading-relaxed">
            Policy notice: Only one check-in is allowed per day. Once checked out, you cannot check in again today without Attendance Regularisation.
          </p>
        </div>

        {/* Reason Box (Required for Early Check-Out, Optional Note otherwise) */}
        <div className="space-y-2">
          <label
            htmlFor="early-checkout-reason"
            className="block text-muted font-semibold"
          >
            {isEarly ? 'Reason for Early Check-Out *' : 'Check-Out Note (Optional)'}
          </label>

          {isEarly && (
            <div className="flex flex-wrap gap-1.5">
              {EARLY_REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setReasonError('');
                  }}
                  className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                    reason === preset
                      ? 'bg-accent text-on-accent border-accent font-semibold'
                      : 'bg-surface2/60 text-muted border-line hover:text-ink'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          <textarea
            id="early-checkout-reason"
            rows={3}
            required={isEarly}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError('');
            }}
            placeholder={
              isEarly
                ? 'Write the reason for early check-out (e.g. Medical appointment, family emergency, client visit)...'
                : 'Add an optional departure note...'
            }
            className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-xs focus:border-accent focus:outline-none placeholder:text-muted/60"
          />

          {reasonError && (
            <p role="alert" className="text-bad text-[11px] font-medium">
              {reasonError}
            </p>
          )}
        </div>

        {/* Tracked Check-Out GPS Location Preview */}
        <div className="space-y-2.5 pt-2 border-t border-line/40">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              Check-Out GPS Tracking ({workMode})
            </span>
            <button
              type="button"
              onClick={captureGPS}
              disabled={isLocating}
              className="text-[11px] text-accent hover:underline flex items-center gap-1"
            >
              <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
            </button>
          </div>

          {isLocating ? (
            <div className="p-6 text-center space-y-2 rounded-tpl bg-surface2/30 border border-line">
              <Radio className="w-7 h-7 text-accent animate-ping mx-auto" />
              <p className="font-semibold text-ink">Tracking Check-Out GPS Location...</p>
              <p className="text-muted text-[11px]">Acquiring exact coordinates for verification</p>
            </div>
          ) : trackedLocation ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-tpl bg-surface2/40 border border-line space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-ink">
                    {formatCoordinates(trackedLocation.latitude, trackedLocation.longitude)}
                  </span>
                  <Tag color={workMode !== 'Office' ? 'info' : trackedLocation.inGeofence ? 'good' : 'warn'}>
                    {workMode !== 'Office'
                      ? `${workMode} · ${formatDistance(trackedLocation.distanceMeters)}`
                      : trackedLocation.inGeofence
                        ? `Campus (${trackedLocation.distanceMeters}m)`
                        : `Outside (${formatDistance(trackedLocation.distanceMeters)})`}
                  </Tag>
                </div>
                <p className="text-[11px] text-muted truncate">{trackedLocation.address}</p>
              </div>

              <LocationMap
                checkInLocation={todayData?.checkInLocation}
                checkOutLocation={trackedLocation}
                checkInTime={todayData?.checkIn}
                checkOutTime={nowPreviewTime}
                workMode={workMode}
                height={180}
              />
            </div>
          ) : null}
        </div>
      </form>
    </Drawer>
  );
}

export default CheckOutDrawer;

