// src/components/WebcamCapture.jsx
import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Camera, RefreshCw, Sun, VideoOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './common/Buttons.jsx';
import { ensureFaceModelsLoaded, detectLiveFaces } from '../utils/faceDetector.js';

// Serialize getUserMedia across React StrictMode double-mounts so hardware never locks up
let cameraInitQueue = Promise.resolve();

export const WebcamCapture = forwardRef(function WebcamCapture({
  onCapture,
  onDetectionUpdate,
  guideText = 'Align your face inside the frame',
  requireLiveness = false,
  livenessPassed = true,
  captureLabel = 'Capture Face Scan',
  compact = false,
  className = ''
}, ref) {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const lightCanvasRef = useRef(null);
  const detectionFrameCountRef = useRef(0);
  const lastBrightnessRef = useRef(128);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const onDetectionUpdateRef = useRef(onDetectionUpdate);
  const lastSingleFaceAtRef = useRef(0);

  onDetectionUpdateRef.current = onDetectionUpdate;

  const [error, setError] = useState(null);
  const [errorActionUrl, setErrorActionUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [fallbackReady, setFallbackReady] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState(128);
  const [facingMode, setFacingMode] = useState('user');
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [retryCounter, setRetryCounter] = useState(0);

  const [liveState, setLiveState] = useState({
    faceCount: 0,
    tooSmall: false,
    statusText: 'Initializing camera & AI face detector...',
    statusTone: 'warn',
    readyToCapture: false
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const acquireCamera = async () => {
      if (!mountedRef.current || cancelled) return;
      setLoading(true);
      setError(null);
      setErrorActionUrl(null);
      setFallbackReady(false);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled && mountedRef.current) {
          const isHttpLan =
            window.location.protocol === 'http:' &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1';

          if (isHttpLan) {
            // Browsers strictly block navigator.mediaDevices on unencrypted LAN IPs.
            // Automatically transfer to localhost so the camera directly opens without stopping or asking.
            try {
              let hashPayload = window.location.hash || '';
              const pendingRaw = sessionStorage.getItem('hrms_pending_2fa');
              if (pendingRaw && !hashPayload.includes('p2fa=')) {
                hashPayload = `#p2fa=${encodeURIComponent(pendingRaw)}`;
              }
              const target = `http://localhost:${window.location.port || '5174'}${window.location.pathname}${window.location.search}${hashPayload}`;
              window.location.replace(target);
              return;
            } catch {
              // fallback below if replace fails
            }
          }

          setError(
            'Camera API (navigator.mediaDevices.getUserMedia) is unavailable in this browser context. Please use Chrome, Edge, or Firefox over http://localhost or HTTPS.'
          );
          setLoading(false);
        }
        return;
      }

      const tryConstraintsList = selectedDeviceId
        ? [
            { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 960 }, height: { ideal: 720 } }, audio: false },
            { video: { deviceId: { exact: selectedDeviceId } }, audio: false },
            { video: true, audio: false }
          ]
        : [
            { video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 } }, audio: false },
            { video: { facingMode }, audio: false },
            { video: true, audio: false }
          ];

      let mediaStream = null;
      let lastError = null;

      for (const constraints of tryConstraintsList) {
        if (cancelled || !mountedRef.current) break;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
          if (
            err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError' ||
            err.name === 'NotFoundError' ||
            err.name === 'DevicesNotFoundError'
          ) {
            break;
          }
        }
      }

      if (cancelled || !mountedRef.current) {
        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
        }
        return;
      }

      if (!mediaStream) {
        const err = lastError || new Error('Failed to open webcam stream');
        console.error('Camera access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(
            'Camera permission was denied. Click the camera/lock icon in your browser address bar, set Camera to Allow, and click Retry.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera detected on this device. Connect a webcam (or check Windows Camera privacy settings) and click Retry.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError(
            'Camera hardware is busy or blocked by another app (or Windows Privacy Settings). Close other video apps, check Settings > Privacy > Camera, and click Retry.'
          );
        } else {
          setError(`Unable to access webcam (${err.name || 'Error'}: ${err.message || 'Check hardware connection'}).`);
        }
        setLoading(false);
        return;
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch {
          // autoPlay will handle playback once metadata arrives
        }
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        if (!cancelled && mountedRef.current) {
          setVideoDevices(cams);
          if (!selectedDeviceId && cams.length > 0) {
            const activeTrack = mediaStream.getVideoTracks()[0];
            const activeId = activeTrack?.getSettings?.()?.deviceId;
            if (activeId) setSelectedDeviceId(activeId);
          }
        }
      } catch {
        // Device enumeration optional
      }

      if (!cancelled && mountedRef.current) {
        setLoading(false);
      }
    };

    cameraInitQueue = cameraInitQueue.then(acquireCamera, acquireCamera);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      stopCamera();
    };
  }, [facingMode, selectedDeviceId, retryCounter, stopCamera]);

  // Ensure video element always binds to the active stream ref even across React fast-refreshes/re-renders
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  // Load local face detection models
  useEffect(() => {
    let active = true;
    ensureFaceModelsLoaded()
      .then(() => {
        if (active) setModelsReady(true);
      })
      .catch(err => {
        console.error('Failed to load face detection models:', err);
        if (active) setFallbackReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // For enrollment profile poses (left/right/up/down), allow server YuNet to adjudicate after 3s if browser TinyFaceDetector misses tilted angles
  useEffect(() => {
    if (loading || error || requireLiveness) return;
    const t = setTimeout(() => {
      setFallbackReady(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [loading, error, requireLiveness]);

  // Fast recursive detection loop (runs at ~12-15 FPS without overlapping inferences)
  useEffect(() => {
    if (loading || error || !modelsReady) return;

    let cancelled = false;
    let timeoutId = null;

    const runDetectionFrame = async () => {
      if (cancelled) return;

      const video = videoRef.current;
      const overlay = overlayCanvasRef.current;
      const lightCanvas = lightCanvasRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          detectionFrameCountRef.current += 1;
          let avgBrightness = lastBrightnessRef.current;

          // Sample ambient brightness every 8 frames to eliminate GPU-to-CPU stall overhead
          if (lightCanvas && detectionFrameCountRef.current % 8 === 1) {
            const lctx = lightCanvas.getContext('2d', { willReadFrequently: true });
            if (lctx) {
              if (lightCanvas.width !== 160 || lightCanvas.height !== 120) {
                lightCanvas.width = 160;
                lightCanvas.height = 120;
              }
              lctx.drawImage(video, 0, 0, 160, 120);
              const frame = lctx.getImageData(0, 0, 160, 120).data;
              let sum = 0;
              for (let i = 0; i < frame.length; i += 16) {
                sum += 0.299 * frame[i] + 0.587 * frame[i + 1] + 0.114 * frame[i + 2];
              }
              avgBrightness = Math.round(sum / (frame.length / 16));
              lastBrightnessRef.current = avgBrightness;
              if (!cancelled) setBrightnessLevel(avgBrightness);
            }
          }

          const det = await detectLiveFaces(video);
          if (cancelled) return;

          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (overlay) {
            if (overlay.width !== vw || overlay.height !== vh) {
              overlay.width = vw;
              overlay.height = vh;
            }
            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, vw, vh);

            const boxes = det.faceCount === 1 && det.box ? [det.box] : det.allBoxes || [];
            const lowLight = avgBrightness < 25;
            const highLight = avgBrightness > 238;
            const tooSmall = det.faceCount === 1 && det.box && det.box.width / vw < 0.10;

            const boxColor =
              det.faceCount !== 1
                ? '#fda4af'
                : lowLight || highLight || tooSmall
                ? '#fcd34d'
                : '#6ee7d0';

            for (const b of boxes) {
              const corner = Math.max(14, Math.min(28, b.width * 0.18));
              ctx.strokeStyle = boxColor;
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';

              ctx.beginPath();
              ctx.moveTo(b.x, b.y + corner);
              ctx.lineTo(b.x, b.y);
              ctx.lineTo(b.x + corner, b.y);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(b.x + b.width - corner, b.y);
              ctx.lineTo(b.x + b.width, b.y);
              ctx.lineTo(b.x + b.width, b.y + corner);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(b.x, b.y + b.height - corner);
              ctx.lineTo(b.x, b.y + b.height);
              ctx.lineTo(b.x + corner, b.y + b.height);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(b.x + b.width - corner, b.y + b.height);
              ctx.lineTo(b.x + b.width, b.y + b.height);
              ctx.lineTo(b.x + b.width, b.y + b.height - corner);
              ctx.stroke();
            }

            const now = Date.now();
            if (det.faceCount === 1) {
              lastSingleFaceAtRef.current = now;
            }
            const withinGrace = det.faceCount === 0 && now - lastSingleFaceAtRef.current < 1500;

            let statusText = guideText;
            let statusTone = 'good';
            let readyToCapture = true;

            if (det.faceCount === 0 && !withinGrace) {
              statusText = fallbackReady
                ? 'Look at the camera — ready for server verification'
                : 'Face not detected — look at the camera';
              statusTone = fallbackReady ? 'warn' : 'bad';
              readyToCapture = fallbackReady;
            } else if (tooSmall) {
              statusText = 'Move closer — face is too far from camera';
              statusTone = 'warn';
              readyToCapture = false;
            } else if (lowLight) {
              statusText = 'Low light — move to a brighter area';
              statusTone = 'warn';
              readyToCapture = false;
            } else if (highLight) {
              statusText = 'Overexposed — avoid bright backlight';
              statusTone = 'warn';
              readyToCapture = false;
            }

            setLiveState({
              faceCount: det.faceCount === 0 && withinGrace ? 1 : det.faceCount,
              tooSmall: Boolean(tooSmall),
              statusText,
              statusTone,
              readyToCapture
            });

            if (onDetectionUpdateRef.current) {
              onDetectionUpdateRef.current({
                ...det,
                brightness: avgBrightness,
                tooSmall: Boolean(tooSmall),
                readyToCapture
              });
            }
          }
        } catch (err) {
          console.warn('Live face detection frame skipped:', err);
        }
      }

      if (!cancelled) {
        timeoutId = setTimeout(runDetectionFrame, 25);
      }
    };

    timeoutId = setTimeout(runDetectionFrame, 40);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, error, modelsReady, guideText, fallbackReady]);

  const captureRawFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return null;
    const video = videoRef.current;
    const maxW = 960;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const scale = vw > maxW ? maxW / vw : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  useImperativeHandle(ref, () => ({
    captureSnapshot: captureRawFrame
  }), [captureRawFrame]);

  const captureFrame = () => {
    const base64 = captureRawFrame();
    if (base64 && onCapture) {
      onCapture(base64);
    }
    return base64;
  };

  const toggleCamera = () => {
    setSelectedDeviceId('');
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleRetryCamera = () => {
    setRetryCounter(c => c + 1);
  };

  const canCapture =
    !loading &&
    !error &&
    (modelsReady ? (liveState.readyToCapture || (!requireLiveness && fallbackReady)) : fallbackReady) &&
    (!requireLiveness || livenessPassed);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <canvas ref={lightCanvasRef} className="hidden" />

      {/* Camera Selector when multiple webcams are available */}
      {videoDevices.length > 1 && (
        <div className="w-full mb-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted font-medium shrink-0">Active Camera:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-tpl bg-surface2 border border-line text-ink text-xs focus:outline-none focus:border-accent truncate"
          >
            {videoDevices.map((dev, idx) => (
              <option key={dev.deviceId} value={dev.deviceId}>
                {dev.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Viewport */}
      <div
        className={`relative w-full overflow-hidden rounded-tpl bg-black/40 border border-line flex items-center justify-center shadow-inner ${
          compact ? 'h-[165px] sm:h-[185px]' : 'aspect-[4/3]'
        }`}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80 z-20">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
            <span className="text-sm text-muted">Requesting webcam access...</span>
          </div>
        )}

        {error && (
          <div className="p-6 text-center space-y-4 max-w-md z-20">
            <VideoOff className="w-12 h-12 text-bad mx-auto opacity-80" />
            <div className="text-xs text-bad leading-relaxed">{error}</div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <SecondaryButton onClick={handleRetryCamera} size="sm">
                Retry Camera Access
              </SecondaryButton>
              {errorActionUrl && (
                <a
                  href={errorActionUrl}
                  className="px-3 py-1.5 rounded-tpl bg-accent text-on-accent text-xs font-bold hover:brightness-105 transition-all"
                >
                  Open via localhost
                </a>
              )}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
            loading || error ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Mirrored AI Face Detection Box Overlay */}
        {!loading && !error && (
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none z-10"
          />
        )}

        {/* Biometric Oval Guide & Live Status Pills */}
        {!loading && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
            <div
              className={`relative rounded-[50%] border-2 border-dashed transition-colors duration-200 flex items-center justify-center overflow-hidden ${
                compact ? 'w-[54%] h-[88%]' : 'w-[68%] h-[82%]'
              } ${
                liveState.statusTone === 'good'
                  ? 'border-good/80 shadow-[0_0_0_9999px_rgba(6,20,28,0.45)]'
                  : liveState.statusTone === 'warn'
                  ? 'border-warn/80 shadow-[0_0_0_9999px_rgba(6,20,28,0.52)]'
                  : 'border-bad/75 shadow-[0_0_0_9999px_rgba(6,20,28,0.58)]'
              }`}
            >
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent scanner-laser" />
            </div>

            {/* Real-time AI Feedback Banner */}
            <div
              className={`absolute top-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border text-[11px] font-medium flex items-center gap-1.5 shadow-md ${
                liveState.statusTone === 'good'
                  ? 'border-good/50 text-good'
                  : liveState.statusTone === 'warn'
                  ? 'border-warn/50 text-warn'
                  : 'border-bad/50 text-bad'
              }`}
            >
              {liveState.statusTone === 'good' ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              ) : (
                <ShieldAlert className="w-3 h-3 shrink-0" />
              )}
              <span>{modelsReady ? liveState.statusText : 'Loading AI face detector...'}</span>
            </div>

            {/* Bottom Lighting Pill */}
            <div className="absolute bottom-2 flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-line text-[10px] font-mono text-muted flex items-center gap-1">
                <Sun
                  className={`w-3 h-3 ${
                    brightnessLevel < 25 || brightnessLevel > 238 ? 'text-warn' : 'text-good'
                  }`}
                />
                <span>
                  {brightnessLevel < 25
                    ? 'Low Light'
                    : brightnessLevel > 238
                    ? 'Too Bright'
                    : `Lighting OK (${brightnessLevel})`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className={`w-full ${compact ? 'mt-2' : 'mt-4'} flex items-center justify-between gap-2 px-0.5`}>
        <SecondaryButton
          onClick={toggleCamera}
          disabled={loading || !!error}
          title="Switch Camera"
          size="sm"
          className={compact ? 'p-1.5 h-8 w-8 flex items-center justify-center' : ''}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </SecondaryButton>

        <PrimaryButton
          onClick={captureFrame}
          disabled={!canCapture}
          className={`flex-1 ${compact ? 'py-1.5 text-xs font-bold h-8 flex items-center justify-center gap-1.5' : ''}`}
        >
          <Camera className="w-3.5 h-3.5" />
          {!modelsReady && !fallbackReady
            ? 'Loading Face AI...'
            : liveState.faceCount > 1
            ? 'Only 1 Face Allowed'
            : liveState.faceCount !== 1 && !fallbackReady
            ? 'Waiting for Single Face...'
            : requireLiveness && !livenessPassed
            ? 'Complete Liveness Challenge Above'
            : captureLabel}
        </PrimaryButton>
      </div>
    </div>
  );
});

export default WebcamCapture;
