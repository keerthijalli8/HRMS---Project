import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { SUPERADMIN_PAGE_NAMES } from "../routes.js";

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const location = useLocation();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const [activePage, setActivePage] = useState(
    () => SUPERADMIN_PAGE_NAMES[location.pathname] || "Dashboard"
  );

  useEffect(() => {
    const label = SUPERADMIN_PAGE_NAMES[location.pathname];
    if (label) {
      setActivePage(label);
    }
  }, [location.pathname]);

  return (
    <NavigationContext.Provider
      value={{
        activePage,
        setActivePage,
        user,
        isAuthenticated,
        logout,
        updateProfile,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error(
      "useNavigation must be used inside NavigationProvider"
    );
  }

  return context;
}
