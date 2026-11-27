import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_BRANDING, applyCompanyBranding, getTenantId, loadCompanyBranding } from "../services/companyBranding";
import { useAuth } from "../../../auth/AuthContext.jsx";
const CompanyThemeContext = createContext(null);
export function CompanyThemeProvider({ children }) { const { isAuthenticated, user } = useAuth(); const [branding, setBranding] = useState(DEFAULT_BRANDING); const [tenantId, setTenantId] = useState(() => getTenantId(user)); useEffect(() => { if (!isAuthenticated) return undefined; let active = true; const tenant = getTenantId(user); setTenantId(tenant); loadCompanyBranding(tenant).then((next) => { if (active) { setBranding(next); applyCompanyBranding(next); } }); return () => { active = false; }; }, [isAuthenticated, user]); useEffect(() => { applyCompanyBranding(branding); }, [branding]); const value = useMemo(() => ({ branding, tenantId, setBranding }), [branding, tenantId]); return <CompanyThemeContext.Provider value={value}>{children}</CompanyThemeContext.Provider>; }
export function useCompanyTheme() { return useContext(CompanyThemeContext); }
