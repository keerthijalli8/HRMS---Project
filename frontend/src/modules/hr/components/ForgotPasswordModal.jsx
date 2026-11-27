import React, { useState } from 'react';
import { Icon } from './Icon.jsx';
import { PrimaryButton, SecondaryButton } from './Buttons.jsx';

export const ForgotPasswordModal = ({ isOpen, onClose, onTriggerToast }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError("Please enter a valid work email address");
      return;
    }
    setError(null);
    setSubmitted(true);
    onTriggerToast(`Password reset link dispatched to ${email}`);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full !p-6 border border-line relative animate-in fade-in">
        
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface2 border border-line text-accent">
              <Icon name="key" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-base">Reset Your Password</div>
              <div className="text-[11px] text-muted font-data">HR Desk Security Verification</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface2 border border-line text-muted hover:text-ink"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-good/20 text-good border border-good/50 flex items-center justify-center">
              <Icon name="check" className="w-5 h-5" />
            </div>
            <div className="font-semibold text-ink text-sm mt-1">Reset Instructions Sent!</div>
            <p className="text-xs text-muted max-w-xs">
              Check your inbox for a secure token link to reset your credentials. The link will expire in 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-4 text-xs">
            <p className="text-muted leading-relaxed">
              Enter your registered work email address. We will verify your employee record and send a password reset token.
            </p>

            <div>
              <label className="block text-muted font-medium mb-1">Work Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexora.in"
                  className="w-full bg-surface2/60 border border-line rounded-[var(--radius)] text-xs text-ink pl-9 pr-3 py-2 focus:border-accent outline-none"
                />
                <Icon name="mail" className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>
              {error && <span className="text-[10.5px] text-bad mt-1 block">{error}</span>}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line/60">
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton icon="arrow-right">Send Reset Link</PrimaryButton>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
