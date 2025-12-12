import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType | React.ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('ErrorInfo:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (React.isValidElement(fallback)) {
        return fallback;
      }
      const FallbackComponent = fallback as React.ComponentType;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;