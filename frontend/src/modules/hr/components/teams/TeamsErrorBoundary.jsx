import React from 'react';
import { Icon } from '../Icon.jsx';

export class TeamsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "[TeamsErrorBoundary] Error caught in Teams module:",
      error?.message || error,
      "\nStack trace:\n",
      error?.stack || "No stack trace available",
      "\nComponent stack:\n",
      errorInfo?.componentStack || "Unknown component"
    );
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleBackToTeams = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onBack) {
      this.props.onBack();
    } else if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/hr/teams");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card !p-8 border border-line rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-xl my-6 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Icon name="alert-triangle" className="w-7 h-7 text-amber-400" />
          </div>
          <div className="max-w-md">
            <h3 className="font-display font-extrabold text-lg text-ink">
              Unable to Display Team Profile
            </h3>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred while loading this section of the Teams module."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-surface2 border border-line hover:border-accent text-xs font-semibold text-ink flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icon name="refresh-cw" className="w-3.5 h-3.5 text-accent" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={this.handleBackToTeams}
              className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs font-bold flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer shadow-md"
            >
              <Icon name="arrow-left" className="w-3.5 h-3.5 text-on-accent" />
              <span>Back to Teams</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default TeamsErrorBoundary;
