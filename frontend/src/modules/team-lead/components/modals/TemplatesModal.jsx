import React from 'react';
import { X, FileText, Download, Copy, Check } from 'lucide-react';
import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { ModalPortal } from '../common/ModalPortal.jsx';

export const TemplatesModal = ({ isOpen, onClose }) => {
  const { triggerToast } = useTeamLead();

  if (!isOpen) return null;

  const templates = [
    {
      title: "Sprint Retrospective & Team Health Review",
      desc: "Standard agile review covering velocity, code reviews, and on-call rotation handovers.",
      category: "Agile Leadership"
    },
    {
      title: "Quarterly 1-on-1 Performance Discussion Guide",
      desc: "Structured talking points for career growth, OKR alignment, and obstacle unblocking.",
      category: "Performance"
    },
    {
      title: "Attendance Regularization Guidelines SOP",
      desc: "Official enterprise policy regarding transit delays, biometric terminal errors, and duty travel.",
      category: "HR Policy"
    },
    {
      title: "Engineering Onboarding 30-60-90 Day Plan",
      desc: "Milestone guide for ramping new developers on repo structure, staging environments, and CI/CD.",
      category: "Onboarding"
    }
  ];

  const handleCopy = (title) => {
    navigator.clipboard?.writeText(title);
    triggerToast(`Copied template "${title}" to clipboard`, 'good');
  };

  return (
    <ModalPortal onClose={onClose} ariaLabelledby="templates-modal-title">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-ink hover:bg-surface2 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pb-3 border-b border-line/60">
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 id="templates-modal-title" className="font-display font-bold text-lg text-white">
              Team Lead Templates & Standard SOPs
            </h3>
            <span className="text-xs text-muted">
              Pre-approved enterprise guidelines for engineering leads
            </span>
          </div>
        </div>

        <div className="space-y-3 my-4">
          {templates.map((tpl, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-surface2/50 border border-line/50 hover:border-accent/40 transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                  {tpl.category}
                </span>
                <h4 className="text-xs font-semibold text-ink mt-0.5">{tpl.title}</h4>
                <p className="text-[11px] text-muted mt-1 leading-snug">{tpl.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(tpl.title)}
                  className="p-1.5 rounded-lg bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition"
                  title="Copy reference title"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => triggerToast(`Downloading ${tpl.title}...`, 'info')}
                  className="px-2.5 py-1.5 rounded-lg bg-accent text-on-accent text-xs font-bold hover:brightness-105 transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Use
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-line/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface2 border border-line text-ink hover:border-accent transition"
          >
            Close
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
