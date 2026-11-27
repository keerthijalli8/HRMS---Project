// src/pages/Leave.jsx
// Upgraded Employee Leave Dashboard module inside Monsoon Glass HRMS:
// Features 3-step TL/MANAGER(FINAL)/HR business logic, 48h SLA escalation, SummaryCards,
// LeaveTabs (All | Pending | Approved | Rejected), responsive LeaveTable, LeaveDetailPanel, and ApplyLeaveModal.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  WifiOff,
  RotateCcw,
  Table,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { SummaryCards } from '../components/leave/SummaryCards.jsx';
import { LeaveTabs } from '../components/leave/LeaveTabs.jsx';
import { LeaveTable } from '../components/leave/LeaveTable.jsx';
import { LeaveDetailPanel } from '../components/leave/LeaveDetailPanel.jsx';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal.jsx';
import { Calendar } from '../components/Calendar.jsx';
import { leaveService } from '../services/leaveService.js';
import { getFinalStatus } from '../utils/leaveStatus.js';

export function Leave() {
  const { showToast } = useToast();

  const [balances, setBalances] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active filter tab: 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [activeTab, setActiveTab] = useState('All');

  // View mode: 'table' | 'calendar'
  const [viewMode, setViewMode] = useState('table');

  // Detail Drawer & Apply Modal states
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadDashboardData = useCallback(async ({ simulateError = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaveService.getLeaveDashboardData({ simulateError, delayMs: 400 });
      setBalances(data.balances);
      setRequests(data.requests);
    } catch (err) {
      setError(err.message || 'Unable to load leave records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Compute dynamic counts using getFinalStatus() business rules
  const statusCounts = useMemo(() => {
    const counts = {
      all: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      cancelled: 0
    };

    requests.forEach((req) => {
      const status = getFinalStatus(req);
      if (status === 'Pending') counts.pending++;
      else if (status === 'Approved') counts.approved++;
      else if (status === 'Rejected') counts.rejected++;
      else if (status === 'Escalated') counts.escalated++;
      else if (status === 'Cancelled') counts.cancelled++;
    });

    return counts;
  }, [requests]);

  // Filter table requests according to active LeaveTabs
  const filteredRequests = useMemo(() => {
    if (activeTab === 'All') return requests;
    return requests.filter((req) => getFinalStatus(req) === activeTab);
  }, [requests, activeTab]);

  // Derive active selected request from latest state
  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null;
    return requests.find((r) => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  const handleApplySuccess = ({ newRequest, requests: updatedRequests, balances: updatedBalances }) => {
    setRequests(updatedRequests);
    setBalances(updatedBalances);
    setActiveTab('Pending');
    setSelectedRequestId(newRequest.id);
    showToast(`Leave request ${newRequest.id} submitted as Pending.`, { variant: 'good' });
  };

  const handleCancelLeave = async (id) => {
    setIsCancelling(true);
    try {
      const result = await leaveService.cancelLeave(id);
      setRequests(result.requests);
      setBalances(result.balances);
      showToast(`Leave request ${id} cancelled and balance restored.`, { variant: 'warn' });
    } catch (err) {
      showToast(err.message || 'Could not cancel leave request.', { variant: 'bad' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    const reset = await leaveService.resetMockData();
    setBalances(reset.balances);
    setRequests(reset.requests);
    setSelectedRequestId(null);
    setActiveTab('All');
    setLoading(false);
    showToast('Leave sample data reset to defaults.');
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Governance Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/40">
        <div className="flex items-center gap-2 text-[12px] text-muted flex-wrap">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
          <span>
            Approval authority: <strong className="text-ink">Manager (Final)</strong> · TL &amp; HR recommendations · 48h escalation to HR
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SecondaryButton
            size="sm"
            onClick={() => loadDashboardData({ simulateError: false })}
            disabled={loading}
            title="Reload leave data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </SecondaryButton>

          <SecondaryButton
            size="sm"
            onClick={() => loadDashboardData({ simulateError: true })}
            disabled={loading}
            title="Simulate network error to test Retry button"
          >
            <WifiOff className="w-3.5 h-3.5 text-bad" />
            Test Error
          </SecondaryButton>

          <SecondaryButton
            size="sm"
            onClick={handleResetDemo}
            disabled={loading}
            title="Restore original mock dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </SecondaryButton>

          <PrimaryButton size="sm" onClick={() => setApplyModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Apply Leave
          </PrimaryButton>
        </div>
      </div>

      {/* 1. Summary Cards (Leave Balance per Type + Pending/Approved/Rejected Counts) */}
      <SummaryCards
        balances={balances}
        counts={statusCounts}
        loading={loading}
        onSelectFilter={(tab) => setActiveTab(tab)}
      />

      {/* 2. Leave History & Approval Tracking Card */}
      <Card
        title="My Leave Requests"
        subtext={
          viewMode === 'calendar'
            ? 'Interactive month calendar · Click any month to view leaves, and click a leave to inspect reason & approvers'
            : activeTab === 'All' && (statusCounts.escalated > 0 || statusCounts.cancelled > 0)
            ? `Click any row to inspect 3-step approvals · ${statusCounts.escalated} Escalated · ${statusCounts.cancelled} Cancelled`
            : 'Click any row or card to inspect the 3-step approval timeline and remarks'
        }
        action={
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher: Table vs Calendar */}
            <div className="flex items-center bg-surface2/70 p-0.5 rounded-full border border-line">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                className={`px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-label="Calendar view"
                className={`px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>

            {viewMode === 'table' && (
              <LeaveTabs
                activeTab={activeTab}
                onChange={setActiveTab}
                counts={statusCounts}
              />
            )}
          </div>
        }
      >
        {viewMode === 'table' ? (
          <LeaveTable
            requests={filteredRequests}
            loading={loading}
            error={error}
            onRetry={() => loadDashboardData({ simulateError: false })}
            onRowClick={(req) => setSelectedRequestId(req.id)}
            selectedId={selectedRequestId}
            onClearFilter={activeTab !== 'All' ? () => setActiveTab('All') : null}
          />
        ) : (
          <Calendar
            leaveEntries={requests}
            onLeaveClick={(leave) => setSelectedRequestId(leave.id)}
          />
        )}
      </Card>

      {/* Escalated SLA Informational Callout when present */}
      {!loading && !error && statusCounts.escalated > 0 && (
        <div className="p-3.5 rounded-tpl bg-orange-500/10 border border-orange-400/40 flex items-center justify-between gap-3 flex-wrap text-[12px]">
          <div className="flex items-center gap-2 text-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-300 shrink-0" />
            <span>
              <strong>{statusCounts.escalated}</strong> leave request exceeded the 48-hour Manager SLA window and has been automatically escalated to <strong>HR (Ananya Deshmukh)</strong> for final resolution.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const esc = requests.find((r) => getFinalStatus(r) === 'Escalated');
              if (esc) setSelectedRequestId(esc.id);
            }}
            className="text-orange-300 hover:underline font-semibold shrink-0"
          >
            Inspect Escalated Request →
          </button>
        </div>
      )}

      {/* 3. Right-side Detail Panel (Fullscreen on Mobile) */}
      <LeaveDetailPanel
        leave={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequestId(null)}
        onCancelLeave={handleCancelLeave}
        isCancelling={isCancelling}
      />

      {/* 4. Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
        balances={balances}
      />
    </div>
  );
}

export default Leave;
