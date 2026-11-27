import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { navItems } from '../data/mockData.js';
import { resolveHrPath } from '../routes.js';
import { getMyTasks, subscribeTasks } from '../services/taskStore.js';
import { getUnreadCountForUser, subscribeNotifications } from '../services/notificationStore.js';
import { getPendingCount, subscribeShifts } from '../services/shiftService.js';
import { getPendingLopCount, subscribeLop } from '../services/lopService.js';
import { getPendingLeaveCount, subscribeLeave } from '../services/leaveService.js';

// Clean grouping: ACCOUNT lo only "Settings" matrame untundi
const NAV_GROUPS = [
  {
    title: "MAIN",
    ids: ["dashboard", "overview", "teams", "announcements", "notifications"]
  },
  {
    title: "WORK",
    ids: ["attendance", "leave", "my-tasks", "tasks", "shifts", "shifts-roster"]
  },
  {
    title: "PAYROLL & GROWTH",
    ids: ["payroll", "benefits-allowances", "performance", "lop"]
  },
  {
    title: "ADMINISTRATION",
    ids: ["recruitment", "employee-management", "onboarding", "offboarding", "approvals", "reports", "documents"]
  },
  {
    title: "ACCOUNT",
    ids: ["settings"]
  }
];

export const Sidebar = ({ currentRoute, setCurrentRoute, currentUser, onNavigate }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [taskCount, setTaskCount] = useState(() => {
    const list = getMyTasks(currentUser);
    return list.filter(t => t.status === "Pending" || t.status === "In Progress").length;
  });

  const [unreadCount, setUnreadCount] = useState(() => getUnreadCountForUser(currentUser));
  const [shiftsPendingCount, setShiftsPendingCount] = useState(() => getPendingCount(currentUser));
  const [lopPendingCount, setLopPendingCount] = useState(() => getPendingLopCount());
  const [leavePendingCount, setLeavePendingCount] = useState(() => getPendingLeaveCount());

  useEffect(() => {
    const unsubTasks = subscribeTasks(() => {
      const list = getMyTasks(currentUser);
      setTaskCount(list.filter(t => t.status === "Pending" || t.status === "In Progress").length);
    });
    const unsubNotifs = subscribeNotifications(() => {
      setUnreadCount(getUnreadCountForUser(currentUser));
    });
    const unsubShifts = subscribeShifts(() => {
      setShiftsPendingCount(getPendingCount(currentUser));
    });
    const unsubLop = subscribeLop(() => {
      setLopPendingCount(getPendingLopCount());
    });
    const unsubLeave = subscribeLeave(() => {
      setLeavePendingCount(getPendingLeaveCount());
    });
    return () => {
      unsubTasks();
      unsubNotifs();
      unsubShifts();
      unsubLop();
      unsubLeave();
    };
  }, [currentUser]);

  const visibleNavItems = useMemo(() => {
    const role = (currentUser?.systemRole || currentUser?.role || "").toLowerCase();
    const isSuperAdmin = role.includes("super admin") || role.includes("admin");
    const isHR = role.includes("hr");
    const isPrivileged = isSuperAdmin || isHR;

    let allItems = [...navItems];

    const ensureItem = (newItem) => {
      if (!allItems.some(i => i.id === newItem.id)) {
        allItems.push(newItem);
      }
    };

    ensureItem({ id: "employee-management", label: "Employee Management", icon: "users" });
    ensureItem({ id: "recruitment", label: "Recruitment", icon: "briefcase" });
    ensureItem({ id: "offboarding", label: "Offboarding", icon: "log-out" });
    ensureItem({ id: "teams", label: "Teams", icon: "users" });
    ensureItem({ id: "announcements", label: "Announcements", icon: "megaphone" });
    ensureItem({ id: "lop", label: "LOP Management", icon: "alert-triangle" });
    ensureItem({ id: "settings", label: "Settings", icon: "settings" });

    return allItems.filter(item => {
      if (item.id === "holiday-calendar") return false;

      if (["recruitment", "offboarding", "audit-logs", "hr-settings", "hrsettings", "onboarding", "reports"].includes(item.id) && !isPrivileged) {
        return false;
      }
      if (["audit-logs", "hr-settings", "hrsettings"].includes(item.id)) {
        return false;
      }
      if (item.hrOnly && !isPrivileged) return false;
      return true;
    });
  }, [currentUser]);

  const groupedSections = useMemo(() => {
    const assignedIds = new Set();
    const sections = NAV_GROUPS.map(group => {
      const items = group.ids
        .map(id => visibleNavItems.find(item => item.id === id))
        .filter(Boolean)
        .filter((item, index, self) => self.findIndex(t => t.id === item.id) === index);

      items.forEach(i => assignedIds.add(i.id));
      return { title: group.title, items };
    }).filter(sec => sec.items.length > 0);

    return sections;
  }, [visibleNavItems]);

  const handleSelectRoute = (id) => {
    const targetPath = resolveHrPath(id);
    navigate(targetPath);
    if (onNavigate) {
      onNavigate(id);
    } else if (setCurrentRoute) {
      setCurrentRoute(id);
    }
    setMobileMenuOpen(false);
  };

  const getBadgeForItem = (item) => {
    if (item.id === "my-tasks" || item.id === "tasks") return taskCount > 0 ? taskCount : null;
    if (item.id === "notifications") return unreadCount > 0 ? unreadCount : null;
    if (item.id === "shifts-roster" || item.id === "shifts") return shiftsPendingCount > 0 ? shiftsPendingCount : null;
    if (item.id === "lop") return lopPendingCount > 0 ? lopPendingCount : null;
    if (item.id === "leave") return leavePendingCount > 0 ? leavePendingCount : null;
    return item.badge || null;
  };

  const isRouteActive = (itemId) => {
    return currentRoute === itemId ||
      (itemId === "dashboard" && (currentRoute === "overview" || currentRoute === "dashboard")) ||
      (itemId === "my-tasks" && (currentRoute === "tasks" || currentRoute === "my-tasks")) ||
      (itemId === "shifts-roster" && (currentRoute === "shifts" || currentRoute === "shifts-roster")) ||
      (itemId === "benefits-allowances" && (currentRoute === "benefits" || currentRoute === "benefits-allowances" || currentRoute === "bonus")) ||
      (itemId === "settings" && (currentRoute === "settings" || currentRoute === "hr-settings" || currentRoute === "hrsettings")) ||
      (itemId === "employee-management" && (currentRoute === "employees" || currentRoute === "employee-management")) ||
      (itemId === "recruitment" && (currentRoute === "recruitment" || currentRoute === "hiring")) ||
      (itemId === "offboarding" && (currentRoute === "offboarding" || currentRoute === "exit"));
  };

  return (
    <aside className="w-full md:w-[260px] shrink-0 md:sticky md:top-0 h-auto md:h-screen flex flex-col bg-[#10242e] border-r border-[#203a45] z-20 overflow-hidden select-none font-sans">
      {/* 1. Technomold Logo Header (Matching the exact logo style) */}
      <div className="flex items-center justify-between p-4 border-b border-[#203a45] shrink-0">
        <div
          onClick={() => handleSelectRoute("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          {/* Logo Circular Badge with Custom Icon */}
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-red-600 font-extrabold text-base shadow-md group-hover:scale-105 transition-transform shrink-0 border border-red-600/30">
            TM
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[14px] tracking-tight leading-none">
              <span className="text-white">Techno</span>
              <span className="text-red-600">mold</span>
            </span>
            <span className="text-slate-400 font-extrabold text-[8px] tracking-widest uppercase mt-1">
              IT SOLUTIONS PVT LTD
            </span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="md:hidden p-2 rounded-lg bg-[#193440] border border-[#34515b] text-white hover:border-accent/60 transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
        >
          <Icon name={mobileMenuOpen ? "x" : "menu"} className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Grouped Navigation List */}
      <nav
        aria-label="Main Navigation"
        className={`${
          mobileMenuOpen ? "flex max-h-[65vh]" : "hidden md:flex"
        } sidebar-scroll-container flex-1 min-h-0 flex-col gap-4 p-4 overflow-y-auto`}
      >
        {groupedSections.map(section => (
          <div key={section.title} className="flex flex-col gap-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              {section.title}
            </div>

            {section.items.map(item => {
              const targetPath = resolveHrPath(item.id);
              const routeActive = isRouteActive(item.id);
              const badgeValue = getBadgeForItem(item);

              return (
                <NavLink
                  key={item.id}
                  to={targetPath}
                  end={item.id === "dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => {
                    const active = isActive || routeActive;
                    return `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer group ${
                      active
                        ? "bg-[#193440] text-emerald-400 border border-[#34515b] shadow-sm font-semibold"
                        : "text-slate-300 hover:bg-[#152e39] hover:text-white border border-transparent"
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const active = isActive || routeActive;
                    return (
                      <>
                        {/* Active Left Pill Indicator */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-emerald-400" />
                        )}

                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            name={item.icon}
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              active ? "text-emerald-400" : "text-slate-400 group-hover:text-white"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {badgeValue && (
                          <span
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full tabular-nums font-num shrink-0 ${
                              active
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-[#152e39] text-slate-300 border border-[#34515b]"
                            }`}
                          >
                            {badgeValue}
                          </span>
                        )}
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};