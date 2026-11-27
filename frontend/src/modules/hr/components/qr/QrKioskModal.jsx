import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import {
  getActiveQrToken,
  generateNewQrToken,
  revokeQrToken,
  loadQrConfig,
  subscribeQrUpdates
} from '../../services/qrAttendanceStore.js';
import { drawQrToCanvas } from '../../services/qrGenerator.js';

export const QrKioskModal = ({ isOpen, onClose, onTriggerToast }) => {
  const canvasRef = useRef(null);
  const [config, setConfig] = useState(() => loadQrConfig());
  const [activeToken, setActiveToken] = useState(() => getActiveQrToken());
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [currentTime, setCurrentTime] = useState("");

  // Live time ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync token state and draw QR
  const refreshKioskToken = useCallback(() => {
    const token = getActiveQrToken();
    setActiveToken(token);
    if (token && canvasRef.current) {
      drawQrToCanvas(canvasRef.current, token.qrPayloadString, {
        size: 320,
        margin: 3,
        dark: "#08101e",
        light: "#ffffff"
      });
    }
  }, []);

  // Auto-refresh countdown loop
  useEffect(() => {
    if (!isOpen) return;
    refreshKioskToken();

    const unsub = subscribeQrUpdates(() => {
      refreshKioskToken();
      setConfig(loadQrConfig());
    });

    const timer = setInterval(() => {
      const token = getActiveQrToken();
      if (!token) return;
      const now = Date.now();
      const diffMs = Math.max(0, token.expiresAt - now);
      const secs = Math.ceil(diffMs / 1000);
      setSecondsRemaining(secs);

      if (secs <= 0) {
        // Automatically rotate token
        generateNewQrToken("kiosk_auto_refresh");
        refreshKioskToken();
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [isOpen, refreshKioskToken]);

  // Redraw whenever activeToken changes
  useEffect(() => {
    if (activeToken && canvasRef.current) {
      drawQrToCanvas(canvasRef.current, activeToken.qrPayloadString, {
        size: 320,
        margin: 3,
        dark: "#08101e",
        light: "#ffffff"
      });
    }
  }, [activeToken]);

  const handleForceRotate = () => {
    const fresh = generateNewQrToken("manual_rotation_request");
    setActiveToken(fresh);
    if (onTriggerToast) onTriggerToast("Office QR code rotated with fresh token!");
  };

  const handleRevoke = () => {
    if (!activeToken) return;
    const fresh = revokeQrToken(activeToken.tokenId, "kiosk_manual_revocation");
    setActiveToken(fresh);
    if (onTriggerToast) onTriggerToast("Active QR code revoked! Generated fresh token.");
  };

  if (!isOpen) return null;

  const totalValidity = config.tokenValiditySeconds || 60;
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / totalValidity) * 100));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-lg overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-card border border-line shadow-2xl rounded-3xl bg-surface/98 overflow-hidden flex flex-col items-center p-6 md:p-8 text-center">
        {/* Top Kiosk Banner */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-line/60">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent text-on-accent font-display font-extrabold text-base flex items-center justify-center shadow-md">
              QR
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold text-ink leading-tight">
                {config.officeName || "Office Attendance Kiosk"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{config.officeId}</span>
                <span>·</span>
                <span className="text-accent font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  Live Reception Display
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface2 transition"
            title="Exit kiosk view"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Clock & Date */}
        <div className="my-4 flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-display font-bold text-ink tabular-nums tracking-tight">
            {currentTime}
          </div>
          <span className="text-xs uppercase tracking-widest text-muted font-semibold mt-0.5">
            Indian Standard Time (IST) · Asia/Kolkata
          </span>
        </div>

        {/* High-Contrast QR Code Display */}
        <div className="relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-accent/20 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} className="rounded-xl shadow-inner max-w-full" />
          <div className="mt-2 text-[11px] font-bold text-gray-800 tracking-wider uppercase font-data flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-good animate-ping"></span>
            Scan for Check-in / Check-out
          </div>
        </div>

        {/* Rotation Countdown Bar */}
        <div className="w-full max-w-md mt-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted flex items-center gap-1.5 font-medium">
              <Icon name="rotate-cw" className="w-3.5 h-3.5 text-accent animate-spin" />
              Dynamic Token Rotation
            </span>
            <span className="font-data font-bold text-accent text-sm">
              Refreshes in {secondsRemaining}s
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden border border-line">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                secondsRemaining <= 10 ? "bg-bad" : secondsRemaining <= 20 ? "bg-warn" : "bg-accent"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted mt-0.5">
            <span className="truncate max-w-[200px]">Token ID: <strong className="text-ink font-data">{activeToken?.tokenId}</strong></span>
            <span>Scans this window: <strong className="text-ink font-data">{activeToken?.scanCount || 0}</strong></span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 pt-4 border-t border-line/60 w-full text-xs">
          <SecondaryButton icon="rotate-cw" onClick={handleForceRotate}>
            Rotate QR Now
          </SecondaryButton>
          <SecondaryButton icon="trash-2" onClick={handleRevoke}>
            Revoke Active QR
          </SecondaryButton>
          <PrimaryButton onClick={onClose}>
            Exit Fullscreen Kiosk
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body
  );
};
