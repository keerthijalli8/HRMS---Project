// src/components/FileUploader.jsx
// Drag-and-drop file upload with validation (PDF, JPG, PNG max 5 MB), keyboard accessibility, and progress simulation.

import React, { useState, useRef } from 'react';
import { Progress } from './Progress.jsx';
import { PrimaryButton } from './Buttons.jsx';

export function FileUploader({
  onUpload,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  maxSizeMB = 5,
  categories = ['Identity', 'Employment', 'Education', 'Policies', 'Payroll tax'],
  className = ''
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState(categories[0] || 'Identity');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  const validateFile = (file) => {
    setErrorMessage('');
    if (!file) return false;

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Only PDF, JPG, and PNG documents are supported.');
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File size exceeds ${maxSizeMB} MB limit.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    // Simulated stepped upload progress
    setTimeout(() => setUploadProgress(65), 200);
    setTimeout(async () => {
      setUploadProgress(100);
      try {
        await onUpload({
          name: selectedFile.name,
          category,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
          expiryDate: expiryDate || null
        });
        setSelectedFile(null);
        setUploadProgress(0);
        setIsUploading(false);
      } catch (err) {
        setErrorMessage(err.message || 'Upload failed');
        setIsUploading(false);
      }
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-tpl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-accent bg-accent/10'
            : selectedFile
            ? 'border-good/60 bg-good/5'
            : 'border-line hover:border-accent/40 bg-surface2/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          className="hidden"
          aria-label="Upload document file"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-surface2 border border-line flex items-center justify-center text-accent text-lg">
            ↑
          </div>
          {selectedFile ? (
            <div>
              <p className="font-semibold text-ink text-[14px]">{selectedFile.name}</p>
              <p className="text-muted text-[12px]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to submit
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-ink text-[14px]">
                Click or drag & drop files here
              </p>
              <p className="text-muted text-[12px] mt-0.5">
                PDF, JPG, PNG up to 5 MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-2.5 rounded-tpl bg-bad/10 border border-bad/40 text-bad text-[12px]"
        >
          {errorMessage}
        </div>
      )}

      {/* Progress bar */}
      {isUploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted">
            <span>Uploading document...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} max={100} height={6} />
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
        <div>
          <label className="block text-[12px] font-medium text-muted mb-1">
            Document Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-[13px] text-ink focus:border-accent focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-bg text-ink">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-muted mb-1">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-surface2 border border-line rounded-tpl px-3 py-2 text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton type="submit" disabled={!selectedFile || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default FileUploader;

