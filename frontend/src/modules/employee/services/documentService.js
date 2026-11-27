// src/services/documentService.js
// Mock only. Replace with real API; enforce scope and rules on the server.

import { INITIAL_DOCUMENTS } from '../data/employee.js';

const STORAGE_DOCS_KEY = 'hrms_emp_documents';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_DOCUMENTS;
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

function save(docs) {
  localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
}

export const documentService = {
  async getDocuments() {
    await new Promise(r => setTimeout(r, 200));
    return load();
  },

  async uploadDocument(fileData) {
    await new Promise(r => setTimeout(r, 500));
    const docs = load();
    const newDoc = {
      id: 'DOC-' + Date.now(),
      name: fileData.name,
      category: fileData.category,
      uploadedBy: 'Me',
      uploadDate: '2026-11-06',
      size: fileData.size || '1.2 MB',
      status: 'Pending verification',
      expiryDate: fileData.expiryDate || null,
      readOnly: false
    };

    const updated = [newDoc, ...docs];
    save(updated);
    return newDoc;
  },

  async deleteDocument(id) {
    await new Promise(r => setTimeout(r, 300));
    const docs = load();
    const doc = docs.find(d => d.id === id);

    if (!doc) throw new Error('Document not found');
    if (doc.readOnly || doc.uploadedBy !== 'Me') {
      throw new Error('Authorized HR documents cannot be deleted.');
    }
    if (doc.status === 'Verified') {
      throw new Error('Verified documents cannot be deleted.');
    }

    const updated = docs.filter(d => d.id !== id);
    save(updated);
    return true;
  }
};

export default documentService;

