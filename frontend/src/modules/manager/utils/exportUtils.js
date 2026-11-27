// CSV and Report download utilities for Manager Desk

export function downloadCSV(filename, rows) {
  const processRow = (row) =>
    row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',');

  const csvContent = rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAttendanceCSV(employees, date = '2026-11-06') {
  const headers = [
    'Date',
    'Employee ID',
    'Employee Name',
    'Role Tier',
    'Designation / Role',
    'Department',
    'Office Location',
    'Shift Timing',
    'Attendance Status',
    'Punch In Time',
    'Punch Out Time',
    'Hours Worked',
    'Hours (Decimal)',
    'Punch In Latitude',
    'Punch In Longitude',
    'Geofence Compliance',
    'Punch Out Latitude',
    'Punch Out Longitude',
    'Reporting Type',
  ];

  const statusMap = {
    'in-office': 'In Office',
    'remote': 'Remote (WFH)',
    'on-leave': 'On Leave',
    'not-punched': 'Not Punched',
    'late': 'Late Arrival',
  };

  const dataRows = employees.map((emp) => {
    // Format human-readable status
    const cleanStatus = statusMap[emp.status] || emp.status || 'Not Punched';

    // Format clean punch times (avoid em-dashes that corrupt Excel encoding)
    const cleanPunchIn = emp.punchIn && emp.punchIn !== '—'
      ? emp.punchIn
      : (emp.status === 'on-leave' ? 'On Leave' : 'Not Punched');

    const cleanPunchOut = emp.punchOut && emp.punchOut !== '—'
      ? emp.punchOut
      : (emp.status === 'in-office' || emp.status === 'remote' ? 'Pending' : 'N/A');

    // Resolve geofence status (Remote employees should be Remote-Verified, not marked Outside)
    let geofenceStatus = 'N/A';
    if (emp.status === 'remote') {
      geofenceStatus = 'Remote-Verified';
    } else if (emp.punchInGps?.geofence) {
      geofenceStatus = emp.punchInGps.geofence.isInside
        ? 'Inside (Compliant)'
        : `Location Mismatch (${emp.punchInGps.geofence.distanceMeters}m away)`;
    }

    const roleTier = emp.orgRole ||
      (emp.role?.includes('Lead')
        ? 'Team Lead'
        : emp.role?.includes('HR')
          ? 'HR'
          : emp.role?.includes('Manager')
            ? 'Manager'
            : 'Employee');

    return [
      date,
      emp.id,
      emp.name,
      roleTier,
      emp.role,
      emp.department,
      emp.location,
      'General (09:30 - 18:30)',
      cleanStatus,
      cleanPunchIn,
      cleanPunchOut,
      emp.hoursWorked && emp.hoursWorked !== '—' ? emp.hoursWorked : '0h 00m',
      typeof emp.hoursDecimal === 'number' ? emp.hoursDecimal.toFixed(2) : '0.00',
      emp.punchInGps?.lat ? String(emp.punchInGps.lat) : 'N/A',
      emp.punchInGps?.lng ? String(emp.punchInGps.lng) : 'N/A',
      geofenceStatus,
      emp.punchOutGps?.lat ? String(emp.punchOutGps.lat) : 'N/A',
      emp.punchOutGps?.lng ? String(emp.punchOutGps.lng) : 'N/A',
      emp.reporting || 'Direct',
    ];
  });

  downloadCSV(`technomold-attendance-${date}.csv`, [headers, ...dataRows]);
}

export function exportPayrollInputsCSV(employees, payrollCycle) {
  const headers = [
    'Employee ID',
    'Name',
    'Role',
    'State',
    'Paid Days (of 30)',
    'LOP Unpaid Days',
    'Overtime Hours',
    'Pending Claims',
    'Compliance Flags',
  ];

  const dataRows = employees.map((emp) => [
    emp.id,
    emp.name,
    emp.role,
    emp.state,
    emp.paidDays,
    emp.lopDays,
    emp.overtimeHours,
    emp.reimbursementsPending,
    (emp.flags || []).join('; ') || 'Verified',
  ]);

  downloadCSV(`payroll-inputs-nov2026.csv`, [headers, ...dataRows]);
}

export function exportTeamRosterCSV(employees) {
  const headers = [
    'Employee ID',
    'Name',
    'Role',
    'Department',
    'Location',
    'State',
    'Email',
    'Phone',
    'Join Date',
    'Tenure',
    'Probation Status',
    'Casual Leave',
    'Sick Leave',
    'Earned Leave',
    'Comp Off',
    'Last 1:1 Date',
  ];

  const dataRows = employees.map((emp) => [
    emp.id,
    emp.name,
    emp.role,
    emp.department,
    emp.location,
    emp.state,
    emp.email,
    emp.phone,
    emp.joinDate,
    emp.tenure,
    emp.isProbation ? 'On Probation' : 'Confirmed',
    emp.leaveBalance?.casual || 0,
    emp.leaveBalance?.sick || 0,
    emp.leaveBalance?.earned || 0,
    emp.leaveBalance?.compOff || 0,
    emp.last1on1,
  ]);

  downloadCSV(`team-roster-directory.csv`, [headers, ...dataRows]);
}

// Re-export payslip and Form 16 generators
export * from './payslipPdfGenerator';

