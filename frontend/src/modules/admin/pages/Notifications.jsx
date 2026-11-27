import { useMemo, useState } from "react";
import { ArrowLeft, Bell, CheckCheck, CircleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationItems } from "../components/TopNavigation";
import useAdminNotifications from "../hooks/useAdminNotifications";
import "../style/Notifications.css";

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const notifications = useAdminNotifications();
  const items = useMemo(() => notifications.notifications.filter((notification) => (
    filter === "All" || (filter === "Read" ? notification.isRead : !notification.isRead)
  )), [filter, notifications.notifications]);

  const openNotification = (notification) => {
    notifications.setRead(notification, true);
    navigate(notification.path);
  };

  return <main className="notifications-page">
    <header className="notifications-page-header">
      <div>
        <span className="notifications-eyebrow">HRMS / ADMIN / NOTIFICATIONS</span>
        <h1>Notifications</h1>
        <p>Updates derived from saved browser records and bundled demonstration data.</p>
      </div>
      <button type="button" className="notifications-back" onClick={() => navigate("/admin/dashboard")}><ArrowLeft size={16} /> Back to Overview</button>
    </header>
    <section className="notifications-panel">
      <div className="notifications-panel-heading">
        <div><h2><Bell size={18} /> Notification center</h2><p>{notifications.unreadCount} unread · {notifications.notifications.length} total</p></div>
        <button type="button" className="notifications-mark-all" disabled={!notifications.unreadCount} onClick={notifications.markAllRead}><CheckCheck size={16} /> Mark All as Read</button>
      </div>
      {notifications.error && <p className="notifications-error" role="alert"><CircleAlert size={16} />{notifications.error}</p>}
      <div className="notifications-page-filters" role="tablist" aria-label="Filter notifications">
        {["All", "Unread", "Read"].map((item) => <button type="button" role="tab" aria-selected={filter === item} className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      <NotificationItems
        items={items}
        onOpen={openNotification}
        onRead={notifications.setRead}
        onDismiss={notifications.dismiss}
      />
      <p className="notifications-data-note">This frontend demonstration has no backend notification service and does not provide company-wide real-time delivery.</p>
    </section>
  </main>;
}
