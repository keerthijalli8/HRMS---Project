import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getCurrentCompany,
  readCompanyTheme,
} from "../utils/companyPortal";
import superAdminEmblem from "/technomold-emblem.png";

const SUPER_ADMIN_DOCUMENT_TITLE = "Technomold IT Solutions";
const APP_FAVICON_ID = "app-favicon";

function getCompanyBranding() {
  const current = getCurrentCompany();
  return current
    ? {
        tenant: current.tenant,
        theme: readCompanyTheme(current.tenant.id),
      }
    : null;
}

export default function DocumentBranding() {
  const location = useLocation();
  const [branding, setBranding] = useState(getCompanyBranding);
  const isCompanyRoute =
    location.pathname === "/super-admin/activate" ||
    location.pathname === "/super-admin/company" ||
    location.pathname.startsWith("/super-admin/company/");

  useEffect(() => {
    const refresh = () => setBranding(getCompanyBranding());
    const events = [
      "storage",
      "hrms:license-updated",
      "hrms:tenant-updated",
      "hrms:company-session-updated",
      "hrms:company-theme-updated",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, []);

  useEffect(() => {
    document.title = isCompanyRoute
      ? branding?.tenant.name?.trim() || SUPER_ADMIN_DOCUMENT_TITLE
      : SUPER_ADMIN_DOCUMENT_TITLE;

    document
      .querySelectorAll('link[rel="icon"][id="company-admin-favicon"]')
      .forEach((icon) => icon.remove());

    const logo = isCompanyRoute
      ? branding?.theme.logos.sidebar || branding?.theme.logos.login
      : superAdminEmblem;
    const existingIcon = document.getElementById(APP_FAVICON_ID);
    if (!logo) {
      existingIcon?.remove();
      return;
    }

    const favicon = existingIcon || document.createElement("link");
    favicon.id = APP_FAVICON_ID;
    favicon.rel = "icon";
    const mimeType = logo.match(/^data:([^;,]+)/i)?.[1];
    if (mimeType) favicon.type = mimeType;
    else favicon.removeAttribute("type");
    favicon.href = logo;
    if (!existingIcon) document.head.appendChild(favicon);
  }, [branding, isCompanyRoute]);

  return null;
}
