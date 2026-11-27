// src/components/ConsentModal.jsx
import React, { useState } from 'react';
import { ShieldCheck, Lock, Check } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './common/Buttons.jsx';

export function ConsentModal({ isOpen, onClose, onConfirm, employeeName, employeeId }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 space-y-5 border border-line relative">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-tpl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Biometric Data Privacy · India DPDP Act 2023
            </div>
            <h2 className="font-display font-bold text-lg text-ink mt-0.5">
              Consent for Face Recognition Enrollment
            </h2>
          </div>
        </div>

        {/* Legal notice content */}
        <div className="p-4 rounded-tpl bg-surface2/50 border border-line/60 space-y-2.5 text-[12px] text-muted leading-relaxed max-h-56 overflow-y-auto">
          <p className="font-semibold text-ink">
            Notice for Employee: {employeeName || 'Aarav Mehta'} ({employeeId || 'EMP-1187'})
          </p>
          <p>
            In accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India, your biometric facial data is classified as sensitive personal data.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Purpose Limitation:</strong> Strictly used for secure 2FA face login verification into the HRMS portal.
            </li>
            <li>
              <strong>No Plaintext Imagery:</strong> The HRMS engine extracts mathematical vector representations (embeddings). Plaintext images are not exposed or sold.
            </li>
            <li>
              <strong>Encryption at Rest:</strong> All stored vectors and thumbnails are encrypted using AES-256-GCM encryption.
            </li>
            <li>
              <strong>Right to Withdraw & Erasure:</strong> You retain the statutory right to request re-enrollment or total deletion of your biometric profile through your HR Administrator at any time.
            </li>
            <li>
              <strong>Policy Version:</strong> <span className="font-mono text-accent">2026.1-DPDP-IN</span>
            </li>
          </ul>
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded-md border border-line bg-surface peer-checked:bg-accent peer-checked:border-accent flex items-center justify-center transition-all">
              {agreed && <Check className="w-3.5 h-3.5 text-on-accent stroke-[3]" />}
            </div>
          </div>
          <span className="text-[12px] text-ink/90 leading-normal">
            I hereby give my explicit and informed consent for the collection and processing of my biometric face embeddings for HRMS face login verification as described.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <SecondaryButton onClick={onClose} size="sm">
            Cancel
          </SecondaryButton>
          <PrimaryButton
            disabled={!agreed}
            onClick={() => {
              if (agreed) onConfirm();
            }}
            size="sm"
          >
            Accept & Proceed
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default ConsentModal;
