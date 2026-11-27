import { Bell, UserCircle } from "lucide-react";

function Header() {
  return (
    <header className="header">
      <div>
        <h2>Admin Dashboard</h2>
        <p>Welcome to HRMS Management System</p>
      </div>

      <div className="header-right">
        <Bell size={22} />
        <UserCircle size={30} />
        <span>Admin</span>
      </div>
    </header>
  );
}

export default Header;