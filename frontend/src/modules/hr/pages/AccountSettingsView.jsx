import React, { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { Select } from '../components/Select.jsx';

export const AccountSettingsView = ({ currentUser, onLogout, onTriggerToast }) => {
  const [activeTab, setActiveTab] = useState('security'); // 'security', 'password', 'contact', 'notifications', 'preferences', 'account'

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  // Email & Mobile settings
  const [currentEmail, setCurrentEmail] = useState(currentUser?.email || 'pooja.patel@nexora.in');
  const [newEmail, setNewEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(true);
  const [currentMobile, setCurrentMobile] = useState('+91 98450 12345');
  const [newMobile, setNewMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [mobileVerified, setMobileVerified] = useState(true);

  // Notifications preferences state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    attendanceAlerts: true,
    leaveAlerts: true,
    payrollAlerts: true,
    announcementAlerts: false
  });

  // Appearance & Preferences
  const [theme, setTheme] = useState('Monsoon Glass Dark');
  const [language, setLanguage] = useState('English (India)');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Active Sessions Mock Data
  const [sessions, setSessions] = useState([
    { id: 1, device: "MacBook Pro 16\" (Chrome 122)", ip: "106.51.72.19 (Bengaluru, IN)", lastActive: "Active Now", current: true },
    { id: 2, device: "iPhone 15 Pro (Safari Mobile)", ip: "49.37.158.22 (Bengaluru, IN)", lastActive: "2 hours ago", current: false },
    { id: 3, device: "Dell Precision Workstation (Firefox)", ip: "182.73.114.90 (Office LAN)", lastActive: "Yesterday at 6:45 PM", current: false }
  ]);

  // Password submission handler
  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword) {
      setPwError("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    setPwSuccess("Password successfully changed!");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onTriggerToast("Password changed successfully! A confirmation notice was sent to your email.");
  };

  const handleRevokeSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    onTriggerToast("Session revoked successfully.");
  };

  const handleRevokeOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.current));
    onTriggerToast("Logged out from all other active sessions.");
  };

  const handleSendOtp = () => {
    if (!newMobile || newMobile.length < 10) {
      onTriggerToast("Please enter a valid 10-digit mobile number");
      return;
    }
    setOtpSent(true);
    onTriggerToast(`6-digit OTP dispatched via SMS to ${newMobile}`);
  };

  const handleVerifyOtp = () => {
    if (otpValue === '123456' || otpValue.length === 6) {
      setCurrentMobile(newMobile);
      setNewMobile('');
      setOtpSent(false);
      setOtpValue('');
      setMobileVerified(true);
      onTriggerToast("Mobile number verified and updated successfully!");
    } else {
      onTriggerToast("Invalid OTP code. Please try 123456 for testing.");
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      onTriggerToast("Notification preferences updated.");
      return updated;
    });
  };

  const tabs = [
    { id: 'security', label: 'Security & Sessions', icon: 'shield' },
    { id: 'password', label: 'Change Password', icon: 'lock' },
    { id: 'contact', label: 'Email & Mobile', icon: 'mail' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'preferences', label: 'Appearance & Locale', icon: 'settings' },
    { id: 'account', label: 'Account Management', icon: 'user' }
  ];

  return (
    <div className="flex flex-col gap-5 animate-in fade-in">
      {/* Page Title & Navigation Pills */}
      <div className="glass-card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-line">
        <div>
          <h2 className="font-display font-bold text-xl text-ink">Account & Security Settings</h2>
          <p className="text-xs text-muted">Manage your authentication credentials, multi-factor settings, and preferences</p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-accent text-on-accent font-semibold shadow-sm'
                  : 'bg-surface2/60 text-muted hover:text-ink hover:bg-surface2'
              }`}
            >
              <Icon name={tab.icon} className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1: SECURITY & SESSIONS ================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="shield" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Security Overview</h3>
              </div>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-good font-semibold">SOC-2 Compliant</span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Last Successful Login</div>
                  <div className="text-muted text-[11px] mt-0.5 font-data">08 Nov 2026, 09:32 AM IST · IP 106.51.72.19</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-good" title="Successful"></span>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Two-Factor Authentication (2FA)</div>
                  <div className="text-muted text-[11px] mt-0.5">Mandatory corporate SMS / TOTP verification</div>
                </div>
                <span className="text-accent font-semibold">Enforced</span>
              </div>

              <div className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Password Age</div>
                  <div className="text-muted text-[11px] mt-0.5">Last updated 42 days ago (Expires every 90 days)</div>
                </div>
                <span className="text-good font-semibold">Healthy</span>
              </div>
            </div>
          </div>

          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Active Logged-In Sessions</h3>
              </div>
              <button
                onClick={handleRevokeOtherSessions}
                className="text-xs text-bad hover:underline font-medium"
              >
                Logout Others
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {sessions.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{s.device}</span>
                      {s.current && (
                        <span className="bg-good/20 text-good border border-good/40 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                    <div className="text-muted text-[11px] font-data mt-0.5">{s.ip} · {s.lastActive}</div>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-2.5 py-1 rounded bg-bad/15 text-bad border border-bad/30 hover:bg-bad/25 text-[11px] font-medium transition"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CHANGE PASSWORD ================= */}
      {activeTab === 'password' && (
        <div className="max-w-xl">
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="lock" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Change Account Password</h3>
              </div>
              <span className="text-[11px] text-muted">Min 8 characters</span>
            </div>

            {pwError && (
              <div className="p-3 rounded-xl bg-bad/15 border border-bad/40 text-bad text-xs flex items-center gap-2">
                <Icon name="shield" className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 rounded-xl bg-good/15 border border-good/40 text-good text-xs flex items-center gap-2">
                <Icon name="check" className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="text-muted block mb-1">Current Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1">New Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1">Confirm New Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-ink">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="rounded border-line bg-surface2 text-accent focus:ring-0"
                  />
                  <span>Show Passwords</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line/60">
                <PrimaryButton icon="lock" type="submit">
                  Update Password
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 3: EMAIL & MOBILE SETTINGS ================= */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Email Settings */}
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="mail" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Email Address Settings</h3>
              </div>
              {emailVerified && (
                <span className="glass-pill px-2 py-0.5 text-[11px] text-good font-semibold">Verified</span>
              )}
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Current Work Email</label>
                <div className="p-2.5 rounded-lg bg-surface2/40 border border-line font-data text-ink">
                  {currentEmail}
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Update Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name.new@nexora.in"
                  className="w-full bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newEmail || !newEmail.includes('@')) {
                    onTriggerToast("Please enter a valid work email address");
                    return;
                  }
                  onTriggerToast(`Verification link sent to ${newEmail}. Check your inbox.`);
                  setNewEmail('');
                }}
                className="w-full py-2 bg-surface2 border border-line text-ink hover:border-accent rounded-lg font-medium transition"
              >
                Send Verification Link
              </button>
            </div>
          </div>

          {/* Mobile Settings */}
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="phone" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Mobile Number & SMS OTP</h3>
              </div>
              {mobileVerified && (
                <span className="glass-pill px-2 py-0.5 text-[11px] text-good font-semibold">Verified</span>
              )}
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-muted block mb-1">Current Registered Mobile</label>
                <div className="p-2.5 rounded-lg bg-surface2/40 border border-line font-data text-ink">
                  {currentMobile}
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Update Mobile Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="flex-1 bg-surface2/60 border border-line rounded-lg px-3 py-2 text-ink focus:border-accent outline-none font-data"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3 py-2 bg-accent text-on-accent font-semibold rounded-lg hover:brightness-105 transition"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="p-3 rounded-xl bg-surface2/50 border border-line flex flex-col gap-2 mt-1">
                  <div className="text-[11px] text-muted">Enter 6-digit OTP code sent to your mobile (Demo: 123456):</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      placeholder="123456"
                      className="w-32 bg-surface2/80 border border-line rounded-lg px-3 py-1.5 text-center font-data text-ink text-base tracking-widest focus:border-accent outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="px-4 py-1.5 bg-good text-bg font-bold rounded-lg hover:brightness-105 transition text-xs"
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: NOTIFICATIONS ================= */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl">
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="bell" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Notification Preferences</h3>
              </div>
              <span className="text-[11px] text-muted">Real-time alerts</span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {[
                { key: 'emailAlerts', title: 'Corporate Email Notifications', desc: 'Critical alerts, HR circulars and password change notices' },
                { key: 'attendanceAlerts', title: 'Attendance & Punch Reminders', desc: 'Alerts when missing morning biometric punch or shift change' },
                { key: 'leaveAlerts', title: 'Leave Approvals & Status Updates', desc: 'Notifications on sick, casual and privilege leave workflows' },
                { key: 'payrollAlerts', title: 'Payroll & Salary Slip Releases', desc: 'Monthly payslip dispatch notification and Form 16 alerts' },
                { key: 'announcementAlerts', title: 'Town Hall & Social Announcements', desc: 'Company-wide town halls, cultural events and newsletters' }
              ].map(item => (
                <div key={item.key} className="p-3 rounded-xl bg-surface2/40 border border-line flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-ink">{item.title}</div>
                    <div className="text-muted text-[11px] mt-0.5">{item.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => toggleNotification(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: PREFERENCES ================= */}
      {activeTab === 'preferences' && (
        <div className="max-w-xl">
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="settings" className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-ink text-base">Appearance & Regional Settings</h3>
              </div>
              <span className="text-[11px] text-muted">India Locale</span>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="text-muted block mb-1">Theme Palette</label>
                <Select
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    onTriggerToast(`Theme changed to ${e.target.value}`);
                  }}
                >
                  <option value="Monsoon Glass Dark">Monsoon Glass Dark (Default)</option>
                  <option value="Slate Navy Pro">Slate Navy Pro</option>
                  <option value="Bengaluru Aurora">Bengaluru Aurora</option>
                </Select>
              </div>

              <div>
                <label className="text-muted block mb-1">Portal Language</label>
                <Select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    onTriggerToast(`Language preference set to ${e.target.value}`);
                  }}
                >
                  <option value="English (India)">English (India)</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                </Select>
              </div>

              <div>
                <label className="text-muted block mb-1">Date Format</label>
                <Select
                  value={dateFormat}
                  onChange={(e) => {
                    setDateFormat(e.target.value);
                    onTriggerToast(`Date format changed to ${e.target.value}`);
                  }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 08-Nov-2026)</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: ACCOUNT MANAGEMENT ================= */}
      {activeTab === 'account' && (
        <div className="max-w-xl">
          <div className="glass-card flex flex-col gap-4 border-bad/30">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="user" className="w-4 h-4 text-bad" />
                <h3 className="font-display font-bold text-ink text-base">Account Management</h3>
              </div>
              <span className="glass-pill px-2.5 py-0.5 text-xs text-good font-semibold">Status: Active</span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface2/40 border border-line flex flex-col gap-1">
                <div className="font-semibold text-ink">Sign Out From Current Session</div>
                <div className="text-muted text-[11px]">End your active session on this browser securely.</div>
                <div className="pt-2">
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 bg-surface2 border border-line hover:border-bad text-bad rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <Icon name="log-out" className="w-4 h-4 text-bad" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-bad/10 border border-bad/30 flex flex-col gap-1">
                <div className="font-semibold text-bad">Request Account Deactivation</div>
                <div className="text-muted text-[11px]">
                  Employee accounts are managed centrally under HR & IT policy. Raising a deactivation request alerts the HR Administrator to initiate offboarding procedures.
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to request account deactivation with HR?")) {
                        onTriggerToast("Deactivation request ticket #HR-OFF-882 logged with HR Administration.");
                      }
                    }}
                    className="px-3.5 py-1.5 bg-bad/20 text-bad hover:bg-bad/30 border border-bad/40 rounded-lg font-medium transition"
                  >
                    Request Deactivation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
