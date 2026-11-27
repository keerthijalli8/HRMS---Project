import React from 'react';
import { Icon } from '../Icon.jsx';

export class QrErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[QrErrorBoundary] Caught error in QR scanner component:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // If the parent passed isOpen and it's false, do not display anything
      if (this.props.isOpen === false) {
        return null;
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface border border-red-500/30 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
              <Icon name="alert-triangle" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">QR Scanner Notice</h3>
              <p className="text-sm text-ink-muted mt-1">
                The scanner encountered an issue accessing your media device or rendering. Your main dashboard and attendance functions remain fully operational.
              </p>
              {this.state.error && (
                <p className="text-xs text-red-400/80 bg-red-500/10 p-2 rounded-lg mt-3 font-mono break-all text-left">
                  {this.state.error.message || String(this.state.error)}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.resetError}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition shadow-md"
              >
                Retry Scanner
              </button>
              {this.props.onClose && (
                <button
                  type="button"
                  onClick={() => {
                    this.resetError();
                    this.props.onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface2 text-ink border border-line hover:border-line-focus transition"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
