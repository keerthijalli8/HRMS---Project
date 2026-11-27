// src/services/supportService.js
// Mock only. Replace with real API; enforce scope and rules on the server.

import { INITIAL_TICKETS } from '../data/employee.js';
import { authService } from './authService.js';

const STORAGE_TICKETS_KEY = 'hrms_emp_support_tickets';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_TICKETS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TICKETS;
  } catch {
    return INITIAL_TICKETS;
  }
}

function save(tickets) {
  localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(tasks));
}

export const supportService = {
  async getTickets() {
    await new Promise(r => setTimeout(r, 200));
    return load();
  },

  async createTicket(data) {
    await new Promise(r => setTimeout(r, 400));
    const tickets = load();
    const newId = `HRQ-2026-${String(tickets.length + 143).padStart(4, '0')}`;

    const newTicket = {
      id: newId,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority || 'Normal',
      status: 'Open',
      created: '2026-11-06',
      lastUpdate: '2026-11-06',
      assignedTo: 'HR Triage Queue',
      slaResponse: 'Response due in 4h',
      attachment: data.attachment ? data.attachment.name : null,
      messages: [
        {
          id: 'm-' + Date.now(),
          sender: authService.getStoredProfile().name,
          role: 'Employee',
          time: '6 Nov 2026, 11:45 AM',
          text: data.description
        }
      ]
    };

    const updated = [newTicket, ...tickets];
    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
    return newTicket;
  },

  async addReply(ticketId, messageText) {
    await new Promise(r => setTimeout(r, 300));
    const tickets = load();
    const newMsg = {
      id: 'm-' + Date.now(),
      sender: authService.getStoredProfile().name,
      role: 'Employee',
      time: 'Just now',
      text: messageText
    };

    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          lastUpdate: 'Just now',
          messages: [...(t.messages || []), newMsg]
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
    return newMsg;
  },

  async updateTicketStatus(ticketId, newStatus) {
    await new Promise(r => setTimeout(r, 300));
    const tickets = load();
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus, lastUpdate: 'Just now' } : t);
    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
    return true;
  },

  async rateTicket(ticketId, rating) {
    await new Promise(r => setTimeout(r, 250));
    const tickets = load();
    const updated = tickets.map(t => t.id === ticketId ? { ...t, rating } : t);
    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
    return true;
  },

  async deleteTicket(ticketId) {
    await new Promise(r => setTimeout(r, 250));
    const tickets = load();
    const updated = tickets.filter(t => t.id !== ticketId);
    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
    return true;
  }
};

export default supportService;

