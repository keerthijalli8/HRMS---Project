import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Tag } from '../shared/Tag';
import { StatusPill } from '../shared/StatusPill';
import { ProgressBar } from '../shared/ProgressBar';
import { Avatar } from '../shared/Avatar';
import { IconHeadphones, IconCheck, IconArrowRight } from '../shared/Icons';

export function HelpdeskSubDashboard({ onBack }) {
  const {
    tickets,
    ticketFeedbacks,
    escalateTicket,
    submitTicketFeedback,
    resolveTicket,
    navigate,
    setActiveDrawer,
    hasPermission
  } = useStore();
  const canReadHelpdesk = hasPermission('Helpdesk', 'read');
  const canWriteHelpdesk = hasPermission('Helpdesk', 'write');
  const canUpdateHelpdesk = hasPermission('Helpdesk', 'update');

  const [selectedEscalateTicket, setSelectedEscalateTicket] = useState(null);
  const [escalateLevel, setEscalateLevel] = useState('L2 - Tier 2 Senior Support');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTicketId, setFeedbackTicketId] = useState(tickets[0]?.id || '');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Open tickets requiring SLA management
  const openTickets = tickets.filter(t => t.status !== 'resolved');
  const breachedTickets = tickets.filter(t => t.status === 'breached SLA');

  // Average CSAT calculation
  const avgRating = (ticketFeedbacks.reduce((acc, f) => acc + f.rating, 0) / (ticketFeedbacks.length || 1)).toFixed(1);

  const handleEscalate = (ticketId) => {
    if (!hasPermission('Helpdesk', 'update')) return;
    escalateTicket(ticketId, escalateLevel);
    setSelectedEscalateTicket(null);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!hasPermission('Helpdesk', 'update')) return;
    if (!feedbackTicketId) return;
    submitTicketFeedback(feedbackTicketId, Number(feedbackRating), feedbackComment);
    setShowFeedbackModal(false);
    setFeedbackComment('');
  };

  if (!canReadHelpdesk) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Helpdesk Operations Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your active role does not have Helpdesk: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in-50 duration-200">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[var(--radius)] bg-surface border border-line">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1 text-[12px] rounded-full bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition-colors"
            >
              ← Back to Overview
            </button>
          )}
          <div>
            <h2 className="font-display font-bold text-[18px] text-ink leading-tight">
              Helpdesk & SLA Operations Sub-Dashboard
            </h2>
            <p className="text-[12px] text-muted">
              Live SLA performance telemetry, L1/L2/L3 escalation dispatch, and CSAT customer satisfaction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canUpdateHelpdesk && <Button
            variant="secondary"
            onClick={() => setShowFeedbackModal(true)}
            ariaLabel="Record CSAT feedback"
          >
            Log CSAT Rating
          </Button>}
          {canWriteHelpdesk && <Button
            variant="primary"
            onClick={() => setActiveDrawer('new_ticket')}
            icon={IconHeadphones}
            ariaLabel="Create ticket"
          >
            Create Ticket
          </Button>}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Active Backlog</span>
          <span className="font-display font-bold text-[24px] text-ink">{openTickets.length}</span>
          <span className="text-[11px] text-accent">Across all priorities</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">SLA Compliance</span>
          <span className="font-display font-bold text-[24px] text-good">
            {Math.round(((tickets.length - breachedTickets.length) / tickets.length) * 100)}%
          </span>
          <span className="text-[11px] text-muted">Target threshold: 92%</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">SLA Breached</span>
          <span className="font-display font-bold text-[24px] text-bad">{breachedTickets.length}</span>
          <span className="text-[11px] text-muted">Immediate triage needed</span>
        </div>
        <div className="p-3.5 rounded-[var(--radius)] bg-surface border border-line flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted font-bold">Customer CSAT</span>
          <span className="font-display font-bold text-[24px] text-accent2">{avgRating} / 5.0</span>
          <span className="text-[11px] text-muted">96% Positive responses</span>
        </div>
      </div>

      {/* SLA Tracking Table */}
      <Card
        title="Live Service Level Agreement (SLA) Tracking"
        subText="Real-time elapsed time vs commitment window (Critical: 4h · High: 8h · Medium: 24h · Low: 48h)"
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Ticket ID</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Requester</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Summary</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Priority</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">SLA Progress</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold">Status</th>
                <th className="pb-2 text-[11px] uppercase tracking-wider text-muted font-bold text-right">Escalation</th>
              </tr>
            </thead>
            <tbody>
              {openTickets.slice(0, 8).map((ticket) => {
                const totalHours = ticket.slaHours || 24;
                const elapsedHours = ticket.slaElapsedHours || 1;
                const percent = Math.min(100, Math.round((elapsedHours / totalHours) * 100));
                const isOverdue = ticket.status === 'breached SLA' || percent >= 100;

                return (
                  <tr key={ticket.id} className="border-b border-dashed border-line hover:bg-surface2 transition-colors">
                    <td className="py-2.5 font-data font-semibold text-accent">{ticket.id}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={ticket.requesterName} size={24} />
                        <span className="text-ink truncate max-w-[120px]">{ticket.requesterName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink truncate max-w-[200px]">{ticket.title}</td>
                    <td className="py-2.5">
                      <StatusPill status={ticket.priority} />
                    </td>
                    <td className="py-2.5">
                      <div className="w-32">
                        <ProgressBar
                          value={percent}
                          max={100}
                          status={isOverdue ? 'bad' : percent > 75 ? 'warn' : 'accent'}
                        />
                        <span className="text-[10px] text-muted font-data mt-0.5 block">
                          {elapsedHours}h of {totalHours}h limit
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <StatusPill status={ticket.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canUpdateHelpdesk && <button
                          onClick={() => setSelectedEscalateTicket(ticket)}
                          className="px-2 py-1 text-[11px] font-semibold text-accent hover:text-ink bg-surface2 border border-line hover:border-accent rounded-full transition-colors"
                        >
                          Escalate
                        </button>}
                        {canUpdateHelpdesk && <button
                          onClick={() => resolveTicket(ticket.id, 'Resolved via Helpdesk Sub-dashboard')}
                          className="px-2 py-1 text-[11px] font-semibold text-good hover:text-ink bg-[var(--good)]/10 border border-good/30 rounded-full transition-colors"
                        >
                          Resolve
                        </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Escalation Manager & CSAT Feedback Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tier Escalation Dispatcher */}
        <Card
          title="Escalation Management (L1 → L2 → L3)"
          subText="Cross-functional routing matrix for complex incidents & SLA prevention"
        >
          <div className="flex flex-col gap-3 text-[13px]">
            <div className="p-3 bg-surface2 rounded-[var(--radius)] border border-line flex flex-col gap-2">
              <span className="font-semibold text-ink">Active Escalation Rules</span>
              <ul className="text-[12px] text-muted space-y-1 list-disc list-inside">
                <li><strong className="text-ink">L1 Support:</strong> Hardware diagnostics, standard software provisioning, initial password resets (2h SLA).</li>
                <li><strong className="text-ink">L2 Infrastructure:</strong> VPN gateways, firewall access, active directory policy, license disputes (4h SLA).</li>
                <li><strong className="text-ink">L3 Engineering & SecOps:</strong> Production cluster downtime, breach triage, data loss response (1h SLA).</li>
              </ul>
            </div>

            {canUpdateHelpdesk && selectedEscalateTicket && (
              <div className="p-3 bg-[#0a222b] border border-accent rounded-[var(--radius)] flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-accent">Escalate Ticket #{selectedEscalateTicket.id}</span>
                  <button onClick={() => setSelectedEscalateTicket(null)} className="text-muted hover:text-ink">✕</button>
                </div>
                <p className="text-[12px] text-ink">{selectedEscalateTicket.title}</p>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wider text-muted font-bold">Target Tier</label>
                  <select
                    value={escalateLevel}
                    onChange={(e) => setEscalateLevel(e.target.value)}
                    className="px-3 py-1.5 text-[12px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="L2 - Infrastructure Support">L2 - Tier 2 Infrastructure Team</option>
                    <option value="L3 - SecOps / Cloud Architecture">L3 - Tier 3 SecOps & Cloud Architecture</option>
                    <option value="Executive IT Leadership">Executive IT Leadership Escalation</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedEscalateTicket(null)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={() => handleEscalate(selectedEscalateTicket.id)}>Dispatch Escalation</Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* CSAT Customer Feedback */}
        <Card
          title="Customer CSAT & Resolution Feedback"
          subText="Employee satisfaction ratings, service comments, and sentiment tracking"
          action={canUpdateHelpdesk ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFeedbackModal(true)}
              ariaLabel="Add feedback"
            >
              + Add Feedback
            </Button>
          ) : null}
        >
          <div className="flex flex-col divide-y divide-dashed divide-line text-[13px]">
            {ticketFeedbacks.map((f, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-data font-bold text-accent">{f.ticketId}</span>
                    <span className="text-muted">•</span>
                    <span className="font-semibold text-ink">{f.requester}</span>
                  </div>
                  <p className="text-[12px] text-muted italic">"{f.comment}"</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-surface2 px-2.5 py-1 rounded-full border border-line">
                  <span className="text-warn text-[12px]">{'★'.repeat(f.rating)}</span>
                  <span className="text-[11px] font-data text-ink font-bold">{f.rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Record Feedback Modal */}
      {canUpdateHelpdesk && showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a222b] border border-line rounded-[var(--radius)] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-display font-bold text-[18px] text-ink">Record Ticket Resolution Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Select Resolved Ticket</label>
                <select
                  required
                  value={feedbackTicketId}
                  onChange={(e) => setFeedbackTicketId(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                >
                  {tickets.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0a222b]">
                      {t.id} — {t.title} ({t.requesterName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`flex-1 py-1.5 rounded-[var(--radius)] border text-[14px] font-bold transition-colors ${
                        feedbackRating >= star
                          ? 'bg-warn/20 border-warn text-warn'
                          : 'bg-surface2 border-line text-muted'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block mb-1">Employee Comment</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Fast turnaround, helpful engineer..."
                  className="w-full px-3 py-2 text-[13px] bg-surface2 border border-line rounded-[var(--radius)] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Submit Feedback</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
