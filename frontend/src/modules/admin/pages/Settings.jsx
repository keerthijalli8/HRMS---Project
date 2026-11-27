
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../style/Settings.css";
import {
  defaultAdminProfile,
  readAdminProfile,
  saveAdminProfile
} from "../services/adminProfile";
import {
  readAttendanceSettings,
  saveAttendanceSettings,
} from "../services/attendanceSettings";
import {
  Building2,
  User,
  Clock,
  CalendarDays,
  Bell,
  ShieldCheck,
  Save
} from "lucide-react";

function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    ["Profile", "Security"].includes(searchParams.get("tab")) ? searchParams.get("tab") : "Company"
  );
  const [savedMessage, setSavedMessage] = useState("");
  const [savedAdminProfile] = useState(readAdminProfile);
  const [profilePhoto, setProfilePhoto] = useState(savedAdminProfile.photo);
  const [adminProfile, setAdminProfile] = useState({
    ...defaultAdminProfile,
    ...savedAdminProfile,
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    branch: ""
  });

  const [company, setCompany] = useState({
    name: "HRMS India",
    email: "admin@hrmsindia.com",
    phone: "+91 9876543210",
    address: "Hyderabad, Telangana, India"
  });

  const [workingHours, setWorkingHours] = useState(readAttendanceSettings);

  const [policies, setPolicies] = useState({
    casual: "12",
    sick: "10",
    earned: "15",
    notice: "30"
  });

  const [notifications, setNotifications] = useState({
    leave: true,
    attendance: true,
    payroll: true,
    email: false
  });

  const tabs = [
    { name: "Company", icon: Building2 },
    { name: "Profile", icon: User },
    { name: "Working Hours", icon: Clock },
    { name: "Leave Policy", icon: CalendarDays },
    { name: "Notifications", icon: Bell },
    { name: "Security", icon: ShieldCheck }
  ];

  const updateCompany = (field, value) => {
    setCompany(previous => ({ ...previous, [field]: value }));
  };

  const updateHours = (field, value) => {
    setWorkingHours(previous => ({ ...previous, [field]: value }));
  };

  const updatePolicies = (field, value) => {
    setPolicies(previous => ({ ...previous, [field]: value }));
  };

  const updateNotifications = (field, value) => {
    setNotifications(previous => ({ ...previous, [field]: value }));
  };

  const updateAdminProfile = (field, value) => {
    setAdminProfile(previous => ({ ...previous, [field]: value }));
  };

  const handleProfilePhotoChange = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSavedMessage("Please select an image file for the profile photo.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePhoto(reader.result);
        setSavedMessage("");
      }
    };
    reader.onerror = () => {
      setSavedMessage("Unable to read the selected profile photo.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeTab === "Working Hours") {
      try {
        setWorkingHours(saveAttendanceSettings(workingHours));
        setSavedMessage("Attendance timings saved in this browser.");
      } catch (error) {
        console.error("Unable to save attendance timings.", error);
        setSavedMessage(error.message || "Unable to save attendance timings.");
      }
      return;
    }

    if (activeTab === "Profile") {
      try {
        saveAdminProfile({ ...adminProfile, photo: profilePhoto });
        setSavedMessage(
          "Profile saved locally and shown in the dashboard. Bank details are not stored."
        );
      } catch (error) {
        console.error("Unable to save the admin profile.", error);
        setSavedMessage("Unable to save the admin profile in this browser.");
      }
      return;
    }

    setSavedMessage("Settings updated in this session.");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Company":
        return (
          <>
            <div className="settings-section-title">
              <h2>Company Information</h2>
              <p>Manage your organization details.</p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Company Name</label>
                <input
                  value={company.name}
                  onChange={e => updateCompany("name", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Company Email</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={e => updateCompany("email", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Contact Number</label>
                <input
                  value={company.phone}
                  onChange={e => updateCompany("phone", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Company Address</label>
                <input
                  value={company.address}
                  onChange={e => updateCompany("address", e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case "Profile":
        return (
          <>
            <div className="settings-section-title">
              <h2>Admin Profile</h2>
              <p>Manage the administrator account information.</p>
            </div>

            <div className="settings-profile-card">
              <div className="settings-profile-avatar">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Admin profile" />
                ) : (
                  adminProfile.name.trim().charAt(0).toUpperCase() || "A"
                )}
              </div>
              <div>
                <h3>{adminProfile.name || "Admin User"}</h3>
                <p>{adminProfile.id || adminProfile.email}</p>
                <p>{adminProfile.designation || "System Administrator"}</p>
                <p>{adminProfile.department || "Other"} department</p>
                <span>Administrator access</span>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Full Name</label>
                <input
                  value={adminProfile.name}
                  onChange={e => updateAdminProfile("name", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Admin ID</label>
                <input
                  value={adminProfile.id || ""}
                  onChange={e => updateAdminProfile("id", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={e => updateAdminProfile("email", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Designation</label>
                <input
                  value={adminProfile.designation}
                  onChange={e => updateAdminProfile("designation", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Department</label>
                <select
                  value={adminProfile.department || "Other"}
                  onChange={e => updateAdminProfile("department", e.target.value)}
                >
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="settings-field">
                <label>Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                />
              </div>

              <div className="settings-profile-subheading">
                <h3>Personal Details</h3>
              </div>

              <div className="settings-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={adminProfile.phone}
                  onChange={e => updateAdminProfile("phone", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={adminProfile.dateOfBirth}
                  onChange={e => updateAdminProfile("dateOfBirth", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Gender</label>
                <select
                  value={adminProfile.gender}
                  onChange={e => updateAdminProfile("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="settings-field">
                <label>Emergency Contact</label>
                <input
                  type="tel"
                  value={adminProfile.emergencyContact}
                  onChange={e => updateAdminProfile("emergencyContact", e.target.value)}
                />
              </div>

              <div className="settings-field settings-field-full">
                <label>Address</label>
                <input
                  value={adminProfile.address}
                  onChange={e => updateAdminProfile("address", e.target.value)}
                />
              </div>

              <div className="settings-profile-subheading">
                <h3>Bank Details</h3>
              </div>

              <div className="settings-field">
                <label>Bank Name</label>
                <input
                  value={adminProfile.bankName}
                  onChange={e => updateAdminProfile("bankName", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Account Holder Name</label>
                <input
                  value={adminProfile.accountHolder}
                  onChange={e => updateAdminProfile("accountHolder", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Account Number</label>
                <input
                  type="password"
                  autoComplete="off"
                  value={adminProfile.accountNumber}
                  onChange={e => updateAdminProfile("accountNumber", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>IFSC Code</label>
                <input
                  value={adminProfile.ifscCode}
                  onChange={e => updateAdminProfile("ifscCode", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Branch</label>
                <input
                  value={adminProfile.branch}
                  onChange={e => updateAdminProfile("branch", e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case "Working Hours":
        return (
          <>
            <div className="settings-section-title">
              <h2>Working Hours</h2>
              <p>Configure office times, late arrival threshold, and the company timezone.</p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Office Start Time</label>
                <input
                  type="time"
                  value={workingHours.start}
                  onChange={e => updateHours("start", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Office End Time</label>
                <input
                  type="time"
                  value={workingHours.end}
                  onChange={e => updateHours("end", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Late Arrival Threshold</label>
                <input
                  type="time"
                  value={workingHours.lateAfter}
                  onChange={e => updateHours("lateAfter", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Company Timezone</label>
                <select
                  value={workingHours.timezone}
                  onChange={e => updateHours("timezone", e.target.value)}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (India Standard Time)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>

              <div className="settings-field">
                <label>Working Days</label>
                <select
                  value={workingHours.workingDays}
                  onChange={e => updateHours("workingDays", e.target.value)}
                >
                  <option>Monday - Friday</option>
                  <option>Monday - Saturday</option>
                  <option>All Days</option>
                </select>
              </div>
            </div>
          </>
        );

      case "Leave Policy":
        return (
          <>
            <div className="settings-section-title">
              <h2>Leave Policy</h2>
              <p>Configure annual leave allowances in days.</p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Casual Leave (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={policies.casual}
                  onChange={e => updatePolicies("casual", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Sick Leave (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={policies.sick}
                  onChange={e => updatePolicies("sick", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Earned Leave (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={policies.earned}
                  onChange={e => updatePolicies("earned", e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label>Notice Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={policies.notice}
                  onChange={e => updatePolicies("notice", e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case "Notifications":
        return (
          <>
            <div className="settings-section-title">
              <h2>Notification Preferences</h2>
              <p>Choose which notifications the admin receives.</p>
            </div>

            <div className="settings-toggle-list">
              {[
                ["leave", "Leave Applications", "Receive updates about leave requests."],
                ["attendance", "Attendance Alerts", "Receive employee attendance updates."],
                ["payroll", "Payroll Updates", "Receive payroll status notifications."],
                ["email", "Email Notifications", "Enable email notification preference."]
              ].map(([key, title, description]) => (
                <div className="settings-toggle-row" key={key}>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>

                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={e => updateNotifications(key, e.target.checked)}
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </>
        );

      case "Security":
        return (
          <>
            <div className="settings-section-title">
              <h2>Security Settings</h2>
              <p>Manage basic administrator account security.</p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>

              <div className="settings-field">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>

              <div className="settings-field">
                <label>Confirm Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
            </div>

            <p className="settings-security-note">
              Password changes are not connected to the authentication backend yet.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">HRMS / ADMIN / SETTINGS</span>
          <h1>System Settings</h1>
          <p>Manage organization preferences and administrator settings.</p>
        </div>
      </header>

      <div className="settings-layout">
        <aside className="settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.name}
                className={`settings-tab ${activeTab === tab.name ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.name);
                  if (["Profile", "Security"].includes(tab.name)) {
                    setSearchParams({ tab: tab.name });
                  } else {
                    setSearchParams({});
                  }
                  setSavedMessage("");
                }}
              >
                <Icon size={18} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </aside>

        <section className="settings-content">
          {renderContent()}

          <div className="settings-save-area">
            <span className="settings-save-message">{savedMessage}</span>

            <button className="settings-save-btn" onClick={handleSave}>
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
