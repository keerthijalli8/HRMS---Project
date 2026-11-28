
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BrandLogo } from "../../../../components/BrandLogo.jsx";

import {
  LayoutDashboard,
  Building2,
  Building,
  CreditCard,
  Layers,
  Receipt,
  Puzzle,
  Users,
  ChartNoAxesCombined,
  Activity,
  ShieldCheck,
  Headset,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", path: "/super-admin/dashboard", icon: LayoutDashboard },
  { name: "Tenant Management", path: "/super-admin/tenants", icon: Building2 },
  { name: "Organization Details", path: "/super-admin/organizations", icon: Building },
  { name: "Subscription Details", path: "/super-admin/subscriptions", icon: CreditCard },
  { name: "Plan Management", path: "/super-admin/plans", icon: Layers },
  { name: "Billing", path: "/super-admin/billing", icon: Receipt },
  { name: "Module Management", path: "/super-admin/modules", icon: Puzzle },
  { name: "Platform Users", path: "/super-admin/platform-users", icon: Users },
  { name: "Usage Analytics", path: "/super-admin/analytics", icon: ChartNoAxesCombined },
  { name: "Monitoring", path: "/super-admin/monitoring", icon: Activity },
  {
    name: "Security & Audit Logs",
    path: "/super-admin/security-audit-logs",
    icon: ShieldCheck
  },
  { name: "Support", path: "/super-admin/support", icon: Headset },
  { name: "Settings", path: "/super-admin/settings/general", icon: Settings }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <BrandLogo
          className="brand-logo"
          alt="TechnoMold IT Solutions Pvt Ltd"
        />
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section-label">
        {!collapsed && <span>MAIN MENU</span>}

        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((previous) => !previous)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={19} />
          ) : (
            <ChevronLeft size={19} />
          )}
        </button>
      </div>

      <nav className="sidebar-navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/super-admin/dashboard"}
              title={collapsed ? item.name : ""}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
