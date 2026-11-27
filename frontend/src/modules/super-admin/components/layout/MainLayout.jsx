
import { useEffect, useRef, useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useNavigation } from "../../context/NavigationContext";
import { SAVE_SUCCESS_EVENT } from "../../utils/saveNavigation";
import { SUPERADMIN_PAGE_NAMES } from "../../routes";

export default function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { setActivePage } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const routeHistory = useRef([]);
  const currentRoute = useRef(null);
  const scrollPositions = useRef(new Map());
  const [, refreshRouteHistory] = useState(0);
  const [saveToast, setSaveToast] = useState("");
  const returnTo = location.state?.returnTo;
  const pageNames = SUPERADMIN_PAGE_NAMES;
  const routeLabel = (route) =>
    route?.state?.submodule ||
    pageNames[route?.pathname] ||
    "Previous Page";

  useEffect(() => {
    const captureScroll = () => {
      if (currentRoute.current) {
        scrollPositions.current.set(currentRoute.current.key, window.scrollY);
      }
    };

    window.addEventListener("scroll", captureScroll, { passive: true });
    return () => window.removeEventListener("scroll", captureScroll);
  }, []);

  useEffect(() => {
    const nextRoute = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      key: location.key,
      state: location.state,
    };
    const previousRoute = currentRoute.current;

    if (!previousRoute) {
      routeHistory.current = [nextRoute];
    } else if (navigationType === "PUSH") {
      routeHistory.current.push(nextRoute);
    } else if (navigationType === "REPLACE") {
      routeHistory.current[routeHistory.current.length - 1] = nextRoute;
    } else {
      const targetIndex = routeHistory.current.findIndex(
        (route) => route.key === nextRoute.key
      );
      if (targetIndex >= 0) {
        routeHistory.current = routeHistory.current.slice(0, targetIndex + 1);
      } else {
        routeHistory.current.push(nextRoute);
      }
      window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositions.current.get(nextRoute.key) || 0);
      });
    }

    currentRoute.current = nextRoute;
    refreshRouteHistory((value) => value + 1);
  }, [location, navigationType]);

  useEffect(() => {
    const handleSaveSuccess = (event) => {
      setSaveToast(event.detail?.message || "Changes saved successfully.");
      window.setTimeout(() => setSaveToast(""), 2600);
    };

    window.addEventListener(SAVE_SUCCESS_EVENT, handleSaveSuccess);
    return () => window.removeEventListener(SAVE_SUCCESS_EVENT, handleSaveSuccess);
  }, []);

  const previousRoute = routeHistory.current.length > 1
    ? routeHistory.current[routeHistory.current.length - 2]
    : null;
  const fallbackPath =
    location.pathname === "/super-admin/dashboard" || location.pathname === "/super-admin"
      ? null
      : "/super-admin/dashboard";
  const returnPath = returnTo
    ? new URL(returnTo, window.location.origin).pathname
    : null;
  const canGoBack =
    location.pathname !== "/super-admin/dashboard" &&
    location.pathname !== "/super-admin" &&
    Boolean(previousRoute || returnPath || fallbackPath);
  const backLabel = previousRoute
    ? routeLabel(previousRoute)
    : returnPath
    ? pageNames[returnPath] || "Previous Page"
    : pageNames[fallbackPath] || "Dashboard";

  // Close the mobile drawer whenever the viewport enters desktop mode.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePageClick = () => {
    const path = window.location.pathname;
    setActivePage(pageNames[path] || "Dashboard");
  };

  const initialTheme = (() => {
    try {
      return localStorage.getItem("superAdminTheme") || "monsoon";
    } catch {
      return "monsoon";
    }
  })();

  return (
    <div className="mod-superadmin" data-theme={initialTheme}>
      <div className="app-shell">
      <div
        className={`mobile-sidebar-overlay ${
          mobileSidebarOpen ? "show" : ""
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <div
        className={`sidebar-wrapper ${
          mobileSidebarOpen ? "mobile-sidebar-open" : ""
        }`}
      >
        <Sidebar />
      </div>

      <main className="main-area">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />

        <div className="page-content" onClick={handlePageClick}>
          {saveToast && <div className="global-save-toast" role="status">{saveToast}</div>}
          {canGoBack && (
            <button
              type="button"
              className="global-back-button"
              aria-label={`Return to ${backLabel}`}
              title={`Return to ${backLabel}`}
              onClick={(event) => {
                event.stopPropagation();
                if (previousRoute) {
                  navigate(-1);
                } else if (returnTo) {
                  navigate(returnTo);
                } else {
                  navigate(fallbackPath);
                }
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <Outlet />
        </div>
      </main>
      </div>
    </div>
  );
}
