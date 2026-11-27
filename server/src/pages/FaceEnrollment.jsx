// src/pages/FaceEnrollment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw, Trash2, ShieldCheck, KeyRound, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { faceApi } from '../api/index.js';
import { WebcamCapture } from '../components/WebcamCapture.jsx';
import { ConsentModal } from '../components/ConsentModal.jsx';
import { Card } from '../components/common/Card.jsx';
import { Input } from '../components/common/Input.jsx';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';

const POSES = [
  { id: 'straight', label: '1. Look Straight', required: true, guide: 'Look straight into the lens with neutral expression' },
  { id: 'left', label: '2. Turn Head Left', required: true, guide: 'Turn head ~25° left while staying inside the oval' },
  { id: 'right', label: '3. Turn Head Right', required: true, guide: 'Turn head ~25° right while staying inside the oval' },
  { id: 'up', label: '4. Tilt Slightly Up', required: true, guide: 'Tilt chin slightly up toward the ceiling' },
  { id: 'down', label: '5. Tilt Slightly Down', required: true, guide: 'Tilt chin slightly down toward your chest' },
  { id: 'smile', label: '6. Clear Smile (Liveness)', required: false, guide: 'Optional 6th live frame: smile naturally at the camera' },
  { id: 'blink', label: '7. Blink Pose (Liveness)', required: false, guide: 'Optional 7th live frame: slight head shift / natural expression' }
];

export function FaceEnrollment() {
  const { user, isHR, needsFaceEnrollment, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [targetEmployeeId, setTargetEmployeeId] = useState(user?.employee_id || 'EMP-1187');
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState({});
  const [consentGranted, setConsentGranted] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Authorization mode for non-HR self-enrollment: OTP or HR Approval
  const [authMethod, setAuthMethod] = useState('OTP'); // 'OTP' | 'HR_APPROVAL'
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [otpSending, setOtpSending] = useState(false);

  const fetchStatus = async (empId) => {
    setLoadingStatus(true);
    try {
      const res = await faceApi.getStatus(empId);
      setEnrollmentStatus(res);
      setConsentGranted(!!res.consent);
    } catch (err) {
      console.warn('Could not fetch face status:', err);
      setEnrollmentStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (user) {
      setTargetEmployeeId(user.employee_id);
      fetchStatus(user.employee_id);
    }
  }, [user]);

  const handleCapturePhoto = (base64) => {
    const currentPose = POSES[currentStepIndex];
    setCapturedPhotos(prev => ({
      ...prev,
      [currentPose.id]: base64
    }));

    showToast(`Captured ${currentPose.label}`, 'good');

    if (currentStepIndex < POSES.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleRequestEnrollOtp = async () => {
    setOtpSending(true);
    try {
      const res = await faceApi.requestEnrollOtp(targetEmployeeId);
      setOtpSessionId(res.otpSessionId);
      setDemoOtpHint(res.demoOtp || '');
      showToast(res.message || '6-digit enrollment OTP sent.', 'info');
    } catch (err) {
      showToast(err.message || 'Could not send enrollment OTP', 'bad');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmitEnrollment = async () => {
    if (!consentGranted) {
      setShowConsentModal(true);
      return;
    }

    if (!isHR && authMethod === 'OTP' && (!otpSessionId || otpCode.trim().length < 6)) {
      showToast('Send and enter the 6-digit OTP first, or choose HR Approval.', 'warn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await faceApi.enroll({
        employeeId: targetEmployeeId,
        photos: capturedPhotos,
        consent: {
          granted: true,
          version: '2026.1-DPDP-IN',
          timestamp: new Date().toISOString()
        },
        otpSessionId: !isHR && authMethod === 'OTP' ? otpSessionId : undefined,
        otpCode: !isHR && authMethod === 'OTP' ? otpCode : undefined,
        requestHrApproval: !isHR && authMethod === 'HR_APPROVAL'
      });

      showToast(res.message, 'good');
      await fetchStatus(targetEmployeeId);
      await refreshUser();
      setCapturedPhotos({});
      setCurrentStepIndex(0);
      setOtpSessionId('');
      setOtpCode('');
      setDemoOtpHint('');

      if (targetEmployeeId === user?.employee_id) {
        navigate('/');
      }
    } catch (err) {
      if (err.data?.pose) {
        const badIndex = POSES.findIndex(p => p.id === err.data.pose);
        if (badIndex >= 0) {
          setCurrentStepIndex(badIndex);
        }
      }
      showToast(err.message || 'Face enrollment failed. Verify lighting and live camera.', 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaceData = async () => {
    if (!window.confirm(`Permanently delete biometric vectors for employee ${targetEmployeeId}?`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await faceApi.deleteFace(targetEmployeeId);
      showToast(res.message, 'info');
      await fetchStatus(targetEmployeeId);
      await refreshUser();
      setCapturedPhotos({});
      setCurrentStepIndex(0);
      setConsentGranted(false);
    } catch (err) {
      showToast(err.message || 'Failed to delete face data', 'bad');
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentPose = POSES[currentStepIndex];
  const requiredCaptured = POSES.filter(p => p.required).every(p => Boolean(capturedPhotos[p.id]));
  const totalCapturedCount = Object.keys(capturedPhotos).length;

  return (
    <div className="space-y-5">
      {needsFaceEnrollment && (
        <div className="p-4 rounded-tpl bg-accent/10 border border-accent/40 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-ink">
            <span className="font-bold block text-accent">Live Biometric Enrollment (Camera Only — Zero Raw Photo Storage)</span>
            Capture 5–7 live face angles below. Every frame is checked by MiniFASNet anti-spoofing, converted into AES-256 encrypted 128-d embeddings, and verified by OTP or HR approval.
          </div>
        </div>
      )}

      {/* Status Banner & HR Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-tpl flex items-center justify-center shrink-0 ${
              enrollmentStatus?.enrollmentStatus === 'APPROVED'
                ? 'bg-good/15 text-good border border-good/40'
                : enrollmentStatus?.enrollmentStatus === 'PENDING_HR'
                  ? 'bg-warn/15 text-warn border border-warn/40'
                  : 'bg-surface2 text-muted border border-line'
            }`}>
              {enrollmentStatus?.enrollmentStatus === 'APPROVED' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[12px] text-muted">
                Enrollment Status for {enrollmentStatus?.name || targetEmployeeId}
              </div>
              <div className="text-[14px] font-bold text-ink">
                {loadingStatus
                  ? 'Checking enrollment status...'
                  : enrollmentStatus?.enrollmentStatus === 'APPROVED'
                    ? `Active (${enrollmentStatus.posesCount} Encrypted Vectors · No Raw Photos)`
                    : enrollmentStatus?.enrollmentStatus === 'PENDING_HR'
                      ? `Pending HR Admin Approval (${enrollmentStatus.posesCount} Angles Captured)`
                      : 'Not Yet Enrolled'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            {isHR && (
              <select
                value={targetEmployeeId}
                onChange={e => {
                  setTargetEmployeeId(e.target.value);
                  fetchStatus(e.target.value);
                  setCapturedPhotos({});
                  setCurrentStepIndex(0);
                }}
                className="px-3 py-2 rounded-tpl bg-surface2 border border-line text-xs font-semibold text-ink focus:outline-none focus:border-accent"
              >
                <option value="EMP-1187">Lokesh Kumar Duba (EMP-1187)</option>
                <option value="MGR-1042">Priya Nair (MGR-1042)</option>
                <option value="HR-1001">Rohit Verma (HR-1001)</option>
              </select>
            )}

            {enrollmentStatus?.faceEnrolled && isHR && (
              <button
                onClick={handleDeleteFaceData}
                disabled={deleteLoading}
                className="px-3.5 py-2 rounded-tpl bg-bad/15 border border-bad/30 text-bad text-xs font-semibold hover:bg-bad/25 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteLoading ? 'Deleting...' : 'Delete Vectors'}
              </button>
            )}

            {!consentGranted && (
              <SecondaryButton
                onClick={() => setShowConsentModal(true)}
                size="sm"
              >
                <ShieldCheck className="w-4 h-4 text-accent" />
                View Biometric Consent
              </SecondaryButton>
            )}
          </div>
        </div>
      </Card>

      {/* 5-7 Step Live Guided Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Live Webcam Only */}
        <div className="lg:col-span-7">
          <Card
            title={`Step ${currentStepIndex + 1} of 7: ${currentPose.label}`}
            subtext="Live webcam required — file uploads are blocked and every frame undergoes MiniFASNet liveness checks"
            action={
              <StatusPill
                status={requiredCaptured ? 'good' : 'info'}
                label={`${totalCapturedCount}/7 captured (5 min)`}
              />
            }
          >
            <WebcamCapture
              onCapture={handleCapturePhoto}
              guideText={currentPose.guide}
              captureLabel={`Capture ${currentPose.label}`}
            />
          </Card>
        </div>

        {/* Right: Checklist + OTP / HR Verification */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Live Angle & Liveness Checklist"
            subtext="5 core poses required + 2 optional expression checks. Raw images are discarded after vector extraction."
          >
            <div className="space-y-2">
              {POSES.map((pose, idx) => {
                const captured = capturedPhotos[pose.id];
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={pose.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`p-2.5 rounded-tpl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-accent/10 border-accent/60 shadow-sm'
                        : captured
                          ? 'bg-surface2 border-line/60 hover:bg-surface2/80'
                          : 'bg-surface2/30 border-line/30 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {captured ? (
                        <img
                          src={captured}
                          alt={pose.id}
                          className="w-9 h-9 rounded-tpl object-cover border border-line shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-tpl bg-surface flex items-center justify-center text-muted border border-line text-xs font-mono font-bold shrink-0">
                          0{idx + 1}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-ink flex items-center gap-1.5 truncate">
                          {pose.label}
                          {!pose.required && <span className="text-[10px] text-muted font-normal">(Optional)</span>}
                          {captured && <CheckCircle2 className="w-3.5 h-3.5 text-good shrink-0" />}
                        </div>
                        <div className="text-[11px] text-muted truncate">{pose.guide}</div>
                      </div>
                    </div>

                    <span className="text-[11px] text-accent font-semibold shrink-0">
                      {captured ? 'Retake' : isCurrent ? 'Active' : 'Select'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Authorization gate (OTP or HR Approval for self-service enrollment) */}
            {!isHR ? (
              <div className="mt-4 pt-3 border-t border-line/40 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Enrollment Verification Method
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('OTP')}
                    className={`p-2.5 rounded-tpl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      authMethod === 'OTP' ? 'bg-accent/15 border-accent text-accent' : 'bg-surface2/40 border-line text-muted'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    6-Digit OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('HR_APPROVAL')}
                    className={`p-2.5 rounded-tpl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      authMethod === 'HR_APPROVAL' ? 'bg-accent/15 border-accent text-accent' : 'bg-surface2/40 border-line text-muted'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    HR Approval
                  </button>
                </div>

                {authMethod === 'OTP' ? (
                  <div className="space-y-2 p-3 rounded-tpl bg-surface2/40 border border-line">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted">Verify via one-time OTP to activate immediately</span>
                      <SecondaryButton
                        type="button"
                        size="sm"
                        onClick={handleRequestEnrollOtp}
                        disabled={otpSending}
                      >
                        {otpSending ? 'Sending...' : otpSessionId ? 'Resend OTP' : 'Send OTP'}
                      </SecondaryButton>
                    </div>
                    {demoOtpHint && (
                      <div className="text-[11px] px-2.5 py-1.5 rounded bg-accent/10 border border-accent/30 text-ink flex justify-between">
                        <span>Dev Sandbox OTP:</span>
                        <span className="font-mono font-bold text-accent tracking-widest">{demoOtpHint}</span>
                      </div>
                    )}
                    <Input
                      id="enroll-otp"
                      label="Enter 6-Digit Enrollment OTP"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="123456"
                      icon={KeyRound}
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-tpl bg-surface2/40 border border-line text-[11px] text-muted leading-relaxed">
                    Your encrypted biometric vectors will be queued with status <span className="font-semibold text-ink">PENDING_HR</span>. Face 2FA activates once an HR Admin approves the enrollment.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-line/40 text-[11px] text-good flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                HR Admin privileges: enrollment activates immediately upon submission.
              </div>
            )}

            <div className="pt-3 border-t border-line/40 space-y-2 mt-3">
              <PrimaryButton
                disabled={!requiredCaptured || submitting}
                onClick={handleSubmitEnrollment}
                className="w-full"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {submitting
                  ? 'Verifying Liveness & Encrypting Vectors...'
                  : !isHR && authMethod === 'HR_APPROVAL'
                    ? 'Submit Vectors for HR Approval'
                    : 'Encrypt Embeddings & Activate Face 2FA'}
              </PrimaryButton>

              {!requiredCaptured && (
                <div className="text-[11px] text-center text-muted">
                  Capture at least the 5 required directional angles (steps 1–5) using the live camera.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={() => {
          setConsentGranted(true);
          setShowConsentModal(false);
          showToast('Biometric consent recorded (DPDP Act 2023)', 'good');
        }}
        employeeName={user?.name}
        employeeId={targetEmployeeId}
      />
    </div>
  );
}

export default FaceEnrollment;
