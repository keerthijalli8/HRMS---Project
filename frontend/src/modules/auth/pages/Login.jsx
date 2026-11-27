// src/pages/Login.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  Camera,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  KeyRound,
  CalendarCheck,
  FileText,
  Sun,
  Moon,
  Globe,
  HelpCircle,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { getHomeRouteForRoles } from '../../../auth/roles.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons.jsx';
import { WebcamCapture } from '../components/WebcamCapture.jsx';
import { LivenessChallenge } from '../components/LivenessChallenge.jsx';
import { authApi } from '../../../api/index.js';

// Multilingual translations dictionary (English, Hindi, Telugu)
const i18n = {
  en: {
    heroHeadline: 'Your work day,',
    heroHeadlineHighlight: 'in one place.',
    heroSubtitle: 'Mark attendance, apply for leave and view payslips, securely with face verification.',
    featFaceTitle: 'Face Attendance',
    featFaceDesc: 'Contactless 1:1 biometric sign-in with live active anti-spoof checks.',
    featLeaveTitle: 'Leave & Approvals',
    featLeaveDesc: 'Apply for leave, check balance quotas and track real-time manager approvals.',
    featPayTitle: 'Payslips',
    featPayDesc: 'Download salary slips, view tax deductions, and access Form 16 anytime.',
    step1: 'Credentials',
    step2: 'Face verification',
    cardTitle: 'Sign in to your account',
    cardSubtitle: 'Enter your official company credentials to continue',
    labelEmail: 'Work Email or Employee ID',
    labelPassword: 'Password',
    placeholderEmail: 'name@technomold.in',
    placeholderPassword: 'Enter your password',
    rememberTitle: 'Remember this device',
    rememberSub: 'Only on your personal device',
    forgotPassword: 'Forgot password?',
    btnSubmit: 'Sign in & verify face',
    cameraNotice: "You'll be asked to allow camera access for face verification.",
    orContinueWith: 'or continue with',
    ssoMicrosoft: 'Microsoft 365',
    ssoGoogle: 'Google',
    statusOperational: 'All systems operational',
    helpSupport: 'Need help? Contact support@technomold.in'
  },
  hi: {
    heroHeadline: 'आपका कार्य दिवस,',
    heroHeadlineHighlight: 'एक ही स्थान पर।',
    heroSubtitle: 'चेहरा प्रमाणीकरण के साथ सुरक्षित रूप से उपस्थिति दर्ज करें, छुट्टी के लिए आवेदन करें और वेतन पर्ची देखें।',
    featFaceTitle: 'फेस अटेंडेंस',
    featFaceDesc: 'लाइव एंटी-स्पूफ सुरक्षा के साथ संपर्क रहित 1:1 बायोमेट्रिक साइन-इन।',
    featLeaveTitle: 'छुट्टी और अनुमोदन',
    featLeaveDesc: 'छुट्टी आवेदन करें, कोटा बैलेंस जांचें और रीयल-टाइम अनुमोदन ट्रैक करें।',
    featPayTitle: 'वेतन पर्ची (पेस्लिप)',
    featPayDesc: 'सैलरी स्लिप डाउनलोड करें, टैक्स कटौती देखें और फॉर्म 16 प्राप्त करें।',
    step1: 'क्रेडेंशियल्स',
    step2: 'फेस वेरिफिकेशन',
    cardTitle: 'अपने खाते में साइन इन करें',
    cardSubtitle: 'जारी रखने के लिए आधिकारिक कंपनी विवरण दर्ज करें',
    labelEmail: 'कार्य ईमेल या कर्मचारी आईडी',
    labelPassword: 'पासवर्ड',
    placeholderEmail: 'name@technomold.in',
    placeholderPassword: 'अपना पासवर्ड दर्ज करें',
    rememberTitle: 'यह डिवाइस याद रखें',
    rememberSub: 'केवल आपके व्यक्तिगत डिवाइस पर',
    forgotPassword: 'पासवर्ड भूल गए?',
    btnSubmit: 'साइन इन करें और चेहरा सत्यापित करें',
    cameraNotice: 'चेहरा सत्यापन के लिए आपसे कैमरा अनुमति मांगी जाएगी।',
    orContinueWith: 'या जारी रखें',
    ssoMicrosoft: 'माइक्रोसॉफ्ट 365',
    ssoGoogle: 'गूगल',
    statusOperational: 'सभी प्रणालियां सामान्य रूप से कार्यरत हैं',
    helpSupport: 'सहायता चाहिए? support@technomold.in पर संपर्क करें'
  },
  te: {
    heroHeadline: 'మీ పని దినం,',
    heroHeadlineHighlight: 'ఒకే చోట.',
    heroSubtitle: 'ముఖ గుర్తింపుతో సురక్షితంగా హాజరు నమోదు చేయండి, సెలవులకు దరఖాస్తు చేసుకోండి మరియు పేస్లిప్‌లను చూడండి.',
    featFaceTitle: 'ఫేస్ అటెండెన్స్',
    featFaceDesc: 'లైవ్ యాంటీ-స్పూఫ్ రక్షణతో కాంటాక్ట్‌లెస్ 1:1 బయోమెట్రిక్ సైన్-ఇన్.',
    featLeaveTitle: 'సెలవులు & ఆమోదాలు',
    featLeaveDesc: 'సెలవులకు దరఖాస్తు చేయండి, బ్యాలెన్స్ కోటాను తనిఖీ చేయండి మరియు మేనేజర్ ఆమోదాలను ట్రాక్ చేయండి.',
    featPayTitle: 'పేస్లిప్‌లు',
    featPayDesc: 'జీతం స్లిప్‌లను డౌన్‌లోడ్ చేయండి, పన్ను వివరాలను తనిఖీ చేయండి మరియు ఫారం 16 పొందండి.',
    step1: 'వివరాలు',
    step2: 'ఫేస్ వెరిఫికేషన్',
    cardTitle: 'మీ ఖాతాలోకి సైన్ ఇన్ చేయండి',
    cardSubtitle: 'కొనసాగించడానికి అధికారిక కంపెనీ వివరాలను నమోదు చేయండి',
    labelEmail: 'వర్క్ ఈమెయిల్ లేదా ఉద్యోగి ID',
    labelPassword: 'పాస్‌వర్డ్',
    placeholderEmail: 'name@technomold.in',
    placeholderPassword: 'మీ పాస్‌వర్డ్ నమోదు చేయండి',
    rememberTitle: 'ఈ పరికరాన్ని గుర్తుంచుకోండి',
    rememberSub: 'మీ వ్యక్తిగత పరికరంలో మాత్రమే',
    forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    btnSubmit: 'సైన్ ఇన్ చేసి ముఖాన్ని ధృవీకరించండి',
    cameraNotice: 'ముఖ ధృవీకరణ కోసం కెమెరా అనుమతి అభ్యర్థించబడుతుంది.',
    orContinueWith: 'లేదా వీటితో కొనసాగించండి',
    ssoMicrosoft: 'మైక్రోసాఫ్ట్ 365',
    ssoGoogle: 'గూగుల్',
    statusOperational: 'అన్ని వ్యవస్థలు సాధారణంగా పనిచేస్తున్నాయి',
    helpSupport: 'సహాయం కావాలా? support@technomold.in సంప్రదించండి'
  }
};

export function Login() {
  const {
    user,
    isAuthenticated,
    needsFaceEnrollment,
    login,
    refreshChallenge,
    completeFaceLogin,
    pending2FA,
    setPending2FA
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const submittingRef = useRef(false);

  // Localization & Theme state
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hrms_theme') || 'dark';
  });
  const t = i18n[lang] || i18n.en;

  // Apply theme to document root whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('hrms_theme', theme);
  }, [theme]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // If already authenticated, redirect to enrollment (if required) or highest-priority role dashboard
  useEffect(() => {
    if (isAuthenticated || user) {
      navigate(needsFaceEnrollment ? '/enroll' : getHomeRouteForRoles(user?.roles), { replace: true });
    }
  }, [isAuthenticated, user, needsFaceEnrollment, navigate]);

  // Password state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showPwdHint, setShowPwdHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2FA Face Verification state
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [liveDetection, setLiveDetection] = useState(null);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [livenessFrames, setLivenessFrames] = useState([]);
  const [livenessResetKey, setLivenessResetKey] = useState(0);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Forgot Password state
  const [forgotState, setForgotState] = useState({
    active: false,
    step: 'email', // 'email' | 'code' | 'password'
    email: '',
    otpSessionId: '',
    otpCode: '',
    demoOtp: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
    showNewPassword: false,
    showConfirmPassword: false,
    loading: false,
    error: '',
    timer: 0
  });

  // Countdown timer for code resend
  useEffect(() => {
    if (!forgotState.active || forgotState.timer <= 0) return;
    const interval = setInterval(() => {
      setForgotState((prev) => ({
        ...prev,
        timer: Math.max(0, prev.timer - 1)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [forgotState.active, forgotState.timer]);

  const handleForgotSendCode = async (e) => {
    if (e) e.preventDefault();
    if (!forgotState.email || !forgotState.email.trim()) {
      setForgotState(prev => ({ ...prev, error: 'Please enter your registered work email or employee ID.' }));
      return;
    }
    setForgotState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await authApi.forgotPasswordRequestCode(forgotState.email.trim());
      setForgotState(prev => ({
        ...prev,
        loading: false,
        step: 'code',
        otpSessionId: res.otpSessionId,
        demoOtp: res.demoOtp || '',
        email: res.email || prev.email,
        timer: 60,
        error: ''
      }));
      showToast('Verification code dispatched to your email!', 'good');
    } catch (err) {
      setForgotState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to send verification code.' }));
    }
  };

  const handleForgotVerifyCode = async (e) => {
    if (e) e.preventDefault();
    if (!forgotState.otpCode || forgotState.otpCode.trim().length !== 6) {
      setForgotState(prev => ({ ...prev, error: 'Please enter the 6-digit verification code.' }));
      return;
    }
    setForgotState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await authApi.forgotPasswordVerifyCode(forgotState.otpSessionId, forgotState.otpCode.trim());
      setForgotState(prev => ({
        ...prev,
        loading: false,
        step: 'password',
        resetToken: res.resetToken,
        error: ''
      }));
      showToast('Verification code confirmed! Now enter your new password.', 'good');
    } catch (err) {
      setForgotState(prev => ({ ...prev, loading: false, error: err.message || 'Verification failed.' }));
    }
  };

  const handleForgotResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotState.newPassword) {
      setForgotState(prev => ({ ...prev, error: 'Please enter a new password.' }));
      return;
    }
    if (forgotState.newPassword.length < 8) {
      setForgotState(prev => ({ ...prev, error: 'Password must be at least 8 characters long.' }));
      return;
    }
    if (!/[0-9]/.test(forgotState.newPassword) || !/[^a-zA-Z0-9]/.test(forgotState.newPassword)) {
      setForgotState(prev => ({ ...prev, error: 'Password must include at least one number and one symbol.' }));
      return;
    }
    if (forgotState.newPassword !== forgotState.confirmPassword) {
      setForgotState(prev => ({ ...prev, error: 'Passwords do not match. Please check and retype.' }));
      return;
    }

    setForgotState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await authApi.forgotPasswordReset(
        forgotState.resetToken,
        forgotState.newPassword,
        forgotState.confirmPassword
      );
      showToast(res.message || 'Password reset successfully! Please sign in with your new password.', 'good');
      setIdentifier(forgotState.email);
      setPassword('');
      setForgotState({
        active: false,
        step: 'email',
        email: '',
        otpSessionId: '',
        otpCode: '',
        demoOtp: '',
        resetToken: '',
        newPassword: '',
        confirmPassword: '',
        showNewPassword: false,
        showConfirmPassword: false,
        loading: false,
        error: '',
        timer: 0
      });
    } catch (err) {
      setForgotState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to reset password.' }));
    }
  };

  // Caps lock listener
  const handleKeyActivity = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSelfUnlock = async () => {
    if (!identifier) {
      showToast('Please enter your Work Email or Employee ID first.', 'warn');
      return;
    }
    setUnlockLoading(true);
    try {
      const res = await authApi.unlockSelf(identifier, password);
      showToast(res.message || 'Account successfully unlocked! You can now sign in.', 'good');
      setErrorMessage('');
    } catch (err) {
      showToast(err.message || 'Failed to unlock account.', 'bad');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.requiresFace) {
        showToast('Password verified! Complete the live anti-spoof challenge to sign in.');
        setAttemptsRemaining(res.employee.failedAttemptsRemaining ?? null);
        setIsLocked(false);
        setFaceError('');
        setLivenessPassed(false);
        setLivenessFrames([]);
        setLivenessResetKey(k => k + 1);
      } else if (res.needsFaceEnrollment) {
        showToast('First-time setup: Enroll your face via live camera to protect your profile.', 'info');
        navigate('/enroll', { replace: true });
      } else {
        showToast(`Welcome back, ${res.user.name}!`);
        navigate(getHomeRouteForRoles(res.user?.roles), { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshChallenge = async () => {
    setFaceError('');
    try {
      await refreshChallenge();
      setLivenessPassed(false);
      setLivenessFrames([]);
      setLivenessResetKey(k => k + 1);
      showToast('Issued new one-time liveness challenge (45s TTL).', 'info');
    } catch (err) {
      setFaceError(err.message || 'Failed to refresh liveness challenge.');
    }
  };

  const executeFaceVerification = async (framesToVerify) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setFaceError('');
    setFaceLoading(true);

    try {
      const res = await completeFaceLogin(framesToVerify);
      const matchPct = Math.round((res.matchScore !== undefined ? res.matchScore : res.similarity || 0.95) * 100);
      const targetRoute = getHomeRouteForRoles(res.user?.roles);
      showToast(`Face verified (${matchPct}% match). Redirecting to Dashboard...`, 'good');
      navigate(targetRoute, { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== targetRoute) {
          window.location.replace(targetRoute);
        }
      }, 120);
    } catch (err) {
      const msg = err.message || 'Face verification failed. Please retry the live challenge.';
      showToast(msg, 'bad');

      const remaining = err.data?.attemptsRemaining !== undefined ? err.data.attemptsRemaining : attemptsRemaining;
      setAttemptsRemaining(remaining);

      if (err.data?.locked || (err.status === 403 && typeof remaining === 'number' && remaining <= 0)) {
        setIsLocked(true);
        setFaceError(err.message || 'Account has been locked for security. HR has been notified.');
      } else {
        setFaceError(msg);
        setLivenessPassed(false);
        setLivenessFrames([]);
        setLivenessResetKey(k => k + 1);
        try {
          await refreshChallenge();
        } catch (refreshErr) {
          if (refreshErr?.status === 401) {
            setPending2FA(null);
            setErrorMessage('Verification session expired. Please sign in again.');
          }
        }
      }
    } finally {
      submittingRef.current = false;
      setFaceLoading(false);
    }
  };

  const handleChallengeSuccess = async ({ frames }) => {
    let validFrames = frames || [];
    if (validFrames.length < 2) {
      const snap = webcamRef.current?.captureSnapshot();
      if (snap) {
        validFrames = [...validFrames, snap];
      }
    }
    setLivenessFrames(validFrames);
    setLivenessPassed(true);

    if (validFrames.length >= 2) {
      await executeFaceVerification(validFrames);
    }
  };

  const handleFaceCapture = async (finalFrameBase64) => {
    const sequenceFrames =
      livenessFrames.length >= 2
        ? [livenessFrames[0], livenessFrames[1], finalFrameBase64]
        : livenessFrames.length > 0
        ? [...livenessFrames, finalFrameBase64]
        : [finalFrameBase64];

    await executeFaceVerification(sequenceFrames);
  };

  const handleSkipFace = async () => {
    setFaceError('');
    setFaceLoading(true);
    try {
      const res = await completeFaceLogin(null, true);
      showToast(`Welcome back, ${res.user.name}!`);
      navigate(getHomeRouteForRoles(res.user?.roles), { replace: true });
    } catch (err) {
      setFaceError(err.message || 'Failed to skip face scan');
    } finally {
      setFaceLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative select-none">
      
      {/* ======================================================================
          TOP BAR: LANGUAGE SELECTOR & THEME TOGGLE
          ====================================================================== */}
      <header className="w-full max-w-6xl mx-auto px-5 py-[clamp(6px,1vh,12px)] flex items-center justify-end gap-2.5 z-20 flex-shrink-0">
        {/* Language Selector */}
        <div className="relative inline-flex items-center">
          <Globe className="w-3.5 h-3.5 text-accent absolute left-2.5 pointer-events-none" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Language selector"
            className="bg-surface backdrop-blur-md border border-line text-ink text-[clamp(11px,1.2vh,12.5px)] font-semibold pl-7 pr-6 py-[clamp(4px,0.7vh,6px)] rounded-full appearance-none cursor-pointer hover:border-accent transition-all focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="en" className="bg-bg text-ink">English</option>
            <option value="hi" className="bg-bg text-ink">हिन्दी (Hindi)</option>
            <option value="te" className="bg-bg text-ink">తెలుగు (Telugu)</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="bg-surface backdrop-blur-md border border-line text-ink text-[clamp(11px,1.2vh,12.5px)] font-semibold px-3 py-[clamp(4px,0.7vh,6px)] rounded-full inline-flex items-center gap-1.5 hover:border-accent transition-all focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-accent" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-warn" />
              <span>Light</span>
            </>
          )}
        </button>
      </header>

      {/* ======================================================================
          MAIN 2-COLUMN AUTH SECTION (FITS 100VH WITHOUT SCROLL)
          ====================================================================== */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-5 flex items-center justify-center overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-[clamp(20px,3.5vw,48px)] items-center max-h-full">
          
          {/* ==================================================================
              LEFT PANEL: HERO & BRAND (ANCHORED TO TOP, LARGER LOGO)
              ================================================================== */}
          <section className="flex flex-col self-start justify-start gap-[clamp(10px,1.8vh,20px)] py-1 min-w-0" aria-label="Technomold Overview">
            
            {/* Technomold Official High-Res Brand Logo */}
            <div className="inline-flex items-center self-start select-none" aria-label="Technomold IT Solutions Pvt Ltd">
              <img
                src="/technomold-logo-dark.png"
                alt="Technomold IT Solutions Pvt Ltd"
                className="hidden dark:block h-[clamp(50px,7.2vh,66px)] w-auto max-w-[340px] object-contain drop-shadow-sm"
              />
              <img
                src="/technomold-logo-light.png"
                alt="Technomold IT Solutions Pvt Ltd"
                className="block dark:hidden h-[clamp(50px,7.2vh,66px)] w-auto max-w-[340px] object-contain drop-shadow-sm"
              />
            </div>

            {/* Headline & Subtitle */}
            <div className="flex flex-col gap-[clamp(4px,0.8vh,8px)]">
              <h1 className="font-display font-bold text-[clamp(22px,3.4vh,36px)] text-ink leading-[1.12] tracking-tight">
                {t.heroHeadline} <br />
                <span className="bg-gradient-to-r from-accent via-emerald-200 to-accent2 bg-clip-text text-transparent">
                  {t.heroHeadlineHighlight}
                </span>
              </h1>
              <p className="text-[clamp(12px,1.5vh,13.5px)] text-ink/80 leading-relaxed max-w-md">
                {t.heroSubtitle}
              </p>
            </div>

            {/* 3 Feature Chips with Icons */}
            <div className="flex flex-col gap-[clamp(5px,0.9vh,8px)]" role="list">
              
              {/* Chip 1: Face Attendance */}
              <div className="flex items-center gap-3 bg-surface backdrop-blur-md border border-line rounded-xl px-3 py-[clamp(6px,1vh,9px)] hover:border-accent/40 transition-all">
                <div className="w-[clamp(28px,3.6vh,32px)] h-[clamp(28px,3.6vh,32px)] rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <Camera className="w-[clamp(15px,2vh,17px)] h-[clamp(15px,2vh,17px)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[clamp(11.5px,1.35vh,12.5px)] font-bold text-ink leading-tight">
                    {t.featFaceTitle}
                  </span>
                  <span className="text-[clamp(10.5px,1.2vh,11.5px)] text-muted leading-tight">
                    {t.featFaceDesc}
                  </span>
                </div>
              </div>

              {/* Chip 2: Leave & Approvals */}
              <div className="flex items-center gap-3 bg-surface backdrop-blur-md border border-line rounded-xl px-3 py-[clamp(6px,1vh,9px)] hover:border-accent2/40 transition-all">
                <div className="w-[clamp(28px,3.6vh,32px)] h-[clamp(28px,3.6vh,32px)] rounded-lg bg-accent2/15 border border-accent2/30 flex items-center justify-center text-accent2 shrink-0">
                  <CalendarCheck className="w-[clamp(15px,2vh,17px)] h-[clamp(15px,2vh,17px)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[clamp(11.5px,1.35vh,12.5px)] font-bold text-ink leading-tight">
                    {t.featLeaveTitle}
                  </span>
                  <span className="text-[clamp(10.5px,1.2vh,11.5px)] text-muted leading-tight">
                    {t.featLeaveDesc}
                  </span>
                </div>
              </div>

              {/* Chip 3: Payslips */}
              <div className="flex items-center gap-3 bg-surface backdrop-blur-md border border-line rounded-xl px-3 py-[clamp(6px,1vh,9px)] hover:border-good/40 transition-all">
                <div className="w-[clamp(28px,3.6vh,32px)] h-[clamp(28px,3.6vh,32px)] rounded-lg bg-good/15 border border-good/30 flex items-center justify-center text-good shrink-0">
                  <FileText className="w-[clamp(15px,2vh,17px)] h-[clamp(15px,2vh,17px)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[clamp(11.5px,1.35vh,12.5px)] font-bold text-ink leading-tight">
                    {t.featPayTitle}
                  </span>
                  <span className="text-[clamp(10.5px,1.2vh,11.5px)] text-muted leading-tight">
                    {t.featPayDesc}
                  </span>
                </div>
              </div>

            </div>

            {/* Left Panel Footer */}
            <footer className="flex items-center gap-2 text-[clamp(10px,1.15vh,11px)] text-muted flex-wrap">
              <span>&copy; 2026 Technomold IT Solutions Pvt Ltd</span>
              <span>&middot;</span>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Biometric vector templates are SHA-256 encrypted.'); }} className="hover:text-accent hover:underline">
                Privacy Policy
              </a>
              <span>&middot;</span>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Authorized company personnel and contractors only.'); }} className="hover:text-accent hover:underline">
                Terms
              </a>
            </footer>

          </section>

          {/* ==================================================================
              RIGHT PANEL: SIGN-IN CARD (ZERO-SCROLL COMPACT)
              ================================================================== */}
          <section className="w-full max-w-[430px] mx-auto" aria-label="Sign-in card">
            <div className={`bg-card-bg backdrop-blur-xl border border-line rounded-2xl shadow-2xl relative overflow-hidden flex flex-col ${
              pending2FA
                ? 'p-3 sm:p-3.5 gap-2 max-h-[calc(100dvh-75px)] justify-between'
                : 'p-[clamp(12px,2vh,20px)_clamp(14px,2vw,22px)] gap-[clamp(8px,1.4vh,13px)]'
            }`}>
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-accent2" />

              {/* Step Progression Indicator & Back Button */}
              {forgotState.active ? (
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface border border-line text-[clamp(10px,1.2vh,11px)] font-semibold text-muted">
                    <span className={`inline-flex items-center gap-1 ${forgotState.step === 'email' ? 'text-accent font-bold' : 'text-good'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${forgotState.step === 'email' ? 'bg-accent text-on-accent' : 'bg-good text-on-accent'}`}>1</span>
                      <span>Email</span>
                    </span>
                    <span className="opacity-50 text-[9px]">&rarr;</span>
                    <span className={`inline-flex items-center gap-1 ${forgotState.step === 'code' ? 'text-accent font-bold' : forgotState.step === 'password' ? 'text-good' : 'text-muted'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${forgotState.step === 'code' ? 'bg-accent text-on-accent' : forgotState.step === 'password' ? 'bg-good text-on-accent' : 'bg-surface2 text-muted'}`}>2</span>
                      <span>Verify</span>
                    </span>
                    <span className="opacity-50 text-[9px]">&rarr;</span>
                    <span className={`inline-flex items-center gap-1 ${forgotState.step === 'password' ? 'text-accent font-bold' : 'text-muted'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${forgotState.step === 'password' ? 'bg-accent text-on-accent' : 'bg-surface2 text-muted'}`}>3</span>
                      <span>Password</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setForgotState(prev => ({ ...prev, active: false }))}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface border border-line text-[clamp(10px,1.2vh,11px)] font-semibold text-muted">
                    <span className={`inline-flex items-center gap-1 ${!pending2FA ? 'text-accent font-bold' : 'text-good'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${!pending2FA ? 'bg-accent text-on-accent' : 'bg-good text-on-accent'}`}>1</span>
                      <span>{t.step1}</span>
                    </span>
                    <span className="opacity-50 text-[9px]">&rarr;</span>
                    <span className={`inline-flex items-center gap-1 ${pending2FA ? 'text-accent font-bold' : 'text-muted'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${pending2FA ? 'bg-accent text-on-accent' : 'bg-surface2 text-muted'}`}>2</span>
                      <span>{t.step2}</span>
                    </span>
                  </div>

                  {pending2FA && (
                    <button
                      type="button"
                      onClick={() => {
                        setPending2FA(null);
                        setFaceError('');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  )}
                </div>
              )}

              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-display font-extrabold text-[clamp(15px,2vh,19px)] text-ink tracking-tight">
                    {forgotState.active
                      ? forgotState.step === 'email'
                        ? 'Forgot Password'
                        : forgotState.step === 'code'
                        ? 'Enter Verification Code'
                        : 'Set New Password'
                      : pending2FA
                      ? `Step 2: Face Verification`
                      : t.cardTitle}
                  </h2>
                  <p className="text-[clamp(10.5px,1.2vh,11.5px)] text-ink/75 leading-tight">
                    {forgotState.active
                      ? forgotState.step === 'email'
                        ? 'Enter your registered work email to receive a 6-digit verification code.'
                        : forgotState.step === 'code'
                        ? `We sent a 6-digit verification code to ${forgotState.email}`
                        : 'Enter your new password below and confirm it.'
                      : pending2FA
                      ? `Identity verification for ${pending2FA.employee.name}`
                      : t.cardSubtitle}
                  </p>
                </div>
                {pending2FA && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-good/15 text-good border border-good/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
                    Live Active
                  </span>
                )}
              </div>

              {/* Accessible Error Alert Banner */}
              {(forgotState.active ? forgotState.error : errorMessage) && (
                <div role="alert" className="p-2.5 rounded-lg bg-bad/10 border border-bad/40 text-bad text-[11.5px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span className="font-bold block">{forgotState.active ? 'Password recovery error' : 'Authentication error'}</span>
                    <span>{forgotState.active ? forgotState.error : errorMessage}</span>
                    {!forgotState.active && errorMessage.toLowerCase().includes('locked') && (
                      <div className="mt-1.5 pt-1.5 border-t border-bad/20 flex items-center justify-between">
                        <span className="text-[10px] text-muted">Self-service:</span>
                        <button
                          type="button"
                          onClick={handleSelfUnlock}
                          disabled={unlockLoading}
                          className="px-2.5 py-0.5 rounded bg-accent text-on-accent text-[11px] font-bold hover:brightness-105"
                        >
                          {unlockLoading ? 'Unlocking...' : 'Unlock Account'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  STEP 1: CREDENTIALS FORM
                  ============================================================== */}
              {forgotState.active ? (
                /* ==============================================================
                    FORGOT PASSWORD MULTI-STEP FLOW (EMAIL -> OTP -> NEW PASSWORD)
                    ============================================================== */
                <div className="flex flex-col gap-[clamp(8px,1.4vh,12px)]">
                  {/* STEP 1: ENTER EMPLOYEE EMAIL */}
                  {forgotState.step === 'email' && (
                    <form onSubmit={handleForgotSendCode} className="flex flex-col gap-[clamp(8px,1.3vh,12px)]">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="forgotEmail" className="text-[clamp(11px,1.25vh,12px)] font-semibold text-ink">
                          Work Email or Employee ID
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 text-muted absolute left-2.5 pointer-events-none" />
                          <input
                            type="text"
                            id="forgotEmail"
                            required
                            autoFocus
                            value={forgotState.email}
                            onChange={(e) => setForgotState(prev => ({ ...prev, email: e.target.value, error: '' }))}
                            placeholder="e.g. aarav.mehta@company.in"
                            className="w-full bg-input-bg border border-line rounded-md text-ink text-[clamp(11.5px,1.35vh,13px)] pl-8 pr-3 py-[clamp(6px,0.9vh,8px)] placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotState.loading}
                        className="w-full bg-accent hover:bg-[#5eead4] active:scale-[0.99] text-on-accent font-bold text-[clamp(12px,1.4vh,13.5px)] py-[clamp(7px,1vh,9.5px)] px-4 rounded-md shadow-[0_4px_12px_rgba(110,231,208,0.28)] hover:shadow-[0_6px_18px_rgba(110,231,208,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {forgotState.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{forgotState.loading ? 'Sending code...' : 'Send Verification Code'}</span>
                      </button>

                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setForgotState(prev => ({ ...prev, active: false }))}
                          className="text-[clamp(10.5px,1.2vh,11.5px)] text-muted hover:text-ink hover:underline cursor-pointer"
                        >
                          Cancel and return to sign in
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: VERIFY CODE */}
                  {forgotState.step === 'code' && (
                    <form onSubmit={handleForgotVerifyCode} className="flex flex-col gap-[clamp(8px,1.3vh,12px)]">
                      {forgotState.demoOtp && (
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-[11px] text-accent">
                          <span>Demo verification code: <strong className="font-mono text-ink">{forgotState.demoOtp}</strong></span>
                          <button
                            type="button"
                            onClick={() => setForgotState(prev => ({ ...prev, otpCode: forgotState.demoOtp, error: '' }))}
                            className="font-bold underline hover:text-white cursor-pointer"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label htmlFor="forgotOtp" className="text-[clamp(11px,1.25vh,12px)] font-semibold text-ink">
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          id="forgotOtp"
                          required
                          autoFocus
                          maxLength={6}
                          value={forgotState.otpCode}
                          onChange={(e) => setForgotState(prev => ({ ...prev, otpCode: e.target.value.replace(/\D/g, ''), error: '' }))}
                          placeholder="000000"
                          className="w-full text-center tracking-[0.45em] font-mono text-[clamp(16px,2vh,20px)] font-bold bg-input-bg border border-line rounded-md text-ink py-[clamp(7px,1vh,9.5px)] placeholder:text-muted/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <button
                          type="button"
                          onClick={() => setForgotState(prev => ({ ...prev, step: 'email', error: '' }))}
                          className="hover:text-accent hover:underline cursor-pointer"
                        >
                          Change email
                        </button>
                        {forgotState.timer > 0 ? (
                          <span>Resend in {forgotState.timer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleForgotSendCode}
                            disabled={forgotState.loading}
                            className="text-accent font-semibold hover:underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={forgotState.loading || forgotState.otpCode.length !== 6}
                        className="w-full bg-accent hover:bg-[#5eead4] active:scale-[0.99] text-on-accent font-bold text-[clamp(12px,1.4vh,13.5px)] py-[clamp(7px,1vh,9.5px)] px-4 rounded-md shadow-[0_4px_12px_rgba(110,231,208,0.28)] hover:shadow-[0_6px_18px_rgba(110,231,208,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {forgotState.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{forgotState.loading ? 'Verifying code...' : 'Verify Code'}</span>
                      </button>
                    </form>
                  )}

                  {/* STEP 3: NEW PASSWORD & CONFIRM */}
                  {forgotState.step === 'password' && (
                    <form onSubmit={handleForgotResetPassword} className="flex flex-col gap-[clamp(6px,1.2vh,10px)]">
                      {/* New Password */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="newPassword" className="text-[clamp(11px,1.25vh,12px)] font-semibold text-ink">
                          New Password
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="w-4 h-4 text-muted absolute left-2.5 pointer-events-none" />
                          <input
                            type={forgotState.showNewPassword ? 'text' : 'password'}
                            id="newPassword"
                            required
                            autoFocus
                            value={forgotState.newPassword}
                            onChange={(e) => setForgotState(prev => ({ ...prev, newPassword: e.target.value, error: '' }))}
                            placeholder="Enter new password"
                            className="w-full bg-input-bg border border-line rounded-md text-ink text-[clamp(11.5px,1.35vh,13px)] pl-8 pr-9 py-[clamp(6px,0.9vh,8px)] placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setForgotState(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                            className="absolute right-2 text-muted hover:text-ink p-1 rounded transition-colors"
                          >
                            {forgotState.showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="text-[9.5px] text-ink/70">
                          Min 8 characters, include at least 1 number and 1 special symbol
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="confirmPassword" className="text-[clamp(11px,1.25vh,12px)] font-semibold text-ink">
                          Confirm New Password
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="w-4 h-4 text-muted absolute left-2.5 pointer-events-none" />
                          <input
                            type={forgotState.showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            required
                            value={forgotState.confirmPassword}
                            onChange={(e) => setForgotState(prev => ({ ...prev, confirmPassword: e.target.value, error: '' }))}
                            placeholder="Confirm new password"
                            className="w-full bg-input-bg border border-line rounded-md text-ink text-[clamp(11.5px,1.35vh,13px)] pl-8 pr-9 py-[clamp(6px,0.9vh,8px)] placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setForgotState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                            className="absolute right-2 text-muted hover:text-ink p-1 rounded transition-colors"
                          >
                            {forgotState.showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {forgotState.confirmPassword && (
                          <div className={`text-[10px] flex items-center gap-1 ${forgotState.newPassword === forgotState.confirmPassword ? 'text-good' : 'text-bad'}`}>
                            {forgotState.newPassword === forgotState.confirmPassword ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-good" />
                                <span>Passwords match</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-bad" />
                                <span>Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={forgotState.loading}
                        className="w-full bg-accent hover:bg-[#5eead4] active:scale-[0.99] text-on-accent font-bold text-[clamp(12px,1.4vh,13.5px)] py-[clamp(7px,1vh,9.5px)] px-4 rounded-md shadow-[0_4px_12px_rgba(110,231,208,0.28)] hover:shadow-[0_6px_18px_rgba(110,231,208,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                      >
                        {forgotState.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{forgotState.loading ? 'Updating password...' : 'Update Password & Sign In'}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : !pending2FA ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-[clamp(6px,1.2vh,11px)]" noValidate>
                  
                  {/* Work Email or Employee ID */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="workEmail" className="text-[clamp(11px,1.25vh,12px)] font-semibold text-ink">
                      {t.labelEmail}
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-muted absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        id="workEmail"
                        required
                        autoComplete="username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={t.placeholderEmail}
                        className="w-full bg-input-bg border border-line rounded-md text-ink text-[clamp(11.5px,1.35vh,13px)] pl-8 pr-3 py-[clamp(6px,0.9vh,8px)] placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password with Eye Toggle, Caps Lock & Hint */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="workPassword" className="text-[clamp(11px,1.25vh,12px)] font-semibold text-ink">
                      {t.labelPassword}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-muted absolute left-2.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="workPassword"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyActivity}
                        onKeyUp={handleKeyActivity}
                        onFocus={() => setShowPwdHint(true)}
                        onBlur={() => setShowPwdHint(false)}
                        placeholder={t.placeholderPassword}
                        className="w-full bg-input-bg border border-line rounded-md text-ink text-[clamp(11.5px,1.35vh,13px)] pl-8 pr-9 py-[clamp(6px,0.9vh,8px)] placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 text-muted hover:text-ink p-1 rounded transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Caps Lock Warning */}
                    {capsLockOn && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-200 bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 rounded-full self-start mt-0.5">
                        <span>Caps Lock is ON</span>
                      </div>
                    )}

                    {/* Short Hint on Focus */}
                    {showPwdHint && (
                      <div className="text-[10px] text-ink/75 leading-tight mt-0.5">
                        Minimum 8 characters, include a number and a symbol
                      </div>
                    )}
                  </div>

                  {/* Remember Device & Forgot Password */}
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <label className="inline-flex items-start gap-1.5 cursor-pointer text-[clamp(10.5px,1.2vh,11.5px)] text-ink/80 select-none">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="mt-0.5 rounded border-line bg-surface text-accent focus:ring-accent"
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="font-semibold text-ink">{t.rememberTitle}</span>
                        <span className="text-[9.5px] text-muted">{t.rememberSub}</span>
                      </div>
                    </label>

                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        setErrorMessage('');
                        setForgotState({
                          active: true,
                          step: 'email',
                          email: identifier.trim(),
                          otpSessionId: '',
                          otpCode: '',
                          demoOtp: '',
                          resetToken: '',
                          newPassword: '',
                          confirmPassword: '',
                          showNewPassword: false,
                          showConfirmPassword: false,
                          loading: false,
                          error: '',
                          timer: 0
                        });
                      }}
                      className="text-[clamp(10.5px,1.2vh,11.5px)] font-semibold text-accent hover:underline whitespace-nowrap cursor-pointer"
                    >
                      {t.forgotPassword}
                    </a>
                  </div>

                  {/* Primary Mint Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-[#5eead4] active:scale-[0.99] text-on-accent font-bold text-[clamp(12px,1.4vh,13.5px)] py-[clamp(7px,1vh,9.5px)] px-4 rounded-md shadow-[0_4px_12px_rgba(110,231,208,0.28)] hover:shadow-[0_6px_18px_rgba(110,231,208,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{loading ? 'Verifying...' : t.btnSubmit}</span>
                  </button>

                  {/* Camera Notice Under Button */}
                  <div className="flex items-center justify-center gap-1.5 text-[clamp(9.5px,1.1vh,10.5px)] text-ink/75 text-center mt-[-2px]">
                    <Camera className="w-3 h-3 text-accent shrink-0" />
                    <span>{t.cameraNotice}</span>
                  </div>

                </form>
              ) : (
                /* ==============================================================
                    STEP 2: 2FA LIVE FACE VERIFICATION (COMPACT ZERO-SCROLL)
                    ============================================================== */
                <div className="flex flex-col gap-2">
                  
                  {typeof attemptsRemaining === 'number' && attemptsRemaining <= 3 && (
                    <div className="p-2 rounded-md bg-warn/15 border border-warn/40 text-warn text-[11px] font-semibold flex items-center justify-between">
                      <span>Biometric Attempts Left:</span>
                      <span className="px-2 py-0.5 rounded bg-warn/20 text-warn font-bold">{attemptsRemaining}</span>
                    </div>
                  )}

                  {faceError && (
                    <div className="p-2 rounded-lg bg-bad/10 border border-bad/40 text-bad text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{faceError}</span>
                    </div>
                  )}

                  {isLocked ? (
                    <div className="p-3 rounded-xl bg-bad/10 border border-bad/40 text-center space-y-1.5">
                      <AlertCircle className="w-7 h-7 text-bad mx-auto" />
                      <div className="text-xs font-bold text-bad">Account Locked</div>
                      <p className="text-[11px] text-muted">
                        Failed maximum biometric attempts. HR notified.
                      </p>
                    </div>
                  ) : (
                    /* Biometric Face Verification View */
                    <div className="flex flex-col gap-1.5">
                      <LivenessChallenge
                        challengeType={pending2FA.challengeType}
                        challengeExpiresAt={pending2FA.challengeExpiresAt}
                        liveDetection={liveDetection}
                        captureSnapshot={() => webcamRef.current?.captureSnapshot()}
                        onChallengeSuccess={handleChallengeSuccess}
                        onRefreshChallenge={handleRefreshChallenge}
                        resetKey={livenessResetKey}
                      />
                      
                      <div className="relative">
                        {faceLoading && (
                          <div className="absolute inset-0 z-30 bg-[#06141c]/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-7 h-7 text-accent animate-spin" />
                            <span className="text-xs font-semibold text-ink">
                              Verifying Anti-Spoof & 1:1 Face Match...
                            </span>
                          </div>
                        )}
                        <WebcamCapture
                          ref={webcamRef}
                          compact={true}
                          onCapture={handleFaceCapture}
                          onDetectionUpdate={setLiveDetection}
                          requireLiveness={true}
                          livenessPassed={livenessPassed}
                          captureLabel="Verify Face & Complete Sign-in"
                          guideText="Center your face inside the circle"
                        />
                      </div>

                      {pending2FA.employee.facePolicy === 'OPTIONAL' && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleSkipFace}
                            disabled={faceLoading}
                            className="bg-white/5 hover:bg-white/10 border border-white/15 text-ink text-[11px] font-semibold py-1.5 px-3 rounded transition-all"
                          >
                            Skip Face Scan
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          </section>

        </div>
      </main>

      {/* ======================================================================
          FOOTER BAR: SYSTEM STATUS & SUPPORT
          ====================================================================== */}
      <footer className="w-full max-w-6xl mx-auto px-5 py-[clamp(5px,0.8vh,8px)] flex items-center justify-between text-[clamp(10px,1.15vh,11.5px)] text-muted border-t border-line/40 flex-shrink-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-good/10 border border-good/25 text-good text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-good shadow-[0_0_5px_#5eead4] animate-pulse" />
            <span>{t.statusOperational}</span>
          </div>
          <span>Technomold Face Attendance &middot; v2.6.4</span>
        </div>

        <div className="flex items-center gap-2">
          <a href="mailto:support@technomold.in" className="inline-flex items-center gap-1.5 text-ink/80 hover:text-accent transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.helpSupport}</span>
          </a>
        </div>
      </footer>

    </div>
  );
}

export default Login;
