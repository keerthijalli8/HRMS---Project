import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { EditProfileForm } from './EditProfileForm.jsx';
import { useProfile } from '../context/ProfileContext.jsx';

export const ProfilePanel = ({
  isOpen,
  onClose,
  onLogout,
  onTriggerToast,
  onNavigate
}) => {
  const { profile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };

    const handleOutsideClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, isEditing, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const firstInitial = (profile?.firstName || profile?.name?.split(' ')[0] || "P")[0] || "P";
  const lastInitial = (profile?.lastName || profile?.name?.split(' ').slice(1).join(' ') || "P")[0] || "P";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  const menuItems = [
    {
      id: "my-profile",
      label: "My profile",
      icon: "user",
      action: () => {
        onClose();
        onNavigate?.("my-profile");
      }
    },
    {
      id: "payroll",
      label: "My Payslips",
      icon: "briefcase",
      action: () => {
        onClose();
        onNavigate?.("payroll");
      }
    },
    {
      id: "settings",
      label: "Settings",
      icon: "settings",
      action: () => {
        onClose();
        onNavigate?.("settings");
      }
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "bell",
      action: () => {
        onClose();
        onNavigate?.("notifications");
      }
    },
    {
      id: "reports",
      label: "Export reports",
      icon: "download",
      action: () => {
        onClose();
        onNavigate?.("reports");
      }
    },
    {
      id: "shortcuts",
      label: "Keyboard shortcuts",
      icon: "command",
      action: () => {
        onClose();
        onTriggerToast?.("Shortcuts: Ctrl+K (Search) • Alt+D (Dashboard)");
      }
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Floating Monsoon Glass Dropdown Panel (Matching First Image Design) */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="User Profile Menu"
        className="fixed top-16 right-3 sm:right-6 md:right-8 w-[calc(100vw-1.5rem)] sm:w-[330px] z-50 bg-[#0d1f28]/95 backdrop-blur-2xl border border-[#203a45] rounded-2xl p-4 shadow-2xl text-white animate-in fade-in slide-in-from-top-3 duration-200 select-none font-sans max-h-[calc(100vh-5rem)] overflow-y-auto"
      >
        {isEditing ? (
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#203a45]">
              <span className="font-bold text-sm text-white">Edit Profile</span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <EditProfileForm
              onSaveSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
              onTriggerToast={onTriggerToast}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* 1. Top Profile Header Card */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#132934] border border-[#23404d]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#629632] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[14px] text-white truncate">
                    {profile?.name || "Pooja Patel"}
                  </span>
                  <span className="text-[11.5px] text-slate-400 truncate mt-0.5">
                    {profile?.role || "Senior HRBP"}
                  </span>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer self-start"
                aria-label="Close profile menu"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Menu Navigation List */}
            <div className="flex flex-col gap-0.5 py-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#152e39] hover:text-white transition group cursor-pointer text-left"
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

            {/* Dotted Separator Line */}
            <div className="border-t border-dashed border-[#264350] my-0.5" />

            {/* 3. Bottom Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl bg-[#132934]/70 hover:bg-red-500/15 text-[#f27474] hover:text-red-300 border border-[#23404d] hover:border-red-500/30 font-semibold text-[13px] transition cursor-pointer"
            >
              <Icon name="log-out" className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};