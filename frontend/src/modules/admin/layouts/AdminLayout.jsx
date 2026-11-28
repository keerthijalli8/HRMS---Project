import { Outlet } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext.jsx";
import Sidebar from "../components/Sidebar";
import TopNavigation from "../components/TopNavigation";
import "../style/AdminLayout.css";
import "../style/Dashboard.css";

function AdminLayout() {
  const { theme } = useTheme();

  return (
    <div className="mod-admin" data-tpl="glass" data-bs-theme={theme}>
      <div className="admin-layout" data-bs-theme={theme}>
        <Sidebar />

        <main className="admin-main-content container-fluid px-0">
          <TopNavigation />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
