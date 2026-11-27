// src/pages/Documents.jsx
// Documents repository: categorized records, secure download/preview, and validated file uploader with Undo.

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Lock,
  ShieldCheck,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { Card } from '../components/Card.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { Tag } from '../components/Tag.jsx';
import { Table } from '../components/Table.jsx';
import { Drawer } from '../components/Drawer.jsx';
import { FileUploader } from '../components/FileUploader.jsx';
import { documentService } from '../services/documentService.js';
import { formatDate } from '../utils/format.js';

const CATEGORIES = ['All', 'Identity', 'Employment', 'Education', 'Policies', 'Payroll tax'];

export function Documents() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const loadDocs = async () => {
    const list = await documentService.getDocuments();
    setDocuments(list);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (fileData) => {
    try {
      const created = await documentService.uploadDocument(fileData);
      await loadDocs();
      setUploadDrawerOpen(false);
      showToast(`Document "${created.name}" uploaded for HR verification.`);
    } catch (err) {
      showToast(err.message || 'Upload failed');
    }
  };

  const handleDelete = async (doc) => {
    try {
      await documentService.deleteDocument(doc.id);
      await loadDocs();
      showToast(`Deleted document "${doc.name}"`, {
        undoLabel: 'Undo',
        onUndo: async () => {
          await documentService.uploadDocument(doc);
          await loadDocs();
          showToast(`Restored "${doc.name}"`);
        }
      });
    } catch (err) {
      showToast(err.message || 'Could not delete document');
    }
  };

  const handleDownload = (doc) => {
    const dummyBlob = new Blob([`HRMS OFFICIAL ARCHIVE\nDocument: ${doc.name}\nCategory: ${doc.category}\nStatus: ${doc.status}`], { type: 'text/plain' });
    const url = URL.createObjectURL(dummyBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    showToast(`Downloaded ${doc.name}`);
  };

  const filteredDocs = documents.filter(d => {
    if (selectedCategory === 'All') return true;
    return d.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* 1. COMPLIANCE INFO STRIP */}
      <div className="p-4 rounded-tpl bg-surface2/50 border border-line flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0" strokeWidth={1.8} />
          <div>
            <span className="font-semibold text-ink text-sm block">
              Authorized Document Repository
            </span>
            <span className="text-muted text-xs">
              Documents are visible only to you and authorised HR staff. Every view is logged.
            </span>
          </div>
        </div>

        <PrimaryButton size="sm" onClick={() => setUploadDrawerOpen(true)}>
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </PrimaryButton>
      </div>

      {/* 2. CATEGORY PILLS & DOCUMENTS TABLE (Section 20) */}
      <Card
        title="My Document Records"
        subtext="Official company agreements, tax declarations, and identity proofs"
        action={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full border transition-all ${
                  selectedCategory === cat
                    ? 'bg-accent text-on-accent border-accent font-semibold'
                    : 'border-line text-muted hover:text-ink bg-surface2/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        }
      >
        <Table
          keyField="id"
          columns={[
            {
              header: 'Document Name',
              key: 'name',
              render: (name, row) => (
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-accent shrink-0" strokeWidth={1.8} />
                  <div>
                    <span className="font-semibold text-ink block">{name}</span>
                    <span className="text-muted text-[11px] font-mono">{row.size}</span>
                  </div>
                </div>
              )
            },
            {
              header: 'Category',
              key: 'category',
              render: (cat) => <Tag color="accent">{cat}</Tag>
            },
            {
              header: 'Uploaded By',
              key: 'uploadedBy',
              render: (up) => (
                <span className="text-xs text-muted flex items-center gap-1">
                  {up === 'HR' ? <Lock className="w-3 h-3 text-muted/60" /> : null}
                  {up}
                </span>
              )
            },
            {
              header: 'Upload Date',
              key: 'uploadDate',
              render: (d) => <span className="font-mono text-xs text-muted">{formatDate(d)}</span>
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewDoc(row)}
                    className="text-ink hover:text-accent flex items-center gap-1 text-xs"
                    title="Preview Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownload(row)}
                    className="text-accent hover:underline flex items-center gap-1 text-xs"
                    title="Download Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {row.uploadedBy === 'Me' && row.status !== 'Verified' && (
                    <button
                      onClick={() => handleDelete(row)}
                      className="text-bad hover:underline text-xs"
                      title="Delete Upload"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            }
          ]}
          data={filteredDocs}
        />
      </Card>

      {/* Upload Document Drawer */}
      <Drawer
        isOpen={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        title="Upload Verification Document"
      >
        <div className="space-y-4">
          <p className="text-muted text-xs leading-relaxed">
            Attach verified credentials such as academic degrees, government photo IDs, or address proofs. HR will review within 2 business days.
          </p>
          <FileUploader onUpload={handleUpload} />
        </div>
      </Drawer>

      {/* Document Preview Drawer */}
      <Drawer
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? `Preview: ${previewDoc.name}` : ''}
        footer={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setPreviewDoc(null)}>Close</SecondaryButton>
            <PrimaryButton onClick={() => handleDownload(previewDoc)}>
              <Download className="w-3.5 h-3.5" /> Download
            </PrimaryButton>
          </div>
        }
      >
        {previewDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-tpl bg-surface2/50 border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted">Document Category:</span>
                <Tag color="accent">{previewDoc.category}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Source:</span>
                <span className="text-ink font-medium">{previewDoc.uploadedBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Status:</span>
                <StatusPill status={previewDoc.status} label={previewDoc.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">File Size:</span>
                <span className="font-mono text-muted">{previewDoc.size}</span>
              </div>
            </div>

            {/* Document Mock Preview Frame */}
            <div className="p-8 rounded-tpl bg-surface2/20 border border-dashed border-line text-center space-y-3">
              <FileText className="w-12 h-12 text-accent mx-auto" strokeWidth={1.5} />
              <div className="space-y-1">
                <h4 className="font-semibold text-ink text-sm">{previewDoc.name}</h4>
                <p className="text-muted text-[11px]">
                  Encrypted binary preview rendered in sandbox memory.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-tpl bg-surface2/20 border border-line text-[11px] text-muted">
              Security Notice: This document access has been logged with timestamp and device fingerprint.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Documents;

