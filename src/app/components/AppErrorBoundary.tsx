/**
 * Author: Yzrel Jade B. Eborde
 *
 * Catches render crashes so a single bad module click cannot blank the whole shell.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional label for logs (e.g. "shell", "module"). */
  label?: string;
  /** Called when the user chooses Try again (reset error state). */
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[aisetup] UI crash${this.props.label ? ` (${this.props.label})` : ""}:`,
      error,
      info.componentStack,
    );
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6 bg-[#EEF2F7]">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-bold text-[#0C2461]">Something went wrong</h2>
          <p className="text-sm text-gray-600">
            This screen hit an unexpected error. Your session is still active — try
            again or open Dashboard.
          </p>
          <p className="text-xs text-red-700/80 font-mono break-words bg-red-50 rounded-lg p-2">
            {error.message || String(error)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-[#0C2461] text-white text-sm font-semibold hover:bg-[#1a3a7a]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.assign(window.location.pathname || "/");
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
