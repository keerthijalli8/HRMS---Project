import React, { useState, useEffect } from 'react';
import Drawer from '../Drawer.jsx';
import { AlertTriangle, Clock } from 'lucide-react';

const EARLY_REASON_PRESETS = [
  'Doctor / medical appointment',
  'Client / on-site visit',
  'Personal / family urgency',
  'Half-day approved',
];

export default function CheckoutConfirmDrawer({
  isOpen,
  onClose,
  earlyMin = 0,
  isImmediateCheckout = false,
  onConfirmCheckout,
}) {
  const [earlyReason, setEarlyReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEarlyReason('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const trimmed = earlyReason.trim();
    if (!trimmed) {
      setError('Please provide a reason for early check-out.');
      return;
    }
    onConfirmCheckout(trimmed);
    setEarlyReason('');
    setError('');
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Early Check-out Reason"
      width="420px"
    >
      <div className="flex flex-col gap-4 text-[13px]">
        <div className="p-3.5 rounded-xl bg-warn/15 border border-warn/30 text-warn text-[12px] flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              Early Check-out ({earlyMin > 0 ? `${earlyMin} min before 6:30 PM shift end` : 'Before shift end'})
            </span>
            <span className="opacity-90">
              {isImmediateCheckout
                ? 'You checked in less than 5 minutes ago. Please enter the reason for checking out early.'
                : 'Checking out before completing the 8h shift goal is recorded as an Early Departure and requires a reason for your attendance log.'}
            </span>
          </div>
        </div>

        {/* Quick Reason Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
            Quick reasons
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EARLY_REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setEarlyReason(preset);
                  setError('');
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                  earlyReason === preset
                    ? 'bg-accent/20 text-accent border-accent'
                    : 'bg-surface2 text-muted border-line hover:text-ink hover:border-accent/50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="earlyReason" className="text-[12px] font-semibold text-ink">
            Reason for early check-out <span className="text-bad">*</span>
          </label>
          <textarea
            id="earlyReason"
            rows={3}
            value={earlyReason}
            onChange={(e) => {
              setEarlyReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter reason for early check-out (e.g., Doctor appointment / client visit)..."
            className={`w-full bg-surface2 border rounded-xl p-3 text-[12.5px] text-ink focus:outline-none transition-colors ${
              error ? 'border-bad focus:border-bad' : 'border-line focus:border-accent'
            }`}
          />
          {error && (
            <span className="text-[11.5px] text-bad font-medium">{error}</span>
          )}
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface2/40 border border-line/60 text-[11px] text-muted font-mono">
          <Clock size={12} className="text-accent shrink-0" />
          <span>Departure GPS location and geofence stamp will be verified upon submit.</span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface2 text-muted hover:text-ink text-[12.5px] font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-warn text-black font-display font-bold text-[12.5px] shadow-sm hover:brightness-105 cursor-pointer"
          >
            Confirm check out
          </button>
        </div>
      </div>
    </Drawer>
  );
}

