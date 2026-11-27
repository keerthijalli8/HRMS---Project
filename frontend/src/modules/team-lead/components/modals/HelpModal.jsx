import React, { useEffect, useMemo, useState } from 'react';
import { X, HelpCircle, Send, Phone, Mail } from 'lucide-react';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { readStorage, writeStorage } from '../../utils/storage.js';
import { ModalPortal } from '../common/ModalPortal.jsx';

const SUPPORT_TICKETS_KEY = 'technomold_teamlead_support_tickets';
const EMPTY_TICKET_FORM = {
  category: 'Attendance & Biometrics',
  subject: '',
  description: '',
  priority: 'Normal'
};

export const HelpModal = ({ isOpen, onClose }) => {
  const { currentUser, triggerToast } = useTeamLead();

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' లేదా 'ticket'
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET_FORM);
  const [submittedTickets, setSubmittedTickets] = useState(() => {
    const storedTickets = readStorage(SUPPORT_TICKETS_KEY, []);
    return Array.isArray(storedTickets) ? storedTickets : [];
  });
  const [formError, setFormError] = useState('');
  const requesterId = String(currentUser?.employeeId || currentUser?.id || 'TL-1042');

  const myTickets = useMemo(
    () => submittedTickets.filter(ticket => String(ticket.requesterId) === requesterId),
    [submittedTickets, requesterId]
  );

  useEffect(() => {
    const syncTickets = (event) => {
      if (event.key !== SUPPORT_TICKETS_KEY) return;
      const storedTickets = readStorage(SUPPORT_TICKETS_KEY, []);
      setSubmittedTickets(Array.isArray(storedTickets) ? storedTickets : []);
    };
    window.addEventListener('storage', syncTickets);
    return () => window.removeEventListener('storage', syncTickets);
  }, []);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    const subject = ticketForm.subject.trim();
    const description = ticketForm.description.trim();
    if (!subject || description.length < 20) {
      setFormError('Enter a subject and a description of at least 20 characters.');
      return;
    }

    const submittedAt = new Date().toISOString();
    const newTicket = {
      id: `HR-${Date.now()}`,
      category: ticketForm.category,
      subject,
      description,
      priority: ticketForm.priority,
      status: 'Open',
      requesterId,
      requesterName: currentUser?.name || 'Team Lead',
      requesterEmail: currentUser?.email || '',
      submittedAt,
      updatedAt: submittedAt,
      activity: [{ event: 'Ticket submitted', detail: 'Request saved locally; HR review has not started.', at: submittedAt }]
    };

    const nextTickets = [newTicket, ...submittedTickets];
    if (!writeStorage(SUPPORT_TICKETS_KEY, nextTickets)) {
      setFormError('Ticket could not be saved in this browser. Check storage availability and try again.');
      triggerToast('Unable to save support ticket.', 'error');
      return;
    }

    setSubmittedTickets(nextTickets);
    setFormError('');
    setTicketForm(EMPTY_TICKET_FORM);
    triggerToast(`Support ticket ${newTicket.id} created.`, 'good');
    setActiveTab('tickets-list');
  };

  if (!isOpen) return null;

  return (
    <ModalPortal onClose={onClose} ariaLabelledby="help-modal-title">
      <div className="relative flex h-[90vh] max-h-[42rem] w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">
        
        {/* క్లోజ్ బటన్ */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* హెడర్ */}
        <div className="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-slate-800 pr-10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="help-modal-title" className="truncate font-display font-bold text-base text-white">
              {activeTab === 'ticket' ? 'Raise HR Support Request' : 'Help & Support Desk'}
            </h3>
            <span className="block truncate text-xs text-slate-400">
              {activeTab === 'ticket' ? 'Submit a request and track its ticket ID and status under My Tickets.' : 'Support contacts and ticket tracking'}
            </span>
          </div>
        </div>

        {/* టాబ్స్ స్విచ్చింగ్ (Contacts vs Raise Ticket vs My Tickets) */}
        <div className="mt-4 flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-3 text-xs">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`shrink-0 rounded-xl px-3 py-1.5 font-semibold transition ${
              activeTab === 'contacts' ? 'bg-[#6EE7B7] text-[#07352a]' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Escalation Contacts
          </button>
          <button
            onClick={() => setActiveTab('ticket')}
            className={`shrink-0 rounded-xl px-3 py-1.5 font-semibold transition ${
              activeTab === 'ticket' ? 'bg-[#6EE7B7] text-[#07352a]' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            + Raise Ticket
          </button>
          <button
            onClick={() => setActiveTab('tickets-list')}
            className={`shrink-0 rounded-xl px-3 py-1.5 font-semibold transition ${
              activeTab === 'tickets-list' ? 'bg-[#6EE7B7] text-[#07352a]' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            My Tickets ({myTickets.length})
          </button>
        </div>

        {/* 1. Escalation Contacts టాబ్ */}
        {activeTab === 'contacts' && (
          <div className="my-4 min-h-0 flex-1 overflow-y-auto text-xs">
            <div className="space-y-4">
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-teal-300">TEAM LEAD MANAGER</span>
                  <span className="rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] font-bold text-teal-300">TL-1042</span>
                </div>
                <div className="text-sm font-semibold text-white">Mounika S. Rao</div>
                <div className="flex items-center gap-2 text-slate-300"><Phone size={13} className="text-teal-300" /> +91 98480 12345</div>
                <div className="flex items-center gap-2 text-slate-300"><Mail size={13} className="text-teal-300" /> mounika.rao@technomold.corp</div>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-300">HR MANAGER (HR-OPS)</span>
                  <span className="rounded-full bg-indigo-400/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">HR-OPS</span>
                </div>
                <div className="text-sm font-semibold text-white">Vikramaditya Nair</div>
                <div className="flex items-center gap-2 text-slate-300"><Phone size={13} className="text-indigo-300" /> +91 91210 98765</div>
                <div className="flex items-center gap-2 text-slate-300"><Mail size={13} className="text-indigo-300" /> hr.support@technomold.corp</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Raise Ticket to HR టాబ్ */}
        {activeTab === 'ticket' && (
          <form onSubmit={handleTicketSubmit} className="my-4 min-h-0 flex-1 space-y-3.5 overflow-y-auto text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Inquiry Category *</label>
              <select
                value={ticketForm.category}
                onChange={(e) => { setTicketForm({ ...ticketForm, category: e.target.value }); setFormError(''); }}
                className="w-full bg-[#121B26] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-300"
                required
              >
                <option value="Attendance & Biometrics">Attendance & Biometrics</option>
                <option value="Leave Management">Leave Management</option>
                <option value="Payroll & Payslips">Payroll & Payslips</option>
                <option value="General HR & Policies">General HR & Policies</option>
                <option value="IT & System Access">IT & System Access</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Subject *</label>
              <input
                type="text"
                maxLength={120}
                placeholder="Concise summary of your query..."
                value={ticketForm.subject}
                onChange={(e) => { setTicketForm({ ...ticketForm, subject: e.target.value }); setFormError(''); }}
                className="w-full bg-[#121B26] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-300"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Detailed Description (min 20 characters) *</label>
              <textarea
                rows="4"
                minLength={20}
                maxLength={1000}
                placeholder="Provide exact dates, payslip months, or specific error messages..."
                value={ticketForm.description}
                onChange={(e) => { setTicketForm({ ...ticketForm, description: e.target.value }); setFormError(''); }}
                className="w-full resize-none bg-[#121B26] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-300"
                required
              />
              <div className="mt-1 text-right text-[10px] text-slate-400">
                {ticketForm.description.length}/1000 characters
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full bg-[#121B26] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-300"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {formError && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">{formError}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6EE7B7] text-[#07352a] hover:brightness-105 transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Request
              </button>
            </div>
          </form>
        )}

        {/* 3. My Tickets హిస్టరీ టాబ్ */}
        {activeTab === 'tickets-list' && (
          <div className="my-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-400 font-semibold">
              <span>Submitted Tickets</span>
              <span>Status</span>
            </div>

            {myTickets.length === 0 ? (
              <p className="text-center py-6 text-slate-400">No tickets raised yet.</p>
            ) : (
              myTickets.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white"><span className="text-teal-300">#{t.id}</span> — {t.subject}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'Resolved' ? 'bg-emerald-400/15 text-emerald-300' : t.status === 'In Progress' ? 'bg-sky-400/15 text-sky-300' : 'bg-amber-400/15 text-amber-300'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-slate-300">{t.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
                    <span>{t.category} · {t.priority} priority</span>
                    <span>Submitted: {new Date(t.submittedAt).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-700/70 pt-2 text-[11px] text-slate-400">
                    Updated: {new Date(t.updatedAt || t.submittedAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ఫుటర్ */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <span>Support Hours: Mon – Fri, 09:30 – 18:30</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </ModalPortal>
  );
};
