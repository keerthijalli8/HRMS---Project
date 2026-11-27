import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, Clock3,
  FileText, Megaphone, Search, Users, X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { DashboardSwitcher } from "../../../components/DashboardSwitcher.jsx";
import { readAdminProfile } from "../services/adminProfile";
import { searchAdminData } from "../services/globalSearch";
import useAdminNotifications from "../hooks/useAdminNotifications";
import { formatNotificationDate } from "../services/adminNotifications";
import LogoutButton from "./LogoutButton";

const CATEGORY_ICONS = {
  Employees: Users,
  Attendance: Clock3,
  "Leave Management": CalendarDays,
  "Employee Documents": FileText,
  Departments: Building2,
  Projects: BriefcaseBusiness,
  "Working Hours": Clock3,
  "Late Login Records": Clock3,
  Announcements: Megaphone,
};

const NOTIFICATION_ICONS = {
  Employee: Users,
  Attendance: Clock3,
  Leave: CalendarDays,
  Announcement: Megaphone,
  System: Bell,
};

function Highlight({ text, query }) {
  const value = String(text || "");
  const index = value.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (!query || index < 0) return value;
  return <>{value.slice(0, index)}<mark>{value.slice(index, index + query.length)}</mark>{value.slice(index + query.length)}</>;
}

function NotificationItems({ items, onOpen, onRead, onDismiss }) {
  if (!items.length) return <div className="topnav-notification-empty">No notifications in this view.</div>;
  return <div className="topnav-notification-list">
    {items.map((notification) => {
      const Icon = NOTIFICATION_ICONS[notification.category] || Bell;
      return <article className={`topnav-notification-item${notification.isRead ? " is-read" : ""}`} key={notification.id}>
        <button type="button" className="topnav-notification-open" onClick={() => onOpen(notification)}>
          <span className="topnav-notification-icon"><Icon size={16} /></span>
          <span className="topnav-notification-copy">
            <strong>{notification.title}</strong>
            <span>{notification.description}</span>
            <small>{notification.category} · {formatNotificationDate(notification.timestamp)} · {notification.isRead ? "Read" : "Unread"}</small>
          </span>
          {!notification.isRead && <i className="topnav-unread-dot" aria-label="Unread" />}
        </button>
        <div className="topnav-notification-actions">
          <button type="button" onClick={() => onRead(notification, !notification.isRead)}>
            Mark as {notification.isRead ? "unread" : "read"}
          </button>
          <button type="button" onClick={() => onDismiss(notification)}>Dismiss</button>
        </div>
      </article>;
    })}
  </div>;
}

export default function TopNavigation() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profile, setProfile] = useState(readAdminProfile);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("All");
  const notifications = useAdminNotifications();
  const results = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const shownNotifications = useMemo(() => notifications.notifications
    .filter((notification) => notificationFilter === "All"
      || (notificationFilter === "Read" ? notification.isRead : !notification.isRead))
    .slice(0, 6), [notificationFilter, notifications.notifications]);

  useEffect(() => {
    const refreshProfile = () => setProfile(readAdminProfile());
    window.addEventListener("admin-profile-updated", refreshProfile);
    window.addEventListener("storage", refreshProfile);
    return () => {
      window.removeEventListener("admin-profile-updated", refreshProfile);
      window.removeEventListener("storage", refreshProfile);
    };
  }, []);

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const updateQuery = (value) => {
    setQuery(value);
    setActiveResult(0);
    setSearchError("");
    if (searchInputRef.current?._globalSearchTimer) window.clearTimeout(searchInputRef.current._globalSearchTimer);
    if (!value.trim()) {
      setGroups([]);
      setIsSearching(false);
      setIsSearchOpen(false);
      return;
    }
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      try {
        setGroups(searchAdminData(value.trim()));
        setIsSearchOpen(true);
      } catch (error) {
        console.error("Unable to search the available admin records.", error);
        setGroups([]);
        setSearchError("Search could not read one or more browser records.");
        setIsSearchOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 220);
    if (searchInputRef.current) searchInputRef.current._globalSearchTimer = timer;
  };

  const openResult = (result) => {
    setIsSearchOpen(false);
    setQuery("");
    setGroups([]);
    setMobileSearchOpen(false);
    navigate(result.path);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsSearchOpen(false);
      return;
    }
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveResult((index) => (index + 1) % results.length);
    }
    if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveResult((index) => (index - 1 + results.length) % results.length);
    }
    if (event.key === "Enter" && results.length) {
      event.preventDefault();
      openResult(results[activeResult] || results[0]);
    }
  };

  const openNotification = (notification) => {
    notifications.setRead(notification, true);
    setIsNotificationOpen(false);
    navigate(notification.path);
  };
  const openNotificationsPage = () => {
    setIsNotificationOpen(false);
    navigate("/admin/notifications");
  };
  const rawAuthName = typeof authUser?.name === "string" && authUser.name.trim() ? authUser.name.trim() : "";
  const profileName = rawAuthName || (typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : "Admin User");
  const initials = profileName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <header className="overview-topnav" ref={rootRef}>
      <div className={`topnav-search${mobileSearchOpen ? " is-mobile-open" : ""}`}>
        {isSearching ? <span className="global-search-spinner" aria-label="Searching" /> : <Search size={17} aria-hidden="true" />}
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => query.trim() && setIsSearchOpen(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search anything in your organization..."
          aria-label="Search all admin records"
          aria-expanded={isSearchOpen}
          aria-controls="global-search-results"
        />
        {query && <button type="button" className="topnav-search-clear" aria-label="Clear search" onClick={() => {
          updateQuery("");
          searchInputRef.current?.focus();
        }}><X size={15} /></button>}
        {isSearchOpen && <div className="global-search-dropdown" id="global-search-results">
          {searchError ? <p className="global-search-empty" role="alert">{searchError}</p>
            : !results.length ? <p className="global-search-empty">No matching records found.</p>
              : groups.map((group) => {
                const Icon = CATEGORY_ICONS[group.category] || Search;
                return <section className="global-search-group" key={group.category}>
                  <h3><Icon size={14} />{group.category}</h3>
                  {group.items.map((result) => {
                    const index = results.findIndex((item) => item.id === result.id);
                    return <button type="button" className={`global-search-result${activeResult === index ? " is-active" : ""}`} key={result.id} onMouseEnter={() => setActiveResult(index)} onClick={() => openResult(result)}>
                      <span className="global-search-result-copy">
                        <strong><Highlight text={result.label} query={query.trim()} /></strong>
                        <small><Highlight text={result.description} query={query.trim()} /></small>
                      </span>
                      <span className="global-search-result-meta">{result.status ? <em>{result.status}</em> : null}<span>{result.category === "Employees" ? "View Employee" : "View"}</span></span>
                    </button>;
                  })}
                </section>;
              })}
        </div>}
      </div>
      <button type="button" className="topnav-mobile-search-button" aria-label="Open search" onClick={() => {
        setMobileSearchOpen((open) => !open);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }}><Search size={19} /></button>
      <div className="topnav-actions">
        <div className="topnav-switcher-wrap">
          <DashboardSwitcher />
        </div>
        <div className="topnav-popover-anchor">
          <button type="button" className={`topnav-icon-button${isNotificationOpen ? " is-open" : ""}`} aria-label={`Notifications, ${notifications.unreadCount} unread`} aria-expanded={isNotificationOpen} onClick={() => {
            setIsNotificationOpen((open) => !open);
            setIsProfileOpen(false);
            setIsSearchOpen(false);
          }}>
            <Bell size={19} />
            {notifications.unreadCount > 0 && <span className="topnav-notification-count">{notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}</span>}
          </button>
          {isNotificationOpen && <section className="topnav-popover topnav-notification-popover" aria-label="Notifications">
            <div className="topnav-popover-heading">
              <div><h2>Notifications</h2><p>{notifications.unreadCount} unread</p></div>
              <button type="button" onClick={notifications.markAllRead} disabled={!notifications.unreadCount}>Mark all as read</button>
            </div>
            {notifications.error && <p className="topnav-notification-error" role="alert">{notifications.error}</p>}
            <div className="topnav-notification-filters" role="tablist" aria-label="Notification filter">
              {["All", "Unread", "Read"].map((filter) => <button type="button" role="tab" aria-selected={notificationFilter === filter} className={notificationFilter === filter ? "active" : ""} key={filter} onClick={() => setNotificationFilter(filter)}>{filter}</button>)}
            </div>
            <NotificationItems
              items={shownNotifications}
              onOpen={openNotification}
              onRead={notifications.setRead}
              onDismiss={notifications.dismiss}
            />
            <p className="topnav-notification-note">Based on saved browser records and bundled demo data. Not a real-time feed.</p>
            <button type="button" className="topnav-view-all" onClick={openNotificationsPage}>View All Notifications</button>
          </section>}
        </div>
        <div className="topnav-popover-anchor">
          <button type="button" className="topnav-profile-button" aria-expanded={isProfileOpen} onClick={() => {
            setIsProfileOpen((open) => !open);
            setIsNotificationOpen(false);
            setIsSearchOpen(false);
          }}>
            <span className="topnav-avatar">{profile.photo ? <img src={profile.photo} alt="" /> : initials}</span>
            <span className="topnav-profile-copy"><strong>{profileName}</strong><small>Administrator</small></span>
            <ChevronDown size={16} />
          </button>
          {isProfileOpen && <nav className="topnav-popover topnav-profile-menu" aria-label="Admin profile menu">
            <Link to="/admin/settings?tab=Profile" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
            <Link to="/admin/settings" onClick={() => setIsProfileOpen(false)}>Account Settings</Link>
            <Link to="/admin/settings?tab=Security" onClick={() => setIsProfileOpen(false)}>Change Password</Link>
            <Link to="/admin/support" onClick={() => setIsProfileOpen(false)}>Help &amp; Support</Link>
            <LogoutButton className="topnav-profile-logout" />
          </nav>}
        </div>
      </div>
    </header>
  );
}

export { NotificationItems };
