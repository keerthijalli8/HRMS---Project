import React from 'react';
import './index.css';
import { TeamLeadProvider } from './context/TeamLeadContext.jsx';
import { AttendanceProvider } from './context/AttendanceContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export function TeamLeadModuleRoutes() {
  return (
    <TeamLeadProvider>
      <AttendanceProvider>
        <AppRoutes />
      </AttendanceProvider>
    </TeamLeadProvider>
  );
}

export default TeamLeadModuleRoutes;
