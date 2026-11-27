import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import {
  getDocumentDownloadUrl,
  getDocumentViewUrl,
  getCandidateDocViewUrl,
  getCandidateDocDownloadUrl
} from '../../services/documentService.js';

export const DocumentViewerModal = ({
  document: doc,
  isOpen,
  onClose
}) => {
  if (!isOpen || !doc) return null;

  const viewUrl = doc.viewUrl || (doc.candidateId && doc.key ? getCandidateDocViewUrl(doc.candidateId, doc.key) : getDocumentViewUrl(doc.id));
  const downloadUrl = doc.downloadUrl || (doc.candidateId && doc.key ? getCandidateDocDownloadUrl(doc.candidateId, doc.key) : getDocumentDownloadUrl(doc.id));
  const ext = (doc.fileType || (doc.fileName ? doc.fileName.split('.').pop() : 'PDF') || 'PDF').toUpperCase();
  const isImage = ext === 'JPG' || ext === 'JPEG' || ext === 'PNG';
  const isPdf = ext === 'PDF' || !ext;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-4xl max-h-[92vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Icon name="file-text" className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-sm sm:text-base flex items-center gap-2">
                <span>{doc.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-surface2 border border-line text-accent">
                  {ext}
                </span>
              </div>
              <div className="text-[11px] text-muted">
                {doc.category} • Uploaded by {doc.uploaderName} ({doc.uploaderId}) on {doc.formattedDate || 'Recent'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={doc.fileName}
              className="px-3 py-1.5 rounded-lg bg-surface2 border border-line text-xs font-semibold text-accent hover:border-accent transition flex items-center gap-1.5"
            >
              <Icon name="download" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink transition"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 min-h-[420px] max-h-[70vh] bg-surface2/30 flex items-center justify-center overflow-auto p-4">
          {isPdf ? (
            <iframe
              src={viewUrl}
              title={doc.name}
              className="w-full h-[65vh] rounded-lg border border-line bg-white"
            />
          ) : isImage ? (
            <img
              src={viewUrl}
              alt={doc.name}
              className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg border border-line"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-surface2 border border-line text-accent flex items-center justify-center">
                <Icon name="file-text" className="w-8 h-8" />
              </div>
              <div>
                <div className="font-semibold text-ink text-sm">{doc.fileName}</div>
                <div className="text-xs text-muted mt-1">
                  Preview not available in-browser for {ext} files. Please download the file to inspect.
                </div>
              </div>
              <a
                href={downloadUrl}
                download={doc.fileName}
                className="mt-2 px-4 py-2 rounded-lg bg-accent text-on-accent font-semibold text-xs flex items-center gap-2 shadow-lg"
              >
                <Icon name="download" className="w-4 h-4" />
                <span>Download File ({doc.formattedSize})</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-muted bg-surface/90">
          <span>Storage: Persistent Backend Server File Storage</span>
          <span>Size: {doc.formattedSize}</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
