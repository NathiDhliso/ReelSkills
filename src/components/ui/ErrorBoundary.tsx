import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service in production
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ 
          background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
          backgroundAttachment: 'fixed'
        }}>
          <div className="max-w-md w-full">
            <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
              <p className="text-slate-400 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-red-400 font-semibold mb-2">Error Details (Dev Mode)</h3>
                  <pre className="text-xs text-slate-300 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="border-slate-600/50 text-slate-300 flex-1"
                >
                  <Home size={16} className="mr-2" />
                  Go Back
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 flex-1"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}