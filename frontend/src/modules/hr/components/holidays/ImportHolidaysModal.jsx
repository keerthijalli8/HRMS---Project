import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon.jsx';
import { importHolidaysFromCSV } from '../../services/holidayStore.js';

export const ImportHolidaysModal = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const sampleCsvTemplate = `Holiday ID,Holiday Name,Date (YYYY-MM-DD),Day of Week,Type,Category,Applicable Location,Optional (Yes/No),Repeat Annually,Status,Description
HOL-2026-901,New Special Holiday,2026-06-18,Thursday,Festival,Public Holiday,Telangana,No,No,Active,Sample celebration observed state-wide
HOL-2026-902,Corporate Foundation Day,2026-11-20,Friday,Company,Corporate Off,All India,No,Yes,Active,Annual celebration of company establishment`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "holidays_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCsvText(evt.target?.result || "");
        setError("");
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (!csvText.trim()) {
      setError("Please select a CSV file or paste valid CSV content.");
      return;
    }

    setIsProcessing(true);
    const res = importHolidaysFromCSV(csvText);
    setIsProcessing(false);

    if (res.ok) {
      onSuccess?.(res.count);
      onClose();
    } else {
      setError(res.error || "Failed to parse and import CSV file.");
    }
  };

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card !p-0 max-w-xl w-full border border-line shadow-2xl relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-on-accent flex items-center justify-center font-bold text-lg shadow-md">
              <Icon name="upload" className="w-5 h-5 text-on-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold text-ink text-base">
                Import Holidays from Excel / CSV
              </h3>
              <p className="text-[11px] text-muted">
                Bulk upload annual holiday calendar records with automatic duplicate prevention
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-surface2 border border-line text-muted hover:text-ink transition"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-bad/15 border border-bad/30 text-bad font-medium">
              {error}
            </div>
          )}

          <div className="p-4 rounded-xl border-2 border-dashed border-line bg-surface2/30 flex flex-col items-center justify-center text-center gap-2">
            <Icon name="file-text" className="w-8 h-8 text-accent" />
            <div className="font-semibold text-ink">Select CSV or Excel (.csv) file</div>
            <div className="text-[11px] text-muted">
              {fileName ? <span className="text-accent font-data font-bold">{fileName}</span> : "Upload standard comma-delimited holiday roster"}
            </div>
            <label className="cursor-pointer mt-1 px-3.5 py-1.5 rounded-[var(--radius)] bg-surface border border-line hover:border-accent text-ink font-semibold transition flex items-center gap-1.5">
              <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
              <span>Browse CSV File</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted text-[11px] font-semibold uppercase">Or Paste CSV Content Directly</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <Icon name="download" className="w-3 h-3 text-accent" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setError("");
            }}
            placeholder={sampleCsvTemplate}
            className="w-full bg-surface2/70 border border-line rounded px-3 py-2 text-ink outline-none focus:border-accent font-data text-[11px] leading-relaxed resize-none"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex items-center justify-end gap-2 bg-surface/90">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-[var(--radius)] bg-accent text-on-accent text-xs font-semibold hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Icon name="check" className="w-3.5 h-3.5 text-on-accent stroke-[3]" />
            <span>{isProcessing ? "Importing..." : "Process Import"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
