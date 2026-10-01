import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SS Vastra caught an uncaught UI error:', error, errorInfo);
    this.setState({ errorInfo });

    // Auto-heal potentially corrupted localStorage data
    try {
      localStorage.removeItem('ss_vastra_custom_products');
      localStorage.removeItem('ss_vastra_cart');
    } catch {}
  }

  private purgeBrowserCaches = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch {}
  };

  private handleReset = async () => {
    await this.purgeBrowserCaches();
    try {
      localStorage.removeItem('ss_vastra_custom_products');
      localStorage.removeItem('ss_vastra_deleted_product_ids');
      localStorage.removeItem('ss_vastra_cart');
    } catch {}
    window.location.href = '/?refresh=' + Date.now();
  };

  private handleAdminRecovery = async () => {
    await this.purgeBrowserCaches();
    this.setState({ hasError: false });
    window.location.href = '/admin?refresh=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF7F0] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-[#E9A9BB]/40 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                SS VASTRA JAIPUR
              </h2>
              <p className="text-stone-600 text-sm mt-1">
                Kripya reload karein ya Admin Portal par punah jayein:
              </p>
            </div>

            {/* Error Message if available */}
            {this.state.error?.message && (
              <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                <p className="font-bold flex items-center justify-between">
                  <span>Error Detail:</span>
                  <button
                    type="button"
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    className="text-[11px] underline text-rose-700 hover:text-rose-900 cursor-pointer"
                  >
                    {this.state.showDetails ? 'Hide Stack' : 'Show Stack'}
                  </button>
                </p>
                <p className="font-mono mt-1 break-words">{this.state.error.message}</p>
                {this.state.showDetails && this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[10px] font-mono bg-white p-2 rounded border border-rose-200 max-h-36 overflow-auto text-stone-700 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleAdminRecovery}
                className="w-full py-3 px-4 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Admin Portal Open Karein</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-[#A87A2A]" />
                <span>Home Page Par Jayein</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
