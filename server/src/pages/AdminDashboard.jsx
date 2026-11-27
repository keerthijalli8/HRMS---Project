// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Unlock,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { auditApi, authApi, faceApi } from '../api/index.js';
import { Card } from '../components/common/Card.jsx';
import { SecondaryButton } from '../components/common/Buttons.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';

export function AdminDashboard() {
  const { isHR } = useAuth();
  const { showToast } = useToast();

  const [loginLogs, setLoginLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [auditRes, empRes, notifRes] = await Promise.all([
        auditApi.getLogins({
          startDate,
          endDate,
          department: departmentFilter,
          status: statusFilter
        }),
        faceApi.getEmployees(),
        auditApi.getNotifications().catch(() => ({ data: [] }))
      ]);
      setLoginLogs(auditRes.data || []);
      setEmployees(empRes.data || []);
      setNotifications(notifRes.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch login audit data', 'bad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [startDate, endDate, departmentFilter, statusFilter]);

  const handleUnlockEmployee = async (employeeId) => {
    try {
      const res = await authApi.unlockAccount(employeeId);
      showToast(res.message, 'good');
      await fetchAllData();
    } catch (err) {
      showToast(err.message || 'Failed to unlock account', 'bad');
    }
  };

  const handleApproveEnrollment = async (employeeId) => {
    try {
      const res = await faceApi.approveEnrollment(employeeId);
      showToast(res.message, 'good');
      await fetchAllData();
    } catch (err) {
      showToast(err.message || 'Failed to approve enrollment', 'bad');
    }
  };

  const handleResolveNotification = async (id) => {
    try {
      await auditApi.resolveNotification(id);
      showToast('Alert marked resolved', 'info');
      await fetchAllData();
    } catch (err) {
      showToast(err.message || 'Failed to resolve alert', 'bad');
    }
  };

  const handlePolicyChange = async (employeeId, policy) => {
    try {
      const res = await authApi.updateFacePolicy(employeeId, policy);
      showToast(res.message, 'good');
      await fetchAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update face login policy', 'bad');
    }
  };

  const handleDeleteBiometrics = async (employeeId) => {
    if (!window.confirm(`Permanently delete encrypted face vectors for ${employeeId}?`)) return;
    try {
      const res = await faceApi.deleteFace(employeeId);
      showToast(res.message, 'info');
      await fetchAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete face biometrics', 'bad');
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (departmentFilter) params.append('department', departmentFilter);
    if (statusFilter) params.append('status', statusFilter);

    window.open(`/api/audit/export?${params.toString()}`, '_blank');
  };

  const openAlerts = notifications.filter(n => !n.is_resolved);

  return (
    <div className="space-y-5">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-tile">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">Total Login Events</div>
          <div className="font-display font-bold text-2xl text-ink tabular-nums">{loginLogs.length}</div>
        </div>
        <div className="kpi-tile">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">Face-Verified Logins</div>
          <div className="font-display font-bold text-2xl text-good tabular-nums">
            {loginLogs.filter(l => l.status === 'SUCCESS').length}
          </div>
        </div>
        <div className="kpi-tile">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">Spoof / Lockout Alerts</div>
          <div className="font-display font-bold text-2xl text-bad tabular-nums">
            {loginLogs.filter(l => ['FAILED_FACE', 'LOCKED', 'SPOOF_SUSPECTED'].includes(l.status)).length}
          </div>
        </div>
        <div className="kpi-tile">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">Enrolled Employees</div>
          <div className="font-display font-bold text-2xl text-accent2 tabular-nums">
            {employees.filter(e => e.face_enrolled && e.enrollment_status === 'APPROVED').length} / {employees.length}
          </div>
        </div>
      </div>

      {/* HR Security Notifications Banner */}
      {openAlerts.length > 0 && (
        <Card
          title="HR Security Alerts & Pending Approvals"
          subtext="Real-time spoof detections, account lockouts (5 fails), and pending biometric enrollments"
        >
          <div className="space-y-2.5">
            {openAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-3 rounded-tpl bg-bad/5 border border-bad/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-bad shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-ink flex items-center gap-2">
                      <span>{alert.event_type}</span>
                      <span className="font-mono text-muted">· {alert.employee_id}</span>
                    </div>
                    <div className="text-muted mt-0.5">{alert.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alert.event_type === 'ENROLLMENT_PENDING' && (
                    <SecondaryButton size="sm" onClick={() => handleApproveEnrollment(alert.employee_id)}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-good" />
                      Approve
                    </SecondaryButton>
                  )}
                  {alert.event_type === 'LOCKED' && (
                    <SecondaryButton size="sm" onClick={() => handleUnlockEmployee(alert.employee_id)}>
                      <Unlock className="w-3.5 h-3.5 text-good" />
                      Unlock
                    </SecondaryButton>
                  )}
                  <SecondaryButton size="sm" onClick={() => handleResolveNotification(alert.id)}>
                    Dismiss
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Employee Face Policy & Account Lock Management */}
      <Card
        title="Employee Face Login Management"
        subtext="Manage 1:1 biometric vector policies, approve enrollments, unlock locked accounts, or purge encrypted vectors"
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-[13px] border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Biometric Status</th>
                <th className="py-2.5 px-3">Face Login Policy</th>
                <th className="py-2.5 px-3">Account Security</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr
                  key={emp.id}
                  className="border-b border-dashed border-line/60 hover:bg-surface2/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-ink">{emp.name}</div>
                    <div className="text-[11px] text-muted font-mono">{emp.id} · {emp.department}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {emp.enrollment_status === 'PENDING_HR' ? (
                        <StatusPill status="warn" label="Pending HR Approval" />
                      ) : emp.face_enrolled ? (
                        <StatusPill status="verified" label="AES-256 Vectors" />
                      ) : (
                        <StatusPill status="warn" label="Not Enrolled" />
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={emp.face_login_policy}
                      onChange={e => handlePolicyChange(emp.id, e.target.value)}
                      disabled={!isHR}
                      className="px-2.5 py-1.5 rounded-tpl bg-surface2 border border-line text-xs font-semibold text-ink focus:outline-none focus:border-accent"
                    >
                      <option value="REQUIRED">REQUIRED</option>
                      <option value="OPTIONAL">OPTIONAL</option>
                      <option value="OFF">OFF</option>
                    </select>
                  </td>

                  <td className="py-3 px-3">
                    {emp.is_locked ? (
                      <StatusPill status="bad" label="Locked (5 Fails)" />
                    ) : (
                      <StatusPill
                        status="good"
                        label={`Active (${emp.failed_face_attempts} fails)`}
                      />
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {emp.enrollment_status === 'PENDING_HR' && (
                        <SecondaryButton
                          onClick={() => handleApproveEnrollment(emp.id)}
                          size="sm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-good" />
                          Approve
                        </SecondaryButton>
                      )}
                      {emp.is_locked === 1 && (
                        <SecondaryButton
                          onClick={() => handleUnlockEmployee(emp.id)}
                          size="sm"
                        >
                          <Unlock className="w-3.5 h-3.5 text-good" />
                          Unlock
                        </SecondaryButton>
                      )}
                      {emp.face_enrolled === 1 && (
                        <button
                          onClick={() => handleDeleteBiometrics(emp.id)}
                          className="px-2.5 py-1.5 rounded-tpl bg-bad/15 border border-bad/30 text-bad text-xs font-semibold hover:bg-bad/25 transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Face
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Filter Bar Card */}
      <Card
        title="Login Audit Filters"
        subtext="Filter login verification history by date, department, or outcome"
        action={
          <SecondaryButton onClick={handleExportCSV} size="sm">
            <FileSpreadsheet className="w-4 h-4 text-accent" />
            Export CSV
          </SecondaryButton>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="text-muted block mb-1 font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-tpl bg-surface2 border border-line text-ink focus:outline-none focus:border-accent text-[13px]"
            />
          </div>
          <div>
            <label className="text-muted block mb-1 font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-tpl bg-surface2 border border-line text-ink focus:outline-none focus:border-accent text-[13px]"
            />
          </div>
          <div>
            <label className="text-muted block mb-1 font-medium">Department</label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-tpl bg-surface2 border border-line text-ink focus:outline-none focus:border-accent text-[13px]"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
          <div>
            <label className="text-muted block mb-1 font-medium">Outcome</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-tpl bg-surface2 border border-line text-ink focus:outline-none focus:border-accent text-[13px]"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">SUCCESS (Face Matched)</option>
              <option value="SPOOF_SUSPECTED">SPOOF_SUSPECTED</option>
              <option value="FAILED_FACE">FAILED_FACE</option>
              <option value="LOCKED">LOCKED</option>
              <option value="OTP_FALLBACK">OTP_FALLBACK</option>
              <option value="PASSWORD_ONLY">PASSWORD_ONLY</option>
              <option value="UNLOCKED">UNLOCKED</option>
            </select>
          </div>
          <div className="flex items-end">
            <SecondaryButton
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setDepartmentFilter('');
                setStatusFilter('');
              }}
              className="w-full text-xs"
            >
              Reset Filters
            </SecondaryButton>
          </div>
        </div>
      </Card>

      {/* Login Audit Table */}
      <Card title="Face Login Audit Log">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-[13px] border-collapse min-w-[740px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Server Login Time</th>
                <th className="py-2.5 px-3">Verification Outcome</th>
                <th className="py-2.5 px-3">Match Score</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Device Hash / Agent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-muted text-[13px]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                    Loading login audit logs...
                  </td>
                </tr>
              ) : loginLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-muted text-[13px]">
                    No login audit records match your filters.
                  </td>
                </tr>
              ) : (
                loginLogs.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-dashed border-line/60 hover:bg-surface2/40 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-ink">{record.employee_name}</div>
                      <div className="text-[11px] text-muted font-mono">{record.employee_id} · {record.department}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-ink tabular-nums">
                      {new Date(record.login_time).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>

                    <td className="py-3 px-3">
                      <StatusPill
                        status={
                          record.status === 'SUCCESS'
                            ? 'verified'
                            : ['LOCKED', 'FAILED_FACE', 'SPOOF_SUSPECTED'].includes(record.status)
                              ? 'bad'
                              : record.status === 'UNLOCKED'
                                ? 'good'
                                : 'info'
                        }
                        label={record.status}
                      />
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums">
                      {record.match_score !== null ? (
                        <span className="text-good font-semibold">
                          {(record.match_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs text-muted">
                      {record.ip_address || '127.0.0.1'}
                    </td>

                    <td className="py-3 px-3 text-xs text-muted max-w-[220px] truncate" title={record.user_agent}>
                      <span className="font-mono text-ink">{record.device_hash ? record.device_hash.slice(0, 10) : 'legacy'}</span>
                      {' · '}
                      {record.user_agent || 'Browser'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboard;
