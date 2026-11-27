// src/pages/Support.jsx
// Help & Support ticketing system with FAQ accordion and responsive conversation drawers.

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  Send,
  Star,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  Paperclip,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Table } from '../components/Table.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { Accordion } from '../components/Accordion.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { supportService } from '../services/supportService.js';
import { FAQ_LIST } from '../data/employee.js';
import { formatDate } from '../utils/format.js';

export function Support() {
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [ticketTab, setTicketTab] = useState('Open'); // Open, In progress, Resolved, Closed
  const [newTicketDrawer, setNewTicketDrawer] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // New ticket state
  const [category, setCategory] = useState('Attendance');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [formError, setFormError] = useState('');

  // Conversation reply state
  const [replyText, setReplyText] = useState('');

  // FAQ search
  const [faqSearch, setFaqSearch] = useState('');

  const loadTickets = async () => {
    const list = await supportService.getTickets();
    setTickets(list);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormError('');

    if (description.trim().length < 20) {
      setFormError('Description must be at least 20 characters long.');
      return;
    }

    try {
      const created = await supportService.createTicket({
        category,
        subject,
        description,
        priority
      });

      await loadTickets();
      setNewTicketDrawer(false);
      setSubject('');
      setDescription('');

      showToast(`Support ticket ${created.id} raised successfully.`, {
        duration: 120000, // 2 minutes Undo window (Section 20)
        undoLabel: 'Undo',
        onUndo: async () => {
          await supportService.deleteTicket(created.id);
          await loadTickets();
          showToast(`Deleted ticket ${created.id}`);
        }
      });
    } catch (err) {
      setFormError(err.message || 'Failed to create ticket');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const msg = await supportService.addReply(selectedTicket.id, replyText);
    await loadTickets();
    setSelectedTicket(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), msg]
    } : null);
    setReplyText('');
    showToast('Reply delivered to HR queue');
  };

  const handleRate = async (ratingVal) => {
    if (!selectedTicket) return;
    await supportService.rateTicket(selectedTicket.id, ratingVal);
    await loadTickets();
    setSelectedTicket(prev => prev ? { ...prev, rating: ratingVal } : null);
    showToast(`Rated ${ratingVal} stars! Thank you for your feedback.`);
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    await supportService.updateTicketStatus(selectedTicket.id, 'Closed');
    await loadTickets();
    setSelectedTicket(prev => prev ? { ...prev, status: 'Closed' } : null);
    showToast(`Ticket ${selectedTicket.id} closed.`);
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;
    await supportService.updateTicketStatus(selectedTicket.id, 'In progress');
    await loadTickets();
    setSelectedTicket(prev => prev ? { ...prev, status: 'In progress' } : null);
    showToast(`Ticket ${selectedTicket.id} reopened.`);
  };

  const filteredTickets = tickets.filter(t => {
    if (ticketTab === 'Open') return t.status === 'Open';
    if (ticketTab === 'In progress') return t.status === 'In progress';
    if (ticketTab === 'Resolved') return t.status === 'Resolved';
    if (ticketTab === 'Closed') return t.status === 'Closed';
    return true;
  });

  const filteredFaqs = FAQ_LIST.filter(f => 
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. SUPPORT HERO & HR CONTACT CARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 p-6 rounded-tpl glass-card flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-accent font-bold font-mono">
              EMPLOYEE ASSISTANCE & TRIAGE
            </span>
            <h2 className="font-display font-bold text-2xl text-ink">
              How can HR Operations assist you today?
            </h2>
            <p className="text-muted text-xs leading-relaxed max-w-xl">
              Submit a support inquiry regarding payroll computations, biometric regularisations, leave policies, or health benefits. Average first response time: under 4 hours.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton onClick={() => setNewTicketDrawer(true)}>
              <Plus className="w-3.5 h-3.5" /> Raise New Ticket
            </PrimaryButton>
          </div>
        </div>

        {/* HR Desk Contact Card (Section 20) */}
        <div className="md:col-span-4 p-5 rounded-tpl bg-surface2/40 border border-line space-y-3 text-xs">
          <span className="font-semibold text-ink text-sm block">HR Helpdesk Direct</span>
          <div className="space-y-2 text-muted">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" strokeWidth={1.8} />
              <span className="text-ink">hrdesk@company.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" strokeWidth={1.8} />
              <span className="text-ink font-mono">+91 040 6822 1000</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted" strokeWidth={1.8} />
              <span>Hours: 9:30 AM – 6:00 PM IST (Mon–Fri)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TICKETS DIRECTORY (Section 20) */}
      <Card
        title="My Support Tickets"
        subtext="Track active inquiries, SLA countdowns, and resolutions"
        action={
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface2/60 border border-line text-xs">
            {['Open', 'In progress', 'Resolved', 'Closed'].map(tab => (
              <button
                key={tab}
                onClick={() => setTicketTab(tab)}
                className={`px-3 py-1 rounded-full transition-all ${
                  ticketTab === tab
                    ? 'bg-accent text-on-accent font-semibold shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      >
        <Table
          keyField="id"
          columns={[
            {
              header: 'Ticket ID',
              key: 'id',
              render: (id) => <span className="font-mono font-semibold text-accent">{id}</span>
            },
            {
              header: 'Subject & Category',
              key: 'subject',
              render: (sub, row) => (
                <div className="space-y-1">
                  <span className="font-semibold text-ink block">{sub}</span>
                  <div className="flex items-center gap-2">
                    <Tag color="accent">{row.category}</Tag>
                    <Tag color={row.priority === 'High' ? 'bad' : 'default'}>{row.priority}</Tag>
                  </div>
                </div>
              )
            },
            {
              header: 'Assigned Specialist',
              key: 'assignedTo',
              render: (agent) => <span className="text-muted text-xs">{agent}</span>
            },
            {
              header: 'SLA Status',
              key: 'slaResponse',
              render: (sla) => (
                <span className="font-mono text-xs text-warn font-medium">{sla}</span>
              )
            },
            {
              header: 'Status',
              key: 'status',
              render: (s) => <StatusPill status={s} label={s} />
            },
            {
              header: 'Actions',
              key: 'actions',
              render: (_, row) => (
                <button
                  onClick={() => setSelectedTicket(row)}
                  className="text-accent hover:underline text-xs font-semibold"
                >
                  View Thread
                </button>
              )
            }
          ]}
          data={filteredTickets}
        />
      </Card>

      {/* 3. SEARCHABLE FAQ ACCORDION (Section 20) */}
      <Card
        title="Knowledge Base & Frequently Asked Questions"
        subtext="Immediate answers to common HRMS policy, payroll, and attendance rules"
        action={
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-full bg-surface2/60 border border-line text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent w-48"
            />
          </div>
        }
      >
        <Accordion items={filteredFaqs} />
      </Card>

      {/* Raise Ticket Drawer (ticketnew) */}
      <Drawer
        isOpen={newTicketDrawer}
        onClose={() => setNewTicketDrawer(false)}
        title="Raise HR Support Request"
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setNewTicketDrawer(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleCreateTicket}>Submit Request</PrimaryButton>
          </div>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-tpl bg-bad/10 border border-bad/40 text-bad text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-muted font-medium mb-1">Inquiry Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Attendance">Attendance & Biometrics</option>
              <option value="Leave">Leave & Accruals</option>
              <option value="Payroll">Payroll & TDS Tax</option>
              <option value="Documents">Documents Verification</option>
              <option value="Profile change">Profile / Shift Change</option>
              <option value="IT or access">IT or Campus Access</option>
              <option value="Policy question">Policy Question</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Concise summary of your query..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">
              Detailed Description (min 20 characters) *
            </label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact dates, payslip months, or specific error messages..."
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            />
            <div className="text-right text-[10px] text-muted mt-1 font-mono">
              {description.length}/1000 characters
            </div>
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-sm focus:border-accent focus:outline-none"
            >
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
              <option value="High">High (Urgent blocker)</option>
            </select>
          </div>
        </form>
      </Drawer>

      {/* Ticket Details & Conversation Drawer */}
      <Drawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Ticket: ${selectedTicket.id}` : ''}
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs">
            {/* Meta Card */}
            <div className="p-3.5 rounded-tpl bg-surface2/50 border border-line space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-ink text-sm">{selectedTicket.subject}</span>
                <StatusPill status={selectedTicket.status} label={selectedTicket.status} />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-muted text-[11px]">
                <Tag color="accent">{selectedTicket.category}</Tag>
                <span>Assigned: {selectedTicket.assignedTo}</span>
                <span>•</span>
                <span>Created: {formatDate(selectedTicket.created)}</span>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-mono block">
                Conversation Thread
              </span>
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {selectedTicket.messages?.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-tpl border space-y-1 ${
                      m.role === 'Employee'
                        ? 'bg-accent/10 border-accent/30 ml-4'
                        : 'bg-surface2/60 border-line mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-semibold text-ink">{m.sender}</span>
                      <span className="text-muted font-mono">{m.time}</span>
                    </div>
                    <p className="text-ink leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Composer */}
            {selectedTicket.status !== 'Closed' && (
              <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-line/40">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to HR..."
                  className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-ink text-xs focus:border-accent focus:outline-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {selectedTicket.status === 'Resolved' && (
                      <SecondaryButton size="sm" type="button" onClick={handleCloseTicket}>
                        Accept & Close
                      </SecondaryButton>
                    )}
                  </div>
                  <PrimaryButton size="sm" type="submit">
                    <Send className="w-3.5 h-3.5" /> Send Reply
                  </PrimaryButton>
                </div>
              </form>
            )}

            {/* Satisfaction Rating (1–5 stars) after resolved */}
            {selectedTicket.status === 'Resolved' && (
              <div className="p-3.5 rounded-tpl bg-surface2/40 border border-line text-center space-y-2">
                <span className="text-ink font-semibold block">Rate Support Quality</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      className={`text-lg p-1 transition-transform hover:scale-125 ${
                        (selectedTicket.rating || 0) >= star ? 'text-warn' : 'text-muted'
                      }`}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reopen action for closed tickets within 7 days */}
            {selectedTicket.status === 'Closed' && (
              <div className="pt-2 border-t border-line/40">
                <button
                  type="button"
                  onClick={handleReopenTicket}
                  className="w-full py-2 rounded-tpl border border-line text-xs font-medium text-accent hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket (Within 7 Days)
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Support;

