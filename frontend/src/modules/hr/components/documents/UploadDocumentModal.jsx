import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { uploadDocument } from '../../services/documentService.js';

export const UploadDocumentModal = ({
  isOpen,
  onClose,
  currentUser,
  onUploadSuccess,
  onTriggerToast
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [category, setCategory] = useState('Identity Proof');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const categories = [
    "Identity Proof",
    "Educational Degree / Certificate",
    "Employment / Relieving Letter",
    "Bank Proof / Cancelled Cheque",
    "Salary Slip / Form 16",
    "General"
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB

  const validateFile = (file) => {
    if (!file) return false;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setErrorMessage(`Unsupported format "${ext}". Please choose a PDF, DOC, DOCX, JPG, or PNG file.`);
      return false;
    }
    if (file.size > maxSizeBytes) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 15MB limit.`);
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      if (!documentName) {
        // Default document name to original file name minus extension
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        setDocumentName(baseName.replace(/[-_]/g, " "));
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await uploadDocument({
        file: selectedFile,
        documentName: documentName.trim() || selectedFile.name,
        category,
        currentUser,
        onUploadProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      setSuccessMessage(res.message || "Document uploaded successfully!");
      if (onTriggerToast) {
        onTriggerToast(res.message || "Document saved to persistent backend storage!");
      }

      setTimeout(() => {
        setIsUploading(false);
        if (onUploadSuccess) {
          onUploadSuccess(res.document);
        }
        handleClose();
      }, 700);
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
      setErrorMessage(err.response?.data?.message || err.message || "Failed to upload document. Please try again.");
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setDocumentName('');
    setCategory('Identity Proof');
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(0);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-lg border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Icon name="upload" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-ink text-lg">Upload Employee Document</h2>
              <p className="text-xs text-muted">File will be securely saved to persistent server storage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center text-muted hover:text-ink transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-accent bg-accent/10'
                : selectedFile
                ? 'border-good/60 bg-good/5'
                : 'border-line/80 hover:border-accent/60 bg-surface2/30 hover:bg-surface2/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
            />

            {selectedFile ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-good/15 border border-good/30 text-good flex items-center justify-center">
                  <Icon name="file-text" className="w-6 h-6" />
                </div>
                <div className="font-semibold text-ink text-sm max-w-xs truncate">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] text-muted font-data">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another to replace
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-surface2 border border-line text-accent flex items-center justify-center">
                  <Icon name="upload" className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-accent hover:underline">Choose file</span>
                  <span className="text-muted"> or drag & drop here</span>
                </div>
                <p className="text-[11px] text-muted">
                  Supports PDF, DOC, DOCX, JPG, PNG (Max 15MB)
                </p>
              </>
            )}
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-muted font-medium mb-1">Document Title *</label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., Aadhaar Card Copy, Degree Certificate"
              className="w-full px-3 py-2 rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent text-xs"
              required
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-muted font-medium mb-1">Document Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface2 border border-line text-ink focus:outline-none focus:border-accent text-xs"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-surface text-ink">{cat}</option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-bad/15 border border-bad/30 text-bad flex items-center gap-2">
              <Icon name="alert-triangle" className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-good/15 border border-good/30 text-good flex items-center gap-2">
              <Icon name="check-circle" className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Uploading to persistent backend storage...</span>
                <span className="font-data font-semibold text-accent">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden border border-line">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg bg-surface2 border border-line text-xs font-semibold text-muted hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className={`px-5 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 ${
                !selectedFile || isUploading
                  ? 'bg-accent/40 text-on-accent/60 cursor-not-allowed'
                  : 'bg-accent text-on-accent hover:brightness-110 shadow-lg'
              }`}
            >
              {isUploading ? (
                <>
                  <Icon name="loader" className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Icon name="upload" className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
