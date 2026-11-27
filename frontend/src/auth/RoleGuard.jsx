// src/auth/RoleGuard.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { getHomeRouteForRoles, hasRequiredRole } from './roles.js';

export function RoleGuard({
  children,
  allowedRoles = null,
  skipEnrollmentCheck = false
}) {
  const { user, loading, needsFaceEnrollment } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!skipEnrollmentCheck && needsFaceEnrollment && location.pathname !== '/enroll') {
    return <Navigate to="/enroll" replace />;
  }

  if (allowedRoles && !hasRequiredRole(user.roles, allowedRoles)) {
    return <Navigate to={getHomeRouteForRoles(user.roles)} replace />;
  }

  return children;
}

export default RoleGuard;
