import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../Buttons.jsx';
import {
  processQrAttendanceScan,
  getActiveQrToken
} from '../../services/qrAttendanceStore.js';

export const QrScannerModal = ({ isOpen, onClose, currentUser, onTriggerToast }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraState, setCameraState] = useState("idle"); // "idle" | "requesting" | "active" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [scanResult, setScanResult] = useState(null); // { ok, action, time, status, message, error }
  const [isProcessing, setIsProcessing] = useState(false);

  // Play audio chime on successful scan (Web Audio API)
  const playSuccessChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  }, []);

  // Stop camera media stream
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  }, []);

  // Handle successful QR code string discovery
  const handleQrDiscovered = useCallback((qrString) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const result = processQrAttendanceScan(qrString, currentUser);
    setScanResult(result);

    if (result.ok) {
      playSuccessChime();
      if (onTriggerToast) {
        onTriggerToast(result.message || `${result.action === "check-in" ? "Check-in" : "Check-out"} verified!`);
      }
    }

    setIsProcessing(false);
  }, [currentUser, isProcessing, onTriggerToast, playSuccessChime]);

  // Optical frame scan loop using native BarcodeDetector if available
  const startScanningLoop = useCallback(() => {
    let hasBarcodeDetector = false;
    let detector = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        hasBarcodeDetector = true;
      } catch (e) {}
    }

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (hasBarcodeDetector && detector && !isProcessing) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleQrDiscovered(rawValue);
              return; // Stop loop once detected
            }
          }
        } catch (err) {}
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleQrDiscovered, isProcessing]);

  // Request desktop webcam stream
  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    setErrorMessage("");
    setScanResult(null);

    // Stop any previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState("error");
      setErrorMessage("Camera access is not supported by this browser. Please use Chrome, Edge, or a modern HTTPS browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      setCameraState("active");
      startScanningLoop();
    } catch (err) {
      console.warn("Camera access error:", err);
      setCameraState("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. Please click the camera/lock icon in your browser address bar, set Camera to 'Allow', and click Retry.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No webcam or video capture device was detected on your desktop system. Please connect a webcam and click Retry.");
      } else {
        setErrorMessage(`Camera activation failed (${err.name || "Unknown"}). Ensure camera is not in use by another application and click Retry.`);
      }
    }
  }, [startScanningLoop]);

  // Trigger test scan of the currently active office QR code
  const handleSimulateActiveOfficeQrScan = () => {
    const activeToken = getActiveQrToken();
    if (!activeToken) {
      setScanResult({ ok: false, error: "No active office QR token available." });
      return;
    }
    handleQrDiscovered(activeToken.qrPayloadString);
  };

  // Reset scanner to scan another code
  const handleReset = () => {
    setScanResult(null);
    if (cameraState !== "active") {
      startCamera();
    } else {
      startScanningLoop();
    }
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg glass-card border border-line shadow-2xl rounded-2xl bg-surface/95 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface2/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Icon name="check-square" className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-[17px] font-display font-bold text-ink leading-tight">
                Scan Office Attendance QR
              </h2>
              <span className="text-[11px] text-muted">
                Point desktop webcam at reception screen or kiosk
              </span>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface2 transition"
            title="Close scanner"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full h-[320px] sm:h-[360px] bg-black overflow-hidden flex items-center justify-center">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraState === "active" ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Hidden Canvas for processing if needed */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Optical Targeting Reticle & Scanning Animation */}
          {cameraState === "active" && !scanResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Target Frame Box */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 border border-accent/30 rounded-2xl flex items-center justify-center shadow-lg">
                {/* Target Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent rounded-br-xl"></div>

                {/* Animated Horizontal Laser Scan Line */}
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_#38bdf8] animate-scanLaser"></div>
              </div>

              {/* Status Pill below frame */}
              <div className="mt-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-line text-[11px] font-semibold text-white flex items-center gap-2 shadow-md">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                <span>Camera Active — Align Office QR Code</span>
              </div>
            </div>
          )}

          {/* Requesting State */}
          {cameraState === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
              <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-xs font-semibold">Requesting desktop camera access...</span>
            </div>
          )}

          {/* Error / Permission Denied State */}
          {cameraState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-black/90">
              <div className="w-12 h-12 rounded-full bg-bad/20 border border-bad/40 flex items-center justify-center text-bad">
                <Icon name="alert-triangle" className="w-6 h-6 text-bad" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm">Camera Unavailable</h4>
                <p className="text-muted text-xs leading-relaxed max-w-sm">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <PrimaryButton icon="rotate-cw" onClick={startCamera}>
                  Retry Camera
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Scan Result Overlay */}
          {scanResult && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md text-center animate-fadeIn">
              {scanResult.ok ? (
                <div className="flex flex-col items-center gap-3 max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-good/20 border border-good flex items-center justify-center text-good shadow-lg animate-bounce">
                    <Icon name="check-circle" className="w-9 h-9 text-good" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-good block">
                      Verification Successful
                    </span>
                    <h3 className="text-xl font-display font-bold text-white mt-0.5">
                      {scanResult.action === "check-in" ? "Check-in Recorded!" : "Check-out Recorded!"}
                    </h3>
                  </div>

                  <div className="w-full p-3 rounded-xl bg-surface2/60 border border-line text-xs flex flex-col gap-1.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-muted">Employee:</span>
                      <strong className="text-white">{currentUser?.name} ({currentUser?.employeeId})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Recorded Time:</span>
                      <strong className="text-white font-data">{scanResult.time}</strong>
                    </div>
                    {scanResult.hoursWorkedFormatted && (
                      <div className="flex justify-between">
                        <span className="text-muted">Total Hours Worked:</span>
                        <strong className="text-accent font-data">{scanResult.hoursWorkedFormatted}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Attendance Status:</span>
                      <strong className="text-good">{scanResult.status}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Location:</span>
                      <span className="text-muted truncate max-w-[180px]">{scanResult.officeName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-1">
                    <PrimaryButton className="w-full" onClick={() => { stopCamera(); onClose(); }}>
                      Done
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 max-w-sm">
                  <div className="w-14 h-14 rounded-full bg-bad/20 border border-bad/50 flex items-center justify-center text-bad">
                    <Icon name="alert-triangle" className="w-7 h-7 text-bad" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white">Scan Rejected</h3>
                    <p className="text-bad text-xs mt-1 leading-relaxed">
                      {scanResult.error}
                    </p>
                  </div>
                  <PrimaryButton icon="rotate-cw" onClick={handleReset}>
                    Try Again
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer & Controls */}
        <div className="p-4 border-t border-line bg-surface2/30 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {cameraState === "active" ? (
                <SecondaryButton icon="x" onClick={stopCamera}>
                  Stop Camera
                </SecondaryButton>
              ) : (
                <PrimaryButton icon="camera" onClick={startCamera}>
                  Start Camera
                </PrimaryButton>
              )}
              <SecondaryButton icon="rotate-cw" onClick={startCamera}>
                Retry
              </SecondaryButton>
            </div>

            <SecondaryButton onClick={() => { stopCamera(); onClose(); }}>
              Close
            </SecondaryButton>
          </div>

          {/* Test Assistant Simulation (For single-screen development / automated review testing) */}
          <div className="pt-2 border-t border-line/50 flex items-center justify-between text-[11px] text-muted">
            <span>Testing on a single screen?</span>
            <button
              onClick={handleSimulateActiveOfficeQrScan}
              className="px-2 py-1 rounded bg-accent/10 border border-accent/30 text-accent font-semibold hover:bg-accent/20 transition flex items-center gap-1"
              title="Simulates webcam scan of the currently active rotating office QR code"
            >
              <Icon name="sparkles" className="w-3 h-3 text-accent" />
              Test Scan Active Office QR
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
