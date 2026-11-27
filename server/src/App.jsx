// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/layout/Layout.jsx';

// Pages
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { FaceEnrollment } from './pages/FaceEnrollment.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';

function ProtectedRoute({ children, title, requireHR = false }) {
  const { user, loading, isHR, needsFaceEnrollment } = useAuth();
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
    return <Navigate to="/login" replace />;
  }

  if (requireHR && !isHR) {
    return <Navigate to="/" replace />;
  }

  // First-time onboarding: employee must save face profile before accessing dashboard
  if (needsFaceEnrollment && location.pathname !== '/enroll') {
    return <Navigate to="/enroll" replace />;
  }

  return <Layout title={title}>{children}</Layout>;
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute title="Employee Profile & Face Security">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/enroll"
              element={
                <ProtectedRoute title="Face Enrollment">
                  <FaceEnrollment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute title="HR Face Login Audit" requireHR={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
