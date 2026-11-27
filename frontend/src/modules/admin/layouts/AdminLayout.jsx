import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavigation from "../components/TopNavigation";
import "../style/AdminLayout.css";
import "../style/Dashboard.css";

function AdminLayout() {
  return (
    <div className="mod-admin" data-tpl="glass" data-bs-theme="dark">
      <div className="admin-layout" data-bs-theme="dark">
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
