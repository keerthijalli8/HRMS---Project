import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { getCompanyById } from '../data/companyStore.js';
import { ProfilePictureModal } from '../components/profile/ProfilePictureModal.jsx';
import { getAvatar, subscribeAvatarStore } from '../services/avatarStore.js';
import { logEvent, diffObjects } from '../services/auditService.js';

export const MyProfileView = ({ currentUser, onUpdateUser, onTriggerToast, onNavigate, onSignOut }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return getAvatar(currentUser?.employeeId || currentUser?.id || currentUser?.name);
  });

  useEffect(() => {
    setAvatarUrl(getAvatar(currentUser?.employeeId || currentUser?.id || currentUser?.name));
    const unsub = subscribeAvatarStore(() => {
      setAvatarUrl(getAvatar(currentUser?.employeeId || currentUser?.id || currentUser?.name));
    });
    return unsub;
  }, [currentUser]);

  const getInitialProfile = () => {
    const isPooja = currentUser?.employeeId === "EMP-1088";
    const isAarav = currentUser?.employeeId === "EMP-1042";

    if (isPooja) {
      return {
        firstName: currentUser?.firstName || "Pooja",
        lastName: currentUser?.lastName || "Patel",
        dob: currentUser?.dob || "1994-08-22",
        gender: currentUser?.gender || "Female",
        personalEmail: currentUser?.personalEmail || "pooja.patel.personal@gmail.com",
        officialEmail: currentUser?.email || "pooja.patel@nexora.in",
        mobile: currentUser?.mobile || "+91 98450 12345",
        altMobile: currentUser?.altMobile || "+91 98450 67890",
        address: currentUser?.address || "Flat 402, Kondapur Greenwoods, HITEC City",
        city: currentUser?.city || "Hyderabad",
        state: currentUser?.state || "Telangana",
        country: currentUser?.country || "India",
        pinCode: currentUser?.pinCode || "500084",
        employeeId: "EMP-1088",
        dept: currentUser?.dept || "Human Resources",
        role: currentUser?.role || "Senior HRBP",
        reportingManager: currentUser?.reportingManager || "Meera Reddy (HR Manager)",
        joiningDate: currentUser?.joiningDate || "15 Jan 2022",
        employmentType: currentUser?.employmentType || "Full-Time Permanent",
        workLocation: currentUser?.workLocation || "Hyderabad Mindspace Cyberabad HQ (Hybrid)",
        employmentStatus: currentUser?.employmentStatus || "Active",
        systemRole: currentUser?.systemRole || "HR",
        companyId: currentUser?.companyId || "NEX-IND"
      };
    }

    if (isAarav) {
      return {
        firstName: currentUser?.firstName || "Aarav",
        lastName: currentUser?.lastName || "Sharma",
        dob: currentUser?.dob || "1989-11-14",
        gender: currentUser?.gender || "Male",
        personalEmail: currentUser?.personalEmail || "aarav.sharma.personal@gmail.com",
        officialEmail: currentUser?.email || "aarav.sharma@nexora.in",
        mobile: currentUser?.mobile || "+91 98765 43210",
        altMobile: currentUser?.altMobile || "+91 98765 01234",
        address: currentUser?.address || "42, Madhapur Silicon Valley Layout",
        city: currentUser?.city || "Hyderabad",
        state: currentUser?.state || "Telangana",
        country: currentUser?.country || "India",
        pinCode: currentUser?.pinCode || "500081",
        employeeId: "EMP-1042",
        dept: currentUser?.dept || "Engineering",
        role: currentUser?.role || "Engineering Manager",
        reportingManager: currentUser?.reportingManager || "Leadership Team",
        joiningDate: currentUser?.joiningDate || "12 Mar 2021",
        employmentType: currentUser?.employmentType || "Full-Time Permanent",
        workLocation: currentUser?.workLocation || "Hyderabad Mindspace Cyberabad HQ (Hybrid)",
        employmentStatus: currentUser?.employmentStatus || "Active",
        systemRole: currentUser?.systemRole || "Manager",
        companyId: currentUser?.companyId || "NEX-IND"
      };
    }

    return {
      firstName: currentUser?.firstName || "Mounika S.",
      lastName: currentUser?.lastName || "Rao",
      dob: currentUser?.dob || "",
      gender: currentUser?.gender || "",
      personalEmail: currentUser?.personalEmail || "",
      officialEmail: currentUser?.email || "",
      mobile: currentUser?.mobile || "",
      altMobile: currentUser?.altMobile || "",
      address: currentUser?.address || "",
      city: currentUser?.city || "",
      state: currentUser?.state || "",
      country: currentUser?.country || "India",
      pinCode: currentUser?.pinCode || "",
      employeeId: currentUser?.employeeId || "",
      dept: currentUser?.dept || "",
      role: currentUser?.role || "Team Lead Manager",
      reportingManager: currentUser?.reportingManager || "",
      joiningDate: currentUser?.joiningDate || "",
      employmentType: currentUser?.employmentType || "Full-Time Permanent",
      workLocation: currentUser?.workLocation || "Not assigned",
      employmentStatus: currentUser?.employmentStatus || "Active",
      systemRole: currentUser?.systemRole || "Employee",
      companyId: currentUser?.companyId || "NEX-IND"
    };
  };

  const [profileData, setProfileData] = useState(getInitialProfile);
  const [tempData, setTempData] = useState(getInitialProfile);

  useEffect(() => {
    const init = getInitialProfile();
    setProfileData(init);
    setTempData(init);
  }, [currentUser]);

  const handleEdit = () => {
    setTempData({ ...profileData });
    setIsEditing(true);
    setShowFullDetails(true);
  };

  const handleCancel = () => {
    setTempData({ ...profileData });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfileData({ ...tempData });
    setIsEditing(false);

    const updatedUser = {
      ...currentUser,
      name: `${tempData.firstName || ''} ${tempData.lastName || ''}`.trim() || "Employee",
      firstName: tempData.firstName,
      lastName: tempData.lastName,
      gender: tempData.gender,
      dob: tempData.dob,
      personalEmail: tempData.personalEmail,
      email: tempData.officialEmail,
      mobile: tempData.mobile,
      altMobile: tempData.altMobile,
      address: tempData.address,
      city: tempData.city,
      state: tempData.state,
      country: tempData.country,
      pinCode: tempData.pinCode,
      dept: tempData.dept,
      role: tempData.role,
      reportingManager: tempData.reportingManager,
      workLocation: tempData.workLocation
    };

    try {
      const raw = localStorage.getItem("hrms_registered_users");
      if (raw) {
        const users = JSON.parse(raw);
        const updatedList = users.map(u => {
          if (u.employeeId && tempData.employeeId && u.employeeId.toUpperCase() === tempData.employeeId.toUpperCase()) {
            return { ...u, ...updatedUser };
          }
          return u;
        });
        localStorage.setItem("hrms_registered_users", JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }

    if (onUpdateUser) onUpdateUser(updatedUser);

    try {
      const diffs = diffObjects(profileData, tempData);
      logEvent({
        action: "edit_profile",
        category: "Data changes",
        module: "Profile",
        description: `Updated personal employee profile details`,
        target: { type: "Profile", id: currentUser?.employeeId, name: currentUser?.name },
        metadata: { diff: diffs },
        user: currentUser,
        status: "Success"
      });
    } catch (e) {}

    onTriggerToast?.("Profile details updated successfully!");
  };

  const getInitials = (first, last) => {
    const f = (first || "").trim()[0] || "";
    const l = (last || "").trim()[0] || "";
    return (f + l).toUpperCase() || "MS";
  };

  const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || "Mounika S. Rao";

  const quickMenuItems = [
    {
      id: "my-profile",
      label: "My profile",
      icon: "user",
      action: () => setShowFullDetails(prev => !prev)
    },
    {
      id: "payroll",
      label: "My Payslips",
      icon: "briefcase",
      action: () => onNavigate?.("payroll")
    },
    {
      id: "settings",
      label: "Settings",
      icon: "settings",
      action: () => onNavigate?.("settings")
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "bell",
      action: () => onNavigate?.("notifications")
    },
    {
      id: "reports",
      label: "Export reports",
      icon: "download",
      action: () => onNavigate?.("reports")
    },
    {
      id: "shortcuts",
      label: "Keyboard shortcuts",
      icon: "command",
      action: () => onTriggerToast?.("Shortcuts: Ctrl+K (Search) • Alt+D (Dashboard)")
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full animate-in fade-in">
      
      {/* ================= LEFT MENU: CLEAN & BORDERLESS (Seamless) ================= */}
      <div className="w-full max-w-sm bg-transparent p-2 flex flex-col gap-3 text-xs select-none font-sans text-white shrink-0">
        
        {/* Top Profile Header */}
        <div className="flex items-center justify-between px-2 py-2 relative">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              className="w-11 h-11 rounded-full bg-[#629632] text-white flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer overflow-hidden shadow-md hover:opacity-90 transition"
              title="Change Profile Photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(profileData.firstName, profileData.lastName)}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[14px] text-white truncate">{fullName}</span>
              <span className="text-[11.5px] text-slate-400 truncate mt-0.5">
                {profileData.role || "Team Lead Manager"}
              </span>
            </div>
          </div>

          {showFullDetails && (
            <button
              type="button"
              onClick={() => {
                setShowFullDetails(false);
                setIsEditing(false);
              }}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
              title="Close details"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu Navigation List */}
        <div className="flex flex-col gap-1 py-1">
          {quickMenuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`flex items-center justify-between px-3 py-3 rounded-xl transition group cursor-pointer text-left ${
                item.id === "my-profile" && showFullDetails
                  ? "bg-white/5 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  name={item.icon}
                  className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors"
                />
                <span className="font-medium text-[13px]">{item.label}</span>
              </div>
              <Icon
                name="chevron-right"
                className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition"
              />
            </button>
          ))}
        </div>

        {/* Bottom Sign Out Button (Borderless) */}
        <button
          type="button"
          onClick={() => {
            if (onSignOut) {
              onSignOut();
            } else {
              onNavigate?.("login");
            }
          }}
          className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-white/5 hover:bg-red-500/15 text-[#f27474] hover:text-red-300 font-semibold text-[13px] transition cursor-pointer mt-2"
        >
          <Icon name="log-out" className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>

      {/* ================= RIGHT PANEL: EXPANDABLE PROFILE DETAILS (Borderless) ================= */}
      {showFullDetails && (
        <div className="flex-1 w-full bg-transparent p-2 md:p-4 flex flex-col gap-5 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-white">Profile & Employment Details</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {profileData.employeeId || "EMP-ID"} • {getCompanyById(profileData.companyId || "NEX-IND")?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <PrimaryButton icon="edit-3" onClick={handleEdit}>
                  Edit Profile
                </PrimaryButton>
              ) : (
                <>
                  <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
                  <PrimaryButton icon="check" onClick={handleSave}>Save</PrimaryButton>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={tempData.firstName}
                  onChange={handleChange}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-400"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-white/5 text-white font-medium">
                  {profileData.firstName || "Not provided"}
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={tempData.lastName}
                  onChange={handleChange}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-400"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-white/5 text-white font-medium">
                  {profileData.lastName || "Not provided"}
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Official Email</label>
              <div className="p-2.5 rounded-lg bg-white/5 text-slate-300">
                {profileData.officialEmail || "Not assigned"}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Mobile Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="mobile"
                  value={tempData.mobile}
                  onChange={handleChange}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-400"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-white/5 text-white font-medium">
                  {profileData.mobile || "Not provided"}
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Department</label>
              <div className="p-2.5 rounded-lg bg-white/5 text-slate-300">
                {profileData.dept || "Not assigned"}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Work Location</label>
              <div className="p-2.5 rounded-lg bg-white/5 text-slate-300">
                {profileData.workLocation || "Not assigned"}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Residential Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={tempData.address}
                  onChange={handleChange}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-400"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-white/5 text-white font-medium">
                  {profileData.address || "Not provided"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Upload Modal */}
      <ProfilePictureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        employee={currentUser}
        currentAvatarUrl={avatarUrl}
        onTriggerToast={onTriggerToast}
        onAvatarSaved={(newUrl) => {
          setAvatarUrl(newUrl);
          onUpdateUser?.({ ...currentUser, avatarUrl: newUrl });
        }}
      />
    </div>
  );
};