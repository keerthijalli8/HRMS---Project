// src/components/LivenessChallenge.jsx
// Server-assigned active liveness challenge verifier (Zero client bypasses).
// Captures [baselineFrame, peakChallengeFrame, finalStraightFrame] for server-side anti-replay & MiniFASNet checks.
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Smile, ArrowLeft, ArrowRight, ArrowDown, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

const CHALLENGE_META = {
  blink_twice: { label: 'Blink your eyes twice clearly', icon: Eye },
  turn_left: { label: 'Turn head slightly left, then look straight', icon: ArrowLeft },
  turn_right: { label: 'Turn head slightly right, then look straight', icon: ArrowRight },
  smile: { label: 'Show a clear smile, then look straight', icon: Smile },
  nod: { label: 'Nod head down slightly, then look straight', icon: ArrowDown }
};

export function LivenessChallenge({
  challengeType = 'blink_twice',
  challengeExpiresAt = null,
  liveDetection,
  captureSnapshot,
  onChallengeSuccess,
  onRefreshChallenge,
  resetKey = 0
}) {
  const [passed, setPassed] = useState(false);
  const [subHint, setSubHint] = useState('Look straight at the camera to begin...');
  const [secondsLeft, setSecondsLeft] = useState(null);

  const onSuccessRef = useRef(onChallengeSuccess);
  onSuccessRef.current = onChallengeSuccess;
  const captureSnapshotRef = useRef(captureSnapshot);
  captureSnapshotRef.current = captureSnapshot;

  // Tracking refs per active challenge attempt
  const baselineFrameRef = useRef(null);
  const peakFrameRef = useRef(null);
  const baselineEarRef = useRef(null);
  const earSamplesRef = useRef([]);
  const eyeClosedRef = useRef(false);
  const blinkCountRef = useRef(0);
  const sawPeakRef = useRef(false);
  const baselinePitchRef = useRef(null);
  const peakPitchRef = useRef(null);
  const pitchSamplesRef = useRef([]);

  const meta = CHALLENGE_META[challengeType] || CHALLENGE_META.blink_twice;
  const IconComponent = meta.icon;

  // Challenge countdown clock (45s server TTL)
  useEffect(() => {
    if (!challengeExpiresAt) {
      setSecondsLeft(null);
      return;
    }
    const updateClock = () => {
      const remaining = Math.max(0, Math.ceil((challengeExpiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    updateClock();
    const timer = setInterval(updateClock, 500);
    return () => clearInterval(timer);
  }, [challengeExpiresAt]);

  // Reset tracking state when challenge or resetKey changes
  useEffect(() => {
    setPassed(false);
    setSubHint('Look straight at the camera to calibrate...');
    baselineFrameRef.current = null;
    peakFrameRef.current = null;
    baselineEarRef.current = null;
    earSamplesRef.current = [];
    eyeClosedRef.current = false;
    blinkCountRef.current = 0;
    sawPeakRef.current = false;
    baselinePitchRef.current = null;
    peakPitchRef.current = null;
    pitchSamplesRef.current = [];
  }, [challengeType, resetKey]);

  const finishChallenge = () => {
    const snap = captureSnapshotRef.current?.();
    const f0 = baselineFrameRef.current || snap;
    const f1 = peakFrameRef.current || snap;
    const f2 = snap || f1;
    const frames = [f0, f1, f2].filter(Boolean);

    setPassed(true);
    setSubHint('Active challenge + sequence frames captured');
    if (onSuccessRef.current) {
      onSuccessRef.current({ challengeType, frames });
    }
  };

  useEffect(() => {
    if (passed || !liveDetection) return;
    if (secondsLeft === 0) {
      setSubHint('Challenge expired — click refresh to get a new challenge.');
      return;
    }

    if (liveDetection.faceCount < 1) {
      setSubHint('Center your face in the oval guide...');
      return;
    }

    const { ear, yawRatio, pitchRatio, happyScore } = liveDetection;

    // Capture clean baseline frame on initial center gaze
    if (!baselineFrameRef.current) {
      const snap = captureSnapshotRef.current?.();
      if (snap) baselineFrameRef.current = snap;
    }

    if (challengeType === 'blink_twice') {
      if (baselineEarRef.current === null) {
        if (typeof ear === 'number' && !Number.isNaN(ear) && ear > 0.10) {
          earSamplesRef.current.push(ear);
          if (earSamplesRef.current.length >= 3) {
            const avg = earSamplesRef.current.reduce((a, b) => a + b, 0) / earSamplesRef.current.length;
            baselineEarRef.current = avg;
          }
        }
        setSubHint('Keep eyes open briefly to calibrate...');
        return;
      }

      if (!eyeClosedRef.current && ear >= baselineEarRef.current * 0.90) {
        baselineEarRef.current = baselineEarRef.current * 0.85 + ear * 0.15;
      }
      const closeThresh = baselineEarRef.current * 0.84;
      const openThresh = baselineEarRef.current * 0.92;

      if (!eyeClosedRef.current) {
        setSubHint(`Blinks completed: ${blinkCountRef.current} / 2 — blink clearly`);
        if (ear < closeThresh) {
          eyeClosedRef.current = true;
          const peakSnap = captureSnapshotRef.current?.();
          if (peakSnap) peakFrameRef.current = peakSnap;
        }
      } else if (ear >= openThresh) {
        eyeClosedRef.current = false;
        blinkCountRef.current += 1;
        setSubHint(`Blinks completed: ${blinkCountRef.current} / 2`);
        if (blinkCountRef.current >= 2) {
          finishChallenge();
        }
      }
      return;
    }

    if (challengeType === 'turn_left') {
      if (!sawPeakRef.current) {
        setSubHint('Turn your head slightly left...');
        if (yawRatio <= 0.41) {
          sawPeakRef.current = true;
          const peakSnap = captureSnapshotRef.current?.();
          if (peakSnap) peakFrameRef.current = peakSnap;
          setSubHint('Left turn captured! Look straight again...');
        }
      } else if (yawRatio >= 0.44 && yawRatio <= 0.64) {
        finishChallenge();
      }
      return;
    }

    if (challengeType === 'turn_right') {
      if (!sawPeakRef.current) {
        setSubHint('Turn your head slightly right...');
        if (yawRatio >= 0.59) {
          sawPeakRef.current = true;
          const peakSnap = captureSnapshotRef.current?.();
          if (peakSnap) peakFrameRef.current = peakSnap;
          setSubHint('Right turn captured! Look straight again...');
        }
      } else if (yawRatio >= 0.36 && yawRatio <= 0.56) {
        finishChallenge();
      }
      return;
    }

    if (challengeType === 'smile') {
      if (!sawPeakRef.current) {
        setSubHint(`Smile naturally (${Math.round((happyScore || 0) * 100)}% / 45%)...`);
        if ((happyScore || 0) >= 0.45) {
          sawPeakRef.current = true;
          const peakSnap = captureSnapshotRef.current?.();
          if (peakSnap) peakFrameRef.current = peakSnap;
          setSubHint('Smile captured! Relax face to look straight...');
        }
      } else if ((happyScore || 0) <= 0.32) {
        finishChallenge();
      }
      return;
    }

    if (challengeType === 'nod') {
      if (baselinePitchRef.current === null) {
        if (typeof pitchRatio === 'number' && !Number.isNaN(pitchRatio)) {
          pitchSamplesRef.current.push(pitchRatio);
          if (pitchSamplesRef.current.length >= 3) {
            const avg = pitchSamplesRef.current.reduce((a, b) => a + b, 0) / pitchSamplesRef.current.length;
            baselinePitchRef.current = avg;
          }
        }
        setSubHint('Look straight briefly to calibrate head level...');
        return;
      }

      if (!sawPeakRef.current) {
        setSubHint('Nod chin downward gently...');
        if (pitchRatio >= baselinePitchRef.current + 0.055) {
          sawPeakRef.current = true;
          peakPitchRef.current = pitchRatio;
          const peakSnap = captureSnapshotRef.current?.();
          if (peakSnap) peakFrameRef.current = peakSnap;
          setSubHint('Nod detected! Raise head straight...');
        }
      } else if (pitchRatio <= (peakPitchRef.current || baselinePitchRef.current + 0.05) - 0.03) {
        finishChallenge();
      }
    }
  }, [liveDetection, passed, challengeType, secondsLeft]);

  const isExpired = !passed && secondsLeft === 0;

  return (
    <div className="w-full p-2 sm:p-2.5 rounded-xl bg-surface2/60 border border-line flex items-center justify-between gap-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            passed
              ? 'bg-good/20 text-good'
              : isExpired
                ? 'bg-bad/20 text-bad'
                : 'bg-accent/20 text-accent animate-pulse'
          }`}
        >
          {passed ? <CheckCircle2 className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-wider text-muted leading-none">
            <span>Liveness Challenge</span>
            {secondsLeft !== null && !passed && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border ${secondsLeft <= 10 ? 'border-bad/40 text-bad' : 'border-line text-muted'}`}>
                <Clock className="w-2.5 h-2.5" />
                {secondsLeft}s
              </span>
            )}
          </div>
          <div className="text-[12px] sm:text-[12.5px] font-semibold text-ink truncate mt-0.5">
            {passed ? 'Challenge Verified — Ready' : meta.label}
          </div>
          <div className={`text-[10px] sm:text-[10.5px] truncate ${isExpired ? 'text-bad font-medium' : 'text-muted'}`}>
            {subHint}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!passed ? (
          onRefreshChallenge && (
            <button
              type="button"
              onClick={onRefreshChallenge}
              className="p-1.5 rounded-lg bg-surface border border-line text-muted hover:text-ink transition-colors"
              title="Request Fresh Challenge Token"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )
        ) : (
          <div className="px-2 py-0.5 rounded-full bg-good/15 text-good text-[11px] font-medium border border-good/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-good" />
            Live
          </div>
        )}
      </div>
    </div>
  );
}

export default LivenessChallenge;
