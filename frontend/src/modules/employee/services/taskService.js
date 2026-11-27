// src/services/taskService.js
// Mock only. Replace with real API; enforce scope and rules on the server.

import { INITIAL_TASKS } from '../data/employee.js';
import { authService } from './authService.js';

const STORAGE_TASKS_KEY = 'hrms_emp_tasks';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_TASKS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TASKS;
  } catch {
    return INITIAL_TASKS;
  }
}

function save(tasks) {
  localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
}

export const taskService = {
  async getTasks() {
    await new Promise(r => setTimeout(r, 200));
    return load();
  },

  async updateTaskStatus(taskId, newStatus) {
    await new Promise(r => setTimeout(r, 300));
    const tasks = load();
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    // Rule: Employee can move To do -> In progress -> In review.
    // If moving to 'Done', it enters "In review" with flag 'Waiting for manager approval'
    let effectiveStatus = newStatus;
    let waitingForManager = false;

    if (newStatus === 'Done') {
      effectiveStatus = 'In review';
      waitingForManager = true;
    }

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: effectiveStatus,
          waitingForManager,
          progress: newStatus === 'Done' ? 100 : t.progress
        };
      }
      return t;
    });

    save(updated);
    return { taskId, newStatus: effectiveStatus, waitingForManager };
  },

  async updateProgress(taskId, progress) {
    await new Promise(r => setTimeout(r, 200));
    const tasks = load();
    const updated = tasks.map(t => t.id === taskId ? { ...t, progress: Number(progress) } : t);
    save(updated);
    return true;
  },

  async toggleChecklistItem(taskId, itemIndex) {
    await new Promise(r => setTimeout(r, 150));
    const tasks = load();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const checklist = [...t.checklist];
        if (checklist[itemIndex]) {
          checklist[itemIndex] = {
            ...checklist[itemIndex],
            done: !checklist[itemIndex].done
          };
        }
        return { ...t, checklist };
      }
      return t;
    });
    save(updated);
    return true;
  },

  async logTime(taskId, hours, note) {
    await new Promise(r => setTimeout(r, 300));
    const tasks = load();
    const newLog = {
      id: 'tl-' + Date.now(),
      hours: Number(hours),
      date: '6 Nov 2026',
      note
    };

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          timeLogs: [newLog, ...(t.timeLogs || [])]
        };
      }
      return t;
    });
    save(updated);
    return newLog;
  },

  async addComment(taskId, text) {
    await new Promise(r => setTimeout(r, 250));
    const tasks = load();
    const newComment = {
      id: 'c-' + Date.now(),
      user: authService.getStoredProfile().name,
      time: 'Just now',
      text
    };

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      }
      return t;
    });
    save(updated);
    return newComment;
  },

  async requestExtension(taskId, newDate, reason) {
    await new Promise(r => setTimeout(r, 350));
    const tasks = load();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          extensionRequested: { newDate, reason, status: 'Pending manager approval' }
        };
      }
      return t;
    });
    save(updated);
    return true;
  }
};

export default taskService;

