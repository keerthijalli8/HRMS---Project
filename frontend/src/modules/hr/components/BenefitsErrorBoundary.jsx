import React from 'react';
import { Icon } from './Icon.jsx';

export class BenefitsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("BenefitsSelector ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg bg-bad/10 border border-bad/30 text-bad text-xs flex items-center gap-2">
          <Icon name="alert-triangle" className="w-4 h-4 text-bad flex-shrink-0" />
          <span>Benefits selector failed to load: {this.state.error?.message || "Unknown error"}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
