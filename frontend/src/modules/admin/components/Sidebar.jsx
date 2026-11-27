import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2,
  Wallet, ChartNoAxesCombined, Megaphone, ShieldCheck, Settings, UserCog, KeyRound, Workflow,
  Link2, SlidersHorizontal,
} from "lucide-react";
import { useCompanyTheme } from "../context/CompanyThemeContext";

import "../style/Sidebar.css";

const menuGroups = [
    { title: "MAIN", items: [{ title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }] },
  { title: "ORGANIZATION MANAGEMENT", items: [
    { title: "Organization Profile", path: "/admin/organization", icon: Building2 },
    { title: "User Management", path: "/admin/users", icon: UserCog },
    { title: "Role Management", path: "/admin/roles", icon: ShieldCheck },
    { title: "Permissions", path: "/admin/permissions", icon: KeyRound },
  ] },
  { title: "PEOPLE MANAGEMENT", items: [
    { title: "Employees", path: "/admin/employees", icon: Users },
    { title: "Departments", path: "/admin/departments", icon: Building2 },
  ] },
  { title: "HR OPERATIONS", items: [
    { title: "Payroll", path: "/admin/payroll", icon: Wallet },
    { title: "HR Configuration", path: "/admin/hr-configuration", icon: SlidersHorizontal },
    { title: "Workflow Management", path: "/admin/workflows", icon: Workflow },
  ] },
  { title: "EMPLOYEE DEVELOPMENT", items: [
    { title: "Performance Management", path: "/admin/performance", icon: ChartNoAxesCombined },
  ] },
  { title: "COMMUNICATION", items: [
    { title: "Announcements", path: "/admin/announcements", icon: Megaphone },
  ] },
  { title: "ANALYTICS", items: [
    { title: "Reports & Audits", path: "/admin/reports", icon: ChartNoAxesCombined },
  ] },
  { title: "ADMINISTRATION", items: [
    { title: "Integrations", path: "/admin/integrations", icon: Link2 },
    { title: "Settings", path: "/admin/settings", icon: Settings },
  ] },
];

function Sidebar() {
  const { branding } = useCompanyTheme() || {};
  const logoUrl = branding?.logoUrl === "/technomold-logo.png"
    ? "/technomold-logo-transparent.png"
    : branding?.logoUrl || "/technomold-logo-transparent.png";

  return (
    <aside className="admin-sidebar d-flex flex-column">
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={logoUrl} alt={branding?.companyName || "Company logo"} />
      </div>
      <nav className="sidebar-navigation" aria-label="Admin navigation">
        <div className="sidebar-menu">
          {menuGroups.flatMap((group) => group.items).map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.path} to={item.path} end={item.path === "/admin/dashboard"} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{item.title}</span>
            </NavLink>;
          })}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
