import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useTheme } from "../../../context/ThemeContext.jsx";

export default function LogoutButton({ className = "sidebar-logout" }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const confirmLogout = () => {
    try {
      logout();
      setConfirming(false);
      navigate("/login", { replace: true });
    } catch {
      setError("Unable to clear the browser session. Please try again.");
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setConfirming(true)}>
        <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>Logout</span>
      </button>
      {confirming && createPortal(
        <div className="mod-admin" data-tpl="glass" data-bs-theme={theme} onPointerDown={(event) => event.stopPropagation()}>
          <div className="logout-dialog-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirming(false);
          }}>
            <section className="logout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description">
              <h2 id="logout-title">Confirm Logout</h2>
              <p id="logout-description">Are you sure you want to log out?</p>
              {error && <p className="logout-error" role="alert">{error}</p>}
              <div className="logout-dialog-actions">
                <button type="button" className="logout-cancel" onClick={() => {
                  setError("");
                  setConfirming(false);
                }}>Cancel</button>
                <button type="button" className="logout-confirm" onClick={confirmLogout}>Logout</button>
              </div>
            </section>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
