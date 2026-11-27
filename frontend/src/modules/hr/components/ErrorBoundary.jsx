import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HR Desk Application Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.removeItem("hrms_user");
      localStorage.removeItem("hrms_auth_status");
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen text-ink flex flex-col justify-center items-center p-6">
          <div className="glass-card max-w-lg w-full p-8 border border-line text-center flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-bad/20 border border-bad/30 flex items-center justify-center text-bad text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold font-display text-ink">
              Application Notice
            </h2>
            <p className="text-sm text-muted">
              HR Desk encountered an unexpected state while rendering. You can reload the application or reset your session cache.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs text-bad bg-bad/10 border border-bad/20 p-3 rounded-lg w-full text-left overflow-x-auto font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-accent text-on-accent font-semibold text-sm hover:opacity-90 transition"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-surface border border-line text-ink font-semibold text-sm hover:bg-surface2 transition"
              >
                Reset Session & Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
