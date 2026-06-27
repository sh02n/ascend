import { Component, type ErrorInfo, type ReactNode } from "react";

interface DetectErrorBoundaryProps {
  children: ReactNode;
}

interface DetectErrorBoundaryState {
  hasError: boolean;
}

export class DetectErrorBoundary extends Component<
  DetectErrorBoundaryProps,
  DetectErrorBoundaryState
> {
  state: DetectErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-5 text-rose-100">
          <h2 className="text-lg font-semibold">Detection workspace failed to render</h2>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 rounded-md bg-rose-200 px-3 py-2 text-sm font-semibold text-rose-950"
          >
            Retry
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
