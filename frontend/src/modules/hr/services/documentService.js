import axios from 'axios';
import { API_BASE, getStoredToken } from '../api.js';

function getAuthHeaders(extra = {}) {
  const token = getStoredToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/**
 * Upload a document with real file upload and progress tracking
 */
export async function uploadDocument({
  file,
  documentName,
  category,
  currentUser,
  onUploadProgress
}) {
  if (!file) {
    throw new Error("Please select a file to upload.");
  }

  // Validate file size (15MB max)
  const MAX_SIZE = 15 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 15MB.`);
  }

  // Validate allowed extensions
  const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!allowed.includes(ext)) {
    throw new Error("Unsupported format. Allowed formats: PDF, DOC, DOCX, JPG, PNG");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentName', documentName?.trim() || file.name.replace(/\.[^/.]+$/, ''));
  formData.append('category', category || 'General');
  formData.append('uploaderId', currentUser?.employeeId || currentUser?.id || 'EMP-STAFF');
  formData.append('uploaderName', currentUser?.name || 'Staff Member');
  formData.append('uploaderEmail', currentUser?.email || '');
  formData.append('employeeId', currentUser?.employeeId || currentUser?.id || 'EMP-STAFF');
  formData.append('userRole', currentUser?.systemRole || currentUser?.role || 'Employee');

  const response = await axios.post(`${API_BASE}/documents/upload`, formData, {
    headers: getAuthHeaders({
      'Content-Type': 'multipart/form-data'
    }),
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    }
  });

  return response.data;
}

/**
 * Fetch documents with role-based filtering
 */
export async function fetchDocuments({ currentUser, category, search } = {}) {
  try {
    const params = new URLSearchParams();
    if (currentUser) {
      params.append('uploaderId', currentUser.employeeId || currentUser.id || '');
      params.append('userRole', currentUser.systemRole || currentUser.role || 'Employee');
    }
    if (category && category !== 'All') {
      params.append('category', category);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const response = await axios.get(`${API_BASE}/documents?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return response.data?.documents || [];
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    return [];
  }
}

/**
 * Delete a document
 */
export async function deleteDocument({ documentId, currentUser }) {
  const userId = currentUser?.employeeId || currentUser?.id || '';
  const userRole = currentUser?.systemRole || currentUser?.role || 'Employee';

  const response = await axios.delete(
    `${API_BASE}/documents/${documentId}?userId=${encodeURIComponent(userId)}&userRole=${encodeURIComponent(userRole)}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
}

/**
 * Helper to get download URL
 */
export function getDocumentDownloadUrl(documentId) {
  return `${API_BASE}/documents/${documentId}/download`;
}

/**
 * Helper to get view URL
 */
export function getDocumentViewUrl(documentId) {
  return `${API_BASE}/documents/${documentId}/view`;
}

/**
 * Candidate Document Verification APIs
 */

export async function fetchCandidates() {
  try {
    const response = await axios.get(`${API_BASE}/candidates`, {
      headers: getAuthHeaders()
    });
    return response.data?.candidates || [];
  } catch (err) {
    console.error("Failed to fetch candidates from backend:", err);
    return [];
  }
}

export async function fetchCandidate(candidateId) {
  const response = await axios.get(`${API_BASE}/candidates/${candidateId}`, {
    headers: getAuthHeaders()
  });
  return response.data?.candidate;
}

export async function verifyCandidateDocument({ candidateId, docKey, action, reason, currentUser }) {
  const response = await axios.post(`${API_BASE}/candidates/${candidateId}/documents/${docKey}/verify`, {
    action,
    reason: reason || "",
    reviewerUser: {
      name: currentUser?.name || "HR Manager",
      systemRole: currentUser?.systemRole || currentUser?.role || "HR",
      employeeId: currentUser?.employeeId || currentUser?.id || "EMP-1001"
    }
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
}

export function getCandidateDocViewUrl(candidateId, docKey) {
  return `${API_BASE}/candidates/${candidateId}/documents/${docKey}/view`;
}

export function getCandidateDocDownloadUrl(candidateId, docKey) {
  return `${API_BASE}/candidates/${candidateId}/documents/${docKey}/download`;
}

export async function reuploadCandidateDocument({ candidateId, docKey, fileName }) {
  const response = await axios.post(`${API_BASE}/candidates/${candidateId}/documents/${docKey}/reupload`, {
    fileName
  });
  return response.data;
}
