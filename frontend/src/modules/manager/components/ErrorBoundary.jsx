import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-surface2/60 border border-line flex flex-col items-center justify-center text-center gap-3 my-auto max-w-lg mx-auto mt-12 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-bad/20 text-bad flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-[16px] font-bold text-ink">Something went wrong</h2>
          <p className="text-[12.5px] text-muted leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while rendering this view.'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-2 px-4 py-2 rounded-full font-semibold text-[12px] bg-accent text-on-accent flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reload view</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
